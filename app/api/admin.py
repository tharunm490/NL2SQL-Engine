import uuid
import logging
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.admin import CreateUserRequest, UserStatusUpdate, UserAdminResponse
from app.services.admin import AdminService
from app.services.audit import AuditService
from app.api.dependencies import require_admin
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(require_admin)])


@router.get("/users", response_model=list[UserAdminResponse])
async def list_users(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.list_users()


@router.post("/users", response_model=UserAdminResponse, status_code=201)
async def create_user(
    body: CreateUserRequest,
    request: Request,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    user = await service.create_user(
        username=body.username,
        email=body.email,
        password=body.password,
        role=body.role,
    )
    audit = AuditService(db)
    await audit.log(
        action="user_created",
        user_id=admin.id,
        username=admin.username,
        resource_type="user",
        resource_id=str(user.id),
        details=f"Created {body.role} user: {body.username}",
        ip_address=request.client.host if request.client else None,
    )
    return user


@router.patch("/users/{user_id}/status", response_model=UserAdminResponse)
async def update_user_status(
    user_id: uuid.UUID,
    body: UserStatusUpdate,
    request: Request,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    user = await service.update_user_status(user_id, body.is_active)
    audit = AuditService(db)
    await audit.log(
        action="user_status_changed",
        user_id=admin.id,
        username=admin.username,
        resource_type="user",
        resource_id=str(user.id),
        details=f"Set active={body.is_active} for user {user.username}",
        ip_address=request.client.host if request.client else None,
    )
    return user
