import uuid
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user_database_access import UserDatabaseAccess
from app.models.database_connection import DatabaseConnection


class PermissionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, access: UserDatabaseAccess) -> UserDatabaseAccess:
        self.db.add(access)
        await self.db.flush()
        await self.db.refresh(access)
        return access

    async def get_by_id(self, access_id: uuid.UUID) -> UserDatabaseAccess | None:
        result = await self.db.execute(
            select(UserDatabaseAccess).where(UserDatabaseAccess.id == access_id)
        )
        return result.scalar_one_or_none()

    async def get_by_user_and_connection(
        self, user_id: uuid.UUID, database_connection_id: uuid.UUID
    ) -> UserDatabaseAccess | None:
        result = await self.db.execute(
            select(UserDatabaseAccess).where(
                UserDatabaseAccess.user_id == user_id,
                UserDatabaseAccess.database_connection_id == database_connection_id,
            )
        )
        return result.scalar_one_or_none()

    async def list_by_user(self, user_id: uuid.UUID) -> list[UserDatabaseAccess]:
        result = await self.db.execute(
            select(UserDatabaseAccess)
            .where(UserDatabaseAccess.user_id == user_id)
            .order_by(UserDatabaseAccess.created_at.desc())
        )
        return list(result.scalars().all())

    async def list_by_connection(
        self, database_connection_id: uuid.UUID
    ) -> list[UserDatabaseAccess]:
        result = await self.db.execute(
            select(UserDatabaseAccess).where(
                UserDatabaseAccess.database_connection_id == database_connection_id
            )
        )
        return list(result.scalars().all())

    async def list_all(self) -> list[UserDatabaseAccess]:
        result = await self.db.execute(
            select(UserDatabaseAccess).order_by(UserDatabaseAccess.created_at.desc())
        )
        return list(result.scalars().all())

    async def delete(self, access: UserDatabaseAccess) -> None:
        await self.db.delete(access)
        await self.db.flush()

    async def delete_by_user_and_connection(
        self, user_id: uuid.UUID, database_connection_id: uuid.UUID
    ) -> None:
        await self.db.execute(
            delete(UserDatabaseAccess).where(
                UserDatabaseAccess.user_id == user_id,
                UserDatabaseAccess.database_connection_id == database_connection_id,
            )
        )
        await self.db.flush()

    async def delete_by_user(self, user_id: uuid.UUID) -> None:
        await self.db.execute(
            delete(UserDatabaseAccess).where(UserDatabaseAccess.user_id == user_id)
        )
        await self.db.flush()

    async def get_assigned_databases(
        self, user_id: uuid.UUID
    ) -> list[DatabaseConnection]:
        result = await self.db.execute(
            select(DatabaseConnection)
            .join(
                UserDatabaseAccess,
                UserDatabaseAccess.database_connection_id == DatabaseConnection.id,
            )
            .where(
                UserDatabaseAccess.user_id == user_id,
                DatabaseConnection.is_active == True,
            )
            .order_by(DatabaseConnection.name)
        )
        return list(result.scalars().all())
