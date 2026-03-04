# room-booking-platform

## SQLite database

This project uses SQLite via SQLAlchemy.

- Default DB file: `room_booking.sqlite3` (created at the project root)
- Override location with: `ROOM_BOOKING_DB_PATH`

Example (PowerShell):

```powershell
$env:ROOM_BOOKING_DB_PATH = "$PWD\data\room_booking.sqlite3"
uvicorn main:app --app-dir src --reload
```

On startup, the app will create the DB file and initialize the schema (tables like `rooms` and `bookings`).

## Install deps

```powershell
pip install -r requirements.txt
```