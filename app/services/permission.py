import uuid
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user_database_access import UserDatabaseAccess
from app.models.user import User, UserRole
from app.models.database_connection import DatabaseConnection
from app.repositories.permission import PermissionRepository
from app.repositories.user import UserRepository
from app.repositories.database_connection import DatabaseConnectionRepository
from app.core.exceptions import NotFoundException, BadRequestException, ConflictException

logger = logging.getLogger(__name__)


class PermissionService:
    def __init__(self, db: AsyncSession):
        self.repo = PermissionRepository(db)
        self.user_repo = UserRepository(db)
        self.connection_repo = DatabaseConnectionRepository(db)

    async def assign(self, user_id: uuid.UUID, database_connection_id: uuid.UUID) -> UserDatabaseAccess:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")

        connection = await self.connection_repo.get_by_id(database_connection_id)
        if not connection:
            raise NotFoundException("Database connection not found")

        existing = await self.repo.get_by_user_and_connection(user_id, database_connection_id)
        if existing:
            raise ConflictException("Access already exists")

        access = UserDatabaseAccess(
            id=uuid.uuid4(),
            user_id=user_id,
            database_connection_id=database_connection_id,
        )
        created = await self.repo.create(access)
        logger.info(
            "Assigned database '%s' to user '%s'",
            connection.name, user.username,
        )
        return created

    async def bulk_assign(self, user_id: uuid.UUID, database_ids: list[uuid.UUID]) -> list[UserDatabaseAccess]:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")

        existing_access = await self.repo.list_by_user(user_id)
        existing_ids = {str(a.database_connection_id) for a in existing_access}

        created = []
        for db_id in database_ids:
            if str(db_id) in existing_ids:
                continue
            connection = await self.connection_repo.get_by_id(db_id)
            if not connection:
                continue
            access = UserDatabaseAccess(
                id=uuid.uuid4(),
                user_id=user_id,
                database_connection_id=db_id,
            )
            created.append(await self.repo.create(access))

        for access in existing_access:
            if str(access.database_connection_id) not in {str(d) for d in database_ids}:
                await self.repo.delete(access)

        logger.info(
            "Bulk assigned %d databases to user '%s'", len(database_ids), user.username,
        )
        return created

    async def remove(self, access_id: uuid.UUID) -> None:
        access = await self.repo.get_by_id(access_id)
        if not access:
            raise NotFoundException("Access not found")
        await self.repo.delete(access)
        logger.info("Access removed: %s", access_id)

    async def list_by_user(self, user_id: uuid.UUID) -> list[UserDatabaseAccess]:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
        return await self.repo.list_by_user(user_id)

    async def list_all(self) -> list[UserDatabaseAccess]:
        return await self.repo.list_all()

    async def get_assigned_databases(self, user_id: uuid.UUID) -> list[DatabaseConnection]:
        return await self.repo.get_assigned_databases(user_id)
