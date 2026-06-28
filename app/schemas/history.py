import uuid
from datetime import datetime
from pydantic import BaseModel


class QueryHistoryResponse(BaseModel):
    id: uuid.UUID
    question: str
    generated_sql: str
    database_name: str | None
    execution_time: float
    row_count: int
    status: str
    error_message: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class QueryHistoryDetail(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    question: str
    generated_sql: str
    database_connection_id: uuid.UUID | None
    database_name: str | None
    execution_time: float
    row_count: int
    status: str
    error_message: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
