import time
import logging
from urllib.parse import quote
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from app.models.database_connection import DatabaseConnection
from app.utils.encryption import decrypt_password
from app.schemas.query import QueryResult
from app.services.formatter import format_success, format_error

logger = logging.getLogger(__name__)


def _build_url(connection: DatabaseConnection) -> str:
    password = decrypt_password(connection.encrypted_password)
    return f"postgresql://{connection.username}:{quote(password, safe='')}@{connection.host}:{connection.port}/{connection.database}"


def execute_query(connection: DatabaseConnection, sql: str, timeout: int = 30) -> QueryResult:
    url = _build_url(connection)
    engine = create_engine(url, pool_pre_ping=True, pool_size=1, max_overflow=0)

    try:
        with engine.connect() as conn:
            conn.execute(text(f"SET statement_timeout = {timeout * 1000}"))

            start = time.time()
            result = conn.execute(text(sql))
            execution_time = time.time() - start

            column_names = list(result.keys())
            rows = [list(row) for row in result.fetchall()]

            return format_success(column_names, rows, execution_time)
    except SQLAlchemyError as e:
        error_msg = str(e)
        logger.error("Query execution failed: %s", error_msg)
        return format_error(error_msg)
    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        logger.error("Query execution failed: %s", error_msg)
        return format_error(error_msg)
    finally:
        engine.dispose()
