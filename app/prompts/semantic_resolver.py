BUSINESS_SEMANTIC_LAYER = """### Business Semantic Layer

The following business metrics DO NOT exist as physical columns.

They must be DERIVED using SQL calculations.

---

Revenue

If `orders.total_amount` exists:
  Revenue = SUM(orders.total_amount)
Otherwise:
  Revenue = SUM(order_items.quantity * order_items.unit_price)

---

Sales

SUM(orders.total_amount)

---

Order Count

COUNT(order_id)

---

Average Order Value

AVG(orders.total_amount)

---

Monthly Revenue

GROUP BY DATE_TRUNC('month', order_date)

---

Quarterly Revenue

GROUP BY EXTRACT(YEAR FROM order_date), EXTRACT(QUARTER FROM order_date)

---

Yearly Revenue

GROUP BY EXTRACT(YEAR FROM order_date)

---

Top Customer

GROUP BY customer_id
ORDER BY SUM(total_amount) DESC
LIMIT 1

---

Top Product

GROUP BY product_id
ORDER BY SUM(quantity) DESC
LIMIT 1

---

Best Region

JOIN orders → customers → regions
GROUP BY region_name
ORDER BY SUM(total_amount) DESC

---

Target Achievement

(achieved_sales / sales_target) * 100

---

Customers Without Orders

LEFT JOIN orders ON customers.customer_id = orders.customer_id
WHERE orders.order_id IS NULL

or

NOT EXISTS (SELECT 1 FROM orders WHERE orders.customer_id = customers.customer_id)

---

Sales Growth

(Current_Revenue - Previous_Revenue) / Previous_Revenue * 100
Use LAG() window function for previous period.

---

Running Total

SUM(amount) OVER (ORDER BY date)

---

Ranking

ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ... DESC)
RANK() OVER (PARTITION BY ... ORDER BY ... DESC)
DENSE_RANK() OVER (PARTITION BY ... ORDER BY ... DESC)

---

### Semantic Mapping Reference

| Keyword       | SQL Pattern                                    |
|---------------|-------------------------------------------------|
| Revenue       | SUM(total_amount) or SUM(quantity * unit_price) |
| Sales         | SUM(total_amount)                               |
| Growth        | (current - previous) / previous * 100           |
| Performance   | Derive using SUM, AVG, or COUNT                 |
| Profit        | SUM(revenue - cost) if columns exist             |
| Ranking       | ROW_NUMBER(), RANK(), DENSE_RANK()              |
| Trend         | GROUP BY date period, ORDER BY date              |
| Comparison    | LAG() or (current - previous) / previous        |
| Achievement   | (achieved / target) * 100                       |
| Top / Highest | ORDER BY ... DESC LIMIT N                       |
| Bottom / Lowest | ORDER BY ... ASC LIMIT N                      |
| Average       | AVG(column)                                     |
| Count         | COUNT(column)                                   |
| Most          | SUM(column) ORDER BY ... DESC LIMIT N           |
| Least         | SUM(column) ORDER BY ... ASC LIMIT N            |
| Monthly       | DATE_TRUNC('month', date_column)                |
| Quarterly     | EXTRACT(YEAR), EXTRACT(QUARTER)                 |
| Yearly        | EXTRACT(YEAR)                                   |
| Region        | JOIN with regions table, GROUP BY region        |
| Customer      | JOIN with customers table, GROUP BY customer    |
| Product       | JOIN with products table, GROUP BY product      |
| Salesperson   | JOIN with sales_representatives, GROUP BY salesperson |

### Rules

1. Never assume a business metric exists as a physical column.
2. Always derive the metric using the available schema.
3. If `total_amount` exists on orders, prefer it over `quantity * unit_price`.
4. For ranking queries, use window functions (ROW_NUMBER, RANK, DENSE_RANK).
5. For period-over-period growth, use LAG() window function.
6. Always qualify columns with table aliases.
7. Every non-aggregated column in SELECT must appear in GROUP BY.
"""

SEMANTIC_MAP = {
    "revenue": "Revenue = SUM(total_amount) or SUM(quantity * unit_price)",
    "sales": "Sales = SUM(total_amount)",
    "growth": "Growth = (current_value - previous_value) / previous_value * 100",
    "profit": "Profit = SUM(revenue - cost) if revenue and cost columns exist",
    "ranking": "Use ROW_NUMBER(), RANK(), or DENSE_RANK() window functions",
    "rank": "Use ROW_NUMBER(), RANK(), or DENSE_RANK() window functions",
    "trend": "Trend = GROUP BY date period, ORDER BY date",
    "comparison": "Comparison = LAG() or (current - previous) / previous",
    "achievement": "Achievement = (achieved / target) * 100",
    "quarterly": "Quarterly = GROUP BY EXTRACT(YEAR), EXTRACT(QUARTER)",
    "monthly": "Monthly = GROUP BY DATE_TRUNC('month', date_column)",
    "month": "Monthly = GROUP BY DATE_TRUNC('month', date_column)",
    "yearly": "Yearly = GROUP BY EXTRACT(YEAR)",
    "average": "Average = AVG(column)",
    "avg": "Average = AVG(column)",
    "count": "Count = COUNT(column)",
    "total": "Total = SUM(column)",
    "sum": "Total = SUM(column)",
    "top": "Top N = ORDER BY ... DESC LIMIT N",
    "highest": "Highest = MAX(column) or ORDER BY ... DESC LIMIT 1",
    "most": "Most = SUM(column) ORDER BY ... DESC",
    "bottom": "Bottom N = ORDER BY ... ASC LIMIT N",
    "lowest": "Lowest = MIN(column) or ORDER BY ... ASC LIMIT 1",
    "least": "Least = SUM(column) ORDER BY ... ASC",
    "best": "Best = ORDER BY derived_metric DESC LIMIT 1",
    "worst": "Worst = ORDER BY derived_metric ASC LIMIT 1",
    "region": "Region = JOIN with regions table, GROUP BY region name",
    "customer": "Customer = JOIN with customers table, GROUP BY customer",
    "product": "Product = JOIN with products table, GROUP BY product",
    "salesperson": "Salesperson = JOIN with sales_representatives, GROUP BY salesperson",
    "performance": "Performance = Derive using SUM, AVG, or COUNT",
    "percentage": "Percentage = (part / total) * 100",
}


def resolve_semantics(question: str) -> str:
    question_lower = question.lower()
    detected = []
    for keyword, mapping in SEMANTIC_MAP.items():
        if keyword in question_lower:
            mapping_str = f"  - \"{keyword}\" -> {mapping}"
            if mapping_str not in detected:
                detected.append(mapping_str)
    if not detected:
        return ""
    return "Semantic Resolver detected business terms:\n" + "\n".join(detected)
