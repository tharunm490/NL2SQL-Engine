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


def _extract_all_aliases(parsed: exp.Expression) -> set[str]:
    aliases: set[str] = set()

    for alias_node in parsed.find_all(exp.Alias):
        alias_name = alias_node.alias
        if alias_name:
            aliases.add(alias_name.lower())

    for cte in parsed.find_all(exp.CTE):
        if cte.alias:
            aliases.add(cte.alias.lower())
        for node in cte.this.find_all(exp.Alias):
            alias_name = node.alias
            if alias_name:
                aliases.add(alias_name.lower())

    for subquery in parsed.find_all(exp.Subquery):
        if subquery.alias:
            aliases.add(subquery.alias.lower())
        for node in subquery.this.find_all(exp.Alias):
            alias_name = node.alias
            if alias_name:
                aliases.add(alias_name.lower())

    for select in parsed.find_all(exp.Select):
        for node in select.find_all(exp.Alias):
            alias_name = node.alias
            if alias_name:
                aliases.add(alias_name.lower())

    for union in parsed.find_all(exp.Union):
        for node in union.find_all(exp.Alias):
            alias_name = node.alias
            if alias_name:
                aliases.add(alias_name.lower())

    return aliases


def _build_table_alias_map(parsed: exp.Expression) -> dict[str, str]:
    alias_map: dict[str, str] = {}
    for table in parsed.find_all(exp.Table):
        alias = table.alias
        if alias:
            alias_map[alias] = table.name
    for cte in parsed.find_all(exp.CTE):
        if cte.alias:
            alias_map[cte.alias] = cte.alias
    for subquery in parsed.find_all(exp.Subquery):
        if subquery.alias:
            alias_map[subquery.alias] = subquery.alias
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

    # 2. Allow only SELECT-based statements (including WITH/CTE)
    if not isinstance(parsed, (exp.Select, exp.Union)):
        if not isinstance(parsed, exp.Query):
            return ValidationResult(False, [
                f"Only SELECT statements are allowed, got: {type(parsed).__name__}"
            ])

    # 3. Reject UNION/INTERSECT/EXCEPT entirely
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

    # Extract all aliases (SELECT aliases, CTE aliases, subquery aliases, window function aliases)
    all_aliases = _extract_all_aliases(parsed)

    # Build table alias map (including CTEs and subqueries as virtual tables)
    table_alias_map = _build_table_alias_map(parsed)

    def resolve_table(ref: str) -> str | None:
        if ref in table_alias_map:
            resolved = table_alias_map[ref]
            if resolved in all_relations:
                return resolved
            return resolved
        return ref if ref in all_relations else None

    # Extract and validate table references
    referenced_tables = set()
    for table_expr in parsed.find_all(exp.Table):
        table_name = table_expr.name
        if table_name and table_name not in referenced_tables:
            if table_name not in table_alias_map and table_name not in all_relations:
                errors.append(f"Table or view does not exist: '{table_name}'")
            referenced_tables.add(table_name)

    # Track CTEs and subqueries as valid table references
    for cte in parsed.find_all(exp.CTE):
        if cte.alias:
            referenced_tables.add(cte.alias)
    for subquery in parsed.find_all(exp.Subquery):
        if subquery.alias:
            referenced_tables.add(subquery.alias)

    # Validate column references - skip aliases and CTE/subquery output columns
    for column_expr in parsed.find_all(exp.Column):
        table_ref = column_expr.table
        col_name = column_expr.name

        if col_name == "*":
            continue

        col_lower = col_name.lower()

        # Skip validation for identifiers that match SELECT aliases
        if col_lower in all_aliases:
            continue

        # Skip validation for identifiers that are CTE or subquery names (used as tables)
        if col_lower in table_alias_map and table_alias_map[col_lower] not in all_relations:
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
                resolved = resolve_table(tbl)
                if resolved and resolved in table_columns and col_name in table_columns[resolved]:
                    found = True
                    break
            if not found:
                errors.append(f"Column '{col_name}' does not exist in any referenced table")

    return ValidationResult(len(errors) == 0, errors)
