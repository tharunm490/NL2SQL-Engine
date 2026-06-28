import uuid
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit_log import AuditLog
from app.repositories.audit import AuditLogRepository

logger = logging.getLogger(__name__)


class AuditService:
    def __init__(self, db: AsyncSession):
        self.repo = AuditLogRepository(db)

    async def log(
        self,
        action: str,
        user_id: uuid.UUID | None = None,
        username: str | None = None,
        resource_type: str | None = None,
        resource_id: str | None = None,
        details: str | None = None,
        ip_address: str | None = None,
        status: str = "success",
    ) -> AuditLog:
        entry = AuditLog(
            id=uuid.uuid4(),
            user_id=user_id,
            username=username,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            ip_address=ip_address,
            status=status,
        )
        created = await self.repo.create(entry)
        logger.debug("Audit log: %s - %s - %s", action, username, status)
        return created

    async def list_all(self) -> list[AuditLog]:
        return await self.repo.list_all()

    async def list_by_user(self, user_id: uuid.UUID) -> list[AuditLog]:
        return await self.repo.list_by_user(user_id)

    async def list_by_action(self, action: str) -> list[AuditLog]:
        return await self.repo.list_by_action(action)
