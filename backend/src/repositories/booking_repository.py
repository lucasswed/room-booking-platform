from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Booking


class BookingRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def create(
        self,
        *,
        room_id: int,
        user_id: int,
        title: str,
        amount_of_people: int = 1,
        start_time: datetime,
        end_time: datetime,
    ) -> Booking:
        booking = Booking(
            room_id=room_id,
            user_id=user_id,
            title=title,
            amount_of_people=amount_of_people,
            start_time=start_time,
            end_time=end_time,
        )
        self._db.add(booking)
        self._db.commit()
        self._db.refresh(booking)
        return booking

    def get(self, booking_id: int) -> Booking | None:
        return self._db.get(Booking, booking_id)

    def list_for_room(self, *, room_id: int, limit: int = 100, offset: int = 0) -> list[Booking]:
        stmt = select(Booking).where(Booking.room_id == room_id).offset(offset).limit(limit)
        return list(self._db.execute(stmt).scalars().all())
    
    def delete(self, booking_id: int) -> None:
        booking = self.get(booking_id)
        if booking:
            self._db.delete(booking)
            self._db.commit()
    
    def list_for_user(self, *, user_id: int, limit: int = 100, offset: int = 0) -> list[Booking]:
        stmt = select(Booking).where(Booking.user_id == user_id).offset(offset).limit(limit)
        return list(self._db.execute(stmt).scalars().all())
    
    def update(self, booking_id: int, **kwargs) -> Booking | None:
        booking = self.get(booking_id)
        if not booking:
            return None
        
        for key, value in kwargs.items():
            if hasattr(booking, key):
                setattr(booking, key, value)
        
        self._db.commit()
        self._db.refresh(booking)
        return booking
