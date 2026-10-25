from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.audit_log import AuditLog
from app.schemas.audit import AuditLogListResponse
from app.api.deps import require_super_admin

router = APIRouter()


@router.get("", response_model=AuditLogListResponse, summary="Retrieve Audit Logs")
def list_audit_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    current_admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """
    Super Admin: Access restricted chronological audit trails.
    Includes login attempts, vehicle modifications, token regenerations, and system events.
    """
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    if resource_type:
        query = query.filter(AuditLog.resource_type == resource_type)

    total = query.count()
    offset = (page - 1) * limit
    logs = query.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit).all()

    return {
        "total": total,
        "items": logs
    }
