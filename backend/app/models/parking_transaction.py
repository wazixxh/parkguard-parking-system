from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class ParkingTransaction(Base):
    __tablename__ = "parking_transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String(50), unique=True, index=True, nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True)
    
    entry_time = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    entry_staff_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    entry_method = Column(String(30), nullable=False, default="qr_scan")  # qr_scan, barcode_scan, manual
    
    exit_time = Column(DateTime, nullable=True, index=True)
    exit_staff_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    exit_method = Column(String(30), nullable=True)  # qr_scan, barcode_scan, manual
    
    parking_area_id = Column(Integer, ForeignKey("parking_areas.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(20), nullable=False, default="parked", index=True)  # parked, exited
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    vehicle = relationship("Vehicle", back_populates="parking_transactions")
    entry_staff = relationship("User", back_populates="entry_transactions", foreign_keys=[entry_staff_id])
    exit_staff = relationship("User", back_populates="exit_transactions", foreign_keys=[exit_staff_id])
    parking_area = relationship("ParkingArea", back_populates="transactions")
