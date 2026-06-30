import uuid
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User, UserRole
from app.repositories.user import UserRepository
from app.repositories.permission import PermissionRepository
from app.utils.security import hash_password
from app.core.exceptions import ConflictException, NotFoundException, BadRequestException

logger = logging.getLogger(__name__)


class AdminService:
    def __init__(self, db: AsyncSession):
        self.repo = UserRepository(db)
        self.permission_repo = PermissionRepository(db)

    async def create_user(self, username: str, email: str, password: str, role: str) -> User:
        existing = await self.repo.get_by_username(username)
        if existing:
            raise ConflictException("Username already exists")

        existing_email = await self.repo.get_by_email(email)
        if existing_email:
            raise ConflictException("Email already exists")

        user_role = UserRole.ADMIN if role == "admin" else UserRole.ANALYST
        user = User(
            id=uuid.uuid4(),
            username=username,
            email=email,
            hashed_password=hash_password(password),
            role=user_role,
        )
        created = await self.repo.create(user)
        logger.info("Admin created user: %s (%s)", created.username, created.role.value)
        return created

    async def list_users(self) -> list[User]:
        return await self.repo.list_all()

    async def update_user(self, user_id: uuid.UUID, username: str, email: str, role: str, is_active: bool) -> User:
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")

        existing_username = await self.repo.get_by_username(username)
        if existing_username and str(existing_username.id) != str(user_id):
            raise ConflictException("Username already exists")

        existing_email = await self.repo.get_by_email(email)
        if existing_email and str(existing_email.id) != str(user_id):
            raise ConflictException("Email already exists")

        user.username = username
        user.email = email
        user.role = UserRole.ADMIN if role == "admin" else UserRole.ANALYST
        user.is_active = is_active
        await self.repo.db.flush()
        await self.repo.db.refresh(user)
        logger.info("User %s updated", user.username)
        return user

    async def delete_user(self, user_id: uuid.UUID) -> None:
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")

        await self.permission_repo.delete_by_user(user_id)
        await self.repo.db.delete(user)
        await self.repo.db.flush()
        logger.info("User %s deleted", user.username)

    async def update_user_status(self, user_id: uuid.UUID, is_active: bool) -> User:
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
        user.is_active = is_active
        await self.repo.db.flush()
        await self.repo.db.refresh(user)
        logger.info(
            "User %s status updated to active=%s", user.username, is_active
        )
        return user
