from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.session import Base

if TYPE_CHECKING:
    from .booking import Booking


class Room(Base):
    __tablename__ = "rooms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    opening_hours: Mapped[str] = mapped_column(String, nullable=True)
    closing_hours: Mapped[str] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    bookings: Mapped[list["Booking"]] = relationship(
        back_populates="room",
        cascade="all, delete-orphan",
    )
