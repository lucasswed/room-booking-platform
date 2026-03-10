import sqlite3
from pathlib import Path

from .session import Base, engine


def _sqlite_db_path() -> Path | None:
    if engine.url.drivername != "sqlite":
        return None

    db = engine.url.database
    if not db or db == ":memory:":
        return None

    return Path(db)


def _table_exists(con: sqlite3.Connection, table: str) -> bool:
    row = con.execute(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name=?",
        (table,),
    ).fetchone()
    return row is not None


def _column_names(con: sqlite3.Connection, table: str) -> set[str]:
    cols = con.execute(f"PRAGMA table_info({table})").fetchall()
    return {c[1] for c in cols}


def _upgrade_sqlite_schema(db_path: Path) -> None:
    con = sqlite3.connect(str(db_path))
    try:
        # users
        if _table_exists(con, "users"):
            cols = _column_names(con, "users")
            if "password_hash" not in cols:
                con.execute("ALTER TABLE users ADD COLUMN password_hash VARCHAR NOT NULL DEFAULT ''")

        # rooms
        if _table_exists(con, "rooms"):
            cols = _column_names(con, "rooms")
            if "opening_hours" not in cols:
                con.execute("ALTER TABLE rooms ADD COLUMN opening_hours TIME")
            if "closing_hours" not in cols:
                con.execute("ALTER TABLE rooms ADD COLUMN closing_hours TIME")

        # bookings
        if _table_exists(con, "bookings"):
            cols = _column_names(con, "bookings")
            if "user_id" not in cols:
                # Keep nullable to avoid breaking existing rows; app will set it for new rows.
                con.execute("ALTER TABLE bookings ADD COLUMN user_id INTEGER")
            if "amount_of_people" not in cols:
                con.execute("ALTER TABLE bookings ADD COLUMN amount_of_people INTEGER NOT NULL DEFAULT 1")

        con.commit()
    finally:
        con.close()


def create_db_and_tables() -> None:
    # Ensure models are imported so they get registered with SQLAlchemy.
    from .. import models  # noqa: F401

    db_path = _sqlite_db_path()
    if db_path and db_path.exists():
        _upgrade_sqlite_schema(db_path)

    Base.metadata.create_all(bind=engine)
