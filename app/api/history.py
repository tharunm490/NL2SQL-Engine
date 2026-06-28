import uuid
import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.history import QueryHistoryResponse, QueryHistoryDetail
from app.services.history import QueryHistoryService
from app.api.dependencies import get_current_user, require_admin
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Query History"])


@router.get("/me/query-history", response_model=list[QueryHistoryResponse])
async def list_my_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = QueryHistoryService(db)
    return await service.list_my_history(current_user.id)


@router.get("/me/query-history/recent", response_model=list[QueryHistoryResponse])
async def list_my_recent_queries(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = QueryHistoryService(db)
    return await service.list_my_recent(current_user.id)


@router.get("/me/query-history/{entry_id}", response_model=QueryHistoryDetail)
async def get_my_query_detail(
    entry_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = QueryHistoryService(db)
    entry = await service.get_by_id(entry_id)
    if str(entry.user_id) != str(current_user.id):
        from app.core.exceptions import ForbiddenException
        raise ForbiddenException("Not your query")
    return entry


@router.get(
    "/admin/query-history",
    response_model=list[QueryHistoryDetail],
    dependencies=[Depends(require_admin)],
)
async def list_all_history(
    db: AsyncSession = Depends(get_db),
):
    service = QueryHistoryService(db)
    return await service.list_all()


@router.get(
    "/admin/query-history/{user_id}",
    response_model=list[QueryHistoryDetail],
    dependencies=[Depends(require_admin)],
)
async def list_user_history(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    service = QueryHistoryService(db)
    return await service.list_by_user(user_id)
