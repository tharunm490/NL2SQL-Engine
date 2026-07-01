import uuid
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User, UserRole
from app.repositories.user import UserRepository
from app.utils.security import hash_password, verify_password, create_access_token
from app.core.exceptions import ConflictException, UnauthorizedException, NotFoundException

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self, db: AsyncSession):
        self.repo = UserRepository(db)

    async def register(
        self, username: str, email: str, password: str, role: str = "analyst"
    ) -> User:
        existing = await self.repo.get_by_username(username)
        if existing:
            raise ConflictException("Username already exists")

        existing_email = await self.repo.get_by_email(email)
        if existing_email:
            raise ConflictException("Email already exists")

        user = User(
            id=uuid.uuid4(),
            username=username,
            email=email,
            hashed_password=hash_password(password),
            role=UserRole(role),
        )
        created = await self.repo.create(user)
        logger.info("User registered: %s (%s)", created.username, created.role.value)
        return created

    async def login(self, username: str, password: str) -> str:
        user = await self.repo.get_by_username(username)
        if not user:
            logger.warning("Failed login attempt - user not found: %s", username)
            raise NotFoundException("No account found with this username.")

        if not verify_password(password, user.hashed_password):
            logger.warning("Failed login attempt - wrong password for: %s", username)
            raise UnauthorizedException("Incorrect password. Please try again.")

        if not user.is_active:
            logger.warning("Inactive user attempted login: %s", username)
            raise UnauthorizedException(
                "Your account has been disabled. Please contact the administrator."
            )

        token = create_access_token(
            data={"sub": str(user.id), "role": user.role.value}
        )
        logger.info("User logged in: %s", username)
        return token

    async def get_current_user(self, user_id: str) -> User:
        user = await self.repo.get_by_id(uuid.UUID(user_id))
        if not user:
            raise NotFoundException("User not found")
        if not user.is_active:
            raise UnauthorizedException(
                "Your account has been disabled. Please contact the administrator."
            )
        return user
