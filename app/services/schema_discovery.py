import logging
from urllib.parse import quote
from sqlalchemy import create_engine, text
from app.models.database_connection import DatabaseConnection
from app.utils.encryption import decrypt_password
from app.schemas.schema import SchemaResponse, TableInfo, ColumnInfo, ViewInfo, IndexInfo

logger = logging.getLogger(__name__)


def _build_url(connection: DatabaseConnection) -> str:
    password = decrypt_password(connection.encrypted_password)
    return f"postgresql://{connection.username}:{quote(password, safe='')}@{connection.host}:{connection.port}/{connection.database}"


def discover_schema(connection: DatabaseConnection) -> SchemaResponse:
    url = _build_url(connection)
    engine = create_engine(url, pool_pre_ping=True, pool_size=1, max_overflow=0)

    try:
        with engine.connect() as conn:
            tables = _get_tables(conn)
            views = _get_views(conn)
            indexes = _get_indexes(conn)
            primary_keys = _get_primary_keys(conn)
            foreign_keys = _get_foreign_keys(conn)

        _enrich_columns(tables, primary_keys, foreign_keys)

        return SchemaResponse(tables=tables, views=views, indexes=indexes)
    finally:
        engine.dispose()


def _get_tables(conn) -> list[TableInfo]:
    result = conn.execute(
        text("""
            SELECT table_name, table_type
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
    )
    tables = []
    for row in result:
        columns = _get_columns(conn, row[0])
        tables.append(TableInfo(
            table_name=row[0],
            table_type=row[1],
            columns=columns,
        ))
    return tables


def _get_columns(conn, table_name: str) -> list[ColumnInfo]:
    result = conn.execute(
        text("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = :t
            ORDER BY ordinal_position
        """),
        {"t": table_name},
    )
    return [
        ColumnInfo(
            column_name=row[0],
            data_type=row[1],
            is_nullable=row[2] == "YES",
            column_default=row[3],
            is_primary_key=False,
            is_foreign_key=False,
            referenced_table=None,
            referenced_column=None,
        )
        for row in result
    ]


def _get_primary_keys(conn) -> dict[str, set[str]]:
    result = conn.execute(
        text("""
            SELECT tc.table_name, kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            WHERE tc.constraint_type = 'PRIMARY KEY'
                AND tc.table_schema = 'public'
        """)
    )
    pk_map: dict[str, set[str]] = {}
    for row in result:
        table = row[0]
        col = row[1]
        if table not in pk_map:
            pk_map[table] = set()
        pk_map[table].add(col)
    return pk_map


def _get_foreign_keys(conn) -> dict[str, dict[str, tuple[str, str]]]:
    result = conn.execute(
        text("""
            SELECT
                tc.table_name,
                kcu.column_name,
                ccu.table_name AS referenced_table,
                ccu.column_name AS referenced_column
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage ccu
                ON tc.constraint_name = ccu.constraint_name
                AND tc.table_schema = ccu.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
                AND tc.table_schema = 'public'
        """)
    )
    fk_map: dict[str, dict[str, tuple[str, str]]] = {}
    for row in result:
        table = row[0]
        col = row[1]
        ref_table = row[2]
        ref_col = row[3]
        if table not in fk_map:
            fk_map[table] = {}
        fk_map[table][col] = (ref_table, ref_col)
    return fk_map


def _enrich_columns(
    tables: list[TableInfo],
    primary_keys: dict[str, set[str]],
    foreign_keys: dict[str, dict[str, tuple[str, str]]],
) -> None:
    for table in tables:
        pk_cols = primary_keys.get(table.table_name, set())
        fk_cols = foreign_keys.get(table.table_name, {})
        for col in table.columns:
            if col.column_name in pk_cols:
                col.is_primary_key = True
            if col.column_name in fk_cols:
                col.is_foreign_key = True
                col.referenced_table = fk_cols[col.column_name][0]
                col.referenced_column = fk_cols[col.column_name][1]


def _get_views(conn) -> list[ViewInfo]:
    result = conn.execute(
        text("""
            SELECT table_name,
                   view_definition
            FROM information_schema.views
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
    )
    return [ViewInfo(view_name=row[0], definition=row[1]) for row in result]


def _get_indexes(conn) -> list[IndexInfo]:
    result = conn.execute(
        text("""
            SELECT
                i.relname AS index_name,
                CASE
                    WHEN ix.indisunique THEN 'unique'
                    ELSE 'non-unique'
                END AS index_type,
                ARRAY_AGG(a.attname ORDER BY array_position(ix.indkey, a.attnum)) AS columns,
                ix.indisunique AS is_unique
            FROM pg_class t
            JOIN pg_index ix ON t.oid = ix.indrelid
            JOIN pg_class i ON i.oid = ix.indexrelid
            JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
            WHERE t.relkind = 'r' AND t.relname NOT LIKE 'pg_%'
                AND t.relname NOT LIKE 'sql_%'
                AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
            GROUP BY i.relname, ix.indisunique
            ORDER BY i.relname
        """)
    )
    return [
        IndexInfo(
            index_name=row[0],
            index_type=row[1],
            columns=row[2],
            is_unique=row[3],
        )
        for row in result
    ]
