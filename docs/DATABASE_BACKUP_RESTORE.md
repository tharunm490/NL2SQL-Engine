# Database Backup & Restore

This document covers backup and restore procedures for the application database.

---

## Backup Strategies

### Recommended Approach

For production deployments, use a combination of:

1. **Automated daily backups** — provider-managed snapshots
2. **On-demand `pg_dump`** — before schema changes or migrations
3. **Point-in-time recovery (PITR)** — for granular restore

---

## Backup with `pg_dump`

### Full Backup (Schema + Data)

```bash
# Custom format (recommended) — compressed, supports parallel restore
pg_dump \
  "postgresql://user:password@host:5432/dbname" \
  --no-owner \
  --no-acl \
  --format=custom \
  --file=app_db_$(date +%Y%m%d_%H%M%S).dump
```

### Schema-Only Backup

```bash
pg_dump \
  "postgresql://user:password@host:5432/dbname" \
  --schema-only \
  --no-owner \
  --no-acl \
  --file=schema.sql
```

### Data-Only Backup

```bash
pg_dump \
  "postgresql://user:password@host:5432/dbname" \
  --data-only \
  --no-owner \
  --no-acl \
  --file=data.sql
```

### Compressed Plain Backup

```bash
pg_dump \
  "postgresql://user:password@host:5432/dbname" \
  --no-owner \
  --no-acl \
  | gzip > app_db_$(date +%Y%m%d).sql.gz
```

---

## Restore with `pg_restore`

### From Custom Format

```bash
pg_restore \
  "postgresql://user:password@target-host:5432/target-db" \
  --no-owner \
  --no-acl \
  --verbose \
  app_db.dump
```

### With Parallel Restore (faster for large datasets)

```bash
pg_restore \
  "postgresql://user:password@target-host:5432/target-db" \
  --no-owner \
  --no-acl \
  --jobs=4 \
  --verbose \
  app_db.dump
```

### Restore Schema Only

```bash
pg_restore \
  "postgresql://user:password@target-host:5432/target-db" \
  --no-owner \
  --no-acl \
  --schema-only \
  app_db.dump
```

### Restore Data Only

```bash
pg_restore \
  "postgresql://user:password@target-host:5432/target-db" \
  --no-owner \
  --no-acl \
  --data-only \
  app_db.dump
```

### From Plain SQL

```bash
psql "postgresql://user:password@target-host:5432/target-db" < schema.sql
psql "postgresql://user:password@target-host:5432/target-db" < data.sql
```

---

## Provider-Specific Backup Recommendations

### Supabase

Supabase provides automated daily backups (free tier) and PITR (pro tier).

**Manual backup:**

```bash
pg_dump \
  --host=aws-1-ap-south-1.pooler.supabase.com \
  --port=5432 \
  --username=postgres.<project-ref> \
  --dbname=postgres \
  --no-owner \
  --no-acl \
  --format=custom \
  --file=supabase_backup.dump
```

### Neon

Neon provides built-in PITR with branching.

**Clone via branching:**

```bash
# Create a branch from the Neon console or CLI
# Each branch is an independent database with its own connection string
```

**Manual backup:**

```bash
pg_dump \
  --host=<neon-host> \
  --username=<user> \
  --dbname=neondb \
  --no-owner \
  --no-acl \
  --format=custom \
  --file=neon_backup.dump
```

### AWS RDS

**Automated snapshots** (configured in AWS Console):
- Automatic backups enabled by default (retention: 1–35 days)
- Manual snapshots for point-in-time

**Manual backup:**

```bash
pg_dump \
  --host=<rds-endpoint> \
  --username=postgres \
  --dbname=ai_sql_assistant \
  --no-owner \
  --no-acl \
  --format=custom \
  --file=rds_backup.dump
```

### Azure PostgreSQL

**Automated backups:**
- Full backup weekly
- Transaction log backup every 5 minutes
- Retention: 7–35 days

**Manual backup:**

```bash
pg_dump \
  --host=<server>.postgres.database.azure.com \
  --username=<user> \
  --dbname=ai_sql_assistant \
  --no-owner \
  --no-acl \
  --format=custom \
  --file=azure_backup.dump
```

### Google Cloud SQL

**Automated backups:**
- Daily exports to Cloud Storage
- Binary log co-ordinates for PITR

**Manual backup:**

```bash
gcloud sql export sql <instance> gs://<bucket>/backup.dump \
  --database=ai_sql_assistant
```

### Railway

**No built-in automated backups.** Manual `pg_dump` is recommended on a schedule.

```bash
pg_dump \
  --host=<railway-host> \
  --port=<railway-port> \
  --username=postgres \
  --dbname=railway \
  --no-owner \
  --no-acl \
  --format=custom \
  --file=railway_backup.dump
```

### Self-hosted PostgreSQL

**Use `cron` + `pg_dump`:**

```bash
# Add to crontab (daily at 2 AM)
0 2 * * * pg_dump --host=localhost --username=postgres --dbname=ai_sql_assistant --no-owner --no-acl --format=custom --file=/backups/app_db_$(date +\%Y\%m\%d).dump
```

---

## Post-Restore Verification

After any restore, always run:

```bash
# 1. Verify tables exist
psql $DATABASE_URL_SYNC -c "\dt"

# 2. Verify migration version
psql $DATABASE_URL_SYNC -c "SELECT * FROM alembic_version;"
# Expected: 7d1e8f3a2b9c

# 3. Run pending migrations (safe even if up to date)
alembic upgrade head

# 4. Test the application health endpoint
curl http://your-app:8000/api/v1/health

# 5. Test authentication
curl -X POST http://your-app:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"existing_user","password":"password"}'
```

---

## Backup Checklist

- [ ] Backup before any schema migration
- [ ] Backup before provider migration
- [ ] Store backups in a different region/provider
- [ ] Test restore process periodically
- [ ] Encrypt backup files if they contain sensitive data
- [ ] Document the backup location and retention policy

---

## Size Estimates

The application database is small (typically < 100 MB for most deployments):

| Table | Estimated Rows | Size |
|---|---|---|
| `users` | 10–1,000 | < 1 MB |
| `database_connections` | 1–100 | < 1 MB |
| `query_history` | 100–100,000 | 10–50 MB |
| `audit_logs` | 100–100,000 | 10–50 MB |
| `database_permissions` | 1–1,000 | < 1 MB |
| `user_database_access` | 1–1,000 | < 1 MB |

Backups are expected to be **< 100 MB** for most deployments.
