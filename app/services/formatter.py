import uuid
import logging
import re
from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import Any
from app.schemas.query import QueryResult

logger = logging.getLogger(__name__)


def serialize_value(val: Any) -> Any:
    if val is None:
        return None
    if isinstance(val, bool):
        return val
    if isinstance(val, int):
        return val
    if isinstance(val, float):
        return val
    if isinstance(val, str):
        return val
    if isinstance(val, bytes):
        return val.decode("utf-8", errors="replace")
    if isinstance(val, (uuid.UUID, datetime, date, Decimal, timedelta)):
        return str(val)
    if isinstance(val, dict):
        return {k: serialize_value(v) for k, v in val.items()}
    if isinstance(val, list):
        return [serialize_value(v) for v in val]
    if isinstance(val, tuple):
        return [serialize_value(v) for v in val]
    return str(val)


def friendly_error_message(error: str) -> str:
    if "relation" in error and "does not exist" in error:
        match = re.search(r'relation "([^"]+)"', error)
        table = match.group(1) if match else "unknown"
        return f'The table "{table}" was not found in the database. Please check that the table name is correct.'
    if "column" in error and "does not exist" in error:
        match = re.search(r'column "([^"]+)"', error)
        col = match.group(1) if match else "unknown"
        return f'The column "{col}" does not exist. Please check the column name and try again.'
    if "syntax error" in error.lower() or "syntax_error" in error.lower():
        return "There was a syntax error in the generated SQL. The system will attempt to fix it automatically."
    if "blocked statement" in error.lower():
        return "You cannot modify the database. Only SELECT queries are allowed."
    if "permission denied" in error.lower():
        return "Permission denied. You may not have access to this database or table."
    if "divide by zero" in error.lower():
        return "A division by zero occurred in the query. Consider filtering out zero values."
    if "timeout" in error.lower():
        return "The query timed out. It may be too complex or the database may be under heavy load."
    return None


def format_success(
    column_names: list[str],
    rows: list[list],
    execution_time: float,
    **kwargs,
) -> QueryResult:
    serialized_rows = [[serialize_value(cell) for cell in row] for row in rows]
    return QueryResult(
        column_names=column_names,
        rows=serialized_rows,
        execution_time=round(execution_time, 4),
        row_count=len(rows),
        status="success",
        corrected_sql=kwargs.get("corrected_sql"),
        correction_attempts=kwargs.get("correction_attempts", 0),
        original_error=kwargs.get("original_error"),
        friendly_error=kwargs.get("friendly_error"),
    )


def format_error(error: str, **kwargs) -> QueryResult:
    return QueryResult(
        column_names=[],
        rows=[],
        execution_time=0.0,
        row_count=0,
        status="error",
        error=error,
        sql=kwargs.get("sql"),
        corrected_sql=kwargs.get("corrected_sql"),
        correction_attempts=kwargs.get("correction_attempts", 0),
        original_error=kwargs.get("original_error"),
        friendly_error=kwargs.get("friendly_error"),
    )
