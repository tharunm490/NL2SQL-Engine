import sys
sys.path.insert(0, ".")

from app.services.validator import validate_sql
from app.schemas.schema import SchemaResponse, TableInfo, ColumnInfo, ViewInfo, IndexInfo


def make_schema() -> SchemaResponse:
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


schema = make_schema()


def test_alias_in_order_by():
    sql = "SELECT SUM(total_amount) AS revenue FROM orders ORDER BY revenue DESC"
    result = validate_sql(sql, schema)
    assert result.valid, f"Expected valid, got: {result.errors}"


def test_alias_in_having():
    sql = "SELECT customer_name, SUM(total_amount) AS total_sales FROM customers JOIN orders ON customers.customer_id = orders.customer_id GROUP BY customer_name HAVING SUM(total_amount) > 1000"
    result = validate_sql(sql, schema)
    assert result.valid, f"Expected valid, got: {result.errors}"


def test_cte_with_alias():
    sql = """
    WITH monthly_sales AS (
        SELECT DATE_TRUNC('month', order_date) AS month, SUM(total_amount) AS revenue
        FROM orders GROUP BY month
    )
    SELECT * FROM monthly_sales ORDER BY revenue DESC
    """
    result = validate_sql(sql, schema)
    assert result.valid, f"Expected valid, got: {result.errors}"


def test_window_function_alias():
    sql = """
    SELECT customer_name, SUM(total_amount) AS total_sales,
           ROW_NUMBER() OVER (ORDER BY SUM(total_amount) DESC) AS rank
    FROM customers JOIN orders ON customers.customer_id = orders.customer_id
    GROUP BY customer_name
    ORDER BY rank
    """
    result = validate_sql(sql, schema)
    assert result.valid, f"Expected valid, got: {result.errors}"


def test_subquery_alias():
    sql = """
    SELECT * FROM (
        SELECT SUM(total_amount) AS revenue FROM orders
    ) sub WHERE revenue > 100
    """
    result = validate_sql(sql, schema)
    assert result.valid, f"Expected valid, got: {result.errors}"


def test_derived_column():
    sql = "SELECT quantity * unit_price AS line_total FROM order_items ORDER BY line_total DESC"
    result = validate_sql(sql, schema)
    assert result.valid, f"Expected valid, got: {result.errors}"


def test_case_expression_alias():
    sql = "SELECT CASE WHEN total_amount > 100 THEN 'High' ELSE 'Low' END AS category FROM orders ORDER BY category"
    result = validate_sql(sql, schema)
    assert result.valid, f"Expected valid, got: {result.errors}"


def test_coalesce_alias():
    sql = "SELECT COALESCE(total_amount, 0) AS amount FROM orders ORDER BY amount"
    result = validate_sql(sql, schema)
    assert result.valid, f"Expected valid, got: {result.errors}"


def test_extract_alias():
    sql = "SELECT EXTRACT(YEAR FROM order_date) AS year FROM orders ORDER BY year"
    result = validate_sql(sql, schema)
    assert result.valid, f"Expected valid, got: {result.errors}"


def test_date_trunc_alias():
    sql = "SELECT DATE_TRUNC('month', order_date) AS month FROM orders ORDER BY month"
    result = validate_sql(sql, schema)
    assert result.valid, f"Expected valid, got: {result.errors}"


def test_top_5_customers_by_revenue():
    sql = """
    SELECT c.customer_name, SUM(o.total_amount) AS revenue
    FROM customers c JOIN orders o ON c.customer_id = o.customer_id
    GROUP BY c.customer_name
    ORDER BY revenue DESC LIMIT 5
    """
    result = validate_sql(sql, schema)
    assert result.valid, f"Expected valid, got: {result.errors}"


def test_salesperson_highest_revenue_per_region():
    sql = """
    WITH ranked AS (
        SELECT r.region_name, sr.salesperson_name,
               SUM(o.total_amount) AS revenue,
               ROW_NUMBER() OVER (PARTITION BY r.region_name ORDER BY SUM(o.total_amount) DESC) AS rank
        FROM orders o
        JOIN customers c ON o.customer_id = c.customer_id
        JOIN regions r ON c.region_id = r.region_id
        JOIN sales_representatives sr ON sr.region_id = r.region_id
        GROUP BY r.region_name, sr.salesperson_name
    )
    SELECT region_name, salesperson_name, revenue
    FROM ranked WHERE rank = 1
    """
    result = validate_sql(sql, schema)
    assert result.valid, f"Expected valid, got: {result.errors}"


def test_monthly_revenue():
    sql = """
    SELECT DATE_TRUNC('month', order_date) AS month,
           SUM(total_amount) AS revenue
    FROM orders
    GROUP BY month
    ORDER BY month
    """
    result = validate_sql(sql, schema)
    assert result.valid, f"Expected valid, got: {result.errors}"


def test_yearly_revenue():
    sql = """
    SELECT EXTRACT(YEAR FROM order_date) AS year,
           SUM(total_amount) AS revenue
    FROM orders
    GROUP BY year
    ORDER BY year
    """
    result = validate_sql(sql, schema)
    assert result.valid, f"Expected valid, got: {result.errors}"


def test_quarterly_revenue():
    sql = """
    SELECT EXTRACT(YEAR FROM order_date) AS year,
           EXTRACT(QUARTER FROM order_date) AS quarter,
           SUM(total_amount) AS revenue
    FROM orders
    GROUP BY year, quarter
    ORDER BY year, quarter
    """
    result = validate_sql(sql, schema)
    assert result.valid, f"Expected valid, got: {result.errors}"


def test_revenue_by_region():
    sql = """
    SELECT r.region_name, SUM(o.total_amount) AS revenue
    FROM orders o
    JOIN customers c ON o.customer_id = c.customer_id
    JOIN regions r ON c.region_id = r.region_id
    GROUP BY r.region_name
    ORDER BY revenue DESC
    """
    result = validate_sql(sql, schema)
    assert result.valid, f"Expected valid, got: {result.errors}"


def test_top_products_by_revenue():
    sql = """
    SELECT p.product_name, SUM(oi.quantity * oi.unit_price) AS revenue
    FROM order_items oi
    JOIN products p ON oi.product_id = p.product_id
    GROUP BY p.product_name
    ORDER BY revenue DESC LIMIT 5
    """
    result = validate_sql(sql, schema)
    assert result.valid, f"Expected valid, got: {result.errors}"


def test_hallucinated_table_rejected():
    sql = "SELECT * FROM nonexistent_table"
    result = validate_sql(sql, schema)
    assert not result.valid


def test_hallucinated_column_rejected():
    sql = "SELECT fake_column FROM orders"
    result = validate_sql(sql, schema)
    assert not result.valid


def test_blocked_insert_rejected():
    sql = "INSERT INTO orders VALUES (1)"
    result = validate_sql(sql, schema)
    assert not result.valid


def test_simple_select_valid():
    sql = "SELECT * FROM orders"
    result = validate_sql(sql, schema)
    assert result.valid
