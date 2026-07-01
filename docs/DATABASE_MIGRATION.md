# Database Migration Guide

This guide explains how to migrate the **application database** from one PostgreSQL provider to another. Because the application uses standard PostgreSQL with Alembic-managed schema, the process is consistent across providers.

---

## General Migration Process

Regardless of source and target, every migration follows these steps:

1. **Export** the schema and data from the source database
2. **Create** the target database
3. **Import** the schema and data into the target
4. **Run Alembic migrations** to ensure schema is current
5. **Update the connection string** in `.env`
6. **Verify** the application connects and functions correctly

---

## Step 1: Export from Source

```bash
# Full export (schema + data)
pg_dump \
  --host=<source-host> \
  --port=<source-port> \
  --username=<source-user> \
  --dbname=<source-db> \
  --no-owner \
  --no-acl \
  --format=custom \
  --file=app_db.dump \
  --verbose
```

Flags explained:

| Flag | Purpose |
|---|---|
| `--no-owner` | Skip owner commands (may differ on target) |
| `--no-acl` | Skip privilege commands |
| `--format=custom` | Compressed, supports parallel restore |
| `--file` | Output file |

### Export Only Schema (no data)

```bash
pg_dump --schema-only --no-owner --no-acl -f schema.sql \
  postgresql://user:password@source-host:5432/source-db
```

### Export Only Data (no schema)

```bash
pg_dump --data-only --no-owner --no-acl -f data.sql \
  postgresql://user:password@source-host:5432/source-db
```

---

## Step 2: Create Target Database

### Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/projects)
2. Create or select your project
3. Note the connection string from Project Settings → Database
4. Use the **connection pooler** URL for production:
   ```
   postgresql://postgres.<project-ref>:<password>@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
   ```

### Neon

1. Go to [Neon Console](https://console.neon.tech)
2. Create a project
3. Copy the connection string from the dashboard

### AWS RDS

```bash
aws rds create-db-instance \
  --db-instance-identifier ai-sql-assistant \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password <password> \
  --allocated-storage 20
```

### Azure PostgreSQL

```bash
az postgres flexible-server create \
  --name ai-sql-assistant \
  --resource-group my-rg \
  --sku-name Standard_B1ms \
  --admin-user postgres \
  --admin-password <password>
```

### Google Cloud SQL

```bash
gcloud sql instances create ai-sql-assistant \
  --database-version POSTGRES_14 \
  --tier db-f1-micro \
  --region us-central1
```

### Railway

1. Go to [Railway Dashboard](https://railway.app)
2. Create a New Project → Provision PostgreSQL
3. Copy the connection string from the dashboard

### Self-hosted

```bash
sudo -u postgres createdb ai_sql_assistant
```

---

## Step 3: Import into Target

```bash
# Restore the custom-format dump
pg_restore \
  --host=<target-host> \
  --port=<target-port> \
  --username=<target-user> \
  --dbname=<target-db> \
  --no-owner \
  --no-acl \
  --verbose \
  app_db.dump
```

### Using a Connection String

```bash
pg_restore --no-owner --no-acl --dbname="postgresql://user:password@target-host:5432/target-db" app_db.dump
```

---

## Step 4: Run Alembic Migrations

Even after a `pg_restore`, run migrations to ensure the `alembic_version` table is correct and any pending migrations are applied:

```bash
# Set the target connection string
export DATABASE_URL_SYNC="postgresql://user:password@target-host:5432/target-db"

# Apply migrations
alembic upgrade head
```

This is safe to run even if the schema is already up to date — Alembic will detect that no migrations need to run.

---

## Step 5: Update Application Configuration

Edit `.env` to point to the new database:

```env
# Async connection (with +asyncpg driver prefix)
DATABASE_URL=postgresql+asyncpg://user:password@target-host:5432/target-db

# Sync connection (no driver prefix, for Alembic)
DATABASE_URL_SYNC=postgresql://user:password@target-host:5432/target-db
```

For Supabase pooler specifically:

```env
DATABASE_URL=postgresql+asyncpg://postgres.<project-ref>:<password>@<region>.pooler.supabase.com:5432/postgres
DATABASE_URL_SYNC=postgresql://postgres.<project-ref>:<password>@<region>.pooler.supabase.com:5432/postgres
```

---

## Step 6: Verify

```bash
# Health check
curl http://your-app:8000/api/v1/health

# Check tables
psql $DATABASE_URL_SYNC -c "\dt"

# Check migration version
psql $DATABASE_URL_SYNC -c "SELECT * FROM alembic_version;"
```

Expected output for `\dt`:

```
                   List of relations
 Schema |          Name           | Type  | Owner
--------+-------------------------+-------+-------
 public | alembic_version         | table | postgres
 public | audit_logs              | table | postgres
 public | database_connections     | table | postgres
 public | database_permissions    | table | postgres
 public | query_history           | table | postgres
 public | user_database_access    | table | postgres
 public | users                   | table | postgres
```

Then run a functional test:

```bash
# Register a user
curl -X POST http://your-app:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"verify_user","email":"verify@test.com","password":"Test1234!","role":"analyst"}'

# Login
curl -X POST http://your-app:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"verify_user","password":"Test1234!"}'
```

---

## Provider-Specific Guides

### Local PostgreSQL → Supabase

```bash
# 1. Export from local
pg_dump --host=localhost --username=postgres --dbname=ai_sql_assistant \
  --no-owner --no-acl --format=custom -f local.dump

# 2. Restore to Supabase pooler
pg_restore --host=aws-1-ap-south-1.pooler.supabase.com \
  --username=postgres.<project-ref> \
  --dbname=postgres \
  --no-owner --no-acl \
  local.dump

# 3. Update .env
DATABASE_URL=postgresql+asyncpg://postgres.<project-ref>:<password>@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
DATABASE_URL_SYNC=postgresql://postgres.<project-ref>:<password>@aws-1-ap-south-1.pooler.supabase.com:5432/postgres

# 4. Run migrations
alembic upgrade head
```

> **Note:** Supabase pooler uses `postgres.<project-ref>` as the username and `postgres` as the database name. Port 5432 is session mode (for long-lived connections from FastAPI).

### Supabase → AWS RDS

```bash
# 1. Export from Supabase
pg_dump --host=aws-1-ap-south-1.pooler.supabase.com \
  --username=postgres.<project-ref> \
  --dbname=postgres \
  --no-owner --no-acl --format=custom -f supabase.dump

# 2. Create RDS instance (see Step 2 above)
# 3. Restore to RDS
pg_restore --host=<rds-endpoint> --username=postgres \
  --dbname=ai_sql_assistant \
  --no-owner --no-acl \
  supabase.dump

# 4. Update .env + run migrations
```

### AWS RDS → Neon

```bash
# 1. Export from RDS
pg_dump --host=<rds-endpoint> --username=postgres \
  --dbname=ai_sql_assistant \
  --no-owner --no-acl --format=custom -f rds.dump

# 2. Restore to Neon
pg_restore --host=<neon-host> --username=<user> \
  --dbname=neondb \
  --no-owner --no-acl \
  rds.dump

# 3. Update .env + run migrations
```

### Neon → Railway

```bash
# 1. Export from Neon
pg_dump --host=<neon-host> --username=<user> \
  --dbname=neondb \
  --no-owner --no-acl --format=custom -f neon.dump

# 2. Restore to Railway
pg_restore --host=<railway-host> --username=<user> \
  --dbname=railway \
  --no-owner --no-acl \
  neon.dump

# 3. Update .env + run migrations
```

### Railway → Azure PostgreSQL

```bash
# 1. Export from Railway
pg_dump --host=<railway-host> --username=<user> \
  --dbname=railway \
  --no-owner --no-acl --format=custom -f railway.dump

# 2. Restore to Azure
pg_restore --host=<azure-host>.postgres.database.azure.com \
  --username=<user> \
  --dbname=ai_sql_assistant \
  --no-owner --no-acl \
  railway.dump

# 3. Update .env + run migrations
```

---

## Notes

- **Standard PostgreSQL:** The application uses only standard PostgreSQL features (no extensions like PostGIS, no custom types beyond ENUM). This means any PostgreSQL 14+ provider is compatible.
- **Alembic Compatibility:** The `alembic_version` table tracks which migrations have been applied. Always run `alembic upgrade head` after a restore to ensure consistency.
- **Connection Pooler vs Direct:** When using Supabase, prefer the pooler (port 5432 session mode) for the application database. User databases connected by analysts should use direct connections.
- **SSL:** Most cloud providers require SSL. `asyncpg` and `psycopg2` enable SSL automatically for non-localhost connections.
- **Downtime:** Expect a few minutes of downtime during the migration. Plan accordingly.
