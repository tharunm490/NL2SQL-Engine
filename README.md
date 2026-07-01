<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/AI_SQL_Assistant-1e293b?style=for-the-badge&logo=postgresql&logoColor=white">
    <img alt="AI SQL Assistant" src="https://img.shields.io/badge/AI_SQL_Assistant-0ea5e9?style=for-the-badge&logo=postgresql&logoColor=white">
  </picture>
</p>

<p align="center">
  <b>Natural Language to SQL Generation with Intelligent Schema Understanding,<br>SQL Validation, ER Diagram Visualization, Redis Caching, and Multi-Database Support.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Redis_Stack-7.4-FF4438?logo=redis&logoColor=white" alt="Redis Stack">
  <img src="https://img.shields.io/badge/OpenAI_GPT-5.1-412991?logo=openai&logoColor=white" alt="OpenAI">
  <img src="https://img.shields.io/badge/License-MIT-yellow?logo=opensourceinitiative&logoColor=white" alt="License">
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Screenshots](#-screenshots)
- [Features](#-features)
- [System Architecture](#-system-architecture)
- [SQL Generation Pipeline](#-sql-generation-pipeline)
- [SQL Validation](#-sql-validation)
- [Redis Caching](#-redis-caching)
- [Supported Databases](#-supported-databases)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Usage Guide](#-usage-guide)
- [Example Queries](#-example-queries)
- [Security](#-security)
- [Performance Optimizations](#-performance-optimizations)
- [Future Enhancements](#-future-enhancements)
- [Contributors](#-contributors)
- [License](#-license)
- [Acknowledgements](#-acknowledgements)

---

## 🚀 Overview

AI SQL Assistant bridges the gap between natural language and database queries. Instead of writing complex SQL manually, users describe what they need in plain English, and the system automatically understands the database schema, generates accurate SQL using OpenAI's GPT models, validates it against the schema, executes it safely, and presents the results — all within a polished web interface.

**Target Users**

- **Data Analysts** who need to query databases without writing SQL
- **Engineering Teams** that want a self-service analytics layer
- **Organizations** managing multiple PostgreSQL databases across cloud providers
- **Students & Researchers** exploring database concepts through natural language

---

## 📸 Screenshots

> _Screenshots to be added. Below are the key application views._

| View | Description |
|------|-------------|
| **Dashboard** | Overview with total databases, healthy/offline counts, recent queries |
| **Database Connections** | CRUD table with connection status badges, test, schema viewer, edit, delete |
| **Natural Language Query** | Input box for English questions, SQL output, result table, error display |
| **Generated SQL** | Formatted SQL with copy and execute controls |
| **Results Table** | Paginated table with column headers, row count, execution time |
| **ER Diagram** | Full-screen interactive React Flow diagram with search, zoom, export |
| **User Management** | Admin-only user CRUD with role assignment and database permissions |
| **About Page** | Application information, version, and acknowledgements |
| **Audit Logs** | Admin-only filtered log of all system actions |

---

## ✨ Features

### 🔐 Authentication & Authorization

- User registration and login with JWT tokens
- Role-based access control (Admin / Analyst)
- Protected routes with automatic 401 redirect
- Token persistence and automatic refresh handling

### 👥 User Management

- Admin user CRUD (create, read, update, delete)
- Role assignment (admin / analyst)
- Account activation / deactivation
- Database permission assignment to analysts
- Bulk database assignment

### 🗄️ Database Connection Management

- Create, read, update, delete database connections
- Support for local and cloud PostgreSQL instances
- Password encryption with Fernet (cryptography)
- Connection testing with `SELECT 1` health check
- Batch status checking with 30-second polling
- Connection status display (Active / Inactive badges)

### 🤖 Natural Language to SQL

- OpenAI GPT-powered SQL generation (gpt-5.1-codex-mini)
- Mock provider for development/testing
- Intelligent prompt construction from database schema
- Business semantic layer for domain-specific terminology
- Relationship graph injection into prompts
- Automatic retry with error feedback (up to 3 attempts)

### ✅ SQL Validation

- AST parsing with SQLGlot (PostgreSQL dialect)
- Schema-aware validation (table and column existence)
- Alias resolution and validation
- Subquery alias validation
- CTE alias validation
- SELECT-only enforcement
- Blocked command detection (INSERT, UPDATE, DELETE, DROP, etc.)
- JOIN column ambiguity detection
- Detailed error messages for LLM correction

### 🎨 ER Diagram Visualization

- Interactive React Flow canvas
- Custom table nodes with column details
- Primary key and foreign key badges
- Relationship edges with cardinality labels (1:1, 1:N, N:M)
- Color-coded edges by relationship type
- Junction table detection (composite FK-only PKs)
- Node drag, zoom, pan, fit view
- Table search and auto-focus
- PNG and SVG export
- Dark/light theme support

### ⚡ Redis Caching

- Schema metadata cache (TTL: 1 hour)
- Connection status cache (TTL: 60 seconds)
- Frontend sessionStorage cache
- Graceful degradation when Redis is unavailable
- Cache invalidation on schema refresh
- Cache invalidation on connection delete
- Cache invalidation on logout
- Console logging for cache hits and misses

### 📊 Query History & Audit

- Per-user query history with pagination
- Search and filter by question, SQL, database
- Execution time and row count tracking
- Admin audit log with action filtering
- IP address logging
- Status tracking for all operations

### 🎨 UI / UX

- Responsive sidebar + navbar layout
- Dark and light theme with persistence
- Skeleton loading states
- Toast notifications
- Data tables with sort and filter
- Form validation with Zod + react-hook-form
- Role-gated views and actions

---

## 🏗️ System Architecture

The application runs in Docker with three containers:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │     │   Backend    │     │     Redis    │
│   (React)    │────▶│  (FastAPI)   │◀───▶│    Stack     │
│   Port 80    │     │   Port 8000  │     │  Cache Layer │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
                            ▼
                   ┌──────────────────┐
                   │   Supabase       │
                   │   PostgreSQL     │
                   │  (Cloud DB)      │
                   └──────────────────┘
```

### Components

| Container | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | React 19 + Vite + Nginx | SPA served via Nginx reverse proxy |
| **Backend** | FastAPI + Uvicorn | REST API, SQL generation, validation |
| **Redis Stack** | Redis Stack 7.4 | Schema cache, connection status cache, RedisInsight UI |
| **PostgreSQL** | Supabase (managed cloud) | Application database (users, connections, audit logs, query history) — **not running in Docker** |

### Redis Caching Flow

```mermaid
sequenceDiagram
    participant User as User / Frontend
    participant Cache as sessionStorage
    participant API as Backend API
    participant Redis as Redis Cache
    participant PG as PostgreSQL

    User->>Cache: Check sessionStorage
    alt Cache HIT
        Cache-->>User: Return cached schema
    else Cache MISS
        User->>API: Request schema
        API->>Redis: Check Redis cache
        alt Redis HIT
            Redis-->>API: Return cached schema
        else Redis MISS
            API->>PG: Extract metadata
            PG-->>API: Tables, columns, keys
            API->>Redis: Store schema (TTL: 3600s)
        end
        API-->>User: Return schema
        User->>Cache: Store in sessionStorage
    end
```

---

## 🔄 SQL Generation Pipeline

```mermaid
graph LR
    Q[User Question] --> BE[Backend API]
    BE --> SC[Schema Cache]
    SC --> Redis[(Redis)]
    SC --> PG[(PostgreSQL)]
    BE --> BP[Build Prompt]
    BP --> Sys["System Prompt | SQL Rules"]
    BP --> UserP["User Prompt | Schema + Question"]
    Sys --> LLM[OpenAI GPT]
    UserP --> LLM
    LLM --> SQL[Generated SQL]
    SQL --> V[SQL Validator]
    V -->|Valid| Ex[Execute SQL]
    V -->|Invalid| Retry["Error Feedback + Regenerate"]
    Retry --> LLM
    Ex --> Results[Return Results]
```

**Step-by-step breakdown:**

1. **User submits a question** in natural language through the React frontend.
2. **Backend resolves the schema** from Redis cache (or PostgreSQL on cache miss) via the `SchemaCacheService`.
3. **Prompt Builder** constructs a system prompt (SQL rules, business semantics) and a user prompt (formatted schema, relationship graph, semantic hints, question).
4. **OpenAI GPT** generates SQL based on the combined prompt.
5. **SQL Validator** parses the generated SQL with SQLGlot and validates against the actual schema — checking table existence, column existence, alias resolution, and blocking unsafe commands.
6. **On validation failure**, the error is fed back to the LLM for correction (up to 3 retries).
7. **On validation success**, the SQL is executed against the customer's PostgreSQL database.
8. **Results** are formatted, measured for execution time, and returned to the frontend along with query history recording.

---

## ✅ SQL Validation

Every generated SQL query passes through a multi-layered validation pipeline before execution:

### Validation Rules

| Check | Description |
|-------|-------------|
| **Syntax validation** | AST parsing with SQLGlot against PostgreSQL dialect |
| **SELECT-only** | Non-SELECT statements (INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, TRUNCATE, MERGE, GRANT, REVOKE) are rejected |
| **Table existence** | Every referenced table must exist in the connected database schema |
| **Column existence** | Every referenced column must exist in its respective table |
| **Alias resolution** | All table, CTE, and subquery aliases must be properly defined and resolved |
| **JOIN column ambiguity** | Columns in JOIN conditions must be unambiguous |
| **CTE validation** | Common Table Expressions are validated for proper alias usage |
| **Subquery validation** | Subquery aliases and column references are validated |

Invalid SQL is **rejected before execution** and the error message is used to guide the LLM in generating a corrected query. After up to 3 retry attempts, the final error is returned to the user with a human-readable explanation.

---

## ⚡ Redis Caching

AI SQL Assistant implements a **two-level caching strategy** to minimize database load and improve response times.

### Schema Cache

Caches the complete database metadata extracted from PostgreSQL.

| Property | Value |
|----------|-------|
| **Redis Key** | `schema:{database_id}` |
| **TTL** | 3600 seconds (1 hour) |
| **Storage** | JSON string |
| **Contents** | Tables, columns, data types, primary keys, foreign keys, relationships, views, indexes |

### Connection Status Cache

Caches the health status of database connections.

| Property | Value |
|----------|-------|
| **Redis Key** | `status:{database_id}` |
| **TTL** | 60 seconds |
| **Storage** | JSON string |
| **Contents** | `{ success, status, error, last_checked }` |

### Frontend Cache

A second layer using `sessionStorage` on the browser:

| Property | Value |
|----------|-------|
| **Storage** | `sessionStorage` |
| **Key Pattern** | `schema:{database_id}` |
| **Purpose** | Eliminates backend requests on page refresh and repeat visits |

### Graceful Degradation

If Redis is unavailable, the application **does not crash**. It logs a warning and reads metadata directly from PostgreSQL, ensuring uninterrupted operation.

---

## 🗄️ Supported Databases

Any PostgreSQL-compatible server can be connected.

| Database Platform | Status |
|------------------|--------|
| Local PostgreSQL 16 | ✅ Supported |
| AWS RDS PostgreSQL | ✅ Supported |
| Railway PostgreSQL | ✅ Supported |
| Neon PostgreSQL | ✅ Supported |
| Supabase PostgreSQL | ✅ Supported |
| Azure PostgreSQL | ✅ Supported |
| Google Cloud SQL for PostgreSQL | ✅ Supported |
| Any PostgreSQL-compatible host | ✅ Supported |

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19 | UI framework |
| TypeScript | 5 | Type safety |
| Vite | 6 | Build tool and dev server |
| Tailwind CSS | 4 | Utility-first styling |
| React Flow (xyflow) | 12 | ER diagram rendering |
| TanStack React Query | 5 | Server state management |
| Axios | 1 | HTTP client |
| React Router | 7 | Client-side routing |
| React Hook Form + Zod | - | Form validation |
| Framer Motion | 11 | Animations |
| Sonner | - | Toast notifications |
| html-to-image | - | PNG/SVG export |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.12 | Runtime |
| FastAPI | 0.115 | Web framework |
| Uvicorn | 0.34 | ASGI server |
| SQLAlchemy | 2.0 | ORM (async) |
| asyncpg | 0.30 | Async PostgreSQL driver |
| psycopg2-binary | 2.9 | Sync PostgreSQL driver |
| Alembic | 1.14 | Database migrations |
| Pydantic | 2.10 | Data validation / settings |
| OpenAI SDK | 1.59 | LLM integration |
| SQLGlot | 26 | SQL parser and validator |
| SQLParse | 0.5 | SQL formatter |
| Redis | 5.2 | Cache backend (async) |
| python-jose | 3.3 | JWT tokens |
| passlib + bcrypt | - | Password hashing |
| cryptography | 44 | Fernet encryption |

### Infrastructure

| Tool | Purpose |
|------|---------|
| Redis Stack | In-memory caching |
| Docker | Containerization |
| Git | Version control |

---

## 📁 Project Structure

```
ucube2/
├── .env                          # Environment configuration
├── .env.example                  # Environment template
├── requirements.txt              # Python dependencies
├── alembic.ini                   # Migration configuration
├── alembic/                      # Database migration scripts
│   └── versions/                 # Versioned migrations
│
├── app/                          # Backend application
│   ├── main.py                   # FastAPI entry point with lifespan
│   ├── api/                      # Route handlers
│   │   ├── admin.py              # Admin user management
│   │   ├── auth.py               # Authentication endpoints
│   │   ├── audit.py              # Audit log endpoints
│   │   ├── database_connections.py # Connection CRUD + batch status
│   │   ├── dependencies.py       # Auth dependencies
│   │   ├── health.py             # Health check
│   │   ├── history.py            # Query history
│   │   ├── permissions.py        # Database permissions
│   │   ├── query.py              # SQL generation + execution
│   │   └── schema.py             # Schema + ER diagram endpoints
│   ├── core/                     # Core infrastructure
│   │   ├── config.py             # Pydantic Settings
│   │   ├── database.py           # Async engine + session
│   │   ├── exceptions.py         # Custom exceptions + handler
│   │   └── logging.py            # Logging setup
│   ├── models/                   # SQLAlchemy ORM models
│   │   ├── audit_log.py
│   │   ├── database_connection.py
│   │   ├── database_permission.py
│   │   ├── query_history.py
│   │   ├── user.py
│   │   └── user_database_access.py
│   ├── prompts/                  # LLM prompt engineering
│   │   ├── builder.py            # Prompt construction
│   │   └── semantic_resolver.py  # Business semantics
│   ├── repositories/             # Data access layer
│   ├── schemas/                  # Pydantic request/response models
│   ├── services/                 # Business logic
│   │   ├── redis_client.py       # Singleton Redis connection
│   │   ├── schema_cache_service.py # Schema caching
│   │   ├── connection_status_cache_service.py # Status caching
│   │   ├── schema_discovery.py   # PostgreSQL metadata extraction
│   │   ├── schema_visualization.py # ER diagram generation
│   │   ├── llm.py                # LLM provider abstraction
│   │   ├── query_executor.py     # SQL execution
│   │   ├── validator.py          # SQL validation
│   │   ├── formatter.py          # Result formatting
│   │   └── ...                   # Other services
│   └── utils/
│       ├── encryption.py         # Fernet password encryption
│       └── security.py           # JWT + bcrypt utilities
│
├── frontend/                     # React frontend
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── src/
│       ├── main.tsx              # Entry point
│       ├── App.tsx               # Root component
│       ├── api/                  # API client functions
│       ├── components/           # Reusable components
│       │   ├── common/           # DataTable, ProtectedRoute, etc.
│       │   ├── layout/           # Sidebar, Navbar
│       │   ├── schema/           # SchemaViewer, SchemaNode, etc.
│       │   └── ui/               # Primitive UI components
│       ├── contexts/             # AuthContext, ThemeContext
│       ├── hooks/                # Custom hooks
│       ├── layouts/              # App layout shell
│       ├── pages/                # Route pages
│       ├── routes/               # React Router configuration
│       ├── types/                # TypeScript interfaces
│       └── utils/                # Utilities (cn, schemaCache)
│
└── tests/                        # Backend tests
    ├── seed_admin.py
    ├── test_queries.py
    ├── test_semantic_layer.py
    └── test_validator.py
```

---

## 📦 Installation

### Prerequisites

- Python 3.12+
- Node.js 20+
- Redis Stack 7.4+ (or Docker)
- Docker (recommended, for backend + Redis)
- A PostgreSQL 14+ instance (Supabase, Neon, AWS RDS, or local) — required for the application database

### Option A: Docker Compose (Recommended)

The fastest way to run the full stack:

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/ai-sql-assistant.git
cd ai-sql-assistant

# 2. Configure environment
cp .env.example .env
# Edit .env with your settings:
#   - DATABASE_URL / DATABASE_URL_SYNC → your PostgreSQL connection string
#   - OPENAI_API_KEY → your OpenAI key
#   - REDIS_HOST → redis (when using Docker) or localhost (for local dev)

# 3. Start all containers
docker compose up --build
```

The application is now accessible at `http://localhost` (frontend) with the API at `http://localhost:8000`.

### Option B: Local Development

#### 1. Backend Setup

```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your settings (database URL, OpenAI key, etc.)

# Run database migrations
alembic upgrade head

# Start the FastAPI server
uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

#### 3. Redis Setup (Docker)

```bash
docker run -d --name redis-stack \
  -p 6379:6379 \
  -p 8001:8001 \
  redis/redis-stack:latest
```

Redis Stack also provides a web UI at `http://localhost:8001` for monitoring.

#### 4. Database Setup

The application database can be any PostgreSQL 14+ instance (Supabase, Neon, AWS RDS, or local).

If using a local PostgreSQL:

```bash
createdb ai_sql_assistant
alembic upgrade head
```

If using a cloud provider (Supabase, Neon, etc.), set `DATABASE_URL` and `DATABASE_URL_SYNC` in `.env` to the provider's connection string, then run:

```bash
alembic upgrade head
```

The application will now be accessible at `http://localhost:5173` (frontend) with the backend at `http://localhost:8000`.

---

## 🔐 Environment Variables

Copy `.env.example` to `.env` and configure the following:

```env
# ==========================================
# Application
# ==========================================
APP_NAME=AI SQL Assistant
APP_VERSION=1.0.0
APP_DESCRIPTION=Enterprise AI SQL Assistant for PostgreSQL
ENVIRONMENT=development
DEBUG=true

# ==========================================
# Application PostgreSQL Database
# Can be any PostgreSQL 14+ provider.
# ==========================================
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/ai_sql_assistant
DATABASE_URL_SYNC=postgresql://postgres:password@localhost:5432/ai_sql_assistant

# ==========================================
# JWT Authentication
# ==========================================
SECRET_KEY=your-long-random-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# ==========================================
# Logging
# ==========================================
LOG_LEVEL=INFO
LOG_FORMAT=json

# ==========================================
# CORS
# ==========================================
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]

# ==========================================
# Encryption Key (for customer DB passwords)
# ==========================================
DB_ENCRYPTION_KEY=your-32-byte-encryption-key

# ==========================================
# LLM Configuration
# ==========================================
LLM_PROVIDER=openai
LLM_TEMPERATURE=0.1
LLM_MAX_TOKENS=1000

# ==========================================
# OpenAI Configuration
# ==========================================
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-5.1-codex-mini

# ==========================================
# Registration Configuration
# ==========================================
ALLOW_ANALYST_SELF_REGISTRATION=true

# ==========================================
# Redis Configuration
# When using Docker Compose, REDIS_HOST must be "redis".
# ==========================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=
REDIS_TTL_SCHEMA=3600
REDIS_TTL_STATUS=60
```

> ⚠️ Never commit the `.env` file to version control. It contains secrets.

---

## 💻 Usage Guide

### 1. Login / Register

- Navigate to `http://localhost:5173/login`
- Register a new account or log in with existing credentials
- The first registered user is assigned the **admin** role

### 2. Connect a Database

- Go to **Database Connections**
- Click **Add Database** (admin only)
- Enter connection details: name, host, port, database name, username, password
- Click **Test Connection** to verify
- Click **Create** to save

### 3. View Schema

- Click the grid icon (⧉) next to any database connection
- The ER Diagram opens as a full-screen interactive canvas
- Search tables, drag nodes, zoom, and export as PNG/SVG

### 4. Ask Questions

- Go to **Query** page
- Select a database from the dropdown
- Type a question in natural language (e.g., "Show me total sales by region last quarter")
- Click **Generate SQL** or type SQL directly
- Review the generated SQL, then click **Execute**
- View results in the paginated table

### 5. Query History

- Go to **Query History** to see past queries
- Search by question text, SQL, or database name
- Re-execute previous queries

### 6. User Management (Admin)

- Go to **Users** to manage accounts
- Create, edit, delete users
- Assign roles (admin / analyst)
- Grant or revoke database access

### 7. Audit Logs (Admin)

- Go to **Audit Logs** to monitor all system actions
- Filter by action type (query, connection, user, permission)

---

## 📝 Example Queries

Here are 20 sample natural language questions you can ask after connecting a database:

### Simple

1. "Show me all customers"
2. "List all products with their prices"
3. "How many orders were placed last month?"
4. "Show me the names of all employees"
5. "What is the total number of users?"

### Intermediate

6. "List the top 5 most expensive products"
7. "Show me orders placed in the last 7 days"
8. "How many customers are in each city?"
9. "Find all products that are out of stock"
10. "Show me the total sales for each product category"

### Aggregation & JOINs

11. "What is the total revenue by month for this year?"
12. "Show me the top 10 customers by total spending"
13. "List all orders with their customer names and order totals"
14. "What is the average order value per customer?"
15. "Show me the number of orders and total revenue by region"

### Advanced (Window Functions, Subqueries)

16. "Rank products by total sales within each category"
17. "Show me month-over-month revenue growth percentage"
18. "Find customers who haven't placed an order in the last 90 days"
19. "For each employee, show their salary and the department average"
20. "Show me the rolling 30-day total sales for each product"

---

## 🔒 Security

| Measure | Implementation |
|---------|---------------|
| **Password hashing** | bcrypt via passlib |
| **JWT authentication** | python-jose with HS256 |
| **Database password encryption** | Fernet symmetric encryption (cryptography) |
| **Role-based access** | Admin/Analyst roles with permission checks on every endpoint |
| **SQL validation** | Generated SQL is validated before execution; non-SELECT queries blocked |
| **Safe execution** | Read-only queries enforced; INSERT/UPDATE/DELETE/DROP rejected |
| **No data sent to LLM** | Only schema metadata (table names, column names, types, keys) is sent to OpenAI — no row values |
| **Redis fallback** | Application continues without Redis; degrades gracefully |
| **CORS** | Configurable allowed origins |
| **Error handling** | Structured exception handling; no stack traces leaked to clients |

---

## ⚙️ Performance Optimizations

| Optimization | Description |
|-------------|-------------|
| **Redis Schema Cache** | Database metadata cached for 1 hour, avoiding repeated PostgreSQL metadata queries |
| **Redis Status Cache** | Connection health cached for 60 seconds, reducing connection test overhead |
| **Frontend sessionStorage** | Schema cached in browser memory, eliminating backend requests on page refresh |
| **Async Database Pool** | SQLAlchemy async engine with connection pooling (pool_size=10, max_overflow=20) |
| **Sync Engine Disposal** | Customer database engines are created per-request and immediately disposed |
| **Thread Pool Execution** | Synchronous schema extraction runs in a thread pool to avoid blocking the async event loop |
| **Graceful Degradation** | Redis failures fall back to direct PostgreSQL reads without service interruption |

---

## 🔮 Future Enhancements

- [ ] MySQL, Microsoft SQL Server, Oracle, SQLite support
- [ ] Multi-turn conversation memory with context retention
- [ ] Query explanation in plain English
- [ ] SQL optimization suggestions and index recommendations
- [ ] Built-in charts and data visualization (bar, line, pie)
- [ ] CSV, Excel, and PDF export for query results
- [ ] Multi-agent SQL generation with parallel candidates
- [ ] Streaming SQL generation responses
- [ ] Database schema diff and migration suggestions
- [ ] Team workspaces and collaborative queries
- [ ] Scheduled query execution and reporting

---


## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2025 Tharun M

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 🙏 Acknowledgements

- [OpenAI](https://openai.com/) — LLM-powered SQL generation
- [Redis](https://redis.io/) — In-memory caching
- [FastAPI](https://fastapi.tiangolo.com/) — High-performance async Python framework
- [React](https://react.dev/) — UI component library
- [SQLGlot](https://sqlglot.com/) — SQL parser and validator
- [PostgreSQL](https://www.postgresql.org/) — Relational database
- [Amazon RDS](https://aws.amazon.com/rds/) — Cloud database hosting
- [Docker](https://www.docker.com/) — Containerization
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS framework
- [xyflow / React Flow](https://xyflow.com/) — Interactive node-based UI
- [TanStack Query](https://tanstack.com/query) — Server state management
- [Vite](https://vitejs.dev/) — Frontend build tool

---


