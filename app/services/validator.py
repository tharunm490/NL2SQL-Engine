import logging
import sqlglot
from sqlglot import exp
from app.schemas.schema import SchemaResponse

logger = logging.getLogger(__name__)


class ValidationResult:
    def __init__(self, valid: bool, errors: list[str] | None = None):
        self.valid = valid
        self.errors = errors or []

    def __bool__(self) -> bool:
        return self.valid


def _build_alias_map(parsed: exp.Expression) -> dict[str, str]:
    alias_map: dict[str, str] = {}
    for table in parsed.find_all(exp.Table):
        alias = table.alias
        if alias:
            alias_map[alias] = table.name
    return alias_map


def validate_sql(sql: str, schema: SchemaResponse) -> ValidationResult:
    errors: list[str] = []

    if not sql or not sql.strip():
        return ValidationResult(False, ["SQL query is empty"])

    try:
        parsed = sqlglot.parse_one(sql, dialect="postgres")
    except Exception as e:
        return ValidationResult(False, [f"Syntax error: {str(e)}"])

    # 1. Blocked commands check
    for node in parsed.walk():
        if isinstance(node, exp.Command):
            cmd_name = node.name.upper()
            if cmd_name in {"INSERT", "UPDATE", "DELETE", "DROP", "ALTER",
                             "CREATE", "TRUNCATE", "MERGE", "GRANT", "REVOKE"}:
                return ValidationResult(False, [f"Blocked statement: {cmd_name}"])

    # 2. Allow only SELECT-based statements
    if not isinstance(parsed, (exp.Select, exp.Union)):
        return ValidationResult(False, [
            f"Only SELECT statements are allowed, got: {type(parsed).__name__}"
        ])

    # 3. Reject UNION/INTERSECT/EXCEPT entirely — tables have different column counts
    if isinstance(parsed, exp.Union):
        errors.append(
            "UNION, INTERSECT, and EXCEPT are not supported. "
            "Each table has a different number of columns. "
            "Use separate SELECT queries or JOINs instead."
        )
        return ValidationResult(False, errors)

    # Build schema lookups
    available_tables = {t.table_name for t in schema.tables}
    available_views = {v.view_name for v in schema.views}
    all_relations = available_tables | available_views

    table_columns: dict[str, set[str]] = {}
    for t in schema.tables:
        table_columns[t.table_name] = {c.column_name for c in t.columns}

    # Build alias-to-table mapping
    alias_map = _build_alias_map(parsed)

    def resolve_table(ref: str) -> str | None:
        return alias_map.get(ref, ref if ref in all_relations else None)

    # 3. Extract and validate table references
    referenced_tables = set()
    for table_expr in parsed.find_all(exp.Table):
        table_name = table_expr.name
        if table_name and table_name not in referenced_tables:
            referenced_tables.add(table_name)
            if table_name not in all_relations:
                errors.append(f"Table or view does not exist: '{table_name}'")

    # 4. Validate column references
    for column_expr in parsed.find_all(exp.Column):
        table_ref = column_expr.table
        col_name = column_expr.name

        if col_name == "*":
            continue

        if table_ref:
            actual_table = resolve_table(table_ref)
            if actual_table and actual_table in table_columns:
                if col_name not in table_columns[actual_table]:
                    errors.append(
                        f"Column '{col_name}' does not exist in table '{actual_table}'"
                    )
        else:
            found = False
            for tbl in referenced_tables:
                if tbl in table_columns and col_name in table_columns[tbl]:
                    found = True
                    break
            if not found:
                errors.append(f"Column '{col_name}' does not exist in any referenced table")

    return ValidationResult(len(errors) == 0, errors)
