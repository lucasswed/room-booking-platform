import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker


def _default_db_path() -> Path:
    project_root = Path(__file__).resolve().parents[2]
    return project_root / "room_booking.sqlite3"


def _sqlite_url(db_path: Path) -> str:
    resolved = db_path.expanduser().resolve()
    return f"sqlite:///{resolved.as_posix()}"


DB_PATH = Path(os.getenv("ROOM_BOOKING_DB_PATH", str(_default_db_path())))
DATABASE_URL = os.getenv("DATABASE_URL", _sqlite_url(DB_PATH))


engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass
