"""Seed an admin user directly into the database."""
import sys
sys.path.insert(0, r"C:\Users\tharu\OneDrive\Desktop\ucube2")

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import settings
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def main():
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.connect() as conn:
        hashed = pwd_context.hash("admin123")
        result = await conn.execute(
            text("SELECT id FROM users WHERE username = 'testadmin'")
        )
        if result.fetchone():
            print("testadmin already exists")
        else:
            result = await conn.execute(
                text(
                    "INSERT INTO users (id, username, email, hashed_password, role, is_active, created_at, updated_at) "
                    "VALUES (gen_random_uuid(), 'testadmin', 'testadmin@test.com', :pwd, 'admin', true, NOW(), NOW()) "
                    "RETURNING id"
                ),
                {"pwd": hashed},
            )
            print(f"Created admin user with id: {result.scalar()}")
        await conn.commit()
    await engine.dispose()


asyncio.run(main())
