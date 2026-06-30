import uuid
import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.schema import SchemaResponse
from app.schemas.schema_visualization import SchemaVisualization
from app.services.database_connection import DatabaseConnectionService
from app.services.schema_cache_service import schema_cache_service
from app.services.schema_visualization import get_schema_visualization
from app.services.permission import PermissionService
from app.api.dependencies import get_current_user, require_admin
from app.models.user import User, UserRole
from app.core.exceptions import ForbiddenException, NotFoundException

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Schema Discovery"])


@router.get("/me/databases/{connection_id}/schema", response_model=SchemaResponse)
async def discover_my_database_schema(
    connection_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = PermissionService(db)
    assigned = await service.get_assigned_databases(current_user.id)
    if not any(str(d.id) == str(connection_id) for d in assigned):
        raise ForbiddenException("Database not assigned to you")

    conn_service = DatabaseConnectionService(db)
    connection = await conn_service.get_by_id(connection_id)
    return await schema_cache_service.get_schema(connection_id, connection)


@router.get(
    "/admin/databases/{connection_id}/schema",
    response_model=SchemaResponse,
    dependencies=[Depends(require_admin)],
)
async def discover_any_database_schema(
    connection_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    conn_service = DatabaseConnectionService(db)
    connection = await conn_service.get_by_id(connection_id)
    return await schema_cache_service.get_schema(connection_id, connection)


@router.get("/me/databases/{connection_id}/schema-visualization", response_model=SchemaVisualization)
async def discover_my_schema_visualization(
    connection_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    perm_service = PermissionService(db)
    assigned = await perm_service.get_assigned_databases(current_user.id)
    if current_user.role.value != "admin" and not any(str(d.id) == str(connection_id) for d in assigned):
        raise ForbiddenException("Database not assigned to you")

    conn_service = DatabaseConnectionService(db)
    connection = await conn_service.get_by_id(connection_id)

    schema = await schema_cache_service.get_schema(connection_id, connection)

    loop = asyncio.get_running_loop()
    executor = ThreadPoolExecutor(max_workers=4)
    try:
        result = await loop.run_in_executor(executor, get_schema_visualization, connection, schema)
    finally:
        executor.shutdown()
    return result
