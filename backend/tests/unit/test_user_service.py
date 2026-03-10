from sqlalchemy.orm import Session


def test_user_service_hashes_password(db_session: Session):
    # Import inside the test so it runs after fixtures (our integration tests
    # purge `src.*` modules to reload env/config, which can otherwise leave
    # stale SQLAlchemy metadata bound to old module objects).
    from src.services.user_service import UserService
    from sqlalchemy import text

    service = UserService(db_session)

    tables = [r[0] for r in db_session.execute(text("select name from sqlite_master where type='table' order by name")).fetchall()]
    assert "users" in tables

    user = service.create_user(name="Alice", email="alice@example.com", phone=None, password="pw123")
    # Avoid isinstance() here: other tests purge/re-import `src.*` modules,
    # which can produce multiple `User` class objects in-memory.
    assert getattr(user, "email") == "alice@example.com"
    assert getattr(user, "password_hash")
    assert getattr(user, "password_hash") != "pw123"
