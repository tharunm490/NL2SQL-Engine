import uuid
import logging
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


def format_success(
    column_names: list[str],
    rows: list[list],
    execution_time: float,
) -> QueryResult:
    serialized_rows = [[serialize_value(cell) for cell in row] for row in rows]
    return QueryResult(
        column_names=column_names,
        rows=serialized_rows,
        execution_time=round(execution_time, 4),
        row_count=len(rows),
        status="success",
    )


def format_error(error: str) -> QueryResult:
    return QueryResult(
        column_names=[],
        rows=[],
        execution_time=0.0,
        row_count=0,
        status="error",
        error=error,
    )
