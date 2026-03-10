from datetime import time

from sqlalchemy.orm import Session

from ..models import Room
from ..repositories.room_repository import RoomRepository


class RoomService:
    def __init__(self, db: Session) -> None:
        self._rooms = RoomRepository(db)

    def create_room(
        self,
        *,
        name: str,
        capacity: int = 1,
        opening_hours: time | None = None,
        closing_hours: time | None = None,
    ) -> Room:
        return self._rooms.create(
            name=name,
            capacity=capacity,
            opening_hours=opening_hours,
            closing_hours=closing_hours,
        )

    def get_room(self, room_id: int) -> Room | None:
        return self._rooms.get(room_id)

    def list_rooms(self, *, limit: int = 100, offset: int = 0) -> list[Room]:
        return self._rooms.list(limit=limit, offset=offset)

    def delete_room(self, room_id: int) -> None:
        self._rooms.delete(room_id)
