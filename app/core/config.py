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

    LLM_PROVIDER: str = "openai"
    LLM_TEMPERATURE: float = 0.1
    LLM_MAX_TOKENS: int = 1000

    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-5.1-codex-mini"

    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: str = ""
    REDIS_TTL_SCHEMA: int = 3600
    REDIS_TTL_STATUS: int = 60

    @property
    def cors_origins_list(self) -> List[str]:
        return json.loads(self.CORS_ORIGINS)

    model_config = {"env_file": ".env", "case_sensitive": True, "extra": "ignore"}


settings = Settings()
