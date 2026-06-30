import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class ConnectionCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    host: str = Field(..., min_length=1, max_length=255)
    port: int = Field(default=5432, ge=1, le=65535)
    database: str = Field(..., min_length=1, max_length=100)
    username: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=1)


class ConnectionUpdateRequest(BaseModel):
    name: str | None = Field(default=None, max_length=100)
    host: str | None = Field(default=None, max_length=255)
    port: int | None = Field(default=None, ge=1, le=65535)
    database: str | None = Field(default=None, max_length=100)
    username: str | None = Field(default=None, max_length=100)
    password: str | None = Field(default=None)


class ConnectionTestRequest(BaseModel):
    host: str = Field(..., min_length=1, max_length=255)
    port: int = Field(default=5432, ge=1, le=65535)
    database: str = Field(..., min_length=1, max_length=100)
    username: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=1)


class ConnectionResponse(BaseModel):
    id: uuid.UUID
    name: str
    host: str
    port: int
    database: str
    username: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ConnectionTestResult(BaseModel):
    success: bool
    message: str


class ConnectionStatusResponse(BaseModel):
    id: uuid.UUID
    success: bool
    status: str = "Inactive"
    error: str | None = None
    last_checked: datetime | None = None


class BatchStatusRequest(BaseModel):
    ids: list[uuid.UUID]
