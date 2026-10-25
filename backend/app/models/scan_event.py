from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class ScanEvent(Base):
    __tablename__ = "scan_events"

    id = Column(Integer, primary_key=True, index=True)
    scanned_token = Column(String(100), nullable=False, index=True)
    scan_type = Column(String(30), nullable=False, default="qr")  # qr, barcode, manual
    result = Column(String(30), nullable=False, index=True)  # success, not_found, blocked, inactive, revoked, error
    message = Column(String(255), nullable=True)
    
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True)
    staff_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    scanned_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Relationships
    vehicle = relationship("Vehicle", back_populates="scan_events")
    staff = relationship("User")
