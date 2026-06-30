from app.schemas.schema import SchemaResponse
from app.prompts.semantic_resolver import BUSINESS_SEMANTIC_LAYER, resolve_semantics


SYSTEM_PROMPT = f"""You are an Expert PostgreSQL Database Engineer and Senior Data Analyst.

Your job is to translate natural language into executable PostgreSQL SQL.

Database type: PostgreSQL

The backend provides only metadata:

* Table names
* Column names
* Data types
* Primary Keys
* Foreign Keys
* Relationships

It does NOT provide any row values.

You must reason entirely from this metadata.

{BUSINESS_SEMANTIC_LAYER}

---

### SQL Rules

Generate ONLY PostgreSQL SELECT queries.

Never generate:

INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, TRUNCATE, MERGE, GRANT, REVOKE

Never hallucinate tables.

Never hallucinate columns.

Only use metadata supplied by the backend.

If a requested business metric is missing, derive it from available columns.

Always qualify columns with table aliases.

Prefer INNER JOIN. Use LEFT JOIN only when required.

Use CTEs (WITH clauses) for complex analytical queries.

Use Window Functions (ROW_NUMBER, RANK, DENSE_RANK, LAG, LEAD) whenever ranking, comparison, or period-over-period analysis is required.

Every aggregate query must satisfy PostgreSQL GROUP BY rules.

Return ONLY executable PostgreSQL SQL.

No markdown formatting.

No code fences.

No explanations unless explicitly requested.

---

### Before returning SQL

Verify:

1. All tables referenced exist in the schema.
2. All columns referenced exist in their respective tables.
3. Every JOIN follows the foreign key relationships provided.
4. GROUP BY includes every non-aggregated column in SELECT.
5. ORDER BY columns exist in the query output.
6. No ambiguous column references (always use table aliases).
7. SQL is valid, executable PostgreSQL.

If any validation check fails, rewrite the SQL before returning it.

---

### Pipeline Reference

The user prompt you receive contains:

1. Database Schema (tables, columns, types, keys)
2. Relationship Graph (foreign key links between tables)
3. Semantic Hints (business term mappings detected in the question)
4. User Question (the natural language request)

Use all of these together to generate accurate SQL."""


def _format_schema(schema: SchemaResponse) -> str:
    lines = ["Database Schema:"]

    for table in schema.tables:
        col_count = len(table.columns)
        lines.append(f"\nTable: {table.table_name} ({table.table_type}) - {col_count} columns")
        for col in table.columns:
            parts = [f"  - {col.column_name} ({col.data_type})"]
            if col.is_primary_key:
                parts.append("[PRIMARY KEY]")
            if col.is_foreign_key:
                parts.append(f"[FK -> {col.referenced_table}.{col.referenced_column}]")
            if col.is_nullable:
                parts.append("[nullable]")
            lines.append(" ".join(parts))

    if schema.views:
        lines.append("\nViews:")
        for view in schema.views:
            lines.append(f"  - {view.view_name}")

    return "\n".join(lines)


def _build_relationship_graph(schema: SchemaResponse) -> str:
    fk_entries = []
    for table in schema.tables:
        for col in table.columns:
            if col.is_foreign_key and col.referenced_table and col.referenced_column:
                fk_entries.append(
                    (col.referenced_table, col.referenced_column, table.table_name, col.column_name)
                )

    if not fk_entries:
        return "\nRelationship Graph:\n  No foreign key relationships found."

    lines = ["\nRelationship Graph:"]
    for ref_table, ref_col, table, column in fk_entries:
        lines.append(f"  {ref_table}.{ref_col}")
        lines.append(f"    \u2193")
        lines.append(f"")
        lines.append(f"  {table}.{column}")

    return "\n".join(lines)


def build_prompt(question: str, schema: SchemaResponse) -> dict[str, str]:
    schema_text = _format_schema(schema)
    relationship_graph = _build_relationship_graph(schema)
    semantic_hints = resolve_semantics(question)

    parts = [schema_text, relationship_graph]
    if semantic_hints:
        parts.append(f"\n{semantic_hints}")
    parts.append(f"\nUser Question: {question}")
    parts.append(f"\nGenerate the PostgreSQL SQL query:")

    user_prompt = "".join(parts)
    return {
        "system": SYSTEM_PROMPT,
        "user": user_prompt,
    }
