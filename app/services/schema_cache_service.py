import uuid
import logging
from app.core.config import settings
from app.models.database_connection import DatabaseConnection
from app.schemas.schema import SchemaResponse
from app.services.redis_client import redis_client
from app.services.schema_discovery import discover_schema

logger = logging.getLogger(__name__)

SCHEMA_TTL = settings.REDIS_TTL_SCHEMA


class SchemaCacheService:
    def __init__(self):
        self._redis = redis_client

    async def get_schema(
        self, database_id: uuid.UUID, connection: DatabaseConnection
    ) -> SchemaResponse:
        key = f"schema:{database_id}"
        cached = await self._get(key)
        if cached is not None:
            logger.info("Schema Cache HIT for database %s", database_id)
            return SchemaResponse.model_validate_json(cached)
        logger.info("Schema Cache MISS for database %s", database_id)
        schema = discover_schema(connection)
        await self._set(key, schema.model_dump_json())
        logger.info("Schema Cached for database %s", database_id)
        return schema

    async def cache_schema(
        self, database_id: uuid.UUID, metadata: SchemaResponse
    ) -> None:
        key = f"schema:{database_id}"
        await self._set(key, metadata.model_dump_json())
        logger.info("Schema Cached for database %s", database_id)

    async def refresh_schema(
        self, database_id: uuid.UUID, connection: DatabaseConnection
    ) -> SchemaResponse:
        key = f"schema:{database_id}"
        await self._delete(key)
        logger.info("Schema Invalidated for database %s", database_id)
        schema = discover_schema(connection)
        await self._set(key, schema.model_dump_json())
        logger.info("Schema Cached for database %s", database_id)
        return schema

    async def delete_schema(self, database_id: uuid.UUID) -> None:
        key = f"schema:{database_id}"
        await self._delete(key)
        logger.info("Schema Invalidated for database %s", database_id)

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
            await client.setex(key, SCHEMA_TTL, value)
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


schema_cache_service = SchemaCacheService()
