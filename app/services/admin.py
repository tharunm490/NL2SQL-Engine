import uuid
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User, UserRole
from app.repositories.user import UserRepository
from app.utils.security import hash_password
from app.core.exceptions import ConflictException, NotFoundException

logger = logging.getLogger(__name__)


class AdminService:
    def __init__(self, db: AsyncSession):
        self.repo = UserRepository(db)

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
