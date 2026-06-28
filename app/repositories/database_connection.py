import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.database_connection import DatabaseConnection


class DatabaseConnectionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, connection: DatabaseConnection) -> DatabaseConnection:
        self.db.add(connection)
        await self.db.flush()
        await self.db.refresh(connection)
        return connection

    async def get_by_id(self, connection_id: uuid.UUID) -> DatabaseConnection | None:
        result = await self.db.execute(
            select(DatabaseConnection).where(DatabaseConnection.id == connection_id)
        )
        return result.scalar_one_or_none()

    async def list_all(self) -> list[DatabaseConnection]:
        result = await self.db.execute(
            select(DatabaseConnection).order_by(DatabaseConnection.created_at.desc())
        )
        return list(result.scalars().all())

    async def update(self, connection: DatabaseConnection) -> DatabaseConnection:
        await self.db.flush()
        await self.db.refresh(connection)
        return connection

    async def delete(self, connection: DatabaseConnection) -> None:
        await self.db.delete(connection)
        await self.db.flush()
