# room-booking-platform

Full-stack room booking app with:

- FastAPI backend (SQLite + SQLAlchemy + JWT auth)
- Next.js frontend (App Router + TypeScript)

## Project structure

- `backend/`: API, data models, business logic, and tests
- `frontend/`: Web client and Next.js API routes used as frontend-facing proxies

## Requirements

- Python 3.10+
- Node.js 20+

## Quick start

Open two terminals at the repository root.

1. Start backend

```powershell
pip install -r backend/requirements.txt
uvicorn main:app --app-dir backend/src --reload
```

Backend runs at `http://127.0.0.1:8000`.

2. Start frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`.

## Environment variables

### Backend

- `ROOM_BOOKING_DB_PATH`: Optional SQLite file path override
	- Default: `backend/room_booking.sqlite3`
- `DATABASE_URL`: Optional full SQLAlchemy connection string
	- If set, it overrides `ROOM_BOOKING_DB_PATH`
- `SECRET_KEY`: JWT signing key
	- Default: `dev-secret-change-me` (change for non-local use)
- `ALGORITHM`: JWT algorithm
	- Default: `HS256`
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Access token TTL in minutes
	- Default: `60`

### Frontend

- `BACKEND_API_URL`: Backend base URL used by Next.js API routes
	- Default: `http://127.0.0.1:8000`

Example (`frontend/.env.local`):

```bash
BACKEND_API_URL=http://127.0.0.1:8000
```

## Database notes

- Tables are created automatically on backend startup.
- Existing SQLite databases are upgraded in place for supported schema changes.
- Two SQLite files may appear in this repo: one at root and one at `backend/`.
	- The active file depends on your environment variables and backend working directory.

## API summary

Base URL: `http://127.0.0.1:8000`

- `POST /users/`: create user account
- `POST /auth/login`: get bearer token
- `GET/POST /rooms/`: list/create rooms (auth required)
- `GET /rooms/{room_id}` and `DELETE /rooms/{room_id}` (auth required)
- `POST /bookings/`: create booking (auth required)
- `GET /bookings/user/{user_id}`: list user bookings (auth required)
- `GET /bookings/room/{room_id}`: list room bookings (auth required)
- `GET /bookings/{booking_id}` and `DELETE /bookings/{booking_id}` (auth required)

Interactive docs are available at:

- `http://127.0.0.1:8000/docs`
- `http://127.0.0.1:8000/redoc`

## Run tests

From repo root:

```powershell
pip install -r backend/requirements.txt
pip install -r backend/requirements-dev.txt
python -m pytest -c backend/pytest.ini
```

Test suites include unit, integration, and e2e tests under `backend/tests/`.