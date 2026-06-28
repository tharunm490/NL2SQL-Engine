import uuid
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.database_permission import DatabasePermission
from app.models.database_connection import DatabaseConnection


class PermissionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, permission: DatabasePermission) -> DatabasePermission:
        self.db.add(permission)
        await self.db.flush()
        await self.db.refresh(permission)
        return permission

    async def get_by_id(self, permission_id: uuid.UUID) -> DatabasePermission | None:
        result = await self.db.execute(
            select(DatabasePermission).where(DatabasePermission.id == permission_id)
        )
        return result.scalar_one_or_none()

    async def get_by_analyst_and_connection(
        self, analyst_id: uuid.UUID, database_connection_id: uuid.UUID
    ) -> DatabasePermission | None:
        result = await self.db.execute(
            select(DatabasePermission).where(
                DatabasePermission.analyst_id == analyst_id,
                DatabasePermission.database_connection_id == database_connection_id,
            )
        )
        return result.scalar_one_or_none()

    async def list_by_analyst(self, analyst_id: uuid.UUID) -> list[DatabasePermission]:
        result = await self.db.execute(
            select(DatabasePermission)
            .where(DatabasePermission.analyst_id == analyst_id)
            .order_by(DatabasePermission.created_at.desc())
        )
        return list(result.scalars().all())

    async def list_by_connection(
        self, database_connection_id: uuid.UUID
    ) -> list[DatabasePermission]:
        result = await self.db.execute(
            select(DatabasePermission).where(
                DatabasePermission.database_connection_id == database_connection_id
            )
        )
        return list(result.scalars().all())

    async def list_all(self) -> list[DatabasePermission]:
        result = await self.db.execute(
            select(DatabasePermission).order_by(DatabasePermission.created_at.desc())
        )
        return list(result.scalars().all())

    async def delete(self, permission: DatabasePermission) -> None:
        await self.db.delete(permission)
        await self.db.flush()

    async def get_assigned_databases(
        self, analyst_id: uuid.UUID
    ) -> list[DatabaseConnection]:
        result = await self.db.execute(
            select(DatabaseConnection)
            .join(
                DatabasePermission,
                DatabasePermission.database_connection_id == DatabaseConnection.id,
            )
            .where(
                DatabasePermission.analyst_id == analyst_id,
                DatabaseConnection.is_active == True,
            )
            .order_by(DatabaseConnection.name)
        )
        return list(result.scalars().all())
