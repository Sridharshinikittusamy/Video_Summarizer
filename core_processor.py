# # #---------async diff gener single pipeline------------------------
# # import os
# # import json
# # import re
# # import asyncio
# # import aiohttp
# # from pathlib import Path
# # from dotenv import load_dotenv
# # from groq import Groq, AsyncGroq
# # from youtube_transcript_api import YouTubeTranscriptApi
# # from youtube_transcript_api.formatters import TextFormatter
# # from pytubefix import YouTube
# # from pytubefix.cli import on_progress
# # from pydub import AudioSegment
# # import markdown
# # from weasyprint import HTML, CSS

# # # --- CONFIGURATION ---
# # load_dotenv()
# # API_KEY = os.getenv("GROQ_API_KEY")

# # if not API_KEY:
# #     print("❌ Error: GROQ_API_KEY not found. Check your .env file.")
# #     exit(1)

# # async_client = AsyncGroq(api_key=API_KEY)
# # GROQ_SEMAPHORE = asyncio.Semaphore(3)  # Rate Limit Bouncer

# # INPUT_DIR = "input"
# # OUTPUT_DIR = "output"

# # # --- HELPER FUNCTIONS ---

# # def ensure_folders():
# #     Path(INPUT_DIR).mkdir(exist_ok=True)
# #     Path(OUTPUT_DIR).mkdir(exist_ok=True)

# # def sanitize_filename(name):
# #     clean = re.sub(r'[^\w\s-]', '', name)
# #     return clean.strip()[:50]

# # def extract_video_id(url):
# #     patterns = [r'(?:v=|\/)([0-9A-Za-z_-]{11}).*', r'^([0-9A-Za-z_-]{11})$']
# #     for pattern in patterns:
# #         match = re.search(pattern, url)
# #         if match: return match.group(1)
# #     return None

# # def convert_to_mp3(input_path, output_path):
# #     """Robust FFmpeg conversion to ensure valid audio for ANY input."""
# #     import subprocess
# #     print(f"   ⚙️  Normalizing Audio: {Path(input_path).name} -> MP3...")
# #     try:
# #         # -y: Overwrite, -vn: No Video, -acodec: MP3, -ar: 44100Hz
# #         cmd = ["ffmpeg", "-i", input_path, "-vn", "-acodec", "libmp3lame", "-ar", "44100", "-y", output_path]
# #         subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
# #         return True
# #     except Exception as e:
# #         print(f"   ❌ FFmpeg Conversion Failed: {e}")
# #         return False

# # def extract_slides_local(video_path, project_folder):
# #     """Extracts slides from a local video file (MP4/MKV)."""
# #     print("   🖼️  Extracting Slides from Video...")
# #     frames_dir = os.path.join(project_folder, "frames")
# #     Path(frames_dir).mkdir(parents=True, exist_ok=True)
# #     try:
# #         import subprocess
# #         # Extract 1 frame every 45 seconds
# #         subprocess.run(
# #             ["ffmpeg", "-i", video_path, "-vf", "fps=1/45", "-q:v", "2", f"{frames_dir}/slide_%03d.jpg"], 
# #             stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
# #         )
# #         print("   ✅ Slides Extracted.")
# #     except Exception as e:
# #         print(f"   ⚠️  Slide extraction failed: {e}")

# # def dict_to_md(data): 
# #     """Converts JSON to Markdown with Tables for Action Items/News."""
# #     md = ""
# #     for k, v in data.items():
# #         title = k.replace('_',' ').title()
        
# #         # TABLE: Action Items (Meeting)
# #         if k == "action_items" and isinstance(v, list) and len(v) > 0:
# #             md += f"### {title}\n| Task | Owner | Deadline |\n|---|---|---|\n"
# #             for item in v:
# #                 md += f"| {item.get('task','-')} | {item.get('owner','-')} | {item.get('deadline','-')} |\n"
# #             md += "\n"

# #         # TABLE: News Briefs (News)
# #         elif k == "news_briefs" and isinstance(v, list):
# #             md += f"### Top Stories\n"
# #             for story in v:
# #                 md += f"#### 📰 {story.get('headline', 'Update')}\n{story.get('details', '')}\n\n"

# #         # LIST: Alerts (News)
# #         elif k == "crucial_alerts" and isinstance(v, list):
# #             md += f"### 🚨 Important Alerts\n"
# #             for alert in v: md += f"- ⚠️ **{alert}**\n"
# #             md += "\n"

# #         # STANDARD
# #         elif isinstance(v, str) and k != 'title': md += f"### {title}\n{v}\n\n"
# #         elif isinstance(v, list):
# #             md += f"### {title}\n"
# #             for item in v:
# #                 if isinstance(item, str): md += f"- {item}\n"
# #                 elif isinstance(item, dict): 
# #                     val = "- " + " | ".join([f"**{sk.title()}:** {sv}" for sk, sv in item.items()])
# #                     md += val + "\n"
# #             md += "\n"
# #         elif isinstance(v, dict):
# #             md += f"### {title}\n"
# #             for sk, sv in v.items(): md += f"- **{sk.title()}:** {sv}\n"
# #             md += "\n"
# #     return md

# # # --- ASYNC TRANSCRIPTION (UNIFIED ENGINE) ---

# # async def transcribe_chunk_async(chunk_path, chunk_index, total_chunks):
# #     async with GROQ_SEMAPHORE:
# #         print(f"   🎤 Processing Chunk {chunk_index + 1}/{total_chunks}...")
# #         try:
# #             with open(chunk_path, "rb") as f:
# #                 transcription = await async_client.audio.transcriptions.create(
# #                     file=(chunk_path, f.read()), model="whisper-large-v3", response_format="verbose_json"
# #                 )
# #             return chunk_index, transcription.text
# #         except Exception as e:
# #             print(f"   ❌ Error Chunk {chunk_index}: {e}")
# #             return chunk_index, ""

# # async def get_transcript_async(audio_path):
# #     """Handles Chunking automatically for ANY input."""
# #     file_size_mb = os.path.getsize(audio_path) / (1024 * 1024)
    
# #     if file_size_mb < 20:
# #         print(f"   🎤 Transcribing (Single File: {round(file_size_mb,1)}MB)...")
# #         async with GROQ_SEMAPHORE:
# #             with open(audio_path, "rb") as f:
# #                 res = await async_client.audio.transcriptions.create(
# #                     file=(audio_path, f.read()), model="whisper-large-v3", response_format="verbose_json"
# #                 )
# #             return res.text
# #     else:
# #         # Parallel Chunking Logic
# #         print(f"   ✂️  File is Large ({round(file_size_mb,1)}MB). Splitting...")
# #         loop = asyncio.get_running_loop()
# #         def split_audio():
# #             song = AudioSegment.from_mp3(audio_path)
# #             TEN_MINUTES = 10 * 60 * 1000
# #             return [song[i:i+TEN_MINUTES] for i in range(0, len(song), TEN_MINUTES)]

# #         chunks = await loop.run_in_executor(None, split_audio)
# #         print(f"   📊 Created {len(chunks)} Chunks. Parallelizing...")
        
# #         tasks = []
# #         temp_files = []
# #         for i, chunk in enumerate(chunks):
# #             chunk_name = f"{audio_path}_part{i}.mp3"
# #             chunk.export(chunk_name, format="mp3")
# #             temp_files.append(chunk_name)
# #             tasks.append(transcribe_chunk_async(chunk_name, i, len(chunks)))
        
# #         results = await asyncio.gather(*tasks)
# #         for f in temp_files: os.remove(f) # Cleanup
# #         results.sort(key=lambda x: x[0])
# #         return " ".join([r[1] for r in results])

# # # --- PROMPT ENGINE ---

# # def get_system_prompt(video_type):
# #     # --- LAYER 1: BASE INSTRUCTION (The Guardrail) ---
# #     # Applies to ALL types to ensure the JSON is always in English for the translator
# #     base_instruction = "You are analyzing a transcript. You MUST output the JSON values STRICTLY IN ENGLISH."
    
# #     # --- LAYER 2: GLOBAL RULES (The Foundation) ---
# #     # Applies to ALL types to fix the "messy transcript" issue globally
# #     global_rules = (
# #         " Read the entire transcript end-to-end. "
# #         "Ignore transcription noise, repetitions, or gibberish. "
# #         "Do not fabricate information. "
# #         "If information is missing, state 'Not specified'."
# #     )

# #     # --- LAYER 3: TYPE-SPECIFIC LOGIC ---
    
# #     # 1. NEWS (The "Forensic Aggregator" - UPDATED)
# #     if video_type == "NEWS":
# #         structure = """{
# #             "title": "Primary headline summarizing the most important story",
# #             "lead_story": { 
# #                 "headline": "Main story headline", 
# #                 "summary": "Concise explanation covering who, what, where, why, and impact" 
# #             },
# #             "news_briefs": [
# #                 { 
# #                     "category": "Politics | Economy | Crime | Court | Sports | General", 
# #                     "headline": "Short headline", 
# #                     "details": "Who was involved, what happened, where, and the outcome" 
# #                 }
# #             ],
# #             "market_snapshot": { 
# #                 "gold_rate": "Price and trend if mentioned, else 'Not mentioned'", 
# #                 "fuel_prices": "Petrol/Diesel info if available", 
# #                 "other_markets": "Stocks/Currency info" 
# #             },
# #             "weather_update": { 
# #                 "region": "Affected area", 
# #                 "alert": "Rain/Heat/Flood warning" 
# #             },
# #             "crucial_alerts": [
# #                 "Deadlines with date/time", 
# #                 "Fines or penalties", 
# #                 "Public advisories"
# #             ],
# #             "fact_check_notes": [
# #                 "Clarifications of names, dates, or numbers if uncertainty exists"
# #             ]
# #         }"""
        
# #         # Specific "News Anchor" Personality
# #         task_prompt = (
# #             " You are a Professional News Analysis Agent. "
# #             "Your goal is to produce a clear, factual news report. "
# #             "RULES: "
# #             "1. Group info into classified sections (Politics, Crime, Economy). "
# #             "2. Extract SPECIFIC numbers for Gold, Fuel, and Fines. "
# #             "3. Identify deadlines and urgent public warnings for 'crucial_alerts'. "
# #             "4. Prioritize the most impactful story as 'lead_story'. "
# #             "5. Look for keywords like 'Court', 'Police', 'Gold', 'Rain' to identify stories in messy text."
# #         )
# #         sys_msg = f"{base_instruction} {global_rules} {task_prompt} OUTPUT JSON."

# #     # 2. MEETING (The Secretary)
# #     elif video_type == "MEETING":
# #         structure = """{ 
# #             "title": "Meeting Title", 
# #             "executive_summary": "Summary", 
# #             "action_items": [{"task": "Task", "owner": "Name", "deadline": "Date"}], 
# #             "key_decisions": ["Dec 1"], 
# #             "open_questions": ["Q1"] 
# #         }"""
# #         task_prompt = " You are a Corporate Secretary. Focus on decisions, action items, and deadlines."
# #         sys_msg = f"{base_instruction} {global_rules} {task_prompt} OUTPUT JSON."

# #     # 3. TUTORIAL / LECTURE (The Teacher)
# #     elif video_type in ["TUTORIAL", "LECTURE"]:
# #         structure = """{ 
# #             "title": "English Title", 
# #             "class_notes": "Technical Article (300 words). 1. Problem 2. Solution 3. How it Works. 4. Why use it.", 
# #             "core_concepts": [{"concept": "Term", "definition": "Def + Analogy"}], 
# #             "exam_shortcuts": ["Code", "Rule"] 
# #         }"""
# #         task_prompt = " You are a Senior Technical Writer. Teach the content. IGNORE meta-talk. FOCUS on facts."
# #         sys_msg = f"{base_instruction} {global_rules} {task_prompt} OUTPUT JSON."

# #     # 4. GENERAL (The Analyst)
# #     else:
# #         structure = """{ 
# #             "title": "Title", 
# #             "tl_dr": "Summary", 
# #             "key_takeaways": ["P1"], 
# #             "best_quotes": ["Q1"] 
# #         }"""
# #         task_prompt = " You are a Content Analyst. Summarize the value."
# #         sys_msg = f"{base_instruction} {global_rules} {task_prompt} OUTPUT JSON."
        
# #     return sys_msg, structure

# # # --- PARALLEL TASKS ---

# # async def generate_report_async(text, video_type):
# #     print(f"   📝 AI: Writing Report ({video_type})...")
# #     sys_msg, structure = get_system_prompt(video_type)
# #     async with GROQ_SEMAPHORE:
# #         res = await async_client.chat.completions.create(
# #             messages=[{"role": "system", "content": f"{sys_msg}\nReturn JSON: {structure}"}, {"role": "user", "content": text[:30000]}],
# #             model="llama-3.3-70b-versatile", response_format={"type": "json_object"}, temperature=0.3
# #         )
# #     return json.loads(res.choices[0].message.content)

# # async def generate_quiz_async(text, target_lang):
# #     print("   ❓ AI: Generating Quiz...")
# #     prompt = f"""Generate 5 MCQs in {target_lang}. JSON: {{ "questions": [ {{ "q": "Q?", "options": ["A","B"], "answer": "A" }} ] }}"""
# #     async with GROQ_SEMAPHORE:
# #         res = await async_client.chat.completions.create(
# #             messages=[{"role": "system", "content": prompt}, {"role": "user", "content": text[:20000]}],
# #             model="llama-3.3-70b-versatile", response_format={"type": "json_object"}
# #         )
# #     return json.loads(res.choices[0].message.content)

# # async def translate_report_async(english_json, target_lang, video_type):
# #     print(f"   🌍 AI: Translating to {target_lang}...")
# #     if video_type == "NEWS":
# #         prompt = f"Translate to {target_lang} News Bulletin. 1. Headline 2. Lead Story 3. Top Stories 4. 🚨 ALERTS. Output MARKDOWN."
# #     elif video_type == "MEETING":
# #         prompt = f"Translate to {target_lang} Minutes. 1. Objective 2. Summary 3. Action Items. Output MARKDOWN."
# #     else:
# #         prompt = f"Translate to {target_lang} Study Guide. Teach concepts. Keep Code English. Output MARKDOWN."
        
# #     async with GROQ_SEMAPHORE:
# #         res = await async_client.chat.completions.create(
# #             messages=[{"role": "system", "content": prompt}, {"role": "user", "content": json.dumps(english_json)}],
# #             model="llama-3.3-70b-versatile"
# #         )
# #     return res.choices[0].message.content

# # async def translate_transcript_async(text, target_lang):
# #     print("   📜 AI: Translating Transcript...")
# #     async with GROQ_SEMAPHORE:
# #         res = await async_client.chat.completions.create(
# #             messages=[{"role": "system", "content": f"Translate to {target_lang}."}, {"role": "user", "content": text[:25000]}],
# #             model="llama-3.3-70b-versatile"
# #         )
# #     return res.choices[0].message.content

# # # --- PDF GENERATION ---

# # def generate_pdf(project_folder, md_content, quiz_json, lang):
# #     print("   📄 Generating PDF...")
# #     pdf_path = f"{project_folder}/Report.pdf"
    
# #     notes_html = markdown.markdown(md_content, extensions=['tables'])
# #     quiz_html = ""
# #     if quiz_json:
# #         quiz_html = "<hr><h2>🧠 Test Yourself</h2>"
# #         for idx, q in enumerate(quiz_json.get('questions', [])):
# #             opts = "".join([f"<li>{o}</li>" for o in q.get('options', [])])
# #             quiz_html += f"<div class='quiz-box'><p><strong>Q{idx+1}: {q.get('q')}</strong></p><ul>{opts}</ul><p><em>Ans: {q.get('answer')}</em></p></div>"

# #     css = CSS(string='''
# #         @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;700&display=swap');
# #         body { font-family: 'Noto Sans Tamil', sans-serif; padding: 40px; line-height: 1.6; color: #333; }
# #         h1, h2, h3 { color: #2c3e50; border-bottom: 2px solid #eee; }
# #         table { width: 100%; border-collapse: collapse; margin: 20px 0; }
# #         th, td { padding: 12px; border: 1px solid #ddd; }
# #         th { background-color: #f2f2f2; }
# #         .quiz-box { background: #fff8e1; padding: 15px; border-left: 5px solid #f1c40f; margin-bottom: 20px; }
# #     ''')
# #     HTML(string=notes_html + quiz_html).write_pdf(pdf_path, stylesheets=[css])
# #     print(f"   ✅ PDF Saved: {pdf_path}")

# # def fetch_visuals_yt(url, project_folder):
# #     """Background extraction for YouTube."""
# #     if not url: return
# #     print("   🖼️  Extracting Slides (YT)...")
# #     frames_dir = os.path.join(project_folder, "frames")
# #     Path(frames_dir).mkdir(parents=True, exist_ok=True)
# #     try:
# #         yt = YouTube(url)
# #         stream = yt.streams.filter(res="360p", progressive=True).first()
# #         if stream:
# #             v_path = stream.download(output_path=INPUT_DIR, filename="temp_vid")
# #             import subprocess
# #             subprocess.run(["ffmpeg", "-i", v_path, "-vf", "fps=1/45", "-q:v", "2", f"{frames_dir}/slide_%03d.jpg"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
# #             if os.path.exists(v_path): os.remove(v_path)
# #     except: pass

# # # --- MAIN CONTROLLER (UNIFIED) ---

# # async def main_async():
# #     ensure_folders()
# #     print("--- 🧠 AI Video Agent (Unified Pipeline) ---")
# #     print("1. YouTube URL\n2. Local File")
# #     choice = input("Choice: ").strip()
# #     target_lang = input("Target Language [Tamil]: ").strip() or "Tamil"
    
# #     text = None
# #     title = "Unknown Project"
# #     url = None
# #     audio_path = None
    
# #     # --- STEP 1: INGESTION (Get standardized MP3) ---
# #     if choice == "1":
# #         url = input("Enter YouTube URL: ").strip()
# #         video_id = extract_video_id(url)
# #         if not video_id: return
# #         title = video_id
# #         audio_path = f"{INPUT_DIR}/{video_id}.mp3"
        
# #         try:
# #             # Try Transcript API First (Only for YouTube)
# #             transcript = YouTubeTranscriptApi.get_transcript(video_id)
# #             text = TextFormatter().format_transcript(transcript)
# #             print("   ✅ Transcript API Success.")
# #             try: title = YouTube(url).title
# #             except: pass
# #         except:
# #             print("   ⬇️  Downloading Audio...")
# #             try:
# #                 yt = YouTube(url, on_progress_callback=on_progress)
# #                 title = yt.title
# #                 stream = yt.streams.get_audio_only()
# #                 raw_path = stream.download(output_path=INPUT_DIR, filename_prefix="raw_")
# #                 if not convert_to_mp3(raw_path, audio_path): return
# #                 if os.path.exists(raw_path): os.remove(raw_path)
# #             except Exception as e:
# #                 print(f"   ❌ Download Error: {e}"); return

# #     elif choice == "2":
# #         f_name = input("Enter filename (in 'input' folder): ").strip()
# #         local_path = os.path.join(INPUT_DIR, f_name)
# #         if not os.path.exists(local_path): print("❌ File not found."); return
        
# #         title = Path(f_name).stem
# #         audio_path = f"{INPUT_DIR}/{title}.mp3"
        
# #         # Always normalize local files to MP3
# #         if not convert_to_mp3(local_path, audio_path): return

# #     # Setup Project Folders Early
# #     safe_name = sanitize_filename(title)
# #     project_folder = f"{OUTPUT_DIR}/{safe_name}"
# #     Path(project_folder).mkdir(parents=True, exist_ok=True)

# #     # NEW: If Local File is VIDEO, Extract Slides!
# #     if choice == "2" and f_name.lower().endswith(('.mp4', '.mkv', '.mov', '.avi')):
# #         loop = asyncio.get_running_loop()
# #         local_path = os.path.join(INPUT_DIR, f_name)
# #         # Extract slides in background (non-blocking)
# #         loop.run_in_executor(None, extract_slides_local, local_path, project_folder)

# #     # --- STEP 2: TRANSCRIPTION (Unified Gatekeeper) ---
# #     if not text:
# #         if not audio_path or not os.path.exists(audio_path):
# #             print("   ❌ Error: No Audio File to process.")
# #             return
        
# #         print("   🎧 Starting Transcription Engine...")
# #         text = await get_transcript_async(audio_path)

# #     # --- CRITICAL SANITY CHECK ---
# #     if not text or len(text.strip()) < 50:
# #         print("\n❌ ERROR: Transcript is empty or audio is silent.")
# #         print("   (Code stopped to prevent hallucinated reports)")
# #         return 

# #     # --- STEP 3: INTELLIGENCE ---
# #     print("\n🔹 Step 2: Parallel Intelligence...")
# #     sys_p = 'Classify as "LECTURE", "MEETING", "NEWS", or "GENERAL". Return JSON: {"type": "LECTURE"}'
# #     try:
# #         res = await async_client.chat.completions.create(
# #             messages=[{"role": "system", "content": sys_p}, {"role": "user", "content": text[:5000]}],
# #             model="llama-3.3-70b-versatile", response_format={"type": "json_object"}
# #         )
# #         v_type = json.loads(res.choices[0].message.content).get('type', 'GENERAL')
# #     except: v_type = "GENERAL"
# #     print(f"   🧠 Detected Type: {v_type}")

# #     loop = asyncio.get_running_loop()
# #     task_report = generate_report_async(text, v_type)
# #     task_trans = translate_transcript_async(text, target_lang)
    
# #     task_quiz = None
# #     if v_type in ["LECTURE", "TUTORIAL"]:
# #         task_quiz = generate_quiz_async(text, target_lang)
# #     else:
# #         print("   ⏩ Skipping Quiz")

# #     # If YouTube, fetch slides now (Local handled above)
# #     if choice == "1" and v_type in ["LECTURE", "TUTORIAL"]:
# #         loop.run_in_executor(None, fetch_visuals_yt, url, project_folder)

# #     # Wait for results
# #     active_tasks = [task_report, task_trans]
# #     if task_quiz: active_tasks.append(task_quiz)
    
# #     results = await asyncio.gather(*active_tasks)
# #     analysis_json = results[0]
# #     full_trans_text = results[1]
# #     quiz_json = results[2] if task_quiz else None
    
# #     markdown_report = await translate_report_async(analysis_json, target_lang, v_type)

# #     print("\n🔹 Step 3: Finalizing...")
# #     english_md = dict_to_md(analysis_json)
# #     final_md = f"# {analysis_json.get('title', title)}\n**Type:** {v_type} | **Language:** {target_lang}\n\n## 🇬🇧 English Notes\n{english_md}\n\n## 🚩 {target_lang} Notes\n{markdown_report}"
    
# #     with open(f"{project_folder}/transcript.txt", "w", encoding="utf-8") as f: f.write(text)
# #     with open(f"{project_folder}/REPORT.md", "w", encoding="utf-8") as f: f.write(final_md)
# #     if quiz_json:
# #         with open(f"{project_folder}/quiz.json", "w", encoding="utf-8") as f: json.dump(quiz_json, f, indent=4)
    
# #     generate_pdf(project_folder, final_md, quiz_json, target_lang)
# #     print(f"\n✅ DONE! Open folder: {project_folder}")

# # if __name__ == "__main__":
# #     asyncio.run(main_async())



# #------------
# import os
# import json
# import re
# import asyncio
# import aiohttp
# from pathlib import Path
# from dotenv import load_dotenv
# from groq import Groq, AsyncGroq
# from youtube_transcript_api import YouTubeTranscriptApi
# from youtube_transcript_api.formatters import TextFormatter
# from pytubefix import YouTube
# from pytubefix.cli import on_progress
# from pydub import AudioSegment
# import markdown
# from weasyprint import HTML, CSS

# # --- CONFIGURATION ---
# load_dotenv()
# API_KEY = os.getenv("GROQ_API_KEY")

# if not API_KEY:
#     print("❌ Error: GROQ_API_KEY not found. Check your .env file.")
#     exit(1)

# async_client = AsyncGroq(api_key=API_KEY)
# GROQ_SEMAPHORE = asyncio.Semaphore(3)  # Rate Limit Bouncer

# INPUT_DIR = "input"
# OUTPUT_DIR = "output"

# # --- HELPER FUNCTIONS ---

# def ensure_folders():
#     Path(INPUT_DIR).mkdir(exist_ok=True)
#     Path(OUTPUT_DIR).mkdir(exist_ok=True)

# def sanitize_filename(name):
#     clean = re.sub(r'[^\w\s-]', '', name)
#     return clean.strip()[:50]

# def extract_video_id(url):
#     patterns = [r'(?:v=|\/)([0-9A-Za-z_-]{11}).*', r'^([0-9A-Za-z_-]{11})$']
#     for pattern in patterns:
#         match = re.search(pattern, url)
#         if match: return match.group(1)
#     return None

# def convert_to_mp3(input_path, output_path):
#     """Robust FFmpeg conversion to ensure valid audio for ANY input."""
#     import subprocess
#     print(f"   ⚙️  Normalizing Audio: {Path(input_path).name} -> MP3...")
#     try:
#         cmd = ["ffmpeg", "-i", input_path, "-vn", "-acodec", "libmp3lame", "-ar", "44100", "-y", output_path]
#         subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
#         return True
#     except Exception as e:
#         print(f"   ❌ FFmpeg Conversion Failed: {e}")
#         return False

# def extract_slides_local(video_path, project_folder):
#     """Extracts slides from a local video file (MP4/MKV)."""
#     print("   🖼️  Extracting Slides from Video...")
#     frames_dir = os.path.join(project_folder, "frames")
#     Path(frames_dir).mkdir(parents=True, exist_ok=True)
#     try:
#         import subprocess
#         subprocess.run(
#             ["ffmpeg", "-i", video_path, "-vf", "fps=1/45", "-q:v", "2", f"{frames_dir}/slide_%03d.jpg"], 
#             stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
#         )
#         print("   ✅ Slides Extracted.")
#     except Exception as e:
#         print(f"   ⚠️  Slide extraction failed: {e}")

# def dict_to_md(data): 
#     """Converts JSON to Markdown with Tables for Action Items/News."""
#     md = ""
#     for k, v in data.items():
#         title = k.replace('_',' ').title()
        
#         if k == "action_items" and isinstance(v, list) and len(v) > 0:
#             md += f"### {title}\n| Task | Owner | Deadline |\n|---|---|---|\n"
#             for item in v:
#                 md += f"| {item.get('task','-')} | {item.get('owner','-')} | {item.get('deadline','-')} |\n"
#             md += "\n"
#         elif k == "news_briefs" and isinstance(v, list):
#             md += f"### Top Stories\n"
#             for story in v:
#                 md += f"#### 📰 {story.get('headline', 'Update')}\n{story.get('details', '')}\n\n"
#         elif k == "crucial_alerts" and isinstance(v, list):
#             md += f"### 🚨 Important Alerts\n"
#             for alert in v: md += f"- ⚠️ **{alert}**\n"
#             md += "\n"
#         elif isinstance(v, str) and k != 'title': md += f"### {title}\n{v}\n\n"
#         elif isinstance(v, list):
#             md += f"### {title}\n"
#             for item in v:
#                 if isinstance(item, str): md += f"- {item}\n"
#                 elif isinstance(item, dict): 
#                     val = "- " + " | ".join([f"**{sk.title()}:** {sv}" for sk, sv in item.items()])
#                     md += val + "\n"
#             md += "\n"
#         elif isinstance(v, dict):
#             md += f"### {title}\n"
#             for sk, sv in v.items(): md += f"- **{sk.title()}:** {sv}\n"
#             md += "\n"
#     return md

# # --- ASYNC TRANSCRIPTION (UNIFIED ENGINE) ---

# async def transcribe_chunk_async(chunk_path, chunk_index, total_chunks):
#     async with GROQ_SEMAPHORE:
#         print(f"   🎤 Processing Chunk {chunk_index + 1}/{total_chunks}...")
#         try:
#             with open(chunk_path, "rb") as f:
#                 transcription = await async_client.audio.transcriptions.create(
#                     file=(chunk_path, f.read()), model="whisper-large-v3", response_format="verbose_json"
#                 )
#             return chunk_index, transcription.text
#         except Exception as e:
#             print(f"   ❌ Error Chunk {chunk_index}: {e}")
#             return chunk_index, ""

# async def get_transcript_async(audio_path):
#     """Handles Chunking automatically for ANY input."""
#     file_size_mb = os.path.getsize(audio_path) / (1024 * 1024)
    
#     if file_size_mb < 20:
#         print(f"   🎤 Transcribing (Single File: {round(file_size_mb,1)}MB)...")
#         async with GROQ_SEMAPHORE:
#             with open(audio_path, "rb") as f:
#                 res = await async_client.audio.transcriptions.create(
#                     file=(audio_path, f.read()), model="whisper-large-v3", response_format="verbose_json"
#                 )
#             return res.text
#     else:
#         print(f"   ✂️  File is Large ({round(file_size_mb,1)}MB). Splitting...")
#         loop = asyncio.get_running_loop()
#         def split_audio():
#             song = AudioSegment.from_mp3(audio_path)
#             TEN_MINUTES = 10 * 60 * 1000
#             return [song[i:i+TEN_MINUTES] for i in range(0, len(song), TEN_MINUTES)]

#         chunks = await loop.run_in_executor(None, split_audio)
#         print(f"   📊 Created {len(chunks)} Chunks. Parallelizing...")
        
#         tasks = []
#         temp_files = []
#         for i, chunk in enumerate(chunks):
#             chunk_name = f"{audio_path}_part{i}.mp3"
#             chunk.export(chunk_name, format="mp3")
#             temp_files.append(chunk_name)
#             tasks.append(transcribe_chunk_async(chunk_name, i, len(chunks)))
        
#         results = await asyncio.gather(*tasks)
#         for f in temp_files: os.remove(f)
#         results.sort(key=lambda x: x[0])
#         return " ".join([r[1] for r in results])

# # --- LONG VIDEO SAFETY LOGIC (NEW) ---

# async def compress_text_chunk(text_chunk, index):
#     """Helper: Summarizes one chunk to remove fluff."""
#     async with GROQ_SEMAPHORE:
#         msg = "Compress this transcript chunk. Remove timestamp/filler words. Keep ALL facts, numbers, names, and events. Output pure text."
#         try:
#             res = await async_client.chat.completions.create(
#                 messages=[{"role": "system", "content": msg}, {"role": "user", "content": text_chunk}],
#                 model="llama-3.3-70b-versatile", max_tokens=1024
#             )
#             return index, res.choices[0].message.content
#         except: return index, text_chunk # Fail safe

# async def compress_transcript_async(text):
#     """Splits massive text, compresses chunks in parallel, and stitches."""
#     CHUNK_SIZE = 15000  # Safe chunk size for compression
#     chunks = [text[i:i+CHUNK_SIZE] for i in range(0, len(text), CHUNK_SIZE)]
#     print(f"   🗜️  Transcript too long ({len(text)} chars). Compressing {len(chunks)} chunks...")
    
#     tasks = [compress_text_chunk(c, i) for i, c in enumerate(chunks)]
#     results = await asyncio.gather(*tasks)
#     results.sort(key=lambda x: x[0])
    
#     compressed_text = " ".join([r[1] for r in results])
#     print(f"   ✅ Compression Done. Size: {len(text)} -> {len(compressed_text)}")
#     return compressed_text

# async def translate_text_chunk(text_chunk, target_lang, index):
#     """Helper: Translates one chunk."""
#     async with GROQ_SEMAPHORE:
#         try:
#             res = await async_client.chat.completions.create(
#                 messages=[{"role": "system", "content": f"Translate to {target_lang}. Preserve formatting."}, {"role": "user", "content": text_chunk}],
#                 model="llama-3.3-70b-versatile"
#             )
#             return index, res.choices[0].message.content
#         except: return index, ""

# async def translate_large_text_parallel(text, target_lang):
#     """Splits text and translates in parallel to avoid timeouts."""
#     CHUNK_SIZE = 10000 
#     chunks = [text[i:i+CHUNK_SIZE] for i in range(0, len(text), CHUNK_SIZE)]
#     print(f"   🌍 Large Translation: Processing {len(chunks)} chunks in parallel...")
    
#     tasks = [translate_text_chunk(c, target_lang, i) for i, c in enumerate(chunks)]
#     results = await asyncio.gather(*tasks)
#     results.sort(key=lambda x: x[0])
#     return " ".join([r[1] for r in results])

# # --- PROMPT ENGINE ---

# def get_system_prompt(video_type):
#     # LAYER 1: Base Instruction
#     base_instruction = "You are analyzing a transcript. You MUST output the JSON values STRICTLY IN ENGLISH."
    
#     # LAYER 2: Global Rules
#     global_rules = (
#         " Read the entire transcript end-to-end. "
#         "Ignore transcription noise, repetitions, or gibberish. "
#         "Do not fabricate information. "
#         "If information is missing, state 'Not specified'."
#     )

#     # LAYER 3: Type-Specific Logic
#     if video_type == "NEWS":
#         structure = """{
#             "title": "Primary headline summarizing the most important story",
#             "lead_story": { 
#                 "headline": "Main story headline", 
#                 "summary": "Concise explanation covering who, what, where, why, and impact" 
#             },
#             "news_briefs": [
#                 { 
#                     "category": "Politics | Economy | Crime | Court | Sports | General", 
#                     "headline": "Short headline", 
#                     "details": "Who was involved, what happened, where, and the outcome" 
#                 }
#             ],
#             "market_snapshot": { 
#                 "gold_rate": "Price and trend if mentioned, else 'Not mentioned'", 
#                 "fuel_prices": "Petrol/Diesel info if available", 
#                 "other_markets": "Stocks/Currency info" 
#             },
#             "weather_update": { "region": "Affected area", "alert": "Rain/Heat/Flood warning" },
#             "crucial_alerts": ["Deadlines with date/time", "Fines or penalties", "Public advisories"],
#             "fact_check_notes": ["Clarifications of names, dates, or numbers if uncertainty exists"]
#         }"""
#         task_prompt = (
#             " You are a Professional News Analysis Agent. "
#             "RULES: 1. Group info into classified sections. 2. Extract SPECIFIC numbers for Gold, Fuel, and Fines. "
#             "3. Identify deadlines for 'crucial_alerts'. 4. Prioritize the most impactful story as 'lead_story'. "
#             "5. Look for keywords like 'Court', 'Police', 'Gold' to identify stories in messy text."
#         )
#         sys_msg = f"{base_instruction} {global_rules} {task_prompt} OUTPUT JSON."

#     elif video_type == "MEETING":
#         structure = """{ "title": "Meeting Title", "executive_summary": "Summary", "action_items": [{"task": "Task", "owner": "Name", "deadline": "Date"}], "key_decisions": ["Dec 1"], "open_questions": ["Q1"] }"""
#         task_prompt = " You are a Corporate Secretary. Focus on decisions, action items, and deadlines."
#         sys_msg = f"{base_instruction} {global_rules} {task_prompt} OUTPUT JSON."

#     elif video_type in ["TUTORIAL", "LECTURE"]:
#         structure = """{ "title": "English Title", "class_notes": "Technical Article (300 words). 1. Problem 2. Solution 3. How it Works. 4. Why use it.", "core_concepts": [{"concept": "Term", "definition": "Def + Analogy"}], "exam_shortcuts": ["Code", "Rule"] }"""
#         task_prompt = " You are a Senior Technical Writer. Teach the content. IGNORE meta-talk. FOCUS on facts."
#         sys_msg = f"{base_instruction} {global_rules} {task_prompt} OUTPUT JSON."

#     else:
#         structure = """{ "title": "Title", "tl_dr": "Summary", "key_takeaways": ["P1"], "best_quotes": ["Q1"] }"""
#         task_prompt = " You are a Content Analyst. Summarize the value."
#         sys_msg = f"{base_instruction} {global_rules} {task_prompt} OUTPUT JSON."
        
#     return sys_msg, structure

# # --- PARALLEL TASKS ---

# async def generate_report_async(text, video_type):
#     # SAFETY CHECK: If text is huge, compress it first
#     if len(text) > 90000:
#         text = await compress_transcript_async(text)

#     print(f"   📝 AI: Writing Report ({video_type})...")
#     sys_msg, structure = get_system_prompt(video_type)
#     async with GROQ_SEMAPHORE:
#         res = await async_client.chat.completions.create(
#             messages=[{"role": "system", "content": f"{sys_msg}\nReturn JSON: {structure}"}, {"role": "user", "content": text[:32000]}], # Safe slice
#             model="llama-3.3-70b-versatile", response_format={"type": "json_object"}, temperature=0.3
#         )
#     return json.loads(res.choices[0].message.content)

# async def generate_quiz_async(text, target_lang):
#     print("   ❓ AI: Generating Quiz...")
#     # Quizzes don't need the whole text, just a sample is fine
#     prompt = f"""Generate 5 MCQs in {target_lang}. JSON: {{ "questions": [ {{ "q": "Q?", "options": ["A","B"], "answer": "A" }} ] }}"""
#     async with GROQ_SEMAPHORE:
#         res = await async_client.chat.completions.create(
#             messages=[{"role": "system", "content": prompt}, {"role": "user", "content": text[:20000]}],
#             model="llama-3.3-70b-versatile", response_format={"type": "json_object"}
#         )
#     return json.loads(res.choices[0].message.content)

# async def translate_report_async(english_json, target_lang, video_type):
#     print(f"   🌍 AI: Translating Report to {target_lang}...")
#     if video_type == "NEWS":
#         prompt = f"Translate to {target_lang} News Bulletin. 1. Headline 2. Lead Story 3. Top Stories 4. 🚨 ALERTS. Output MARKDOWN."
#     elif video_type == "MEETING":
#         prompt = f"Translate to {target_lang} Minutes. 1. Objective 2. Summary 3. Action Items. Output MARKDOWN."
#     else:
#         prompt = f"Translate to {target_lang} Study Guide. Teach concepts. Keep Code English. Output MARKDOWN."
        
#     async with GROQ_SEMAPHORE:
#         res = await async_client.chat.completions.create(
#             messages=[{"role": "system", "content": prompt}, {"role": "user", "content": json.dumps(english_json)}],
#             model="llama-3.3-70b-versatile"
#         )
#     return res.choices[0].message.content

# async def translate_transcript_async(text, target_lang):
#     print("   📜 AI: Translating Full Transcript...")
#     # SAFETY CHECK: If text is huge, use parallel translation
#     if len(text) > 25000:
#         return await translate_large_text_parallel(text, target_lang)
    
#     async with GROQ_SEMAPHORE:
#         res = await async_client.chat.completions.create(
#             messages=[{"role": "system", "content": f"Translate to {target_lang}."}, {"role": "user", "content": text}],
#             model="llama-3.3-70b-versatile"
#         )
#     return res.choices[0].message.content

# # --- PDF GENERATION ---

# def generate_pdf(project_folder, md_content, quiz_json, lang):
#     print("   📄 Generating PDF...")
#     pdf_path = f"{project_folder}/Report.pdf"
    
#     notes_html = markdown.markdown(md_content, extensions=['tables'])
#     quiz_html = ""
#     if quiz_json:
#         quiz_html = "<hr><h2>🧠 Test Yourself</h2>"
#         for idx, q in enumerate(quiz_json.get('questions', [])):
#             opts = "".join([f"<li>{o}</li>" for o in q.get('options', [])])
#             quiz_html += f"<div class='quiz-box'><p><strong>Q{idx+1}: {q.get('q')}</strong></p><ul>{opts}</ul><p><em>Ans: {q.get('answer')}</em></p></div>"

#     css = CSS(string='''
#         @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;700&display=swap');
#         body { font-family: 'Noto Sans Tamil', sans-serif; padding: 40px; line-height: 1.6; color: #333; }
#         h1, h2, h3 { color: #2c3e50; border-bottom: 2px solid #eee; }
#         table { width: 100%; border-collapse: collapse; margin: 20px 0; }
#         th, td { padding: 12px; border: 1px solid #ddd; }
#         th { background-color: #f2f2f2; }
#         .quiz-box { background: #fff8e1; padding: 15px; border-left: 5px solid #f1c40f; margin-bottom: 20px; }
#     ''')
#     HTML(string=notes_html + quiz_html).write_pdf(pdf_path, stylesheets=[css])
#     print(f"   ✅ PDF Saved: {pdf_path}")

# def fetch_visuals_yt(url, project_folder):
#     """Background extraction for YouTube."""
#     if not url: return
#     print("   🖼️  Extracting Slides (YT)...")
#     frames_dir = os.path.join(project_folder, "frames")
#     Path(frames_dir).mkdir(parents=True, exist_ok=True)
#     try:
#         yt = YouTube(url)
#         stream = yt.streams.filter(res="360p", progressive=True).first()
#         if stream:
#             v_path = stream.download(output_path=INPUT_DIR, filename="temp_vid")
#             import subprocess
#             subprocess.run(["ffmpeg", "-i", v_path, "-vf", "fps=1/45", "-q:v", "2", f"{frames_dir}/slide_%03d.jpg"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
#             if os.path.exists(v_path): os.remove(v_path)
#     except: pass

# # --- MAIN CONTROLLER (UNIFIED) ---

# async def main_async():
#     ensure_folders()
#     print("--- 🧠 AI Video Agent (Safe Pipeline) ---")
#     print("1. YouTube URL\n2. Local File")
#     choice = input("Choice: ").strip()
#     target_lang = input("Target Language [Tamil]: ").strip() or "Tamil"
    
#     text = None
#     title = "Unknown Project"
#     url = None
#     audio_path = None
    
#     # --- STEP 1: INGESTION ---
#     if choice == "1":
#         url = input("Enter YouTube URL: ").strip()
#         video_id = extract_video_id(url)
#         if not video_id: return
#         title = video_id
#         audio_path = f"{INPUT_DIR}/{video_id}.mp3"
        
#         try:
#             transcript = YouTubeTranscriptApi.get_transcript(video_id)
#             text = TextFormatter().format_transcript(transcript)
#             print("   ✅ Transcript API Success.")
#             try: title = YouTube(url).title
#             except: pass
#         except:
#             print("   ⬇️  Downloading Audio...")
#             try:
#                 yt = YouTube(url, on_progress_callback=on_progress)
#                 title = yt.title
#                 stream = yt.streams.get_audio_only()
#                 raw_path = stream.download(output_path=INPUT_DIR, filename_prefix="raw_")
#                 if not convert_to_mp3(raw_path, audio_path): return
#                 if os.path.exists(raw_path): os.remove(raw_path)
#             except Exception as e:
#                 print(f"   ❌ Download Error: {e}"); return

#     elif choice == "2":
#         f_name = input("Enter filename (in 'input' folder): ").strip()
#         local_path = os.path.join(INPUT_DIR, f_name)
#         if not os.path.exists(local_path): print("❌ File not found."); return
        
#         title = Path(f_name).stem
#         audio_path = f"{INPUT_DIR}/{title}.mp3"
#         if not convert_to_mp3(local_path, audio_path): return

#     # Setup Project Folders
#     safe_name = sanitize_filename(title)
#     project_folder = f"{OUTPUT_DIR}/{safe_name}"
#     Path(project_folder).mkdir(parents=True, exist_ok=True)

#     # Local Slide Extraction
#     if choice == "2" and f_name.lower().endswith(('.mp4', '.mkv', '.mov', '.avi')):
#         loop = asyncio.get_running_loop()
#         local_path = os.path.join(INPUT_DIR, f_name)
#         loop.run_in_executor(None, extract_slides_local, local_path, project_folder)

#     # --- STEP 2: TRANSCRIPTION ---
#     if not text:
#         if not audio_path or not os.path.exists(audio_path): return
#         print("   🎧 Starting Transcription Engine...")
#         text = await get_transcript_async(audio_path)

#     if not text or len(text.strip()) < 50:
#         print("\n❌ ERROR: Transcript is empty or audio is silent.")
#         return 

#     # --- STEP 3: INTELLIGENCE ---
#     print("\n🔹 Step 2: Parallel Intelligence...")
#     sys_p = 'Classify as "LECTURE", "MEETING", "NEWS", or "GENERAL". Return JSON: {"type": "LECTURE"}'
#     try:
#         res = await async_client.chat.completions.create(
#             messages=[{"role": "system", "content": sys_p}, {"role": "user", "content": text[:5000]}],
#             model="llama-3.3-70b-versatile", response_format={"type": "json_object"}
#         )
#         v_type = json.loads(res.choices[0].message.content).get('type', 'GENERAL')
#     except: v_type = "GENERAL"
#     print(f"   🧠 Detected Type: {v_type}")

#     loop = asyncio.get_running_loop()
#     task_report = generate_report_async(text, v_type)
#     task_trans = translate_transcript_async(text, target_lang)
    
#     task_quiz = None
#     if v_type in ["LECTURE", "TUTORIAL"]:
#         task_quiz = generate_quiz_async(text, target_lang)
#     else:
#         print("   ⏩ Skipping Quiz")

#     if choice == "1" and v_type in ["LECTURE", "TUTORIAL"]:
#         loop.run_in_executor(None, fetch_visuals_yt, url, project_folder)

#     # Wait for results
#     active_tasks = [task_report, task_trans]
#     if task_quiz: active_tasks.append(task_quiz)
    
#     results = await asyncio.gather(*active_tasks)
#     analysis_json = results[0]
#     full_trans_text = results[1]
#     quiz_json = results[2] if task_quiz else None
    
#     markdown_report = await translate_report_async(analysis_json, target_lang, v_type)

#     print("\n🔹 Step 3: Finalizing...")
#     english_md = dict_to_md(analysis_json)
#     final_md = f"# {analysis_json.get('title', title)}\n**Type:** {v_type} | **Language:** {target_lang}\n\n## 🇬🇧 English Notes\n{english_md}\n\n## 🚩 {target_lang} Notes\n{markdown_report}"
    
#     with open(f"{project_folder}/transcript.txt", "w", encoding="utf-8") as f: f.write(text)
#     with open(f"{project_folder}/REPORT.md", "w", encoding="utf-8") as f: f.write(final_md)
#     if quiz_json:
#         with open(f"{project_folder}/quiz.json", "w", encoding="utf-8") as f: json.dump(quiz_json, f, indent=4)
    
#     generate_pdf(project_folder, final_md, quiz_json, target_lang)
#     print(f"\n✅ DONE! Open folder: {project_folder}")

# if __name__ == "__main__":
#     asyncio.run(main_async())


#-------------all input formates---------------------
import os
import json
import re
import asyncio
import aiohttp
import shutil
from pathlib import Path
from dotenv import load_dotenv
from groq import Groq, AsyncGroq
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import TextFormatter
from pytubefix import YouTube
from pytubefix.cli import on_progress
from pydub import AudioSegment
import markdown
from weasyprint import HTML, CSS

# --- CONFIGURATION ---
load_dotenv()
API_KEY = os.getenv("GROQ_API_KEY")

if not API_KEY:
    print("❌ Error: GROQ_API_KEY not found. Check your .env file.")
    exit(1)

async_client = AsyncGroq(api_key=API_KEY)
GROQ_SEMAPHORE = asyncio.Semaphore(3)  # Rate Limit Protector

INPUT_DIR = "input"
OUTPUT_DIR = "output"

# --- HELPER FUNCTIONS ---

def ensure_folders():
    Path(INPUT_DIR).mkdir(exist_ok=True)
    Path(OUTPUT_DIR).mkdir(exist_ok=True)

def sanitize_filename(name):
    clean = re.sub(r'[^\w\s-]', '', name)
    return clean.strip()[:50]

def extract_video_id(url):
    patterns = [r'(?:v=|\/)([0-9A-Za-z_-]{11}).*', r'^([0-9A-Za-z_-]{11})$']
    for pattern in patterns:
        match = re.search(pattern, url)
        if match: return match.group(1)
    return None

def convert_to_mp3(input_path, output_path):
    """
    Robust FFmpeg conversion.
    Safe against overwriting (uses temp file) and handles any A/V format.
    """
    import subprocess
    
    print(f"   ⚙️  Normalizing Audio: {Path(input_path).name} -> MP3...")
    
    # Check if input and output are the same file path
    is_same_file = os.path.abspath(input_path) == os.path.abspath(output_path)
    final_output = output_path
    
    # Use temp file if overwriting
    if is_same_file:
        final_output = str(Path(output_path).with_suffix('.temp.mp3'))

    try:
        # -y: Overwrite, -vn: No Video, -acodec: MP3, -ar: 44100Hz
        cmd = ["ffmpeg", "-i", input_path, "-vn", "-acodec", "libmp3lame", "-ar", "44100", "-y", final_output]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        
        # Rename temp back to target
        if is_same_file:
            shutil.move(final_output, output_path)
            
        return True
    except Exception as e:
        print(f"   ❌ FFmpeg Conversion Failed: {e}")
        if is_same_file and os.path.exists(final_output):
            os.remove(final_output)
        return False

def extract_slides_local(video_path, project_folder):
    """Extracts slides from a local video file (MP4/MKV)."""
    print("   🖼️  Extracting Slides from Local Video...")
    frames_dir = os.path.join(project_folder, "frames")
    Path(frames_dir).mkdir(parents=True, exist_ok=True)
    try:
        import subprocess
        subprocess.run(
            ["ffmpeg", "-i", video_path, "-vf", "fps=1/45", "-q:v", "2", f"{frames_dir}/slide_%03d.jpg"], 
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
        print("   ✅ Slides Extracted.")
    except Exception as e:
        print(f"   ⚠️  Slide extraction failed: {e}")

def dict_to_md(data): 
    """Converts JSON to Markdown with Tables."""
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

# --- ASYNC TRANSCRIPTION ---

async def transcribe_chunk_async(chunk_path, chunk_index, total_chunks):
    async with GROQ_SEMAPHORE:
        print(f"   🎤 Processing Chunk {chunk_index + 1}/{total_chunks}...")
        try:
            with open(chunk_path, "rb") as f:
                transcription = await async_client.audio.transcriptions.create(
                    file=(chunk_path, f.read()), model="whisper-large-v3", response_format="verbose_json"
                )
            return chunk_index, transcription.text
        except Exception as e:
            print(f"   ❌ Error Chunk {chunk_index}: {e}")
            return chunk_index, ""

async def get_transcript_async(audio_path):
    """Handles Chunking automatically for ANY input."""
    file_size_mb = os.path.getsize(audio_path) / (1024 * 1024)
    
    if file_size_mb < 20:
        print(f"   🎤 Transcribing (Single File: {round(file_size_mb,1)}MB)...")
        async with GROQ_SEMAPHORE:
            with open(audio_path, "rb") as f:
                res = await async_client.audio.transcriptions.create(
                    file=(audio_path, f.read()), model="whisper-large-v3", response_format="verbose_json"
                )
            return res.text
    else:
        print(f"   ✂️  File is Large ({round(file_size_mb,1)}MB). Splitting...")
        loop = asyncio.get_running_loop()
        def split_audio():
            song = AudioSegment.from_mp3(audio_path)
            TEN_MINUTES = 10 * 60 * 1000
            return [song[i:i+TEN_MINUTES] for i in range(0, len(song), TEN_MINUTES)]

        chunks = await loop.run_in_executor(None, split_audio)
        print(f"   📊 Created {len(chunks)} Chunks. Parallelizing...")
        
        tasks = []
        temp_files = []
        for i, chunk in enumerate(chunks):
            chunk_name = f"{audio_path}_part{i}.mp3"
            chunk.export(chunk_name, format="mp3")
            temp_files.append(chunk_name)
            tasks.append(transcribe_chunk_async(chunk_name, i, len(chunks)))
        
        results = await asyncio.gather(*tasks)
        for f in temp_files: os.remove(f)
        results.sort(key=lambda x: x[0])
        return " ".join([r[1] for r in results])

# --- LONG VIDEO SAFETY LOGIC ---

async def compress_text_chunk(text_chunk, index):
    """Helper: Summarizes one chunk to remove fluff."""
    async with GROQ_SEMAPHORE:
        msg = "Compress this transcript chunk. Remove timestamp/filler words. Keep ALL facts, numbers, names, and events. Output pure text."
        try:
            res = await async_client.chat.completions.create(
                messages=[{"role": "system", "content": msg}, {"role": "user", "content": text_chunk}],
                model="llama-3.3-70b-versatile", max_tokens=1024
            )
            return index, res.choices[0].message.content
        except: return index, text_chunk # Fail safe

async def compress_transcript_async(text):
    """Splits massive text, compresses chunks in parallel, and stitches."""
    CHUNK_SIZE = 15000  # Safe chunk size for compression
    chunks = [text[i:i+CHUNK_SIZE] for i in range(0, len(text), CHUNK_SIZE)]
    print(f"   🗜️  Transcript too long ({len(text)} chars). Compressing {len(chunks)} chunks...")
    
    tasks = [compress_text_chunk(c, i) for i, c in enumerate(chunks)]
    results = await asyncio.gather(*tasks)
    results.sort(key=lambda x: x[0])
    
    compressed_text = " ".join([r[1] for r in results])
    print(f"   ✅ Compression Done. Size: {len(text)} -> {len(compressed_text)}")
    return compressed_text

async def translate_text_chunk(text_chunk, target_lang, index):
    """Helper: Translates one chunk."""
    async with GROQ_SEMAPHORE:
        try:
            res = await async_client.chat.completions.create(
                messages=[{"role": "system", "content": f"Translate to {target_lang}. Preserve formatting."}, {"role": "user", "content": text_chunk}],
                model="llama-3.3-70b-versatile"
            )
            return index, res.choices[0].message.content
        except: return index, ""

async def translate_large_text_parallel(text, target_lang):
    """Splits text and translates in parallel to avoid timeouts."""
    CHUNK_SIZE = 10000 
    chunks = [text[i:i+CHUNK_SIZE] for i in range(0, len(text), CHUNK_SIZE)]
    print(f"   🌍 Large Translation: Processing {len(chunks)} chunks in parallel...")
    
    tasks = [translate_text_chunk(c, target_lang, i) for i, c in enumerate(chunks)]
    results = await asyncio.gather(*tasks)
    results.sort(key=lambda x: x[0])
    return " ".join([r[1] for r in results])

# --- PROMPT ENGINE ---

def get_system_prompt(video_type):
    # LAYER 1: Base Instruction (Guardrail)
    base_instruction = "You are analyzing a transcript. You MUST output the JSON values STRICTLY IN ENGLISH."
    
    # LAYER 2: Global Rules (Foundation)
    global_rules = (
        " Read the entire transcript end-to-end. "
        "Ignore transcription noise, repetitions, or gibberish. "
        "Do not fabricate information. "
        "If information is missing, state 'Not specified'."
    )

    # LAYER 3: Type-Specific Logic
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

# --- PARALLEL TASKS ---

async def generate_report_async(text, video_type):
    # SAFETY CHECK: If text is huge, compress it first
    if len(text) > 90000:
        text = await compress_transcript_async(text)

    print(f"   📝 AI: Writing Report ({video_type})...")
    sys_msg, structure = get_system_prompt(video_type)
    async with GROQ_SEMAPHORE:
        res = await async_client.chat.completions.create(
            messages=[{"role": "system", "content": f"{sys_msg}\nReturn JSON: {structure}"}, {"role": "user", "content": text[:32000]}], # Safe slice
            model="llama-3.3-70b-versatile", response_format={"type": "json_object"}, temperature=0.3
        )
    return json.loads(res.choices[0].message.content)

async def generate_quiz_async(text, target_lang):
    print("   ❓ AI: Generating Quiz...")
    # Quizzes don't need the whole text, just a sample is fine
    prompt = f"""Generate 5 MCQs in {target_lang}. JSON: {{ "questions": [ {{ "q": "Q?", "options": ["A","B"], "answer": "A" }} ] }}"""
    async with GROQ_SEMAPHORE:
        res = await async_client.chat.completions.create(
            messages=[{"role": "system", "content": prompt}, {"role": "user", "content": text[:20000]}],
            model="llama-3.3-70b-versatile", response_format={"type": "json_object"}
        )
    return json.loads(res.choices[0].message.content)

async def translate_report_async(english_json, target_lang, video_type):
    print(f"   🌍 AI: Translating Report to {target_lang}...")
    if video_type == "NEWS":
        prompt = f"Translate to {target_lang} News Bulletin. 1. Headline 2. Lead Story 3. Top Stories 4. 🚨 ALERTS. Output MARKDOWN."
    elif video_type == "MEETING":
        prompt = f"Translate to {target_lang} Minutes. 1. Objective 2. Summary 3. Action Items. Output MARKDOWN."
    else:
        prompt = f"Translate to {target_lang} Study Guide. Teach concepts. Keep Code English. Output MARKDOWN."
        
    async with GROQ_SEMAPHORE:
        res = await async_client.chat.completions.create(
            messages=[{"role": "system", "content": prompt}, {"role": "user", "content": json.dumps(english_json)}],
            model="llama-3.3-70b-versatile"
        )
    return res.choices[0].message.content

async def translate_transcript_async(text, target_lang):
    print("   📜 AI: Translating Full Transcript...")
    # SAFETY CHECK: If text is huge, use parallel translation
    if len(text) > 25000:
        return await translate_large_text_parallel(text, target_lang)
    
    async with GROQ_SEMAPHORE:
        res = await async_client.chat.completions.create(
            messages=[{"role": "system", "content": f"Translate to {target_lang}."}, {"role": "user", "content": text}],
            model="llama-3.3-70b-versatile"
        )
    return res.choices[0].message.content

# --- PDF GENERATION ---

def generate_pdf(project_folder, md_content, quiz_json, lang):
    print("   📄 Generating PDF...")
    pdf_path = f"{project_folder}/Report.pdf"
    
    notes_html = markdown.markdown(md_content, extensions=['tables'])
    quiz_html = ""
    if quiz_json:
        quiz_html = "<hr><h2>🧠 Test Yourself</h2>"
        for idx, q in enumerate(quiz_json.get('questions', [])):
            opts = "".join([f"<li>{o}</li>" for o in q.get('options', [])])
            quiz_html += f"<div class='quiz-box'><p><strong>Q{idx+1}: {q.get('q')}</strong></p><ul>{opts}</ul><p><em>Ans: {q.get('answer')}</em></p></div>"

    css = CSS(string='''
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;700&display=swap');
        body { font-family: 'Noto Sans Tamil', sans-serif; padding: 40px; line-height: 1.6; color: #333; }
        h1, h2, h3 { color: #2c3e50; border-bottom: 2px solid #eee; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; border: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
        .quiz-box { background: #fff8e1; padding: 15px; border-left: 5px solid #f1c40f; margin-bottom: 20px; }
    ''')
    HTML(string=notes_html + quiz_html).write_pdf(pdf_path, stylesheets=[css])
    print(f"   ✅ PDF Saved: {pdf_path}")

def fetch_visuals_yt(url, project_folder):
    """Background extraction for YouTube."""
    if not url: return
    print("   🖼️  Extracting Slides (YT)...")
    frames_dir = os.path.join(project_folder, "frames")
    Path(frames_dir).mkdir(parents=True, exist_ok=True)
    try:
        yt = YouTube(url)
        stream = yt.streams.filter(res="360p", progressive=True).first()
        if stream:
            v_path = stream.download(output_path=INPUT_DIR, filename="temp_vid")
            import subprocess
            subprocess.run(["ffmpeg", "-i", v_path, "-vf", "fps=1/45", "-q:v", "2", f"{frames_dir}/slide_%03d.jpg"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            if os.path.exists(v_path): os.remove(v_path)
    except: pass

# --- MAIN CONTROLLER (UNIFIED & SAFE) ---

async def main_async():
    ensure_folders()
    print("--- 🧠 AI Video Agent (Universal Pipeline) ---")
    print("1. YouTube URL\n2. Local File")
    choice = input("Choice: ").strip()
    target_lang = input("Target Language [Tamil]: ").strip() or "Tamil"
    
    text = None
    title = "Unknown Project"
    url = None
    audio_path = None
    
    # --- STEP 1: INGESTION (Universal) ---
    if choice == "1":
        url = input("Enter YouTube URL: ").strip()
        video_id = extract_video_id(url)
        if not video_id: return
        title = video_id
        audio_path = f"{INPUT_DIR}/{video_id}.mp3"
        
        try:
            transcript = YouTubeTranscriptApi.get_transcript(video_id)
            text = TextFormatter().format_transcript(transcript)
            print("   ✅ Transcript API Success.")
            try: title = YouTube(url).title
            except: pass
        except:
            print("   ⬇️  Downloading Audio...")
            try:
                yt = YouTube(url, on_progress_callback=on_progress)
                title = yt.title
                stream = yt.streams.get_audio_only()
                raw_path = stream.download(output_path=INPUT_DIR, filename_prefix="raw_")
                if not convert_to_mp3(raw_path, audio_path): return
                if os.path.exists(raw_path): os.remove(raw_path)
            except Exception as e:
                print(f"   ❌ Download Error: {e}"); return

    elif choice == "2":
        f_name = input("Enter filename (in 'input' folder): ").strip()
        local_path = os.path.join(INPUT_DIR, f_name)
        if not os.path.exists(local_path): print("❌ File not found."); return
        
        title = Path(f_name).stem
        audio_path = f"{INPUT_DIR}/{title}.mp3"
        
        # Safe Conversion
        if not convert_to_mp3(local_path, audio_path): return

    # Setup Folders
    safe_name = sanitize_filename(title)
    project_folder = f"{OUTPUT_DIR}/{safe_name}"
    Path(project_folder).mkdir(parents=True, exist_ok=True)

    # Local Video Slide Logic
    if choice == "2" and f_name.lower().endswith(('.mp4', '.mkv', '.mov', '.avi')):
        loop = asyncio.get_running_loop()
        local_path = os.path.join(INPUT_DIR, f_name)
        loop.run_in_executor(None, extract_slides_local, local_path, project_folder)

    # --- STEP 2: TRANSCRIPTION ---
    if not text:
        if not audio_path or not os.path.exists(audio_path): return
        print("   🎧 Starting Transcription Engine...")
        text = await get_transcript_async(audio_path)

    # Guardrail: Check for silent/empty transcript
    if not text or len(text.strip()) < 50:
        print("\n❌ ERROR: Transcript is empty or audio is silent.")
        return 

    # --- STEP 3: INTELLIGENCE ---
    print("\n🔹 Step 2: Parallel Intelligence...")
    sys_p = 'Classify as "LECTURE", "MEETING", "NEWS", or "GENERAL". Return JSON: {"type": "LECTURE"}'
    try:
        res = await async_client.chat.completions.create(
            messages=[{"role": "system", "content": sys_p}, {"role": "user", "content": text[:5000]}],
            model="llama-3.3-70b-versatile", response_format={"type": "json_object"}
        )
        v_type = json.loads(res.choices[0].message.content).get('type', 'GENERAL')
    except: v_type = "GENERAL"
    print(f"   🧠 Detected Type: {v_type}")

    loop = asyncio.get_running_loop()
    task_report = generate_report_async(text, v_type)
    task_trans = translate_transcript_async(text, target_lang)
    
    task_quiz = None
    if v_type in ["LECTURE", "TUTORIAL"]:
        task_quiz = generate_quiz_async(text, target_lang)
    else:
        print("   ⏩ Skipping Quiz")

    # YouTube Slide Logic
    if choice == "1" and v_type in ["LECTURE", "TUTORIAL"]:
        loop.run_in_executor(None, fetch_visuals_yt, url, project_folder)

    # Wait for all AI tasks
    active_tasks = [task_report, task_trans]
    if task_quiz: active_tasks.append(task_quiz)
    
    results = await asyncio.gather(*active_tasks)
    analysis_json = results[0]
    full_trans_text = results[1]
    quiz_json = results[2] if task_quiz else None
    
    markdown_report = await translate_report_async(analysis_json, target_lang, v_type)

    print("\n🔹 Step 3: Finalizing...")
    english_md = dict_to_md(analysis_json)
    final_md = f"# {analysis_json.get('title', title)}\n**Type:** {v_type} | **Language:** {target_lang}\n\n## 🇬🇧 English Notes\n{english_md}\n\n## 🚩 {target_lang} Notes\n{markdown_report}"
    
    with open(f"{project_folder}/transcript.txt", "w", encoding="utf-8") as f: f.write(text)
    with open(f"{project_folder}/REPORT.md", "w", encoding="utf-8") as f: f.write(final_md)
    if quiz_json:
        with open(f"{project_folder}/quiz.json", "w", encoding="utf-8") as f: json.dump(quiz_json, f, indent=4)
    
    generate_pdf(project_folder, final_md, quiz_json, target_lang)
    print(f"\n✅ DONE! Open folder: {project_folder}")

if __name__ == "__main__":
    asyncio.run(main_async())