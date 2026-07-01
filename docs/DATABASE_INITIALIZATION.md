# Database Initialization

This document explains how to initialize the application database from scratch.

---

## Technology Stack

| Component | Technology | Purpose |
|---|---|---|
| ORM | SQLAlchemy 2.x (async) | Runtime database access |
| Migrations | Alembic | Schema versioning and migration |
| Connection | asyncpg + psycopg2 | Async and sync PostgreSQL drivers |
| Engine | `create_async_engine` with `async_sessionmaker` | Session management |

---

## Initialization Process

The application uses **Alembic** for all schema management. There is no raw SQL or `Base.metadata.create_all()` call in production code.

### Step 1: Prerequisites

```bash
# Ensure PostgreSQL is running
# Create the database (if using local PostgreSQL)
psql -U postgres -c "CREATE DATABASE ai_sql_assistant;"

# Install dependencies
pip install -r requirements.txt
```

### Step 2: Configure Environment

```env
# .env — see .env.example for all options
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/ai_sql_assistant
DATABASE_URL_SYNC=postgresql://postgres:password@localhost:5432/ai_sql_assistant
```

### Step 3: Run Migrations

```bash
# Apply all pending migrations to create/update the schema
alembic upgrade head
```

Expected output:

```
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade  -> 0001, create_users_table
INFO  [alembic.runtime.migration] Running upgrade 0001 -> 043e981772c4, create_database_connections_table
INFO  [alembic.runtime.migration] Running upgrade 043e981772c4 -> 9a362b5bdf9a, create_database_permissions_table
INFO  [alembic.runtime.migration] Running upgrade 9a362b5bdf9a -> 66024269d4d0, create_query_history_table
INFO  [alembic.runtime.migration] Running upgrade 66024269d4d0 -> 263bef76a6fa, create_audit_logs_table
INFO  [alembic.runtime.migration] Running upgrade 263bef76a6fa -> 7d1e8f3a2b9c, create_user_database_access_table
```

### Step 4: Verify

```bash
# Check tables exist
psql -U postgres -d ai_sql_assistant -c "\dt"

# Check migration version
psql -U postgres -d ai_sql_assistant -c "SELECT * FROM alembic_version;"
```

Expected tables: `alembic_version`, `audit_logs`, `database_connections`, `database_permissions`, `query_history`, `user_database_access`, `users`

---

## How Alembic Is Configured

### `alembic.ini` (at project root)

```ini
[alembic]
script_location = alembic
prepend_sys_path = .
sqlalchemy.url = postgresql://postgres:postgres@localhost:5432/ai_sql_assistant
```

The `sqlalchemy.url` in `alembic.ini` is a fallback. The actual connection URL comes from `settings.DATABASE_URL` (async) or `settings.DATABASE_URL_SYNC` (sync) at runtime.

### `alembic/env.py`

- Imports all models to populate `Base.metadata`
- Uses `settings.DATABASE_URL` for online migrations (async engine)
- Uses `settings.DATABASE_URL_SYNC` for offline migrations (SQL script generation)
- Auto-detects whether running online or offline

---

## Migration History

| Revision | Description | Dependencies |
|---|---|---|
| `0001` | Create `users` table | None (initial) |
| `043e981772c4` | Create `database_connections` table | `0001` |
| `9a362b5bdf9a` | Create `database_permissions` table | `043e981772c4` |
| `66024269d4d0` | Create `query_history` table | `9a362b5bdf9a` |
| `263bef76a6fa` | Create `audit_logs` table | `66024269d4d0` |
| `7d1e8f3a2b9c` | Create `user_database_access` table | `263bef76a6fa` |

**Current head:** `7d1e8f3a2b9c`

---

## Creating New Migrations

```bash
# Auto-generate a migration from model changes
alembic revision --autogenerate -m "description_of_change"

# Review the generated file in alembic/versions/
# Apply it
alembic upgrade head
```

> **Important:** Always review auto-generated migrations before applying. Alembic may not detect all changes (e.g., enum value changes, renames).

---

## Resetting the Database

```bash
# Drop all tables and re-apply all migrations
alembic downgrade base
alembic upgrade head
```

Or, to start completely fresh:

```bash
# Drop and recreate the database
psql -U postgres -c "DROP DATABASE IF EXISTS ai_sql_assistant;"
psql -U postgres -c "CREATE DATABASE ai_sql_assistant;"
alembic upgrade head
```

---

## SQLAlchemy Session Management

```python
# app/core/database.py
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

async_session = async_sessionmaker(engine, expire_on_commit=False)

async def get_db() -> AsyncSession:
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
```

- Connection pooling is enabled (10 pool / 20 overflow)
- `pool_pre_ping=True` verifies connections before use
- Sessions auto-commit on success, auto-rollback on error
