#!/bin/sh
set -e

echo "Checking Supabase database connection..."
python -c "
import asyncio, asyncpg, os

async def check():
    url = os.environ['DATABASE_URL_SYNC']
    try:
        conn = await asyncpg.connect(url)
        v = await conn.fetchval('SELECT version()')
        print(f'  Connected to database: PostgreSQL {v.split(\",\")[0]}')
        await conn.close()
    except Exception as e:
        print(f'  FATAL: Cannot connect to database: {e}')
        print(f'  Check that DATABASE_URL_SYNC in .env is correct.')
        exit(1)

asyncio.run(check())
"

echo "Running database migrations..."
alembic upgrade head

echo "Starting FastAPI server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
