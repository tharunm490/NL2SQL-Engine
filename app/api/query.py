import uuid
import logging
import time
import sqlparse
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.query import QueryRequest, QueryResult
from app.services.database_connection import DatabaseConnectionService
from app.services.query_executor import execute_query
from app.services.schema_cache_service import schema_cache_service
from app.services.permission import PermissionService
from app.services.history import QueryHistoryService
from app.services.audit import AuditService
from app.services.llm import llm_service
from app.services.validator import validate_sql
from app.services.formatter import format_success, format_error, friendly_error_message
from app.prompts.builder import build_prompt
from app.api.dependencies import get_current_user, require_admin
from app.models.user import User
from app.core.exceptions import ForbiddenException, BadRequestException

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Query Execution"])

MAX_RETRIES = 3


def format_sql(sql: str) -> str:
    if not sql:
        return sql
    try:
        formatted = sqlparse.format(
            sql,
            reindent=True,
            keyword_case="upper",
            identifier_case="lower",
            strip_comments=False,
            use_space_around_operators=True,
        )
        return formatted.strip()
    except Exception:
        return sql.strip()


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


def _generate_and_validate_sql(
    connection,
    schema,
    question: str,
    error_context: str | None = None,
    previous_sql: str | None = None,
) -> str:
    prompt = build_prompt(question, schema)

    if error_context and previous_sql:
        user_prompt = (
            prompt["user"]
            + f"\n\nYour previous query had an error:\n{previous_sql}\n\nError: {error_context}\n\nFix only the SQL. Return only the corrected SQL."
        )
    else:
        user_prompt = prompt["user"]

    generated = llm_service.generate_sql(prompt["system"], user_prompt)
    if not generated or not generated.strip():
        raise BadRequestException("LLM failed to generate SQL")

    sql = _extract_first_statement(generated)
    if not sql:
        raise BadRequestException("LLM returned empty query")

    validation = validate_sql(sql, schema)
    if not validation.valid:
        error_msg = " | ".join(validation.errors)
        logger.warning("Pre-validation failed: %s", error_msg)
        raise BadRequestException(f"Generated SQL failed validation: {error_msg}")

    return format_sql(sql)


async def _execute_with_retry(
    connection,
    schema,
    question: str,
    db: AsyncSession,
    initial_sql: str | None = None,
) -> QueryResult:
    error_context: str | None = None
    previous_sql: str | None = initial_sql
    generation_start = time.time()

    for attempt in range(MAX_RETRIES):
        sql: str | None = None

        if attempt == 0 and initial_sql:
            sql = initial_sql
        else:
            try:
                sql = _generate_and_validate_sql(
                    connection,
                    schema,
                    question,
                    error_context=error_context,
                    previous_sql=previous_sql,
                )
                logger.info(
                    "SQL generated (attempt %d/%d) | Question: '%s' | SQL: %s",
                    attempt + 1, MAX_RETRIES, question[:100], sql[:200],
                )
            except BadRequestException as e:
                if attempt + 1 >= MAX_RETRIES:
                    friendly = friendly_error_message(str(e)) or str(e)
                    elapsed = time.time() - generation_start
                    return format_error(
                        str(e),
                        correction_attempts=attempt + 1,
                        friendly_error=friendly,
                        sql=previous_sql,
                    )
                error_context = str(e)
                continue

        exec_start = time.time()
        result = execute_query(connection, sql)
        exec_time = time.time() - exec_start
        total_time = time.time() - generation_start

        result.execution_time = round(total_time, 4)
        result.correction_attempts = attempt
        result.sql = sql

        if result.status == "success":
            if attempt > 0:
                result.corrected_sql = sql
            logger.info(
                "Query succeeded (attempt %d/%d) | Exec: %.2fs | Rows: %d",
                attempt + 1, MAX_RETRIES, exec_time, result.row_count,
            )
            return result

        logger.warning(
            "Query failed (attempt %d/%d) | Error: %s | SQL: %s",
            attempt + 1, MAX_RETRIES, result.error, sql[:200],
        )

        if attempt + 1 >= MAX_RETRIES:
            friendly = friendly_error_message(result.error or "")
            result.correction_attempts = attempt + 1
            result.original_error = result.error
            result.friendly_error = (
                friendly
                or "The query could not be executed. Please try rephrasing your question."
            )
            logger.info("All retries exhausted | SQL: %s | Error: %s", sql[:200], result.error)
            return result

        error_context = result.error
        previous_sql = sql


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
    schema = await schema_cache_service.get_schema(conn_id, connection)

    result = await _execute_with_retry(
        connection,
        schema,
        body.question or "",
        db,
        initial_sql=body.sql,
    )

    history_service = QueryHistoryService(db)
    await history_service.record(
        user_id=current_user.id,
        question=body.question or "",
        generated_sql=result.sql or "",
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
        details=f"Executed query on '{connection.name}': {(result.sql or '')[:100]}",
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
    schema = await schema_cache_service.get_schema(conn_id, connection)

    result = await _execute_with_retry(
        connection,
        schema,
        body.question or "",
        db,
        initial_sql=body.sql,
    )

    history_service = QueryHistoryService(db)
    await history_service.record(
        user_id=current_user.id,
        question=body.question or "",
        generated_sql=result.sql or "",
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
        details=f"Admin query on '{connection.name}': {(result.sql or '')[:100]}",
        ip_address=request.client.host if request.client else None,
        status=result.status,
    )

    return result