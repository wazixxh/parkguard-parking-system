import secrets
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.incident import Incident
from app.schemas.incident import IncidentCreate, IncidentUpdate, IncidentResponse, IncidentListResponse
from app.api.deps import require_staff_or_admin, require_super_admin, get_client_ip
from app.services.audit_service import record_audit

router = APIRouter()


def format_incident_response(inc: Incident) -> dict:
    """Format incident model into schema response."""
    return {
        "id": inc.id,
        "incident_id": inc.incident_id,
        "category": inc.category,
        "location": inc.location,
        "description": inc.description,
        "status": inc.status,
        "resolution_notes": inc.resolution_notes,
        "vehicle_id": inc.vehicle_id,
        "plate_number": inc.vehicle.plate_number if inc.vehicle else None,
        "owner_name": inc.vehicle.owner_name if inc.vehicle else None,
        "owner_phone": inc.vehicle.owner_phone if inc.vehicle else None,
        "reporter_id": inc.reporter_id,
        "reporter_name": inc.reporter.full_name if inc.reporter else "Staff",
        "resolved_by_name": inc.resolved_by.full_name if inc.resolved_by else None,
        "resolved_at": inc.resolved_at,
        "created_at": inc.created_at
    }


@router.get("", response_model=IncidentListResponse, summary="List Parking Incidents")
def list_incidents(
    status_filter: Optional[str] = Query(None, alias="status"),
    category: Optional[str] = None,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
):
    """Retrieve operational parking and security incidents."""
    query = db.query(Incident)
    if status_filter:
        query = query.filter(Incident.status == status_filter)
    if category:
        query = query.filter(Incident.category == category)

    total = query.count()
    items = query.order_by(Incident.created_at.desc()).all()

    return {
        "total": total,
        "items": [format_incident_response(i) for i in items]
    }


@router.post("", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED, summary="Report Parking Incident")
def create_incident(
    inc_in: IncidentCreate,
    request: Request,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
):
    """Staff or Admin: Report wrong parking, blocked gate, or security issue."""
    ip = get_client_ip(request)
    vehicle_id = None
    if inc_in.vehicle_identifier:
        ident = inc_in.vehicle_identifier.strip()
        vehicle = db.query(Vehicle).filter(
            or_(
                Vehicle.plate_number == ident.upper(),
                Vehicle.qr_token == ident,
                Vehicle.barcode_token == ident,
                Vehicle.vehicle_id == ident.upper()
            )
        ).first()
        if vehicle:
            vehicle_id = vehicle.id

    random_code = secrets.token_hex(3).upper()
    incident_code = f"INC-{datetime.now(timezone.utc).strftime('%m%d')}-{random_code}"

    new_inc = Incident(
        incident_id=incident_code,
        category=inc_in.category,
        location=inc_in.location.strip(),
        description=inc_in.description.strip(),
        vehicle_id=vehicle_id,
        reporter_id=current_user.id,
        status="open"
    )
    db.add(new_inc)
    db.commit()
    db.refresh(new_inc)

    record_audit(
        db=db,
        action="INCIDENT_REPORT",
        resource_type="incident",
        resource_id=new_inc.incident_id,
        outcome="SUCCESS",
        actor_id=current_user.id,
        actor_email=current_user.email,
        ip_address=ip,
        details=f"Reported {new_inc.category} incident at {new_inc.location}"
    )

    return format_incident_response(new_inc)


@router.put("/{incident_id}", response_model=IncidentResponse, summary="Update / Resolve Incident")
def update_incident(
    incident_id: int,
    inc_update: IncidentUpdate,
    request: Request,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
):
    """Update incident status and resolution notes."""
    ip = get_client_ip(request)
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found.")

    if inc_update.status:
        inc.status = inc_update.status
        if inc_update.status in ["resolved", "dismissed"]:
            inc.resolved_by_id = current_user.id
            inc.resolved_at = datetime.now(timezone.utc)

    if inc_update.resolution_notes:
        inc.resolution_notes = inc_update.resolution_notes.strip()

    db.commit()
    db.refresh(inc)

    record_audit(
        db=db,
        action="INCIDENT_RESOLVE" if inc.status == "resolved" else "INCIDENT_UPDATE",
        resource_type="incident",
        resource_id=inc.incident_id,
        outcome="SUCCESS",
        actor_id=current_user.id,
        actor_email=current_user.email,
        ip_address=ip,
        details=f"Updated incident {inc.incident_id} to status {inc.status}"
    )

    return format_incident_response(inc)
