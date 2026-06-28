import logging
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth import AuthService
from app.services.audit import AuditService
from app.api.dependencies import get_current_user, get_current_user_optional
from app.models.user import User
from app.core.exceptions import ForbiddenException

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(
    body: RegisterRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    if body.role == "admin" and (not current_user or current_user.role.value != "admin"):
        raise ForbiddenException("Only admins can create admin accounts")

    service = AuthService(db)
    user = await service.register(
        username=body.username,
        email=body.email,
        password=body.password,
        role=body.role,
    )

    audit = AuditService(db)
    await audit.log(
        action="user_registered",
        user_id=user.id,
        username=user.username,
        resource_type="user",
        resource_id=str(user.id),
        details=f"Registered as {body.role}",
        ip_address=request.client.host if request.client else None,
    )

    return user


@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    audit = AuditService(db)

    try:
        token = await service.login(username=body.username, password=body.password)
        user = await service.repo.get_by_username(body.username)
        await audit.log(
            action="login",
            user_id=user.id if user else None,
            username=body.username,
            details="Login successful",
            ip_address=request.client.host if request.client else None,
        )
        return TokenResponse(access_token=token)
    except Exception as e:
        await audit.log(
            action="login_failed",
            username=body.username,
            details=str(e),
            status="failure",
            ip_address=request.client.host if request.client else None,
        )
        await db.flush()
        await db.commit()
        raise


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
