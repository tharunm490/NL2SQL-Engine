from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import setup_logging
from app.core.exceptions import global_exception_handler
from app.api.health import router as health_router
from app.api.auth import router as auth_router
from app.api.admin import router as admin_router
from app.api.database_connections import router as db_connections_router
from app.api.permissions import router as permissions_router
from app.api.schema import router as schema_router
from app.api.query import router as query_router
from app.api.history import router as history_router
from app.api.audit import router as audit_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=settings.APP_DESCRIPTION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(Exception, global_exception_handler)

app.include_router(health_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(db_connections_router, prefix="/api/v1")
app.include_router(permissions_router, prefix="/api/v1")
app.include_router(schema_router, prefix="/api/v1")
app.include_router(query_router, prefix="/api/v1")
app.include_router(history_router, prefix="/api/v1")
app.include_router(audit_router, prefix="/api/v1")
