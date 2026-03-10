from .rooms import router as rooms_router
from .bookings import router as bookings_router
from .users import router as users_router
from .auth import router as auth_router

__all__ = ["rooms_router", "bookings_router", "users_router", "auth_router"]
