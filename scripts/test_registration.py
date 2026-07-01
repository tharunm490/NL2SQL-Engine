"""Test registration flow end-to-end."""
import httpx
import asyncio
import json
import base64
import sys


async def main():
    base = "http://localhost:8000/api/v1"
    async with httpx.AsyncClient() as c:
        # Health
        r = await c.get(f"{base}/health")
        print(f"HEALTH: {r.status_code}")
        if r.status_code != 200:
            print("Server not ready")
            sys.exit(1)

        # Register analyst
        r = await c.post(
            f"{base}/auth/register",
            json={
                "username": "reg_test_analyst",
                "email": "analyst@regtest.com",
                "password": "Test1234!",
                "role": "analyst",
            },
        )
        if r.status_code == 201:
            print(f"REGISTER ANALYST: {r.status_code} role={r.json().get('role')}")
        else:
            print(f"REGISTER ANALYST: {r.status_code} {r.json()}")
            if r.status_code == 409:
                print("  (user already exists from previous run)")

        # Register admin
        r = await c.post(
            f"{base}/auth/register",
            json={
                "username": "reg_test_admin",
                "email": "admin@regtest.com",
                "password": "Test1234!",
                "role": "admin",
            },
        )
        if r.status_code == 201:
            print(f"REGISTER ADMIN: {r.status_code} role={r.json().get('role')}")
        else:
            print(f"REGISTER ADMIN: {r.status_code} {r.json()}")
            if r.status_code == 409:
                print("  (user already exists from previous run)")

        # Login as analyst - check JWT role
        r = await c.post(
            f"{base}/auth/login",
            json={"username": "reg_test_analyst", "password": "Test1234!"},
        )
        if r.status_code == 200:
            token = r.json()["access_token"]
            payload = token.split(".")[1]
            payload += "=" * (-len(payload) % 4)
            decoded = base64.urlsafe_b64decode(payload)
            data = json.loads(decoded)
            print(f"ANALYST LOGIN: 200 JWT role={data.get('role')}")
            assert (
                data.get("role") == "analyst"
            ), f"Expected analyst role, got {data.get('role')}"

            # Verify /auth/me returns correct role
            r = await c.get(
                f"{base}/auth/me",
                headers={"Authorization": f"Bearer {token}"},
            )
            if r.status_code == 200:
                print(f"AUTH ME: {r.status_code} role={r.json().get('role')}")
            else:
                print(f"AUTH ME FAILED: {r.status_code} {r.json()}")
        else:
            print(f"ANALYST LOGIN: {r.status_code} {r.json()}")

        # Login as admin - check JWT role
        r = await c.post(
            f"{base}/auth/login",
            json={"username": "reg_test_admin", "password": "Test1234!"},
        )
        if r.status_code == 200:
            token = r.json()["access_token"]
            payload = token.split(".")[1]
            payload += "=" * (-len(payload) % 4)
            decoded = base64.urlsafe_b64decode(payload)
            data = json.loads(decoded)
            print(f"ADMIN LOGIN: 200 JWT role={data.get('role')}")
            assert (
                data.get("role") == "admin"
            ), f"Expected admin role, got {data.get('role')}"

            # Admin can access admin-only endpoints
            r = await c.get(
                f"{base}/admin/users",
                headers={"Authorization": f"Bearer {token}"},
            )
            print(f"ADMIN LIST USERS: {r.status_code} (expect 200)")

            # Admin can assign permissions
            conns = r.json() if r.status_code == 200 else []
            if conns:
                print(f"  Found {len(conns)} users")
        else:
            print(f"ADMIN LOGIN: {r.status_code} {r.json()}")

        # Analyst cannot access admin endpoints
        r = await c.post(
            f"{base}/auth/login",
            json={"username": "reg_test_analyst", "password": "Test1234!"},
        )
        if r.status_code == 200:
            token = r.json()["access_token"]
            r = await c.get(
                f"{base}/admin/users",
                headers={"Authorization": f"Bearer {token}"},
            )
            print(f"ANALYST ADMIN ACCESS: {r.status_code} (expect 403)")

        # Test deny analyst self-registration flag
        print("\n--- ALLOW_ANALYST_SELF_REGISTRATION tests ---")
        register_again = await c.post(
            f"{base}/auth/register",
            json={
                "username": "reg_test_blocked",
                "email": "blocked@regtest.com",
                "password": "Test1234!",
                "role": "analyst",
            },
        )
        print(f"ANALYST REGISTER (normal): {register_again.status_code}")

        print("\n--- All tests completed ---")


asyncio.run(main())
