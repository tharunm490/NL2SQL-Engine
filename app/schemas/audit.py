import uuid
from datetime import datetime
from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID | None
    username: str | None
    action: str
    resource_type: str | None
    resource_id: str | None
    details: str | None
    ip_address: str | None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
