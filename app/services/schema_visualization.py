import logging
from urllib.parse import quote
from sqlalchemy import create_engine, text
from app.models.database_connection import DatabaseConnection
from app.utils.encryption import decrypt_password
from app.schemas.schema import SchemaResponse
from app.schemas.schema_visualization import (
    SchemaVisualization, VisTable, VisColumn, Relationship,
)

logger = logging.getLogger(__name__)


def _build_url(connection: DatabaseConnection) -> str:
    password = decrypt_password(connection.encrypted_password)
    return (
        f"postgresql://{connection.username}:{quote(password, safe='')}"
        f"@{connection.host}:{connection.port}/{connection.database}"
    )


def get_schema_visualization(
    connection: DatabaseConnection,
    schema: SchemaResponse | None = None,
) -> SchemaVisualization:
    url = _build_url(connection)
    engine = create_engine(url, pool_pre_ping=True, pool_size=1, max_overflow=0)

    try:
        with engine.connect() as conn:
            if schema:
                return _build_from_schema(conn, schema)
            return _build_from_postgres(conn)
    finally:
        engine.dispose()


def _build_from_schema(conn, schema: SchemaResponse) -> SchemaVisualization:
    tables = [t.table_name for t in schema.tables]
    pk_map: dict[str, set[str]] = {}
    fk_list: list[dict] = []
    columns_map: dict[str, list[dict]] = {}

    for table in schema.tables:
        tbl = table.table_name
        pk_map[tbl] = {c.column_name for c in table.columns if c.is_primary_key}
        columns_map[tbl] = [
            {
                "name": c.column_name,
                "type": c.data_type,
                "nullable": c.is_nullable,
                "default": c.column_default,
            }
            for c in table.columns
        ]
        for col in table.columns:
            if col.is_foreign_key and col.referenced_table and col.referenced_column:
                fk_list.append({
                    "from_table": tbl,
                    "from_column": col.column_name,
                    "to_table": col.referenced_table,
                    "to_column": col.referenced_column,
                })

    unique_cols = _get_unique_constraints(conn)
    row_counts = _get_row_counts(conn, tables)

    vis_tables: list[VisTable] = []
    for table in schema.tables:
        tbl = table.table_name
        tbl_cols = columns_map.get(tbl, [])
        pks = pk_map.get(tbl, set())
        fks = {fk["from_column"] for fk in fk_list if fk["from_table"] == tbl}
        vis_columns = [
            VisColumn(
                name=c["name"],
                type=c["type"],
                nullable=c["nullable"],
                default=c["default"],
                primary_key=c["name"] in pks,
                foreign_key=c["name"] in fks,
            )
            for c in tbl_cols
        ]
        vis_tables.append(VisTable(
            name=tbl,
            schema_name="public",
            columns=vis_columns,
            row_count=row_counts.get(tbl, 0),
        ))

    relationships = _infer_relationships(fk_list, pk_map, unique_cols, tables)

    return SchemaVisualization(tables=vis_tables, relationships=relationships)


def _build_from_postgres(conn) -> SchemaVisualization:
    tables = _get_tables(conn)
    columns = _get_all_columns(conn)
    pk_map = _get_primary_keys(conn)
    fk_list = _get_foreign_keys(conn)
    unique_cols = _get_unique_constraints(conn)
    row_counts = _get_row_counts(conn, tables)

    vis_tables: list[VisTable] = []
    for tbl in tables:
        tbl_cols = columns.get(tbl, [])
        pks = pk_map.get(tbl, set())
        fks = {fk["from_column"] for fk in fk_list if fk["from_table"] == tbl}
        vis_columns = [
            VisColumn(
                name=c["name"],
                type=c["type"],
                nullable=c["nullable"],
                default=c["default"],
                primary_key=c["name"] in pks,
                foreign_key=c["name"] in fks,
            )
            for c in tbl_cols
        ]
        vis_tables.append(VisTable(
            name=tbl,
            schema_name="public",
            columns=vis_columns,
            row_count=row_counts.get(tbl, 0),
        ))

    relationships = _infer_relationships(fk_list, pk_map, unique_cols, tables)

    return SchemaVisualization(tables=vis_tables, relationships=relationships)


def _get_tables(conn) -> list[str]:
    result = conn.execute(text(
        "SELECT table_name FROM information_schema.tables "
        "WHERE table_schema = 'public' AND table_type = 'BASE TABLE' "
        "ORDER BY table_name"
    ))
    return [row[0] for row in result]


def _get_all_columns(conn) -> dict[str, list[dict]]:
    result = conn.execute(text(
        "SELECT table_name, column_name, data_type, "
        "       is_nullable, column_default "
        "FROM information_schema.columns "
        "WHERE table_schema = 'public' "
        "ORDER BY table_name, ordinal_position"
    ))
    columns: dict[str, list[dict]] = {}
    for row in result:
        tbl = row[0]
        if tbl not in columns:
            columns[tbl] = []
        columns[tbl].append({
            "name": row[1],
            "type": row[2],
            "nullable": row[3] == "YES",
            "default": row[4],
        })
    return columns


def _get_primary_keys(conn) -> dict[str, set[str]]:
    result = conn.execute(text(
        "SELECT tc.table_name, kc.column_name "
        "FROM information_schema.table_constraints tc "
        "JOIN information_schema.key_column_usage kc "
        "  ON tc.constraint_name = kc.constraint_name "
        "  AND tc.table_schema = kc.table_schema "
        "WHERE tc.constraint_type = 'PRIMARY KEY' "
        "  AND tc.table_schema = 'public'"
    ))
    pk_map: dict[str, set[str]] = {}
    for row in result:
        tbl = row[0]
        if tbl not in pk_map:
            pk_map[tbl] = set()
        pk_map[tbl].add(row[1])
    return pk_map


def _get_foreign_keys(conn) -> list[dict]:
    result = conn.execute(text(
        "SELECT kcu.table_name AS from_table, "
        "       kcu.column_name AS from_column, "
        "       ccu.table_name AS to_table, "
        "       ccu.column_name AS to_column "
        "FROM information_schema.table_constraints tc "
        "JOIN information_schema.key_column_usage kcu "
        "  ON tc.constraint_name = kcu.constraint_name "
        "  AND tc.table_schema = kcu.table_schema "
        "JOIN information_schema.constraint_column_usage ccu "
        "  ON tc.constraint_name = ccu.constraint_name "
        "  AND tc.table_schema = ccu.table_schema "
        "WHERE tc.constraint_type = 'FOREIGN KEY' "
        "  AND tc.table_schema = 'public'"
    ))
    return [
        {
            "from_table": row[0],
            "from_column": row[1],
            "to_table": row[2],
            "to_column": row[3],
        }
        for row in result
    ]


def _get_unique_constraints(conn) -> dict[str, set[str]]:
    result = conn.execute(text(
        "SELECT tc.table_name, kc.column_name "
        "FROM information_schema.table_constraints tc "
        "JOIN information_schema.key_column_usage kc "
        "  ON tc.constraint_name = kc.constraint_name "
        "  AND tc.table_schema = kc.table_schema "
        "WHERE tc.constraint_type = 'UNIQUE' "
        "  AND tc.table_schema = 'public'"
    ))
    unique_map: dict[str, set[str]] = {}
    for row in result:
        tbl = row[0]
        if tbl not in unique_map:
            unique_map[tbl] = set()
        unique_map[tbl].add(row[1])
    return unique_map


def _get_row_counts(conn, tables: list[str]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for tbl in tables:
        result = conn.execute(text(f"SELECT COUNT(*) FROM {tbl}"))
        counts[tbl] = result.scalar() or 0
    return counts


def _infer_relationships(
    fk_list: list[dict],
    pk_map: dict[str, set[str]],
    unique_cols: dict[str, set[str]],
    all_tables: list[str],
) -> list[Relationship]:
    relationships: list[Relationship] = []
    table_set = set(all_tables)

    for fk in fk_list:
        from_tbl = fk["from_table"]
        from_col = fk["from_column"]
        to_tbl = fk["to_table"]
        to_col = fk["to_column"]

        from_unique = unique_cols.get(from_tbl, set())
        from_pks = pk_map.get(from_tbl, set())

        # Determine relationship type
        if from_col in from_unique or from_col in from_pks:
            rel_type = "ONE_TO_ONE"
        else:
            rel_type = "ONE_TO_MANY"

        relationships.append(Relationship(
            from_table=from_tbl,
            from_column=from_col,
            to_table=to_tbl,
            to_column=to_col,
            relationship=rel_type,
        ))

    # Detect many-to-many junction tables
    junction_tables = _find_junction_tables(fk_list, pk_map, table_set)
    for jt in junction_tables:
        relationships.append(Relationship(
            from_table=jt["table_a"],
            from_column=jt["column_a"],
            to_table=jt["table_b"],
            to_column=jt["column_b"],
            relationship="MANY_TO_MANY",
        ))

    return relationships


def _find_junction_tables(
    fk_list: list[dict],
    pk_map: dict[str, set[str]],
    table_set: set[str],
) -> list[dict]:
    junctions: list[dict] = []

    fk_by_table: dict[str, list[dict]] = {}
    for fk in fk_list:
        tbl = fk["from_table"]
        if tbl not in fk_by_table:
            fk_by_table[tbl] = []
        fk_by_table[tbl].append(fk)

    for tbl, fks in fk_by_table.items():
        if len(fks) < 2:
            continue
        fk_cols = {fk["from_column"] for fk in fks}
        pks = pk_map.get(tbl, set())
        # Junction table: composite PK made entirely of FK columns
        if pks and pks == fk_cols:
            pairs = []
            for fk in fks:
                pairs.append({
                    "table_a": fk["from_table"],
                    "column_a": fk["from_column"],
                    "table_b": fk["to_table"],
                    "column_b": fk["to_column"],
                })
            # Generate M:N relationships between each pair of referenced tables
            for i in range(len(pairs)):
                for j in range(i + 1, len(pairs)):
                    junctions.append({
                        "table_a": pairs[i]["table_b"],
                        "column_a": pairs[i]["column_b"],
                        "table_b": pairs[j]["table_b"],
                        "column_b": pairs[j]["column_b"],
                    })

    return junctions
