from sqlalchemy import select
from sqlalchemy.orm import Session

from src.models.user import User



class UserRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def create(self, *, name: str, email: str, password: str) -> User:
        user = User(name=name, email=email, password=password)
        self._db.add(user)
        self._db.commit()
        self._db.refresh(user)
        return user

    def get(self, user_id: int) -> User | None:
        return self._db.get(User, user_id)

    def list(self, *, limit: int = 100, offset: int = 0) -> list[User]:
        stmt = select(User).offset(offset).limit(limit)
        return list(self._db.execute(stmt).scalars().all())

    def delete(self, user_id: int) -> None:
        user = self.get(user_id)
        if user:
            self._db.delete(user)
            self._db.commit()

    def get_by_email(self, email: str) -> User | None:
        stmt = select(User).where(User.email == email)
        return self._db.execute(stmt).scalar_one_or_none()
    
    def update(self, user_id: int, **kwargs) -> User | None:
        user = self.get(user_id)
        if not user:
            return None
        
        for key, value in kwargs.items():
            if hasattr(user, key):
                setattr(user, key, value)
        
        self._db.commit()
        self._db.refresh(user)
        return user