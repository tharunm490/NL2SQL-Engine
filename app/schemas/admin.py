import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class CreateUserRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    role: str = Field(default="analyst", pattern="^(admin|analyst)$")


class UpdateUserRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    role: str = Field(default="analyst", pattern="^(admin|analyst)$")
    is_active: bool = True


class UserStatusUpdate(BaseModel):
    is_active: bool


class UserDatabasesResponse(BaseModel):
    database_ids: list[uuid.UUID]


class AssignDatabasesRequest(BaseModel):
    database_ids: list[uuid.UUID]


class UserAdminResponse(BaseModel):
    id: uuid.UUID
    username: str
    email: str
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
