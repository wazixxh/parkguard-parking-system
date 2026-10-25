from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(String(50), unique=True, index=True, nullable=False)
    plate_number = Column(String(50), unique=True, index=True, nullable=False)
    vehicle_type = Column(String(50), nullable=False, default="car")  # car, motorcycle, van, truck, suv, other
    make = Column(String(100), nullable=False)
    model = Column(String(100), nullable=False)
    color = Column(String(50), nullable=True)
    owner_name = Column(String(150), nullable=False, index=True)
    owner_phone = Column(String(50), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    parking_area_id = Column(Integer, ForeignKey("parking_areas.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(20), nullable=False, default="active")  # active, inactive, blocked
    notes = Column(Text, nullable=True)
    
    # Identification Tokens
    qr_token = Column(String(100), unique=True, index=True, nullable=False)
    barcode_token = Column(String(100), unique=True, index=True, nullable=False)
    
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    department = relationship("Department", back_populates="vehicles")
    parking_area = relationship("ParkingArea", back_populates="vehicles")
    created_by = relationship("User", back_populates="vehicles_created", foreign_keys=[created_by_id])
    parking_transactions = relationship("ParkingTransaction", back_populates="vehicle", cascade="all, delete-orphan")
    scan_events = relationship("ScanEvent", back_populates="vehicle")
    incidents = relationship("Incident", back_populates="vehicle")
