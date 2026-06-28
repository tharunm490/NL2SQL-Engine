from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    APP_NAME: str = "AI SQL Assistant"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "Enterprise AI SQL Assistant for PostgreSQL"
    DEBUG: bool = True

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/ai_sql_assistant"
    DATABASE_URL_SYNC: str = "postgresql://postgres:postgres@localhost:5432/ai_sql_assistant"

    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    LOG_LEVEL: str = "DEBUG"
    LOG_FORMAT: str = "json"

    CORS_ORIGINS: str = '["http://localhost:3000","http://localhost:5173"]'

    DB_ENCRYPTION_KEY: str = "your-encryption-key-change-in-production"

    LLM_PROVIDER: str = "mock"
    LLM_API_KEY: str = ""
    LLM_API_URL: str = "https://api.openai.com/v1"
    LLM_MODEL: str = "gpt-4o-mini"
    LLM_TEMPERATURE: float = 0.1
    LLM_MAX_TOKENS: int = 1000

    @property
    def cors_origins_list(self) -> List[str]:
        return json.loads(self.CORS_ORIGINS)

    model_config = {"env_file": ".env", "case_sensitive": True, "extra": "ignore"}


settings = Settings()
