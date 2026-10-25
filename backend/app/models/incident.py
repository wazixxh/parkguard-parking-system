from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String(50), unique=True, index=True, nullable=False)
    category = Column(String(50), nullable=False, default="wrong_parking")  # wrong_parking, blocked_access, unauthorized_parking, other
    location = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(30), nullable=False, default="open", index=True)  # open, under_review, resolved, dismissed
    resolution_notes = Column(Text, nullable=True)
    
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    resolved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Relationships
    vehicle = relationship("Vehicle", back_populates="incidents")
    reporter = relationship("User", back_populates="incidents_reported", foreign_keys=[reporter_id])
    resolved_by = relationship("User", foreign_keys=[resolved_by_id])
