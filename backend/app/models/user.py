from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="staff")  # "super_admin", "staff"
    is_active = Column(Boolean, default=True, nullable=False)
    department = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    vehicles_created = relationship("Vehicle", back_populates="created_by", foreign_keys="Vehicle.created_by_id")
    incidents_reported = relationship("Incident", back_populates="reporter", foreign_keys="Incident.reporter_id")
    entry_transactions = relationship("ParkingTransaction", back_populates="entry_staff", foreign_keys="ParkingTransaction.entry_staff_id")
    exit_transactions = relationship("ParkingTransaction", back_populates="exit_staff", foreign_keys="ParkingTransaction.exit_staff_id")
