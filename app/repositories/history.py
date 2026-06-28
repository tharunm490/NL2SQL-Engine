import uuid
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.query_history import QueryHistory


class QueryHistoryRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, entry: QueryHistory) -> QueryHistory:
        self.db.add(entry)
        await self.db.flush()
        await self.db.refresh(entry)
        return entry

    async def get_by_id(self, entry_id: uuid.UUID) -> QueryHistory | None:
        result = await self.db.execute(
            select(QueryHistory).where(QueryHistory.id == entry_id)
        )
        return result.scalar_one_or_none()

    async def list_by_user(self, user_id: uuid.UUID, limit: int = 50) -> list[QueryHistory]:
        result = await self.db.execute(
            select(QueryHistory)
            .where(QueryHistory.user_id == user_id)
            .order_by(desc(QueryHistory.created_at))
            .limit(limit)
        )
        return list(result.scalars().all())

    async def list_recent_by_user(self, user_id: uuid.UUID, limit: int = 10) -> list[QueryHistory]:
        result = await self.db.execute(
            select(QueryHistory)
            .where(QueryHistory.user_id == user_id)
            .order_by(desc(QueryHistory.created_at))
            .limit(limit)
        )
        return list(result.scalars().all())

    async def list_all(self, limit: int = 100) -> list[QueryHistory]:
        result = await self.db.execute(
            select(QueryHistory)
            .order_by(desc(QueryHistory.created_at))
            .limit(limit)
        )
        return list(result.scalars().all())

    async def list_by_user_admin(self, user_id: uuid.UUID, limit: int = 100) -> list[QueryHistory]:
        result = await self.db.execute(
            select(QueryHistory)
            .where(QueryHistory.user_id == user_id)
            .order_by(desc(QueryHistory.created_at))
            .limit(limit)
        )
        return list(result.scalars().all())
