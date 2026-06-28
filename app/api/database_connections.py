import uuid
import asyncio
import logging
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
)
from app.schemas.schema_visualization import SchemaVisualization
from app.services.database_connection import DatabaseConnectionService
from app.services.audit import AuditService
from app.services.schema_visualization import get_schema_visualization
from app.api.dependencies import require_admin
from app.models.user import User

_executor = ThreadPoolExecutor(max_workers=4)

logger = logging.getLogger(__name__)
router = APIRouter(
    prefix="/admin/connections",
    tags=["Database Connections"],
    dependencies=[Depends(require_admin)],
)


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
    result = await _run_sync(get_schema_visualization, conn)
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
