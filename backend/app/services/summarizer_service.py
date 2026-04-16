import json
import asyncio
import random
import re
from functools import wraps
from groq import AsyncGroq
from app.core.config import settings
from app.services.cache_service import get_cache_key, get_cached_result, set_cached_result

def with_retry(max_retries=5, base_delay=4):
    """Decorator to automatically retry Groq API calls on 429 Rate Limit errors."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            retries = 0
            while retries < max_retries:
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    error_msg = str(e).lower()
                    if "429" in error_msg or "rate limit" in error_msg:
                        retries += 1
                        if retries >= max_retries:
                            print(f"   ❌ Max retries reached for {func.__name__}")
                            raise
                        
                        # Try to parse exact wait time from error message
                        delay = base_delay * (2 ** (retries - 1)) + random.uniform(0, 1)
                        match = re.search(r"try again in ([\d\.]+)s", error_msg)
                        if match:
                            delay = float(match.group(1)) + 1.0 # Add 1s buffer
                            
                        print(f"   ⚠️ Rate Limit Hit (429) in {func.__name__}. Retrying in {delay:.2f}s... (Attempt {retries}/{max_retries})")
                        await asyncio.sleep(delay)
                    else:
                        raise e
            return await func(*args, **kwargs)
        return wrapper
    return decorator

# Shared default client
default_client = AsyncGroq(api_key=settings.GROQ_API_KEY)
GROQ_SEMAPHORE = asyncio.Semaphore(3)

def get_client(api_key: str = None) -> AsyncGroq:
    """Returns a Groq client for the given key, or the system default."""
    if api_key and api_key.strip():
        return AsyncGroq(api_key=api_key)
    return default_client

# ============================================================
# PROMPT ENGINE (Exact replica from core_processor.py)
# ============================================================

def get_system_prompt(video_type: str) -> tuple[str, str]:
    """Returns (system_message, json_structure) based on detected video type."""
    base_instruction = "You are analyzing a transcript. You MUST output the JSON values STRICTLY IN ENGLISH."
    
    global_rules = (
        " Read the entire transcript end-to-end. "
        "Ignore transcription noise, repetitions, or gibberish. "
        "Do not fabricate information. "
        "If information is missing, state 'Not specified'."
    )

    if video_type == "NEWS":
        structure = """{
            "title": "Primary headline summarizing the most important story",
            "lead_story": { 
                "headline": "Main story headline", 
                "summary": "Concise explanation covering who, what, where, why, and impact" 
            },
            "news_briefs": [
                { 
                    "category": "Politics | Economy | Crime | Court | Sports | General", 
                    "headline": "Short headline", 
                    "details": "Who was involved, what happened, where, and the outcome" 
                }
            ],
            "market_snapshot": { 
                "gold_rate": "Price and trend if mentioned, else 'Not mentioned'", 
                "fuel_prices": "Petrol/Diesel info if available", 
                "other_markets": "Stocks/Currency info" 
            },
            "weather_update": { "region": "Affected area", "alert": "Rain/Heat/Flood warning" },
            "crucial_alerts": ["Deadlines with date/time", "Fines or penalties", "Public advisories"],
            "fact_check_notes": ["Clarifications of names, dates, or numbers if uncertainty exists"]
        }"""
        task_prompt = (
            " You are a Professional News Analysis Agent. "
            "RULES: 1. Group info into classified sections (Politics, Crime, Economy). "
            "2. Extract SPECIFIC numbers for Gold, Fuel, and Fines. "
            "3. Identify deadlines and urgent public warnings for 'crucial_alerts'. "
            "4. Prioritize the most impactful story as 'lead_story'. "
            "5. Look for keywords like 'Court', 'Police', 'Gold', 'Rain' to identify stories in messy text."
        )
        sys_msg = f"{base_instruction} {global_rules} {task_prompt} OUTPUT JSON."

    elif video_type == "MEETING":
        structure = """{ "title": "Meeting Title", "executive_summary": "Summary", "action_items": [{"task": "Task", "owner": "Name", "deadline": "Date"}], "key_decisions": ["Dec 1"], "open_questions": ["Q1"] }"""
        task_prompt = " You are a Corporate Secretary. Focus on decisions, action items, and deadlines."
        sys_msg = f"{base_instruction} {global_rules} {task_prompt} OUTPUT JSON."

    elif video_type in ["TUTORIAL", "LECTURE"]:
        structure = """{ "title": "English Title", "class_notes": "Technical Article (300 words). 1. Problem 2. Solution 3. How it Works. 4. Why use it.", "core_concepts": [{"concept": "Term", "definition": "Def + Analogy"}], "exam_shortcuts": ["Code", "Rule"] }"""
        task_prompt = " You are a Senior Technical Writer. Teach the content. IGNORE meta-talk. FOCUS on facts."
        sys_msg = f"{base_instruction} {global_rules} {task_prompt} OUTPUT JSON."

    else:
        structure = """{ "title": "Title", "tl_dr": "Summary", "key_takeaways": ["P1"], "best_quotes": ["Q1"] }"""
        task_prompt = " You are a Content Analyst. Summarize the value."
        sys_msg = f"{base_instruction} {global_rules} {task_prompt} OUTPUT JSON."
        
    return sys_msg, structure


# ============================================================
# LONG VIDEO SAFETY LOGIC
# ============================================================

@with_retry()
async def compress_text_chunk(text_chunk, index, api_key: str = None):
    """Helper: Summarizes one chunk to remove fluff."""
    client = get_client(api_key)
    async with GROQ_SEMAPHORE:
        msg = "Compress this transcript chunk. Remove timestamp/filler words. Keep ALL facts, numbers, names, and events. Output pure text."
        try:
            res = await client.chat.completions.create(
                messages=[{"role": "system", "content": msg}, {"role": "user", "content": text_chunk}],
                model="llama-3.3-70b-versatile", max_tokens=1024
            )
            return index, res.choices[0].message.content
        except: return index, text_chunk  # Fail safe

async def compress_transcript_async(text, api_key: str = None):
    """Splits massive text, compresses chunks in parallel, and stitches."""
    CHUNK_SIZE = 15000
    chunks = [text[i:i+CHUNK_SIZE] for i in range(0, len(text), CHUNK_SIZE)]
    print(f"   🗜️ Transcript too long ({len(text)} chars). Compressing {len(chunks)} chunks...")
    
    tasks = [compress_text_chunk(c, i, api_key) for i, c in enumerate(chunks)]
    results = await asyncio.gather(*tasks)
    results.sort(key=lambda x: x[0])
    
    compressed_text = " ".join([r[1] for r in results])
    print(f"   ✅ Compression Done. Size: {len(text)} -> {len(compressed_text)}")
    return compressed_text


# ============================================================
# TYPE DETECTION
# ============================================================

@with_retry()
async def detect_video_type(text: str, api_key: str = None) -> str:
    """Auto-classifies video type using LLM (Cached)."""
    cache_key = get_cache_key("vtype", text[:5000])
    cached = get_cached_result(cache_key)
    if cached:
        print("   🚀 Cache Hit: Video Type")
        return cached

    client = get_client(api_key)
    sys_p = 'Classify as "LECTURE", "MEETING", "NEWS", or "GENERAL". Return JSON: {"type": "LECTURE"}'
    try:
        async with GROQ_SEMAPHORE:
            res = await client.chat.completions.create(
                messages=[{"role": "system", "content": sys_p}, {"role": "user", "content": text[:5000]}],
                model="llama-3.3-70b-versatile", response_format={"type": "json_object"}
            )
        vtype = json.loads(res.choices[0].message.content).get('type', 'GENERAL')
        set_cached_result(cache_key, vtype)
        return vtype
    except:
        return "GENERAL"


# ============================================================
# PARALLEL TASKS
# ============================================================

@with_retry()
async def generate_report_async(text: str, video_type: str, api_key: str = None) -> dict:
    """Generates the analysis report (Cached)."""
    cache_key = get_cache_key(f"report:{video_type}", text)
    cached = get_cached_result(cache_key)
    if cached:
        print(f"   🚀 Cache Hit: Report ({video_type})")
        return cached

    client = get_client(api_key)
    if len(text) > 90000:
        text = await compress_transcript_async(text, api_key)

    print(f"   📝 AI: Writing Report ({video_type})...")
    sys_msg, structure = get_system_prompt(video_type)
    async with GROQ_SEMAPHORE:
        res = await client.chat.completions.create(
            messages=[{"role": "system", "content": f"{sys_msg}\nReturn JSON: {structure}"}, {"role": "user", "content": text[:32000]}],
            model="llama-3.3-70b-versatile", response_format={"type": "json_object"}, temperature=0.3
        )
    result = json.loads(res.choices[0].message.content)
    set_cached_result(cache_key, result)
    return result

@with_retry()
async def generate_quiz_async(text: str, target_lang: str, api_key: str = None) -> dict:
    """Generates quiz questions for LECTURE/TUTORIAL type videos (Cached)."""
    cache_key = get_cache_key(f"quiz:{target_lang}", text)
    cached = get_cached_result(cache_key)
    if cached:
        print("   🚀 Cache Hit: Quiz")
        return cached

    client = get_client(api_key)
    print("   ❓ AI: Generating Quiz...")
    prompt = f"""Generate 5 MCQs in {target_lang}. JSON: {{ "questions": [ {{ "q": "Q?", "options": ["A","B"], "answer": "A" }} ] }}"""
    async with GROQ_SEMAPHORE:
        res = await client.chat.completions.create(
            messages=[{"role": "system", "content": prompt}, {"role": "user", "content": text[:20000]}],
            model="llama-3.3-70b-versatile", response_format={"type": "json_object"}
        )
    result = json.loads(res.choices[0].message.content)
    set_cached_result(cache_key, result)
    return result


# ============================================================
# TRANSLATION
# ============================================================

@with_retry()
async def translate_text_chunk(text_chunk, target_lang, index, api_key: str = None):
    """Helper: Translates one chunk."""
    client = get_client(api_key)
    async with GROQ_SEMAPHORE:
        try:
            res = await client.chat.completions.create(
                messages=[{"role": "system", "content": f"Translate to {target_lang}. Preserve formatting."}, {"role": "user", "content": text_chunk}],
                model="llama-3.3-70b-versatile"
            )
            return index, res.choices[0].message.content
        except: return index, ""

async def translate_large_text_parallel(text, target_lang, api_key: str = None):
    """Splits text and translates in parallel to avoid timeouts."""
    CHUNK_SIZE = 10000
    chunks = [text[i:i+CHUNK_SIZE] for i in range(0, len(text), CHUNK_SIZE)]
    print(f"   🌍 Large Translation: Processing {len(chunks)} chunks in parallel...")
    
    tasks = [translate_text_chunk(c, target_lang, i, api_key) for i, c in enumerate(chunks)]
    results = await asyncio.gather(*tasks)
    results.sort(key=lambda x: x[0])
    return " ".join([r[1] for r in results])

@with_retry()
async def translate_report_async(english_json: dict, target_lang: str, video_type: str, api_key: str = None) -> str:
    """Translates the analysis report to the target language (Cached)."""
    cache_key = get_cache_key(f"trans_report:{target_lang}", json.dumps(english_json))
    cached = get_cached_result(cache_key)
    if cached:
        print(f"   🚀 Cache Hit: Translated Report ({target_lang})")
        return cached

    client = get_client(api_key)
    print(f"   🌍 AI: Translating Report to {target_lang}...")
    if video_type == "NEWS":
        prompt = f"Translate to {target_lang} News Bulletin. 1. Headline 2. Lead Story 3. Top Stories 4. 🚨 ALERTS. Output MARKDOWN. STRICTLY OUTPUT ONLY IN {target_lang}. NO ENGLISH."
    elif video_type == "MEETING":
        prompt = f"Translate to {target_lang} Minutes. 1. Objective 2. Summary 3. Action Items. Output MARKDOWN. STRICTLY OUTPUT ONLY IN {target_lang}. NO ENGLISH."
    else:
        prompt = f"Translate to {target_lang} Study Guide. Teach concepts. Keep Code English. Output MARKDOWN. EXPLANATIONS STRICTLY IN {target_lang} ONLY."
        
    async with GROQ_SEMAPHORE:
        res = await client.chat.completions.create(
            messages=[{"role": "system", "content": prompt}, {"role": "user", "content": json.dumps(english_json)}],
            model="llama-3.3-70b-versatile"
        )
    result = res.choices[0].message.content
    set_cached_result(cache_key, result)
    return result

@with_retry()
async def translate_transcript_async(text: str, target_lang: str, api_key: str = None) -> str:
    """Translates transcripts (Cached). Uses parallel chunking for long text."""
    cache_key = get_cache_key(f"trans_transcript:{target_lang}", text)
    cached = get_cached_result(cache_key)
    if cached:
        print(f"   🚀 Cache Hit: Full Transcript ({target_lang})")
        return cached

    client = get_client(api_key)
    print("   📜 AI: Translating Full Transcript...")
    
    if len(text) > 25000:
        result = await translate_large_text_parallel(text, target_lang, api_key)
    else:
        async with GROQ_SEMAPHORE:
            res = await client.chat.completions.create(
                messages=[{"role": "system", "content": f"Translate to {target_lang}."}, {"role": "user", "content": text}],
                model="llama-3.3-70b-versatile"
            )
        result = res.choices[0].message.content
        
    set_cached_result(cache_key, result)
    return result


# ============================================================
# DICT TO MARKDOWN (from core_processor.py)
# ============================================================

def dict_to_md(data: dict) -> str:
    """Converts JSON to Markdown with Tables for Action Items/News."""
    md = ""
    for k, v in data.items():
        title = k.replace('_',' ').title()
        
        if k == "action_items" and isinstance(v, list) and len(v) > 0:
            md += f"### {title}\n| Task | Owner | Deadline |\n|---|---|---|\n"
            for item in v:
                md += f"| {item.get('task','-')} | {item.get('owner','-')} | {item.get('deadline','-')} |\n"
            md += "\n"
        elif k == "news_briefs" and isinstance(v, list):
            md += f"### Top Stories\n"
            for story in v:
                md += f"#### 📰 {story.get('headline', 'Update')}\n{story.get('details', '')}\n\n"
        elif k == "crucial_alerts" and isinstance(v, list):
            md += f"### 🚨 Important Alerts\n"
            for alert in v: md += f"- ⚠️ **{alert}**\n"
            md += "\n"
        elif isinstance(v, str) and k != 'title': md += f"### {title}\n{v}\n\n"
        elif isinstance(v, list):
            md += f"### {title}\n"
            for item in v:
                if isinstance(item, str): md += f"- {item}\n"
                elif isinstance(item, dict): 
                    val = "- " + " | ".join([f"**{sk.title()}:** {sv}" for sk, sv in item.items()])
                    md += val + "\n"
            md += "\n"
        elif isinstance(v, dict):
            md += f"### {title}\n"
            for sk, sv in v.items(): md += f"- **{sk.title()}:** {sv}\n"
            md += "\n"
    return md
