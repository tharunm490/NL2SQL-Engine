# Architecture

This document describes the high-level architecture of the AI SQL Assistant application.

---

## Container Stack

The application runs as three Docker containers orchestrated by Docker Compose:

| Container | Image | Port(s) | Purpose |
|---|---|---|---|
| **frontend** | Custom (React + Nginx) | `80` | Serves the React SPA via Nginx reverse proxy; proxies `/api` requests to backend |
| **backend** | Custom (FastAPI + Uvicorn) | `8000` | REST API — authentication, SQL generation, validation, schema discovery, ER diagrams |
| **redis** | `redis/redis-stack:latest` | `6379`, `8001` | In-memory cache for database schemas and connection statuses; RedisInsight UI on port 8001 |

### Container Dependencies

```
frontend ──depends-on──▶ backend ──depends-on (healthy)──▶ redis
```

The backend:
- **Requires** Redis to be healthy before starting
- **Requires** the application database (Supabase PostgreSQL) to be reachable — verified via a startup connection check
- **Does NOT** wait for a local PostgreSQL container (the database is a managed cloud service)

---

## Application Database

The application database is hosted on **Supabase PostgreSQL (cloud)**. It stores:

- User accounts and roles
- Database connection metadata (host, port, encrypted passwords)
- Query history
- Audit logs
- Database permissions and access grants

The connection is configured entirely through environment variables:

```env
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/dbname
DATABASE_URL_SYNC=postgresql://user:password@host:5432/dbname
```

Because the connection is environment-variable driven, switching providers (Supabase → Neon → AWS RDS → etc.) requires only updating `.env` — no code changes.

---

## Redis Caching

Redis provides two caches to reduce database load:

| Cache | Key Pattern | TTL | Purpose |
|---|---|---|---|
| Schema cache | `schema:{database_id}` | 3600s | Cached database metadata (tables, columns, keys) |
| Status cache | `status:{database_id}` | 60s | Cached connection health status |

The application degrades gracefully if Redis is unavailable — it reads metadata directly from PostgreSQL.

---

## External User Databases

Users connect their own PostgreSQL (or MySQL) databases through the application. These are completely independent of the application's Supabase database:

- Connection details are stored in `database_connections` (with Fernet-encrypted passwords)
- The application never stores or caches customer business data permanently
- Schema metadata is cached temporarily in Redis (1 hour TTL)
- Generated SQL is validated and executed directly against the user's database

---

## Request Flow

```
User ──▶ Browser ──▶ Nginx (:80) ──▶ /api/* ──▶ Backend (:8000)
                        │                              │
                        │                              ├──▶ Redis (cache)
                        │                              │
                        │                              ├──▶ Supabase (app DB)
                        │                              │
                        │                              └──▶ User DB (external)
                        │
                        └──▶ /assets/* ──▶ Static files (React SPA)
```

1. Browser loads the React SPA from Nginx on port 80
2. API requests (`/api/*`) are proxied by Nginx to the backend on port 8000
3. Backend authenticates via JWT (stored in Supabase `users` table)
4. Backend serves schema and status data from Redis (cache) or Supabase
5. SQL queries are executed directly against the user's external database
6. Query history and audit logs are written to Supabase

---

## Startup Sequence

```
1. Redis container starts and becomes healthy
2. Backend container starts:
   a. Connects to Redis
   b. Runs database connectivity check against Supabase
   c. Applies pending Alembic migrations (safe — idempotent)
   d. Starts Uvicorn (FastAPI)
3. Frontend container starts:
   a. Nginx serves the pre-built React SPA
   b. API requests are proxied to backend
```

---

## Service-to-Service Communication

| From | To | Method | Address |
|---|---|---|---|
| Browser | Nginx (frontend) | HTTP | `http://localhost:80` |
| Nginx (frontend) | Uvicorn (backend) | HTTP (reverse proxy) | `backend:8000` (Docker network) |
| Uvicorn (backend) | Redis Stack | TCP | `redis:6379` (Docker network) |
| Uvicorn (backend) | Supabase PostgreSQL | TCP (asyncpg) | Via `DATABASE_URL` env var |
| Uvicorn (backend) | User databases | TCP (asyncpg/psycopg2) | Per connection config |
