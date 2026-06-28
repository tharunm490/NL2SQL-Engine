import uuid
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.query_history import QueryHistory
from app.repositories.history import QueryHistoryRepository
from app.core.exceptions import NotFoundException

logger = logging.getLogger(__name__)


class QueryHistoryService:
    def __init__(self, db: AsyncSession):
        self.repo = QueryHistoryRepository(db)

    async def record(
        self,
        user_id: uuid.UUID,
        question: str,
        generated_sql: str,
        database_connection_id: uuid.UUID | None,
        database_name: str | None,
        execution_time: float,
        row_count: int,
        status: str,
        error_message: str | None = None,
    ) -> QueryHistory:
        entry = QueryHistory(
            id=uuid.uuid4(),
            user_id=user_id,
            question=question,
            generated_sql=generated_sql,
            database_connection_id=database_connection_id,
            database_name=database_name,
            execution_time=execution_time,
            row_count=row_count,
            status=status,
            error_message=error_message,
        )
        created = await self.repo.create(entry)
        logger.debug("Query history recorded: %s", created.id)
        return created

    async def get_by_id(self, entry_id: uuid.UUID) -> QueryHistory:
        entry = await self.repo.get_by_id(entry_id)
        if not entry:
            raise NotFoundException("Query history entry not found")
        return entry

    async def list_my_history(self, user_id: uuid.UUID) -> list[QueryHistory]:
        return await self.repo.list_by_user(user_id)

    async def list_my_recent(self, user_id: uuid.UUID) -> list[QueryHistory]:
        return await self.repo.list_recent_by_user(user_id)

    async def list_all(self) -> list[QueryHistory]:
        return await self.repo.list_all()

    async def list_by_user(self, user_id: uuid.UUID) -> list[QueryHistory]:
        return await self.repo.list_by_user_admin(user_id)
