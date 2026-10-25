from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
from app.core.logging import logger


def record_audit(
    db: Session,
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    outcome: str = "SUCCESS",
    actor_id: Optional[int] = None,
    actor_email: Optional[str] = None,
    ip_address: Optional[str] = None,
    details: Optional[str] = None
) -> AuditLog:
    """Record an audit event without logging passwords, tokens, or sensitive credentials."""
    try:
        log = AuditLog(
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            outcome=outcome,
            actor_id=actor_id,
            actor_email=actor_email,
            ip_address=ip_address,
            details=details
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to record audit log: {str(e)}")
        return None
