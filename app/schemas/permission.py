import uuid
from datetime import datetime
from pydantic import BaseModel


class AssignPermissionRequest(BaseModel):
    analyst_id: uuid.UUID
    database_connection_id: uuid.UUID


class PermissionResponse(BaseModel):
    id: uuid.UUID
    analyst_id: uuid.UUID
    database_connection_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class AssignedDatabaseResponse(BaseModel):
    id: uuid.UUID
    name: str
    host: str
    port: int
    database: str
    username: str

    model_config = {"from_attributes": True}
