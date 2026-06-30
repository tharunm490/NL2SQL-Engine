import urllib.request
import urllib.parse
import json
import sys


BASE_URL = "http://localhost:8000/api/v1"

TEST_QUERIES = [
    "List all customers.",
    "Show total sales by region.",
    "Show the top 5 customers by revenue.",
    "Show the top 5 products by revenue.",
    "Find customers who have never placed an order.",
    "Show average order value.",
    "Show monthly revenue.",
    "Show quarterly revenue.",
    "Show yearly revenue.",
    "Show revenue by sales representative.",
    "Find the salesperson with the highest revenue in every region.",
    "Compare this year's revenue with last year's revenue.",
    "Show sales target achievement percentage.",
]


def _request(method, path, token=None, body=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        try:
            return json.loads(error_body)
        except json.JSONDecodeError:
            return {"status": "error", "error": error_body}
    except Exception as e:
        return {"status": "error", "error": str(e)}


def login(username, password):
    result = _request("POST", "/auth/login", body={
        "username": username,
        "password": password,
    })
    if "access_token" not in result:
        print(f"Login failed: {result}")
        sys.exit(1)
    return result["access_token"]


def get_databases(token):
    return _request("GET", "/me/databases", token=token)


def execute_query(token, db_id, question):
    return _request("POST", "/query/execute", token=token, body={
        "database_connection_id": str(db_id),
        "question": question,
    })


def main():
    if len(sys.argv) < 3:
        print("Usage: python test_queries.py <username> <password>")
        sys.exit(1)

    username = sys.argv[1]
    password = sys.argv[2]

    print(f"Logging in as {username}...")
    token = login(username, password)
    print("Login successful.")

    print("Getting databases...")
    databases = get_databases(token)
    if not databases:
        print("No databases assigned!")
        sys.exit(1)

    print(f"Found {len(databases)} database(s):")
    for db in databases:
        print(f"  - {db.get('name', 'Unknown')} (ID: {db['id']})")

    all_passed = True
    all_results = []

    for db in databases:
        db_id = db["id"]
        db_name = db.get("name", "Unknown")
        print(f"\n{'='*60}")
        print(f"Testing on database: {db_name}")
        print(f"{'='*60}")

        for i, query_text in enumerate(TEST_QUERIES, 1):
            print(f"\nQuery {i}: {query_text}")
            print("-" * 40)

            try:
                result = execute_query(token, db_id, query_text)
                attempts = result.get("correction_attempts", 0)

                if result.get("status") == "success":
                    print(f"  Status:   SUCCESS")
                    print(f"  Rows:     {result.get('row_count', 0)}")
                    print(f"  Columns:  {', '.join(result.get('column_names', []))}")
                    print(f"  Time:     {result.get('execution_time', 0)}s")
                    if attempts > 0:
                        print(f"  Retries:  {attempts}")
                    if result.get("sql"):
                        sql_preview = result["sql"][:150]
                        print(f"  SQL:      {sql_preview}...")
                    all_results.append({
                        "query": query_text,
                        "status": "success",
                        "rows": result.get('row_count', 0),
                        "columns": result.get('column_names', []),
                        "attempts": attempts,
                        "sql": (result.get('sql') or '')[:200],
                    })
                else:
                    all_passed = False
                    friendly = result.get("friendly_error") or ""
                    error = result.get("error") or result.get("detail") or "Unknown error"
                    print(f"  Status:   FAILED")
                    print(f"  Error:    {str(error)[:200]}")
                    if friendly:
                        print(f"  Friendly: {friendly}")
                    if result.get("sql"):
                        print(f"  SQL:      {result['sql'][:200]}")
                    if attempts > 0:
                        print(f"  Retries:  {attempts}")
                    all_results.append({
                        "query": query_text,
                        "status": "failed",
                        "error": str(error)[:200],
                        "friendly_error": friendly,
                        "attempts": attempts,
                        "sql": (result.get('sql') or '')[:200],
                    })

            except Exception as e:
                all_passed = False
                print(f"  Exception: {e}")
                all_results.append({
                    "query": query_text,
                    "status": "exception",
                    "error": str(e),
                })

    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    for r in all_results:
        status_symbol = "PASS" if r["status"] == "success" else "FAIL"
        print(f"  [{status_symbol}] {r['query']}")
        if r["status"] == "success":
            print(f"         {r['rows']} rows, {r['attempts']} retries")

    print(f"\n{'='*60}")
    if all_passed:
        print(f"ALL {len(TEST_QUERIES)} QUERIES PASSED")
    else:
        print("SOME QUERIES FAILED")

    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    main()
