# FastAPI Backend Scaffold

This service replaces Supabase incrementally using a domain-first API.

## Included now

- JWT auth login endpoint
- One-time bootstrap endpoint to create first admin user
- Role-based permission checks
- PostgreSQL models and Alembic migration for users, inventory, orders, and audit logs
- Order processing with transaction-safe inventory deduction using row-level locking
- Audit logs persisted on order create and status updates
- Notification queue endpoint (placeholder)
- Report queue endpoint for PDF/XLSX (placeholder)

## Quick start

1. Create a virtual environment and install deps:

   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt

2. Copy environment variables:

   cp .env.example .env

3. Run the API:

   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

4. Apply migrations:

   alembic upgrade head

5. Bootstrap first admin and capture token:

   curl -X POST http://localhost:8000/api/v1/auth/bootstrap \
     -H "Content-Type: application/json" \
     -d '{"email":"manager@westkenya.local","full_name":"System Manager","password":"ChangeMe123","role":"manager"}'

6. Test:

   pytest -q

## Initial routes

- GET /health
- GET /api/v1/health
- POST /api/v1/auth/bootstrap
- POST /api/v1/auth/login
- GET /api/v1/orders
- GET /api/v1/orders/lookups/customers
- GET /api/v1/orders/lookups/depots
- GET /api/v1/orders/lookups/products
- POST /api/v1/orders
- PATCH /api/v1/orders/{order_id}/status
- POST /api/v1/notifications
- POST /api/v1/reports

## Frontend orders cutover setup

The Orders page now consumes this API via a typed client.

Set one of these in frontend runtime:

- localStorage key api_access_token (preferred during dev)
- VITE_API_ACCESS_TOKEN in frontend env file

Set API base URL in frontend env if needed:

- VITE_API_BASE_URL=http://localhost:8000/api/v1

## Phase-2 implementation targets

- Replace in-memory users and stock with PostgreSQL models
- Add transactional order + inventory writes with row-level locking
- Persist audit logs to append-only table
- Integrate Celery/Dramatiq + Redis workers
- Implement real PDF/XLSX generation + object storage signed links
