# Database Relationships

This document describes every foreign-key relationship in the application database, including the business logic behind each link.

---

## Relationship: `users` → `query_history`

```
  users (1) ────── (N) query_history
```

**Foreign Key:** `query_history.user_id` → `users.id` (ON DELETE CASCADE)

**Plain English:** A user can execute many queries over time. Each query history record belongs to exactly one user. If the user is deleted, their query history is also removed (no orphaned records).

---

## Relationship: `users` → `audit_logs`

```
  users (1) ────── (N) audit_logs
```

**Foreign Key:** `audit_logs.user_id` → `users.id` (ON DELETE SET NULL)

**Plain English:** A user can generate many audit log entries (login, registration, admin actions). If the user is deleted, the audit log entry is preserved for compliance, but the `user_id` is set to NULL. The `username` column is denormalized so the log remains readable even after user deletion.

---

## Relationship: `users` → `database_permissions`

```
  users (1) ────── (N) database_permissions
```

**Foreign Key:** `database_permissions.analyst_id` → `users.id` (ON DELETE CASCADE)

**Plain English:** An analyst user can be granted access to many database connections. This legacy table specifically constrains `analyst_id` — only users with the `analyst` role should be linked. If the user is deleted, their permission grants are also removed.

---

## Relationship: `database_connections` → `database_permissions`

```
  database_connections (1) ────── (N) database_permissions
```

**Foreign Key:** `database_permissions.database_connection_id` → `database_connections.id` (ON DELETE CASCADE)

**Plain English:** A database connection can be granted to many analysts. If the connection is deleted, all associated permission grants are removed.

**Unique constraint:** `uq_analyst_db` on (`analyst_id`, `database_connection_id`) — an analyst cannot be granted the same database twice.

---

## Relationship: `users` → `user_database_access`

```
  users (1) ────── (N) user_database_access
```

**Foreign Key:** `user_database_access.user_id` → `users.id` (ON DELETE CASCADE)

**Plain English:** Any user (admin or analyst) can be granted access to many database connections. This modern table supersedes `database_permissions` and supports both roles. If the user is deleted, their access grants are removed.

---

## Relationship: `database_connections` → `user_database_access`

```
  database_connections (1) ────── (N) user_database_access
```

**Foreign Key:** `user_database_access.database_connection_id` → `database_connections.id` (ON DELETE CASCADE)

**Plain English:** A database connection can be shared with many users. If the connection is deleted, all associated access grants are removed.

**Unique constraint:** `uq_user_db` on (`user_id`, `database_connection_id`) — a user cannot be granted the same database twice.

---

## Relationship: `users` → `query_history` (via database_connection)

```
  database_connections (1) ────── (N) query_history
```

**Foreign Key:** `query_history.database_connection_id` → `database_connections.id` (ON DELETE SET NULL)

**Plain English:** A query may reference the database connection it was executed against. If the connection is deleted, the query history remains but the reference is set to NULL so historical data is preserved.

---

## Relationship Summary Table

| From | To | FK Column | ON DELETE | Purpose |
|---|---|---|---|---|
| `query_history` | `users` | `user_id` | CASCADE | Who executed the query |
| `query_history` | `database_connections` | `database_connection_id` | SET NULL | Which database was queried |
| `audit_logs` | `users` | `user_id` | SET NULL | Which user performed the action |
| `database_permissions` | `users` | `analyst_id` | CASCADE | Which analyst was granted access |
| `database_permissions` | `database_connections` | `database_connection_id` | CASCADE | Which connection was granted |
| `user_database_access` | `users` | `user_id` | CASCADE | Which user was granted access |
| `user_database_access` | `database_connections` | `database_connection_id` | CASCADE | Which connection was granted |

---

## Cascade Behavior Notes

- **CASCADE:** When the parent row is deleted, child rows are automatically deleted. Used for owned data (query history, permissions, access grants).
- **SET NULL:** When the parent row is deleted, the foreign key is set to NULL. Used for audit logs and query history so records are never lost.
