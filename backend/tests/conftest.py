import os
import sys
import importlib
from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker


BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


def _purge_modules(prefixes: tuple[str, ...]) -> None:
    for name in list(sys.modules.keys()):
        if any(name == p or name.startswith(p + ".") for p in prefixes):
            sys.modules.pop(name, None)


@pytest.fixture()
def client(tmp_path: Path) -> Iterator[TestClient]:
    # Isolate each test run to its own sqlite file.
    db_path = tmp_path / "test.sqlite3"

    os.environ["ROOM_BOOKING_DB_PATH"] = str(db_path)
    os.environ.pop("DATABASE_URL", None)

    # Ensure env vars are read fresh (engine is created at import time).
    _purge_modules(("src.db", "src.models", "src.repositories", "src.services", "src.routers", "src.security", "src.main"))

    # Import app after env setup.
    from src.main import app  # noqa: WPS433

    with TestClient(app) as c:
        yield c


@pytest.fixture()
def db_session(tmp_path: Path) -> Iterator[Session]:
    # Unit-test DB: isolated sqlite file per test (avoids sqlite :memory: connection pitfalls).
    db_path = tmp_path / "unit.sqlite3"
    engine = create_engine(
        f"sqlite+pysqlite:///{db_path.as_posix()}",
        connect_args={"check_same_thread": False},
    )

    # Ensure models are registered.
    from src.db.session import Base  # noqa: WPS433
    importlib.import_module("src.models")

    Base.metadata.create_all(bind=engine)
    LocalSession = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)

    db = LocalSession()
    try:
        yield db
    finally:
        db.close()


def auth_headers(client: TestClient, *, email: str = "alice@example.com", password: str = "pw123") -> dict[str, str]:
    # Public signup
    client.post(
        "/users/",
        json={"name": "Alice", "email": email, "phone": None, "password": password},
    )

    # OAuth2 login form: username=email
    resp = client.post("/auth/login", data={"username": email, "password": password})
    assert resp.status_code == 200, resp.text
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
