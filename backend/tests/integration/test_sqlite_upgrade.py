import os
import sqlite3
import sys
from pathlib import Path


def _purge(prefix: str) -> None:
    for name in list(sys.modules.keys()):
        if name == prefix or name.startswith(prefix + "."):
            sys.modules.pop(name, None)


def test_sqlite_schema_upgrade_adds_missing_columns(tmp_path: Path):
    db_path = tmp_path / "old.sqlite3"

    con = sqlite3.connect(str(db_path))
    try:
        con.executescript(
            """
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR NOT NULL,
                email VARCHAR NOT NULL,
                phone VARCHAR,
                created_at DATETIME NOT NULL
            );

            CREATE TABLE rooms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                capacity INTEGER NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                room_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            """
        )
        con.commit()
    finally:
        con.close()

    os.environ["ROOM_BOOKING_DB_PATH"] = str(db_path)
    os.environ.pop("DATABASE_URL", None)

    _purge("src.db")
    _purge("src.models")

    from src.db.init_db import create_db_and_tables  # noqa: WPS433

    create_db_and_tables()

    con = sqlite3.connect(str(db_path))
    try:
        users_cols = {c[1] for c in con.execute("PRAGMA table_info(users)").fetchall()}
        rooms_cols = {c[1] for c in con.execute("PRAGMA table_info(rooms)").fetchall()}
        bookings_cols = {c[1] for c in con.execute("PRAGMA table_info(bookings)").fetchall()}

        assert "password_hash" in users_cols
        assert "opening_hours" in rooms_cols
        assert "closing_hours" in rooms_cols
        assert "user_id" in bookings_cols
        assert "amount_of_people" in bookings_cols
    finally:
        con.close()
