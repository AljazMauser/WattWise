from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://wattwise_user:wattwise_password@db:5432/wattwise_db"
    SECRET_KEY: str = "default_secret_key_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    GROQ_API_KEY: Optional[str] = None
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
