import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GROQ_API_KEY: str
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str
    FRONTEND_URL: str = "http://localhost:5173"
    SMTP_SERVER: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = ""
    ENCRYPTION_KEY: str = ""
    REDIS_URL: str = "redis://localhost:6379/0"
    
    @property
    def encryption_key_clean(self) -> str:
        return self.ENCRYPTION_KEY.strip()
    
    class Config:
        env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
        extra = "ignore"
        # For local development if running from 'backend' folder
        if not os.path.exists(env_file):
            env_file = ".env"

settings = Settings()
