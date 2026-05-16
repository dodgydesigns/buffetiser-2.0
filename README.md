# Buffetiser

A modern web application scaffold with:
- FastAPI backend using SQLModel and Alembic
- React frontend built with Vite
- Nginx reverse proxy serving static frontend assets
- Docker Compose configuration for development and production
- GitHub Actions CI with linting and tests

## Folder layout

- `backend/` — FastAPI application, models, Alembic, backend Dockerfile
- `frontend/` — React + TypeScript app, Vite, frontend Dockerfile, ESLint config
- `infra/` — Docker Compose manifests and Nginx service definitions
- `scripts/` — helper scripts for migrations and database setup

## Local development

1. Copy `infra/.env.example` to `infra/.env`
2. Copy `backend/.env.example` to `backend/.env`
3. Run:
   - `./install-local.sh`
4. Start the stack:
   - `docker compose -f infra/docker-compose.dev.yml up --build`

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000/api/v1`

## Single compose for the whole system

1. Copy `infra/.env.example` to `infra/.env`
2. Copy `backend/.env.example` to `backend/.env`
3. Run:
   - `docker compose up --build`

This root-level `docker-compose.yml` starts PostgreSQL, backend, and Nginx together.

## Production-ready static build flow

1. Copy `infra/.env.example` to `infra/.env`
2. Copy `backend/.env.example` to `backend/.env`
3. Run:
   - `docker compose -f infra/docker-compose.yml up --build`

The frontend is built into static assets by the `infra/nginx` image and served by Nginx on port `80`.

## Alembic migrations

Run migrations from the root with the helper script:

- Create a new revision:
  - `./scripts/db.sh revision --autogenerate -m "create users"`
- Apply migrations:
  - `./scripts/db.sh upgrade head`
- Roll back migrations:
  - `./scripts/db.sh downgrade -1`

## CI and linting

The repository includes GitHub Actions in `.github/workflows/ci.yml`.

### Backend
- `ruff` for linting
- `pytest` for tests

### Frontend
- `eslint` for TypeScript/React linting
- `npm run build` for verifying the Vite production build
