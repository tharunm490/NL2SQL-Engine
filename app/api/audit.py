import uuid
import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.audit import AuditLogResponse
from app.services.audit import AuditService
from app.api.dependencies import require_admin

logger = logging.getLogger(__name__)
router = APIRouter(
    prefix="/admin/audit-logs",
    tags=["Audit Logs"],
    dependencies=[Depends(require_admin)],
)


@router.get("", response_model=list[AuditLogResponse])
async def list_audit_logs(
    db: AsyncSession = Depends(get_db),
):
    service = AuditService(db)
    return await service.list_all()


@router.get("/action/{action}", response_model=list[AuditLogResponse])
async def list_audit_logs_by_action(
    action: str,
    db: AsyncSession = Depends(get_db),
):
    service = AuditService(db)
    return await service.list_by_action(action)


@router.get("/user/{user_id}", response_model=list[AuditLogResponse])
async def list_audit_logs_by_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    service = AuditService(db)
    return await service.list_by_user(user_id)
