from datetime import time

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Room


class RoomRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def create(
        self,
        *,
        name: str,
        capacity: int = 1,
        opening_hours: time | None = None,
        closing_hours: time | None = None,
    ) -> Room:
        room = Room(name=name, capacity=capacity, opening_hours=opening_hours, closing_hours=closing_hours)
        self._db.add(room)
        self._db.commit()
        self._db.refresh(room)
        return room

    def get(self, room_id: int) -> Room | None:
        return self._db.get(Room, room_id)

    def list(self, *, limit: int = 100, offset: int = 0) -> list[Room]:
        stmt = select(Room).offset(offset).limit(limit)
        return list(self._db.execute(stmt).scalars().all())

    def delete(self, room_id: int) -> None:
        room = self.get(room_id)
        if room:
            self._db.delete(room)
            self._db.commit()
