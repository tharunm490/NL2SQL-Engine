from pydantic import BaseModel


class QueryRequest(BaseModel):
    database_connection_id: str
    sql: str | None = None
    question: str = ""


class QueryResult(BaseModel):
    column_names: list[str]
    rows: list[list]
    execution_time: float
    row_count: int
    status: str
    error: str | None = None
    sql: str | None = None
    corrected_sql: str | None = None
    correction_attempts: int = 0
    original_error: str | None = None
    friendly_error: str | None = None
