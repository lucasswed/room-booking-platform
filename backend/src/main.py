from contextlib import asynccontextmanager

from fastapi import FastAPI

try:
    # When imported as a package module (e.g., `uvicorn src.main:app`).
    from .db.init_db import create_db_and_tables
    from .routers import auth_router, bookings_router, rooms_router, users_router
except ImportError:  # pragma: no cover
    # When run with `uvicorn main:app --app-dir src`.
    from db.init_db import create_db_and_tables
    from routers import auth_router, bookings_router, rooms_router, users_router

@asynccontextmanager
async def lifespan(_: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(lifespan=lifespan)

app.include_router(rooms_router)
app.include_router(bookings_router)
app.include_router(users_router)
app.include_router(auth_router)


@app.get("/")
def read_root():
    return {"Hello": "World"}