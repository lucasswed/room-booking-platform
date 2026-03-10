from datetime import datetime, time

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from ..db.deps import get_db
from ..security.auth import get_current_user
from ..services.room_service import RoomService

router = APIRouter(prefix="/rooms", tags=["rooms"], dependencies=[Depends(get_current_user)])


class RoomCreate(BaseModel):
    name: str
    capacity: int = 1
    opening_hours: time | None = None
    closing_hours: time | None = None


class RoomRead(BaseModel):
    id: int
    name: str
    capacity: int
    opening_hours: time | None
    closing_hours: time | None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


@router.post("/", response_model=RoomRead)
def create_room(payload: RoomCreate, db: Session = Depends(get_db)) -> RoomRead:
    service = RoomService(db)
    room = service.create_room(
        name=payload.name,
        capacity=payload.capacity,
        opening_hours=payload.opening_hours,
        closing_hours=payload.closing_hours,
    )
    return RoomRead.model_validate(room)


@router.get("/{room_id}", response_model=RoomRead)
def get_room(room_id: int, db: Session = Depends(get_db)) -> RoomRead:
    service = RoomService(db)
    room = service.get_room(room_id)
    if room is None:
        raise HTTPException(status_code=404, detail="Room not found")
    return RoomRead.model_validate(room)


@router.get("/", response_model=list[RoomRead])
def list_rooms(limit: int = 100, offset: int = 0, db: Session = Depends(get_db)) -> list[RoomRead]:
    service = RoomService(db)
    rooms = service.list_rooms(limit=limit, offset=offset)
    return [RoomRead.model_validate(room) for room in rooms]


@router.delete("/{room_id}")
def delete_room(room_id: int, db: Session = Depends(get_db)) -> dict:
    service = RoomService(db)
    service.delete_room(room_id)
    return {"ok": True}
