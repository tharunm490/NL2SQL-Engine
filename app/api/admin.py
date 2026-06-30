import uuid
import logging
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.admin import (
    CreateUserRequest, UpdateUserRequest, UserStatusUpdate,
    UserAdminResponse, AssignDatabasesRequest,
)
from app.schemas.permission import AssignedDatabaseResponse
from app.services.admin import AdminService
from app.services.permission import PermissionService
from app.services.audit import AuditService
from app.api.dependencies import require_admin
from app.models.user import User
from app.core.exceptions import BadRequestException

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


@router.put("/users/{user_id}", response_model=UserAdminResponse)
async def update_user(
    user_id: uuid.UUID,
    body: UpdateUserRequest,
    request: Request,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    user = await service.update_user(
        user_id=user_id,
        username=body.username,
        email=body.email,
        role=body.role,
        is_active=body.is_active,
    )
    audit = AuditService(db)
    await audit.log(
        action="user_edited",
        user_id=admin.id,
        username=admin.username,
        resource_type="user",
        resource_id=str(user.id),
        details=f"Edited user: {user.username}",
        ip_address=request.client.host if request.client else None,
    )
    return user


@router.delete("/users/{user_id}", status_code=204)
async def delete_user(
    user_id: uuid.UUID,
    request: Request,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    if str(admin.id) == str(user_id):
        raise BadRequestException("Cannot delete yourself")

    service = AdminService(db)
    deleted_user = await service.repo.get_by_id(user_id)
    await service.delete_user(user_id)

    audit = AuditService(db)
    await audit.log(
        action="user_deleted",
        user_id=admin.id,
        username=admin.username,
        resource_type="user",
        resource_id=str(user_id),
        details=f"Deleted user: {deleted_user.username if deleted_user else 'unknown'}",
        ip_address=request.client.host if request.client else None,
    )


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


@router.get("/users/{user_id}/databases", response_model=list[AssignedDatabaseResponse])
async def get_user_databases(
    user_id: uuid.UUID,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = PermissionService(db)
    return await service.get_assigned_databases(user_id)


@router.put("/users/{user_id}/databases", status_code=204)
async def assign_user_databases(
    user_id: uuid.UUID,
    body: AssignDatabasesRequest,
    request: Request,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = PermissionService(db)
    await service.bulk_assign(user_id, body.database_ids)
    audit = AuditService(db)
    target_user = await service.user_repo.get_by_id(user_id)
    conn_names = []
    for db_id in body.database_ids:
        conn = await service.connection_repo.get_by_id(db_id)
        if conn:
            conn_names.append(conn.name)
    await audit.log(
        action="databases_assigned",
        user_id=admin.id,
        username=admin.username,
        resource_type="user",
        resource_id=str(user_id),
        details=f"Assigned databases [{', '.join(conn_names)}] to {target_user.username if target_user else 'unknown'}",
        ip_address=request.client.host if request.client else None,
    )
