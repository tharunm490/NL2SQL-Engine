import uuid
import asyncio
import logging
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.database_connection import (
    ConnectionCreateRequest,
    ConnectionUpdateRequest,
    ConnectionTestRequest,
    ConnectionResponse,
    ConnectionTestResult,
    ConnectionStatusResponse,
    BatchStatusRequest,
)
from app.schemas.schema import SchemaResponse
from app.schemas.schema_visualization import SchemaVisualization
from app.services.database_connection import DatabaseConnectionService
from app.services.permission import PermissionService
from app.services.audit import AuditService
from app.services.schema_visualization import get_schema_visualization
from app.services.schema_cache_service import schema_cache_service
from app.services.connection_status_cache_service import connection_status_cache_service
from app.api.dependencies import require_admin, get_current_user
from app.models.user import User
from app.core.exceptions import ForbiddenException
from app.utils.encryption import decrypt_password

_executor = ThreadPoolExecutor(max_workers=4)

logger = logging.getLogger(__name__)

# Admin-only router
router = APIRouter(
    prefix="/admin/connections",
    tags=["Database Connections"],
    dependencies=[Depends(require_admin)],
)

# Shared router (admin and analyst)
shared_router = APIRouter(prefix="/databases", tags=["Database Connections Shared"])


@router.post("/test", response_model=ConnectionTestResult)
async def test_connection(
    body: ConnectionTestRequest,
    request: Request,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = DatabaseConnectionService(db)
    success, message = await service.test_connection(
        host=body.host,
        port=body.port,
        database=body.database,
        username=body.username,
        password=body.password,
    )
    audit = AuditService(db)
    await audit.log(
        action="connection_tested",
        user_id=admin.id,
        username=admin.username,
        resource_type="database_connection",
        details=f"Test {'succeeded' if success else 'failed'}: {body.host}:{body.port}/{body.database}",
        ip_address=request.client.host if request.client else None,
        status="success" if success else "failure",
    )
    return ConnectionTestResult(success=success, message=message)


@router.post("", response_model=ConnectionResponse, status_code=201)
async def create_connection(
    body: ConnectionCreateRequest,
    request: Request,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = DatabaseConnectionService(db)
    conn = await service.create(
        name=body.name,
        host=body.host,
        port=body.port,
        database=body.database,
        username=body.username,
        password=body.password,
    )
    audit = AuditService(db)
    await audit.log(
        action="connection_created",
        user_id=admin.id,
        username=admin.username,
        resource_type="database_connection",
        resource_id=str(conn.id),
        details=f"Created connection: {body.name}",
        ip_address=request.client.host if request.client else None,
    )
    return conn


@router.get("", response_model=list[ConnectionResponse])
async def list_connections(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = DatabaseConnectionService(db)
    return await service.list_all()


@router.get("/{connection_id}", response_model=ConnectionResponse)
async def get_connection(
    connection_id: uuid.UUID,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = DatabaseConnectionService(db)
    return await service.get_by_id(connection_id)


@router.put("/{connection_id}", response_model=ConnectionResponse)
async def update_connection(
    connection_id: uuid.UUID,
    body: ConnectionUpdateRequest,
    request: Request,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = DatabaseConnectionService(db)
    conn = await service.update(
        connection_id=connection_id,
        name=body.name,
        host=body.host,
        port=body.port,
        database=body.database,
        username=body.username,
        password=body.password,
    )
    audit = AuditService(db)
    await audit.log(
        action="connection_updated",
        user_id=admin.id,
        username=admin.username,
        resource_type="database_connection",
        resource_id=str(conn.id),
        details=f"Updated connection: {conn.name}",
        ip_address=request.client.host if request.client else None,
    )
    return conn


@router.delete("/{connection_id}", status_code=204)
async def delete_connection(
    connection_id: uuid.UUID,
    request: Request,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = DatabaseConnectionService(db)
    conn = await service.get_by_id(connection_id)
    await service.delete(connection_id)
    await schema_cache_service.delete_schema(connection_id)
    await connection_status_cache_service.delete_status(connection_id)
    audit = AuditService(db)
    await audit.log(
        action="connection_deleted",
        user_id=admin.id,
        username=admin.username,
        resource_type="database_connection",
        resource_id=str(connection_id),
        details=f"Deleted connection: {conn.name}",
        ip_address=request.client.host if request.client else None,
    )


@router.post("/{connection_id}/refresh-schema", response_model=SchemaResponse)
async def refresh_schema(
    connection_id: uuid.UUID,
    request: Request,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = DatabaseConnectionService(db)
    conn = await service.get_by_id(connection_id)
    schema = await schema_cache_service.refresh_schema(connection_id, conn)
    audit = AuditService(db)
    await audit.log(
        action="schema_refreshed",
        user_id=admin.id,
        username=admin.username,
        resource_type="database_connection",
        resource_id=str(connection_id),
        details=f"Refreshed schema for {conn.name}",
        ip_address=request.client.host if request.client else None,
    )
    return schema


async def _run_sync(fn, *args):
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(_executor, fn, *args)


@router.get("/{connection_id}/schema-visualization", response_model=SchemaVisualization)
async def get_schema_visualization_endpoint(
    connection_id: uuid.UUID,
    request: Request,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = DatabaseConnectionService(db)
    conn = await service.get_by_id(connection_id)
    schema = await schema_cache_service.get_schema(connection_id, conn)
    result = await _run_sync(get_schema_visualization, conn, schema)
    audit = AuditService(db)
    await audit.log(
        action="schema_visualized",
        user_id=admin.id,
        username=admin.username,
        resource_type="database_connection",
        resource_id=str(connection_id),
        details=f"Viewed schema visualization for {conn.name}",
        ip_address=request.client.host if request.client else None,
    )
    return result


@shared_router.post("/{connection_id}/test", response_model=ConnectionTestResult)
async def test_stored_connection(
    connection_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = DatabaseConnectionService(db)
    conn = await service.get_by_id(connection_id)

    if current_user.role.value != "admin":
        perm_service = PermissionService(db)
        assigned = await perm_service.get_assigned_databases(current_user.id)
        if not any(str(d.id) == str(connection_id) for d in assigned):
            raise ForbiddenException("Database not assigned to you")

    password = decrypt_password(conn.encrypted_password)
    success, message = await service.test_connection(
        host=conn.host, port=conn.port, database=conn.database,
        username=conn.username, password=password,
    )
    now = datetime.now(timezone.utc)
    await connection_status_cache_service.cache_status(connection_id, {
        "success": success,
        "status": "Active" if success else "Inactive",
        "error": None if success else message,
        "last_checked": now.isoformat(),
    })
    audit = AuditService(db)
    await audit.log(
        action="connection_tested",
        user_id=current_user.id,
        username=current_user.username,
        resource_type="database_connection",
        resource_id=str(connection_id),
        details=f"Test {'succeeded' if success else 'failed'} for '{conn.name}'",
        ip_address=request.client.host if request.client else None,
        status="success" if success else "failure",
    )
    return ConnectionTestResult(success=success, message=message)


@shared_router.post("/batch-status", response_model=list[ConnectionStatusResponse])
async def batch_check_status(
    body: BatchStatusRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = DatabaseConnectionService(db)
    perm_service = PermissionService(db)

    if current_user.role.value != "admin":
        assigned = await perm_service.get_assigned_databases(current_user.id)
        allowed_ids = {str(d.id) for d in assigned}
    else:
        all_conns = await service.list_all()
        allowed_ids = {str(c.id) for c in all_conns}

    results = []
    now = datetime.now(timezone.utc)
    for cid in body.ids:
        cid_str = str(cid)
        if cid_str not in allowed_ids:
            results.append(ConnectionStatusResponse(
                id=cid, success=False, status="Inactive", error="Access denied", last_checked=now,
            ))
            continue
        try:
            cached = await connection_status_cache_service.get_status(cid)
            if cached is not None:
                results.append(ConnectionStatusResponse(
                    id=cid,
                    success=cached["success"],
                    status=cached["status"],
                    error=cached.get("error"),
                    last_checked=datetime.fromisoformat(cached["last_checked"]),
                ))
                continue

            conn = await service.get_by_id(cid)
            password = decrypt_password(conn.encrypted_password)
            success, message = await service.test_connection(
                host=conn.host, port=conn.port, database=conn.database,
                username=conn.username, password=password,
            )
            status_data = {
                "success": success,
                "status": "Active" if success else "Inactive",
                "error": None if success else message,
                "last_checked": now.isoformat(),
            }
            await connection_status_cache_service.cache_status(cid, status_data)
            results.append(ConnectionStatusResponse(
                id=cid, success=success,
                status="Active" if success else "Inactive",
                error=None if success else message,
                last_checked=now,
            ))
        except Exception as e:
            results.append(ConnectionStatusResponse(
                id=cid, success=False, status="Inactive",
                error=str(e), last_checked=now,
            ))
    return results
