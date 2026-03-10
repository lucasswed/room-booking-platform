from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from ..db.deps import get_db
from ..security.auth import get_current_user
from ..services.user_service import UserService

router = APIRouter(prefix="/users", tags=["users"])


class UserCreate(BaseModel):
    name: str
    email: str
    phone: str | None = None
    password: str


class UserRead(BaseModel):
    id: int
    name: str
    email: str
    phone: str | None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


@router.post("/", response_model=UserRead)
def create_user(payload: UserCreate, db: Session = Depends(get_db)) -> UserRead:
    service = UserService(db)
    user = service.create_user(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        password=payload.password,
    )
    return UserRead.model_validate(user)


@router.get("/{user_id}", response_model=UserRead)
def get_user(user_id: int, db: Session = Depends(get_db), _: object = Depends(get_current_user)) -> UserRead:
    service = UserService(db)
    user = service.get_user(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return UserRead.model_validate(user)


@router.get("/", response_model=list[UserRead])
def list_users(limit: int = 100, offset: int = 0, db: Session = Depends(get_db), _: object = Depends(get_current_user)) -> list[UserRead]:
    service = UserService(db)
    users = service.list_users(limit=limit, offset=offset)
    return [UserRead.model_validate(user) for user in users]


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), _: object = Depends(get_current_user)) -> dict:
    service = UserService(db)
    service.delete_user(user_id)
    return {"ok": True}
