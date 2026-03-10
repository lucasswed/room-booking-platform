from sqlalchemy.orm import Session

from ..models import User
from ..repositories.user_repository import UserRepository
from ..security.passwords import hash_password


class UserService:
    def __init__(self, db: Session) -> None:
        self._users = UserRepository(db)

    def create_user(
        self,
        *,
        name: str,
        email: str,
        phone: str | None = None,
        password: str,
    ) -> User:
        password_hash = hash_password(password)
        return self._users.create(name=name, email=email, phone=phone, password_hash=password_hash)

    def get_user(self, user_id: int) -> User | None:
        return self._users.get(user_id)

    def list_users(self, *, limit: int = 100, offset: int = 0) -> list[User]:
        return self._users.list(limit=limit, offset=offset)

    def delete_user(self, user_id: int) -> None:
        self._users.delete(user_id)
