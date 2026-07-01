# Database Architecture

The application uses **two distinct database layers** with completely different purposes. Understanding this separation is critical for deployment, migration, and maintenance.

---

## Layer 1: Application Database

This is the **application's own PostgreSQL database** that powers the AI SQL Assistant itself. As of the Supabase migration, the application database is hosted on **Supabase PostgreSQL (cloud)**, but it can run on any PostgreSQL 14+ provider — the connection is fully environment-variable driven.

### What It Stores

| Domain | Tables | Description |
|---|---|---|
| Users | `users` | User accounts, roles, hashed passwords |
| Roles | `users.role` (ENUM) | `admin` or `analyst` |
| Saved Connections | `database_connections` | Metadata for external databases users connect to |
| Access Control | `database_permissions`, `user_database_access` | Which users can access which databases |
| Query History | `query_history` | Every AI-generated SQL query execution |
| Audit Logs | `audit_logs` | Security events (login, registration, admin actions) |
| Migrations | `alembic_version` | Current Alembic schema version |

### Data It Does NOT Store

- Customer business data
- Customer database schema snapshots (cached temporarily in Redis)
- API keys (stored in environment variables)
- Query result sets (returned in API responses, not persisted)

### Compatible Providers

The application database can be hosted on any PostgreSQL 14+ provider:

| Provider | Connection Example |
|---|---|
| **Local PostgreSQL** | `postgresql://postgres:password@localhost:5432/ai_sql_assistant` |
| **Supabase** | `postgresql://postgres.qrhyqpssjlhwaewzwcnu:password@aws-1-ap-south-1.pooler.supabase.com:5432/postgres` |
| **Neon** | `postgresql://user:password@ep-example-123456.us-east-2.aws.neon.tech/neondb` |
| **AWS RDS** | `postgresql://master:password@database-1.xxxxxxxxxx.us-east-1.rds.amazonaws.com:5432/ai_sql_assistant` |
| **Azure PostgreSQL** | `postgresql://user:password@server-name.postgres.database.azure.com:5432/ai_sql_assistant` |
| **Google Cloud SQL** | `postgresql://user:password@/cloudsql/project:region:instance/.s.PGSQL.5432/ai_sql_assistant` |
| **Railway** | `postgresql://user:password@containers-us-west-xx.railway.app:xxxx/railway` |
| **Self-hosted** | `postgresql://postgres:password@your-server.com:5432/ai_sql_assistant` |

### Configuration

The application database connection is configured via environment variables:

```env
# Async connection (used by SQLAlchemy at runtime)
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/dbname

# Sync connection (used by Alembic migrations)
DATABASE_URL_SYNC=postgresql://user:password@host:5432/dbname
```

---

## Layer 2: User Databases (External)

These are **external PostgreSQL databases** that users connect to *through* the application. The application never stores or caches their data permanently.

### What They Are

- Customer-owned PostgreSQL databases
- Connected by analysts to run AI-generated SQL queries
- Schema is discovered on-demand and cached in Redis (TTL: 1 hour)

### Compatible Providers

| Provider | Read/Write | Notes |
|---|---|---|
| Local PostgreSQL | Read + Write | |
| AWS RDS PostgreSQL | Read + Write | Requires public access or VPC peering |
| Supabase PostgreSQL | Read + Write | |
| Neon PostgreSQL | Read + Write | |
| Railway PostgreSQL | Read + Write | |
| Azure PostgreSQL | Read + Write | |
| Google Cloud SQL | Read + Write | |
| MySQL | Read-only | Limited support via read-only querying |

### How Passwords Are Handled

Database passwords for user databases are **encrypted at rest** using Fernet (AES-128) symmetric encryption:

```
DB_ENCRYPTION_KEY → Fernet key derivation → encrypt/decrypt
```

The encryption key is stored in the application's `.env` file as `DB_ENCRYPTION_KEY`.

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│                  Docker Compose Stack                     │
│                                                          │
│  ┌─────────────────┐   ┌──────────────────────────────┐  │
│  │  React Frontend  │   │   FastAPI Backend            │  │
│  │  (Nginx, :80)   │──▶│   (Uvicorn, :8000)           │  │
│  │                  │   │                              │  │
│  │  SPA served via  │   │  - SQLAlchemy (async)        │  │
│  │  Nginx           │   │  - SQL generation            │  │
│  └─────────────────┘   │  - Validation                 │  │
│                         │  - Redis caching              │  │
│                         └──────────┬───────┬───────────┘  │
│                                    │       │              │
│                                    ▼       ▼              │
│  ┌──────────────────────┐   ┌──────────────┐             │
│  │   Supabase           │   │  Redis Stack  │             │
│  │   PostgreSQL (Cloud) │   │  (Container)  │             │
│  │                      │   │               │             │
│  │  - users             │   │  - Schema     │             │
│  │  - connections       │   │    cache      │             │
│  │  - query_history     │   │  - Status     │             │
│  │  - audit_logs        │   │    cache      │             │
│  └──────────────────────┘   └──────────────┘             │
│                                                          │
│  ┌──────────────────────────────────────────────┐        │
│  │  External User Databases (Layer 2)            │        │
│  │  psycopg2 direct connections                  │        │
│  └──────────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────────┘
```

## Summary

| Aspect | Application Database | User Databases |
|---|---|---|
| Purpose | Powers the app itself | Customer data to query |
| Data stored | Users, config, audit logs | Business data |
| Ownership | Application operator | Customer |
| Schema | Fixed, managed by Alembic | Unknown, discovered dynamically |
| Connection | Single, configured via `.env` | Multiple, stored in `database_connections` |
| Password storage | Plain env var | Fernet-encrypted at rest |
| Migrations | Alembic (6 revisions) | N/A |
