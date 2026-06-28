import uuid
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.database_permission import DatabasePermission
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

    async def assign(self, analyst_id: uuid.UUID, database_connection_id: uuid.UUID) -> DatabasePermission:
        analyst = await self.user_repo.get_by_id(analyst_id)
        if not analyst:
            raise NotFoundException("Analyst not found")
        if analyst.role != UserRole.ANALYST:
            raise BadRequestException("User is not an analyst")

        connection = await self.connection_repo.get_by_id(database_connection_id)
        if not connection:
            raise NotFoundException("Database connection not found")

        existing = await self.repo.get_by_analyst_and_connection(analyst_id, database_connection_id)
        if existing:
            raise ConflictException("Permission already exists")

        permission = DatabasePermission(
            id=uuid.uuid4(),
            analyst_id=analyst_id,
            database_connection_id=database_connection_id,
        )
        created = await self.repo.create(permission)
        logger.info(
            "Assigned database '%s' to analyst '%s'",
            connection.name, analyst.username,
        )
        return created

    async def remove(self, permission_id: uuid.UUID) -> None:
        permission = await self.repo.get_by_id(permission_id)
        if not permission:
            raise NotFoundException("Permission not found")
        await self.repo.delete(permission)
        logger.info("Permission removed: %s", permission_id)

    async def list_by_analyst(self, analyst_id: uuid.UUID) -> list[DatabasePermission]:
        analyst = await self.user_repo.get_by_id(analyst_id)
        if not analyst:
            raise NotFoundException("Analyst not found")
        return await self.repo.list_by_analyst(analyst_id)

    async def list_all(self) -> list[DatabasePermission]:
        return await self.repo.list_all()

    async def get_assigned_databases(self, analyst_id: uuid.UUID) -> list[DatabaseConnection]:
        return await self.repo.get_assigned_databases(analyst_id)
