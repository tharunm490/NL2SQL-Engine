import uuid
import logging
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.permission import (
    AssignPermissionRequest,
    PermissionResponse,
    AssignedDatabaseResponse,
)
from app.services.permission import PermissionService
from app.services.audit import AuditService
from app.api.dependencies import require_admin, get_current_user
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Permissions"])


@router.post(
    "/admin/permissions",
    response_model=PermissionResponse,
    status_code=201,
    dependencies=[Depends(require_admin)],
)
async def assign_permission(
    body: AssignPermissionRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    service = PermissionService(db)
    perm = await service.assign(
        analyst_id=body.analyst_id,
        database_connection_id=body.database_connection_id,
    )
    audit = AuditService(db)
    await audit.log(
        action="permission_assigned",
        user_id=admin.id,
        username=admin.username,
        resource_type="permission",
        resource_id=str(perm.id),
        details=f"Assigned DB {body.database_connection_id} to analyst {body.analyst_id}",
        ip_address=request.client.host if request.client else None,
    )
    return perm


@router.delete(
    "/admin/permissions/{permission_id}",
    status_code=204,
    dependencies=[Depends(require_admin)],
)
async def remove_permission(
    permission_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    service = PermissionService(db)
    await service.remove(permission_id)
    audit = AuditService(db)
    await audit.log(
        action="permission_removed",
        user_id=admin.id,
        username=admin.username,
        resource_type="permission",
        resource_id=str(permission_id),
        ip_address=request.client.host if request.client else None,
    )


@router.get(
    "/admin/permissions",
    response_model=list[PermissionResponse],
    dependencies=[Depends(require_admin)],
)
async def list_all_permissions(
    db: AsyncSession = Depends(get_db),
):
    service = PermissionService(db)
    return await service.list_all()


@router.get(
    "/admin/analysts/{analyst_id}/permissions",
    response_model=list[PermissionResponse],
    dependencies=[Depends(require_admin)],
)
async def list_analyst_permissions(
    analyst_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    service = PermissionService(db)
    return await service.list_by_analyst(analyst_id)


@router.get("/me/databases", response_model=list[AssignedDatabaseResponse])
async def list_my_databases(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = PermissionService(db)
    return await service.get_assigned_databases(current_user.id)
