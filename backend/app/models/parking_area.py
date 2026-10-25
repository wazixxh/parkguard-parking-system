from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


class ParkingArea(Base):
    __tablename__ = "parking_areas"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    total_capacity = Column(Integer, nullable=False, default=50)
    occupied_count = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    vehicles = relationship("Vehicle", back_populates="parking_area")
    transactions = relationship("ParkingTransaction", back_populates="parking_area")
