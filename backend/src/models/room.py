from __future__ import annotations

from ..db.session import Base
from typing import TYPE_CHECKING
from datetime import datetime, time, timezone
from sqlalchemy import DateTime, Integer, String, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship


if TYPE_CHECKING:
    from .booking import Booking


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Room(Base):
    __tablename__ = "rooms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    opening_hours: Mapped[time | None] = mapped_column(Time, nullable=True)
    closing_hours: Mapped[time | None] = mapped_column(Time, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utc_now)

    bookings: Mapped[list["Booking"]] = relationship(
        back_populates="room",
        cascade="all, delete-orphan",
    )
