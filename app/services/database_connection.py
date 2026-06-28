import uuid
import logging
from urllib.parse import quote
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import create_engine, text
from app.models.database_connection import DatabaseConnection
from app.repositories.database_connection import DatabaseConnectionRepository
from app.utils.encryption import encrypt_password, decrypt_password
from app.core.exceptions import NotFoundException, BadRequestException

logger = logging.getLogger(__name__)


class DatabaseConnectionService:
    def __init__(self, db: AsyncSession):
        self.repo = DatabaseConnectionRepository(db)

    async def create(
        self, name: str, host: str, port: int, database: str, username: str, password: str
    ) -> DatabaseConnection:
        connection = DatabaseConnection(
            id=uuid.uuid4(),
            name=name,
            host=host,
            port=port,
            database=database,
            username=username,
            encrypted_password=encrypt_password(password),
        )
        created = await self.repo.create(connection)
        logger.info("Database connection created: %s (%s:%d/%s)", name, host, port, database)
        return created

    async def get_by_id(self, connection_id: uuid.UUID) -> DatabaseConnection:
        connection = await self.repo.get_by_id(connection_id)
        if not connection:
            raise NotFoundException("Database connection not found")
        return connection

    async def list_all(self) -> list[DatabaseConnection]:
        return await self.repo.list_all()

    async def update(
        self,
        connection_id: uuid.UUID,
        name: str | None = None,
        host: str | None = None,
        port: int | None = None,
        database: str | None = None,
        username: str | None = None,
        password: str | None = None,
    ) -> DatabaseConnection:
        connection = await self.get_by_id(connection_id)
        if name is not None:
            connection.name = name
        if host is not None:
            connection.host = host
        if port is not None:
            connection.port = port
        if database is not None:
            connection.database = database
        if username is not None:
            connection.username = username
        if password is not None:
            connection.encrypted_password = encrypt_password(password)
        updated = await self.repo.update(connection)
        logger.info("Database connection updated: %s", connection.name)
        return updated

    async def delete(self, connection_id: uuid.UUID) -> None:
        connection = await self.get_by_id(connection_id)
        await self.repo.delete(connection)
        logger.info("Database connection deleted: %s", connection.name)

    async def test_connection(
        self, host: str, port: int, database: str, username: str, password: str
    ) -> tuple[bool, str]:
        url = f"postgresql://{username}:{quote(password, safe='')}@{host}:{port}/{database}"
        engine = None
        try:
            engine = create_engine(url, pool_pre_ping=True, pool_size=1, max_overflow=0)
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return True, "Connection successful"
        except Exception as e:
            logger.warning("Connection test failed for %s:%d/%s: %s", host, port, database, str(e))
            return False, f"Connection failed: {str(e)}"
        finally:
            if engine:
                engine.dispose()
