import json
import redis
import hashlib
from app.core.config import settings

# Initialize Redis client for caching
# We use a different DB (e.g., 1) for caching to keep it separate from Celery (DB 0)
cache_client = redis.from_url(settings.REDIS_URL.replace("/0", "/1"))

def get_cache_key(prefix: str, content: str) -> str:
    """Generates a stable cache key based on content hash."""
    content_hash = hashlib.sha256(content.encode()).hexdigest()
    return f"{prefix}:{content_hash}"

def get_cached_result(key: str):
    """Retrieves a result from Redis."""
    try:
        data = cache_client.get(key)
        if data:
            return json.loads(data)
    except Exception as e:
        print(f"⚠️ Cache read failed: {e}")
    return None

def set_cached_result(key: str, value: any, ttl: int = 86400):
    """Stores a result in Redis with a TTL (default 24h)."""
    try:
        cache_client.setex(key, ttl, json.dumps(value))
    except Exception as e:
        print(f"⚠️ Cache write failed: {e}")
