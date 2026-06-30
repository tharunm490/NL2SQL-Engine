import logging
import time
import os
from abc import ABC, abstractmethod
from openai import OpenAI
from app.core.config import settings

logger = logging.getLogger(__name__)


class BaseLLMProvider(ABC):
    @abstractmethod
    def generate_sql(self, system_prompt: str, user_prompt: str) -> str:
        ...


class OpenAIProvider(BaseLLMProvider):
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY") or settings.OPENAI_API_KEY
        self.client = OpenAI(api_key=api_key)
        self.model = os.getenv("OPENAI_MODEL", settings.OPENAI_MODEL)
        self.temperature = settings.LLM_TEMPERATURE
        self.max_tokens = settings.LLM_MAX_TOKENS
    def generate_sql(self, system_prompt: str, user_prompt: str) -> str:
        logger.info("Model: %s", self.model)
        start = time.time()

        response = self.client.responses.create(
            model=self.model,
            max_output_tokens=self.max_tokens,
            input=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        elapsed = time.time() - start
        usage = response.usage
        if usage:
            logger.info(
                "Model: %s | Prompt Tokens: %s | Completion Tokens: %s | Total Tokens: %s | Execution Time: %.2f sec",
                self.model, usage.input_tokens, usage.output_tokens, usage.total_tokens, elapsed,
            )
        else:
            logger.info("Model: %s | Execution Time: %.2f sec", self.model, elapsed)
        sql = response.output_text or ""
        return sql.strip()


class MockProvider(BaseLLMProvider):
    def generate_sql(self, system_prompt: str, user_prompt: str) -> str:
        logger.info("MockProvider: returning placeholder SQL")
        return "SELECT * FROM information_schema.tables LIMIT 5"


class LLMService:
    def __init__(self):
        self._provider: BaseLLMProvider | None = None

    @property
    def provider(self) -> BaseLLMProvider:
        if self._provider is None:
            self._provider = self._create_provider()
        return self._provider

    def _create_provider(self) -> BaseLLMProvider:
        provider_name = settings.LLM_PROVIDER.lower()
        if provider_name == "openai":
            return OpenAIProvider()
        elif provider_name == "mock":
            return MockProvider()
        else:
            logger.warning("Unknown LLM provider '%s', falling back to mock", provider_name)
            return MockProvider()

    def generate_sql(self, system_prompt: str, user_prompt: str) -> str:
        return self.provider.generate_sql(system_prompt, user_prompt)


llm_service = LLMService()
