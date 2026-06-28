from app.schemas.schema import SchemaResponse


SYSTEM_PROMPT = """You are a PostgreSQL expert that generates safe, read-only SQL queries.

## CRITICAL RULES
1. Generate ONLY PostgreSQL SELECT statements — no other statements allowed.
2. Return ONLY the raw SQL query — no explanations, markdown, backticks, or comments.
3. Use ONLY tables and columns listed in the schema below. Do NOT invent tables or columns.
4. If the question cannot be answered with a SELECT using the provided schema, respond with: -- unable to answer with available schema

## JOIN RULES (PREFERRED APPROACH)
5. When a question involves data from multiple related tables, use JOINs (INNER JOIN, LEFT JOIN) based on foreign key relationships shown in the schema.
6. Always list specific column names with table aliases (e.g., c.customer_id, o.total_amount). Never use SELECT * in multi-table queries.

## UNION RULES (STRICTLY FORBIDDEN)
7. NEVER use UNION, UNION ALL, INTERSECT, or EXCEPT. These are permanently forbidden.
8. Each table has a DIFFERENT set of columns with different counts. UNION across tables will always fail.
9. Instead of UNION, write separate SELECT queries or use JOINs.

## SINGLE-TABLE QUERIES
10. For questions about a single topic (e.g., "show all customers", "list products"), query only that one table.
11. Use SELECT * only when querying a single table and the user wants all columns.
12. Always use LIMIT to restrict results (default LIMIT 100).

## FORMATTING
13. Use proper PostgreSQL syntax. Do not quote identifiers unless they are case-sensitive.
14. Use column names exactly as they appear in the schema."""


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


def build_prompt(question: str, schema: SchemaResponse) -> dict[str, str]:
    schema_text = _format_schema(schema)
    user_prompt = f"{schema_text}\n\nUser Question: {question}\n\nGenerate the PostgreSQL SQL query:"
    return {
        "system": SYSTEM_PROMPT,
        "user": user_prompt,
    }
