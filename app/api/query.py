import uuid
import logging
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.query import QueryRequest, QueryResult
from app.services.database_connection import DatabaseConnectionService
from app.services.query_executor import execute_query
from app.services.schema_discovery import discover_schema
from app.services.permission import PermissionService
from app.services.history import QueryHistoryService
from app.services.audit import AuditService
from app.services.llm import llm_service
from app.services.validator import validate_sql
from app.prompts.builder import build_prompt
from app.api.dependencies import get_current_user, require_admin
from app.models.user import User
from app.core.exceptions import ForbiddenException, BadRequestException

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Query Execution"])


def _extract_first_statement(sql: str) -> str:
    lines = []
    for line in sql.split("\n"):
        stripped = line.strip()
        if stripped.upper().startswith("SELECT") or stripped.upper().startswith("--"):
            lines.append(line)
        elif lines and not stripped:
            continue
        elif lines:
            lines.append(line)
    result = " ".join(lines)
    for sep in (";", "\n\n"):
        if sep in result:
            result = result.split(sep)[0].strip()
    return result.strip()


async def _resolve_sql(connection, body: QueryRequest, db: AsyncSession) -> str:
    if body.sql:
        return body.sql
    if not body.question:
        raise BadRequestException("Either sql or question must be provided")
    schema = discover_schema(connection)
    prompt = build_prompt(body.question, schema)

    for attempt in range(2):
        generated = llm_service.generate_sql(prompt["system"], prompt["user"] if attempt == 0 else retry_prompt)
        if not generated or not generated.strip():
            if attempt == 0:
                raise BadRequestException("LLM failed to generate SQL")
            raise BadRequestException(f"LLM failed to generate valid SQL: {error_msg}")

        sql = _extract_first_statement(generated)
        if not sql:
            if attempt == 0:
                raise BadRequestException("LLM returned empty query")
            raise BadRequestException(f"LLM failed to generate valid SQL: {error_msg}")

        validation = validate_sql(sql, schema)
        if validation.valid:
            return sql

        logger.warning("Generated SQL failed validation (attempt %d): %s", attempt + 1, validation.errors)
        error_msg = " | ".join(validation.errors)
        retry_prompt = (
            prompt["user"]
            + f"\n\nYour previous query was rejected: {error_msg}. Generate a SINGLE corrected SQL query that follows the rules."
        )

    raise BadRequestException(
        f"Generated SQL still invalid after retry: {'; '.join(validation.errors)}"
    )


@router.post("/query/execute", response_model=QueryResult)
async def execute_analyst_query(
    body: QueryRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conn_id = uuid.UUID(body.database_connection_id)
    permission_service = PermissionService(db)
    assigned = await permission_service.get_assigned_databases(current_user.id)
    if not any(str(d.id) == str(conn_id) for d in assigned):
        raise ForbiddenException("Database not assigned to you")

    conn_service = DatabaseConnectionService(db)
    connection = await conn_service.get_by_id(conn_id)

    sql = await _resolve_sql(connection, body, db)
    result = execute_query(connection, sql)
    result.sql = sql

    history_service = QueryHistoryService(db)
    await history_service.record(
        user_id=current_user.id,
        question=body.question,
        generated_sql=sql,
        database_connection_id=conn_id,
        database_name=connection.name,
        execution_time=result.execution_time,
        row_count=result.row_count,
        status=result.status,
        error_message=result.error,
    )

    audit = AuditService(db)
    await audit.log(
        action="query_executed",
        user_id=current_user.id,
        username=current_user.username,
        resource_type="query",
        details=f"Executed query on '{connection.name}': {sql[:100]}",
        ip_address=request.client.host if request.client else None,
        status=result.status,
    )

    return result


@router.post("/admin/query/execute", response_model=QueryResult)
async def execute_admin_query(
    body: QueryRequest,
    request: Request,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    conn_id = uuid.UUID(body.database_connection_id)
    conn_service = DatabaseConnectionService(db)
    connection = await conn_service.get_by_id(conn_id)

    sql = await _resolve_sql(connection, body, db)
    result = execute_query(connection, sql)
    result.sql = sql

    history_service = QueryHistoryService(db)
    await history_service.record(
        user_id=current_user.id,
        question=body.question,
        generated_sql=sql,
        database_connection_id=conn_id,
        database_name=connection.name,
        execution_time=result.execution_time,
        row_count=result.row_count,
        status=result.status,
        error_message=result.error,
    )

    audit = AuditService(db)
    await audit.log(
        action="query_executed",
        user_id=current_user.id,
        username=current_user.username,
        resource_type="query",
        details=f"Admin query on '{connection.name}': {sql[:100]}",
        ip_address=request.client.host if request.client else None,
        status=result.status,
    )

    return result
