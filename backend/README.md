# FastAPI Backend Scaffold

This service replaces Supabase incrementally using a domain-first API.

## Included now

- JWT auth login endpoint
- Role-based permission checks
- Order processing with inventory deduction validation
- Audit event shape for write operations
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

4. Test:

   pytest -q

## Initial routes

- GET /health
- GET /api/v1/health
- POST /api/v1/auth/login
- POST /api/v1/orders
- POST /api/v1/notifications
- POST /api/v1/reports

## Phase-2 implementation targets

- Replace in-memory users and stock with PostgreSQL models
- Add transactional order + inventory writes with row-level locking
- Persist audit logs to append-only table
- Integrate Celery/Dramatiq + Redis workers
- Implement real PDF/XLSX generation + object storage signed links
