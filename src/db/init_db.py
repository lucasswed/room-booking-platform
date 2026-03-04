from .session import Base, engine


def create_db_and_tables() -> None:
    # Ensure models are imported so they get registered with SQLAlchemy.
    from .. import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
