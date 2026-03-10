from datetime import datetime

from sqlalchemy.orm import Session

from ..models import Booking
from ..repositories.booking_repository import BookingRepository


class BookingService:
    def __init__(self, db: Session) -> None:
        self._bookings = BookingRepository(db)

    def create_booking(
        self,
        *,
        room_id: int,
        user_id: int,
        title: str,
        amount_of_people: int,
        start_time: datetime,
        end_time: datetime,
    ) -> Booking:
        return self._bookings.create(
            room_id=room_id,
            user_id=user_id,
            title=title,
            amount_of_people=amount_of_people,
            start_time=start_time,
            end_time=end_time,
        )

    def get_booking(self, booking_id: int) -> Booking | None:
        return self._bookings.get(booking_id)

    def list_bookings_for_room(self, *, room_id: int, limit: int = 100, offset: int = 0) -> list[Booking]:
        return self._bookings.list_for_room(room_id=room_id, limit=limit, offset=offset)

    def list_bookings_for_user(self, *, user_id: int, limit: int = 100, offset: int = 0) -> list[Booking]:
        return self._bookings.list_for_user(user_id=user_id, limit=limit, offset=offset)

    def delete_booking(self, booking_id: int) -> None:
        self._bookings.delete(booking_id)

    def update_booking(self, booking_id: int, **kwargs) -> Booking | None:
        return self._bookings.update(booking_id, **kwargs)
