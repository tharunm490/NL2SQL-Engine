import logging
from redis.asyncio import Redis
from app.core.config import settings

logger = logging.getLogger(__name__)


class RedisClient:
    def __init__(self):
        self._client: Redis | None = None

    async def initialize(self) -> None:
        try:
            self._client = Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                db=settings.REDIS_DB,
                password=settings.REDIS_PASSWORD or None,
                decode_responses=True,
            )
            await self._client.ping()
            logger.info("Redis connected successfully.")
        except Exception as e:
            logger.warning("Redis connection failed: %s. Caching disabled.", e)
            self._client = None

    @property
    def client(self) -> Redis | None:
        return self._client

    async def close(self) -> None:
        if self._client:
            await self._client.close()
            self._client = None


redis_client = RedisClient()
