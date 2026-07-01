# Database Schema

This document describes every table in the application database, auto-generated from the SQLAlchemy models and Alembic migrations.

**Total tables:** 7

---

## Table: `users`

**Purpose:** Stores all registered user accounts (admin and analyst).

### Columns

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | `UUID` | NO | `gen_random_uuid()` | **Primary Key** |
| `username` | `VARCHAR(50)` | NO | — | **Unique**, Indexed |
| `email` | `VARCHAR(255)` | NO | — | **Unique**, Indexed |
| `hashed_password` | `VARCHAR(255)` | NO | — | |
| `role` | `user_role` (ENUM) | NO | `'analyst'` | Values: `admin`, `analyst` |
| `is_active` | `BOOLEAN` | NO | `true` | |
| `created_at` | `TIMESTAMP` | NO | `now()` | |
| `updated_at` | `TIMESTAMP` | NO | `now()` | Auto-updated on modification |

### Indexes

- `ix_users_username` — unique index on `username`
- `ix_users_email` — unique index on `email`

### Enum: `user_role`

Defined values: `'admin'`, `'analyst'`

### SQLAlchemy Model

```python
class User(Base):
    __tablename__ = "users"
```

### Migration

- Revision: `0001` — `create_users_table`

---

## Table: `database_connections`

**Purpose:** Stores metadata for external PostgreSQL databases that users connect to for querying. The actual passwords are encrypted at rest using Fernet symmetric encryption driven by `DB_ENCRYPTION_KEY`.

### Columns

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | `UUID` | NO | `uuid.uuid4()` | **Primary Key** |
| `name` | `VARCHAR(100)` | NO | — | |
| `host` | `VARCHAR(255)` | NO | — | |
| `port` | `INTEGER` | NO | `5432` | |
| `database` | `VARCHAR(100)` | NO | — | |
| `username` | `VARCHAR(100)` | NO | — | |
| `encrypted_password` | `TEXT` | NO | — | Fernet-encrypted |
| `is_active` | `BOOLEAN` | NO | `true` | |
| `created_at` | `TIMESTAMP` | NO | `now()` | |
| `updated_at` | `TIMESTAMP` | NO | `now()` | Auto-updated on modification |

### SQLAlchemy Model

```python
class DatabaseConnection(Base):
    __tablename__ = "database_connections"
```

### Migration

- Revision: `043e981772c4` — `create_database_connections_table`

---

## Table: `database_permissions`

**Purpose:** Legacy junction table linking analysts to database connections they are allowed to query. Constrains `analyst_id` — only users with `role = 'analyst'` should be linked here.

### Columns

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | `UUID` | NO | `uuid.uuid4()` | **Primary Key** |
| `analyst_id` | `UUID` | NO | — | **FK → `users.id`** ON DELETE CASCADE |
| `database_connection_id` | `UUID` | NO | — | **FK → `database_connections.id`** ON DELETE CASCADE |
| `created_at` | `TIMESTAMP` | NO | `now()` | |

### Constraints

- **Unique:** `uq_analyst_db` on (`analyst_id`, `database_connection_id`)

### SQLAlchemy Model

```python
class DatabasePermission(Base):
    __tablename__ = "database_permissions"
    __table_args__ = (
        UniqueConstraint("analyst_id", "database_connection_id", name="uq_analyst_db"),
    )
```

### Migration

- Revision: `9a362b5bdf9a` — `create_database_permissions_table`

---

## Table: `query_history`

**Purpose:** Records every AI-generated SQL query executed by any user.

### Columns

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | `UUID` | NO | `uuid.uuid4()` | **Primary Key** |
| `user_id` | `UUID` | NO | — | **FK → `users.id`** ON DELETE CASCADE, Indexed |
| `question` | `TEXT` | NO | — | Natural-language question |
| `generated_sql` | `TEXT` | NO | — | AI-generated SQL |
| `database_connection_id` | `UUID` | YES | — | **FK → `database_connections.id`** ON DELETE SET NULL |
| `database_name` | `VARCHAR(100)` | YES | — | Denormalized for display |
| `execution_time` | `FLOAT` | NO | `0.0` | Seconds |
| `row_count` | `INTEGER` | NO | `0` | |
| `status` | `VARCHAR(20)` | NO | `'success'` | Values: `success`, `error` |
| `error_message` | `TEXT` | YES | — | |
| `created_at` | `TIMESTAMP` | NO | `now()` | |

### Indexes

- `ix_query_history_user_id` — on `user_id`

### SQLAlchemy Model

```python
class QueryHistory(Base):
    __tablename__ = "query_history"
```

### Migration

- Revision: `66024269d4d0` — `create_query_history_table`

---

## Table: `audit_logs`

**Purpose:** Immutable audit trail recording security-relevant events (login, registration, admin actions). Logs are retained for compliance and troubleshooting.

### Columns

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | `UUID` | NO | `uuid.uuid4()` | **Primary Key** |
| `user_id` | `UUID` | YES | — | **FK → `users.id`** ON DELETE SET NULL, Indexed |
| `username` | `VARCHAR(100)` | YES | — | Denormalized (survives user deletion) |
| `action` | `VARCHAR(50)` | NO | — | Indexed |
| `resource_type` | `VARCHAR(50)` | YES | — | e.g. `user`, `connection` |
| `resource_id` | `VARCHAR(100)` | YES | — | |
| `details` | `TEXT` | YES | — | Human-readable description |
| `ip_address` | `VARCHAR(45)` | YES | — | Supports IPv4 and IPv6 |
| `status` | `VARCHAR(20)` | NO | `'success'` | Values: `success`, `failure` |
| `created_at` | `TIMESTAMP` | NO | `now()` | |

### Indexes

- `ix_audit_logs_action` — on `action`
- `ix_audit_logs_user_id` — on `user_id`

### SQLAlchemy Model

```python
class AuditLog(Base):
    __tablename__ = "audit_logs"
```

### Migration

- Revision: `263bef76a6fa` — `create_audit_logs_table`

---

## Table: `user_database_access`

**Purpose:** Modern junction table linking any user (admin or analyst) to database connections they can access. Supersedes `database_permissions` for new deployments.

### Columns

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `id` | `UUID` | NO | `uuid.uuid4()` | **Primary Key** |
| `user_id` | `UUID` | NO | — | **FK → `users.id`** ON DELETE CASCADE |
| `database_connection_id` | `UUID` | NO | — | **FK → `database_connections.id`** ON DELETE CASCADE |
| `created_at` | `TIMESTAMP` | NO | `now()` | |

### Constraints

- **Unique:** `uq_user_db` on (`user_id`, `database_connection_id`)

### SQLAlchemy Model

```python
class UserDatabaseAccess(Base):
    __tablename__ = "user_database_access"
    __table_args__ = (
        UniqueConstraint("user_id", "database_connection_id", name="uq_user_db"),
    )
```

### Migration

- Revision: `7d1e8f3a2b9c` — `create_user_database_access_table`

---

## Table: `alembic_version`

**Purpose:** Internal Alembic migration tracking table. Stores the current migration revision ID.

### Columns

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| `version_num` | `VARCHAR(32)` | NO | — | **Primary Key** |

> This table is managed automatically by Alembic. Do not modify it manually.

---

## Entity-Relationship Summary

```
┌─────────────┐       ┌──────────────────────┐
│    users    │1──N──▶│    query_history     │
└─────────────┘       └──────────────────────┘
      │
      │1──N──▶┌──────────────────────┐
      │       │     audit_logs       │
      │       └──────────────────────┘
      │
      │1──N──▶┌──────────────────────────────┐
      │       │  database_permissions        │
      │       │  (analyst_id → users.id)     │
      │       └──────────────────────────────┘
      │                      │
      │                      │N:1
      │                      ▼
      │       ┌──────────────────────────────┐
      │       │  database_connections        │
      │       └──────────────────────────────┘
      │                      ▲
      │                      │N:1
      │1──N──▶┌──────────────────────────────┐
      │       │  user_database_access        │
      │       │  (user_id → users.id)        │
      │       └──────────────────────────────┘
```

## Stored Procedures & Functions

None. The application does not use stored procedures or custom PostgreSQL functions.
