import json
import uuid
import logging
from app.core.config import settings
from app.services.redis_client import redis_client

logger = logging.getLogger(__name__)

STATUS_TTL = settings.REDIS_TTL_STATUS


class ConnectionStatusCacheService:
    def __init__(self):
        self._redis = redis_client

    async def get_status(self, database_id: uuid.UUID) -> dict | None:
        key = f"status:{database_id}"
        cached = await self._get(key)
        if cached is not None:
            logger.info("Status Cache HIT for database %s", database_id)
            return json.loads(cached)
        logger.info("Status Cache MISS for database %s", database_id)
        return None

    async def cache_status(self, database_id: uuid.UUID, status_data: dict) -> None:
        key = f"status:{database_id}"
        await self._set(key, json.dumps(status_data))
        logger.info("Status Cached for database %s", database_id)

    async def delete_status(self, database_id: uuid.UUID) -> None:
        key = f"status:{database_id}"
        await self._delete(key)
        logger.info("Status Invalidated for database %s", database_id)

    async def _get(self, key: str) -> str | None:
        client = self._redis.client
        if client is None:
            return None
        try:
            return await client.get(key)
        except Exception as e:
            logger.warning("Redis get failed for key %s: %s", key, e)
            return None

    async def _set(self, key: str, value: str) -> None:
        client = self._redis.client
        if client is None:
            return
        try:
            await client.setex(key, STATUS_TTL, value)
        except Exception as e:
            logger.warning("Redis set failed for key %s: %s", key, e)

    async def _delete(self, key: str) -> None:
        client = self._redis.client
        if client is None:
            return
        try:
            await client.delete(key)
        except Exception as e:
            logger.warning("Redis delete failed for key %s: %s", key, e)


connection_status_cache_service = ConnectionStatusCacheService()
