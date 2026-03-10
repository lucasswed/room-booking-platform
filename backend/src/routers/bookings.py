from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from ..db.deps import get_db
from ..security.auth import get_current_user
from ..services.booking_service import BookingService

router = APIRouter(prefix="/bookings", tags=["bookings"], dependencies=[Depends(get_current_user)])


class BookingCreate(BaseModel):
    room_id: int
    user_id: int
    title: str
    amount_of_people: int = 1
    start_time: datetime
    end_time: datetime


class BookingRead(BaseModel):
    id: int
    room_id: int
    user_id: int
    title: str
    amount_of_people: int
    start_time: datetime
    end_time: datetime
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


@router.post("/", response_model=BookingRead)
def create_booking(payload: BookingCreate, db: Session = Depends(get_db)) -> BookingRead:
    service = BookingService(db)
    booking = service.create_booking(
        room_id=payload.room_id,
        user_id=payload.user_id,
        title=payload.title,
        amount_of_people=payload.amount_of_people,
        start_time=payload.start_time,
        end_time=payload.end_time,
    )
    return BookingRead.model_validate(booking)


@router.get("/{booking_id}", response_model=BookingRead)
def get_booking(booking_id: int, db: Session = Depends(get_db)) -> BookingRead:
    service = BookingService(db)
    booking = service.get_booking(booking_id)
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")
    return BookingRead.model_validate(booking)


@router.get("/room/{room_id}", response_model=list[BookingRead])
def list_bookings_for_room(room_id: int, limit: int = 100, offset: int = 0, db: Session = Depends(get_db)) -> list[BookingRead]:
    service = BookingService(db)
    bookings = service.list_bookings_for_room(room_id=room_id, limit=limit, offset=offset)
    return [BookingRead.model_validate(booking) for booking in bookings]


@router.get("/user/{user_id}", response_model=list[BookingRead])
def list_bookings_for_user(user_id: int, limit: int = 100, offset: int = 0, db: Session = Depends(get_db)) -> list[BookingRead]:
    service = BookingService(db)
    bookings = service.list_bookings_for_user(user_id=user_id, limit=limit, offset=offset)
    return [BookingRead.model_validate(booking) for booking in bookings]


@router.delete("/{booking_id}")
def delete_booking(booking_id: int, db: Session = Depends(get_db)) -> dict:
    service = BookingService(db)
    service.delete_booking(booking_id)
    return {"ok": True}
