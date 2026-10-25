from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    actor_email = Column(String(255), nullable=True)
    action = Column(String(100), nullable=False, index=True)  # LOGIN, LOGOUT, VEHICLE_CREATE, ENTRY_RECORD, etc.
    resource_type = Column(String(50), nullable=False, index=True)  # auth, vehicle, parking, incident, config
    resource_id = Column(String(100), nullable=True)
    outcome = Column(String(20), nullable=False, default="SUCCESS")  # SUCCESS, FAILURE, DENIED
    ip_address = Column(String(50), nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    actor = relationship("User", foreign_keys=[actor_id])
