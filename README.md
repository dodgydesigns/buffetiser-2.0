# Buffetiser

A modern web application scaffold with:
- FastAPI backend using SQLModel and Alembic
- React frontend built with Vite
- Nginx reverse proxy serving static frontend assets
- Docker Compose configuration for development and production
- GitHub Actions CI with linting and tests

## Folder layout

- `backend/` — FastAPI application, models, Alembic, backend Dockerfile
- `frontend/` — React app plus its production Nginx configuration
- `docker-compose.yml` — PostgreSQL, backend, and frontend services
- `scripts/` — helper scripts for migrations and database setup

## Run the application

1. Copy `backend/.env.example` to `backend/.env`.
2. Start the stack:

   ```sh
   docker compose up --build
   ```

Open `http://localhost`.

Nginx serves the frontend on port `80` and proxies `/api/*` requests to the
internal FastAPI service. Alembic migrations run automatically when the backend
starts.

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
