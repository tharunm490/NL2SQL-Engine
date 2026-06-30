import sys
sys.path.insert(0, ".")

from app.prompts.semantic_resolver import resolve_semantics, BUSINESS_SEMANTIC_LAYER, SEMANTIC_MAP
from app.prompts.builder import build_prompt, SYSTEM_PROMPT
from app.schemas.schema import SchemaResponse, TableInfo, ColumnInfo, ViewInfo, IndexInfo


def make_sample_schema() -> SchemaResponse:
    return SchemaResponse(
        tables=[
            TableInfo(
                table_name="customers",
                table_type="TABLE",
                columns=[
                    ColumnInfo(column_name="customer_id", data_type="integer", is_nullable=False, column_default=None, is_primary_key=True, is_foreign_key=False, referenced_table=None, referenced_column=None),
                    ColumnInfo(column_name="customer_name", data_type="varchar", is_nullable=True, column_default=None, is_primary_key=False, is_foreign_key=False, referenced_table=None, referenced_column=None),
                    ColumnInfo(column_name="region_id", data_type="integer", is_nullable=True, column_default=None, is_primary_key=False, is_foreign_key=True, referenced_table="regions", referenced_column="region_id"),
                ]
            ),
            TableInfo(
                table_name="orders",
                table_type="TABLE",
                columns=[
                    ColumnInfo(column_name="order_id", data_type="integer", is_nullable=False, column_default=None, is_primary_key=True, is_foreign_key=False, referenced_table=None, referenced_column=None),
                    ColumnInfo(column_name="customer_id", data_type="integer", is_nullable=True, column_default=None, is_primary_key=False, is_foreign_key=True, referenced_table="customers", referenced_column="customer_id"),
                    ColumnInfo(column_name="total_amount", data_type="numeric", is_nullable=True, column_default=None, is_primary_key=False, is_foreign_key=False, referenced_table=None, referenced_column=None),
                    ColumnInfo(column_name="order_date", data_type="date", is_nullable=True, column_default=None, is_primary_key=False, is_foreign_key=False, referenced_table=None, referenced_column=None),
                    ColumnInfo(column_name="salesperson_id", data_type="integer", is_nullable=True, column_default=None, is_primary_key=False, is_foreign_key=True, referenced_table="sales_representatives", referenced_column="salesperson_id"),
                ]
            ),
            TableInfo(
                table_name="products",
                table_type="TABLE",
                columns=[
                    ColumnInfo(column_name="product_id", data_type="integer", is_nullable=False, column_default=None, is_primary_key=True, is_foreign_key=False, referenced_table=None, referenced_column=None),
                    ColumnInfo(column_name="product_name", data_type="varchar", is_nullable=True, column_default=None, is_primary_key=False, is_foreign_key=False, referenced_table=None, referenced_column=None),
                    ColumnInfo(column_name="unit_price", data_type="numeric", is_nullable=True, column_default=None, is_primary_key=False, is_foreign_key=False, referenced_table=None, referenced_column=None),
                ]
            ),
            TableInfo(
                table_name="order_items",
                table_type="TABLE",
                columns=[
                    ColumnInfo(column_name="order_item_id", data_type="integer", is_nullable=False, column_default=None, is_primary_key=True, is_foreign_key=False, referenced_table=None, referenced_column=None),
                    ColumnInfo(column_name="order_id", data_type="integer", is_nullable=True, column_default=None, is_primary_key=False, is_foreign_key=True, referenced_table="orders", referenced_column="order_id"),
                    ColumnInfo(column_name="product_id", data_type="integer", is_nullable=True, column_default=None, is_primary_key=False, is_foreign_key=True, referenced_table="products", referenced_column="product_id"),
                    ColumnInfo(column_name="quantity", data_type="integer", is_nullable=True, column_default=None, is_primary_key=False, is_foreign_key=False, referenced_table=None, referenced_column=None),
                    ColumnInfo(column_name="unit_price", data_type="numeric", is_nullable=True, column_default=None, is_primary_key=False, is_foreign_key=False, referenced_table=None, referenced_column=None),
                ]
            ),
            TableInfo(
                table_name="regions",
                table_type="TABLE",
                columns=[
                    ColumnInfo(column_name="region_id", data_type="integer", is_nullable=False, column_default=None, is_primary_key=True, is_foreign_key=False, referenced_table=None, referenced_column=None),
                    ColumnInfo(column_name="region_name", data_type="varchar", is_nullable=True, column_default=None, is_primary_key=False, is_foreign_key=False, referenced_table=None, referenced_column=None),
                ]
            ),
            TableInfo(
                table_name="sales_representatives",
                table_type="TABLE",
                columns=[
                    ColumnInfo(column_name="salesperson_id", data_type="integer", is_nullable=False, column_default=None, is_primary_key=True, is_foreign_key=False, referenced_table=None, referenced_column=None),
                    ColumnInfo(column_name="salesperson_name", data_type="varchar", is_nullable=True, column_default=None, is_primary_key=False, is_foreign_key=False, referenced_table=None, referenced_column=None),
                    ColumnInfo(column_name="region_id", data_type="integer", is_nullable=True, column_default=None, is_primary_key=False, is_foreign_key=True, referenced_table="regions", referenced_column="region_id"),
                ]
            ),
        ],
        views=[],
        indexes=[],
    )


def test_semantic_resolver_detects_revenue():
    result = resolve_semantics("Show total revenue by region")
    assert "revenue" in result.lower()


def test_semantic_resolver_detects_growth():
    result = resolve_semantics("Show revenue growth")
    assert "growth" in result.lower()


def test_semantic_resolver_detects_top():
    result = resolve_semantics("Show top 5 customers")
    assert "top" in result.lower() or "Top" in result


def test_semantic_resolver_detects_quarterly():
    result = resolve_semantics("Show quarterly revenue")
    assert "quarterly" in result.lower()


def test_semantic_resolver_detects_monthly():
    result = resolve_semantics("Show revenue by month")
    assert "monthly" in result.lower()


def test_semantic_resolver_detects_average():
    result = resolve_semantics("Show average order value")
    assert "average" in result.lower()


def test_semantic_resolver_detects_ranking():
    result = resolve_semantics("Find the salesperson with the highest revenue in every region")
    assert "ranking" in result.lower() or "highest" in result.lower()


def test_semantic_resolver_no_match():
    result = resolve_semantics("List all tables")
    assert result == ""


def test_semantic_resolver_multiple_terms():
    result = resolve_semantics("Show top 5 products by revenue")
    assert "top" in result.lower()
    assert "revenue" in result.lower()


def test_build_prompt_includes_semantic_hints():
    schema = make_sample_schema()
    prompt = build_prompt("Show total revenue by region", schema)
    assert "Semantic Resolver" in prompt["user"]
    assert "revenue" in prompt["user"].lower()
    assert "Database Schema:" in prompt["user"]
    assert "Relationship Graph:" in prompt["user"]


def test_build_prompt_no_semantic_hints():
    schema = make_sample_schema()
    prompt = build_prompt("List all tables in the database", schema)
    assert "Semantic Resolver" not in prompt["user"]


def test_build_prompt_includes_business_semantic_layer():
    assert "Business Semantic Layer" in SYSTEM_PROMPT
    assert "Revenue" in SYSTEM_PROMPT
    assert "Sales Growth" in SYSTEM_PROMPT


def test_build_prompt_orders_correctly():
    schema = make_sample_schema()
    prompt = build_prompt("Show revenue", schema)
    user_prompt = prompt["user"]
    schema_idx = user_prompt.index("Database Schema:")
    question_idx = user_prompt.index("User Question:")
    assert schema_idx < question_idx


def test_semantic_map_is_comprehensive():
    required_keys = [
        "revenue", "growth", "ranking", "quarterly", "monthly",
        "average", "count", "top", "highest", "most",
        "bottom", "lowest", "least", "region", "customer",
        "product", "salesperson", "performance",
    ]
    for key in required_keys:
        assert key in SEMANTIC_MAP, f"Missing semantic mapping for '{key}'"


def test_business_semantic_layer_is_comprehensive():
    required_metrics = [
        "Revenue", "Sales", "Order Count", "Average Order Value",
        "Monthly Revenue", "Quarterly Revenue", "Yearly Revenue",
        "Top Customer", "Top Product", "Best Region",
        "Target Achievement", "Sales Growth", "Running Total",
        "Ranking", "Customers Without Orders",
    ]
    for metric in required_metrics:
        assert metric in BUSINESS_SEMANTIC_LAYER, f"Missing business metric: {metric}"


def test_system_prompt_has_pipeline_reference():
    assert "Pipeline Reference" in SYSTEM_PROMPT
    assert "Database Schema" in SYSTEM_PROMPT
    assert "Relationship Graph" in SYSTEM_PROMPT
    assert "Semantic Hints" in SYSTEM_PROMPT
    assert "User Question" in SYSTEM_PROMPT


def test_system_prompt_has_database_type():
    assert "Database type: PostgreSQL" in SYSTEM_PROMPT


def test_system_prompt_has_no_code_fences_rule():
    assert "No code fences" in SYSTEM_PROMPT


def test_system_prompt_has_window_functions_rule():
    assert "Window Functions" in SYSTEM_PROMPT
    assert "LAG" in SYSTEM_PROMPT


def test_semantic_resolver_detects_customers_without_orders():
    result = resolve_semantics("Find customers who have never placed an order")
    assert "customer" in result.lower()
    assert "LEFT JOIN" in BUSINESS_SEMANTIC_LAYER or "NOT EXISTS" in BUSINESS_SEMANTIC_LAYER


def test_build_prompt_with_salesperson_ranking():
    schema = make_sample_schema()
    prompt = build_prompt("Find the salesperson with the highest revenue in every region", schema)
    assert "highest" in prompt["user"].lower() or "ranking" in prompt["user"].lower()
    assert "revenue" in prompt["user"].lower()
    assert "salesperson" in prompt["user"].lower() or "Salesperson" in prompt["user"]
