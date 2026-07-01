"""
Migrate the application database to Supabase using Alembic.

Usage:
    python scripts/migrate_to_supabase.py

This script reads the Supabase connection string from the .env file
(DATABASE_URL_SUPABASE) and applies all existing Alembic migrations
to create the schema in Supabase.

After a successful migration, the .env file is updated to point
DATABASE_URL and DATABASE_URL_SYNC to the Supabase instance.
"""

import os
import re
import sys
from pathlib import Path


def load_env_file(env_path: Path) -> dict[str, str]:
    env_vars: dict[str, str] = {}
    if not env_path.exists():
        print(f"Error: .env file not found at {env_path}")
        sys.exit(1)
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            env_vars[key] = value
    return env_vars


def update_env_file(
    env_path: Path,
    supabase_async_url: str,
    supabase_sync_url: str,
) -> None:
    with open(env_path) as f:
        content = f.read()

    content = re.sub(
        r"^DATABASE_URL=.*$",
        f"DATABASE_URL={supabase_async_url}",
        content,
        flags=re.MULTILINE,
    )
    content = re.sub(
        r"^DATABASE_URL_SYNC=.*$",
        f"DATABASE_URL_SYNC={supabase_sync_url}",
        content,
        flags=re.MULTILINE,
    )

    with open(env_path, "w") as f:
        f.write(content)

    print(f"Updated {env_path} with Supabase connection strings.")


def main() -> None:
    root_dir = Path(__file__).resolve().parent.parent
    env_path = root_dir / ".env"

    print("Step 1: Reading environment variables...")
    env_vars = load_env_file(env_path)

    supabase_url = env_vars.get("DATABASE_URL_SUPABASE")
    if not supabase_url:
        print(
            "Error: DATABASE_URL_SUPABASE not found in .env file.\n"
            "Please add it in the format:\n"
            "  DATABASE_URL_SUPABASE=postgresql://postgres:password@db.ref.supabase.co:5432/postgres"
        )
        sys.exit(1)

    print(f"  Using Supabase URL: {supabase_url}")

    orig_db_url = env_vars.get("DATABASE_URL", "")
    orig_db_sync_url = env_vars.get("DATABASE_URL_SYNC", "")

    supabase_async_url = supabase_url.replace(
        "postgresql://", "postgresql+asyncpg://"
    )
    supabase_sync_url = supabase_url

    print("\nStep 2: Setting environment variables for Supabase...")
    os.environ["DATABASE_URL"] = supabase_async_url
    os.environ["DATABASE_URL_SYNC"] = supabase_sync_url

    print(f"  DATABASE_URL={supabase_async_url}")
    print(f"  DATABASE_URL_SYNC={supabase_sync_url}")

    print("\nStep 3: Running Alembic migrations against Supabase...")
    os.chdir(root_dir)

    import subprocess

    result = subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        capture_output=True,
        text=True,
        env={**os.environ},
    )

    print(result.stdout)
    if result.stderr:
        print(result.stderr)

    if result.returncode != 0:
        print(f"\nError: Alembic migration failed (exit code {result.returncode}).")
        print("The .env file has NOT been modified.")
        sys.exit(1)

    print("\nStep 4: Migration successful! Updating .env file...")
    update_env_file(env_path, supabase_async_url, supabase_sync_url)

    print("\nStep 5: Verifying tables in Supabase...")
    try:
        import psycopg2

        conn = psycopg2.connect(supabase_sync_url)
        cur = conn.cursor()
        cur.execute(
            """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        """
        )
        tables = [row[0] for row in cur.fetchall()]
        cur.close()
        conn.close()

        expected = [
            "alembic_version",
            "audit_logs",
            "database_connections",
            "database_permissions",
            "query_history",
            "user_database_access",
            "users",
        ]
        print(f"  Tables found: {', '.join(tables)}")
        missing = [t for t in expected if t not in tables]
        if missing:
            print(f"  WARNING: Missing tables: {', '.join(missing)}")
        else:
            print("  All expected tables are present. Migration complete!")

    except Exception as e:
        print(f"  Could not verify tables: {e}")
        print("  Please verify manually by connecting to your Supabase database.")


if __name__ == "__main__":
    main()
