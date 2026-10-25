from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.scan_event import ScanEvent
from app.models.parking_transaction import ParkingTransaction
from app.schemas.scan import ScanValidationRequest, ScanValidationResponse, ScanEventResponse, ScanEventListResponse
from app.api.deps import require_staff_or_admin, get_client_ip
from app.api.v1.endpoints.vehicles import enrich_vehicle_response

router = APIRouter()


@router.post("/validate", response_model=ScanValidationResponse, summary="Validate Scanned QR / Barcode / Plate")
def validate_scan(
    payload: ScanValidationRequest,
    request: Request,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
):
    """
    Validate scanned credential or manual input.
    Checks vehicle status, records the scan event, and returns parking state.
    """
    raw_token = payload.token.strip()
    scan_type = payload.scan_type
    
    # Lookup by qr_token, barcode_token, plate_number, or vehicle_id
    vehicle = db.query(Vehicle).filter(
        or_(
            Vehicle.qr_token == raw_token,
            Vehicle.barcode_token == raw_token,
            Vehicle.plate_number == raw_token.upper(),
            Vehicle.vehicle_id == raw_token.upper()
        )
    ).first()

    # 1. Not Found
    if not vehicle:
        scan_event = ScanEvent(
            scanned_token=raw_token,
            scan_type=scan_type,
            result="not_found",
            message=f"No registered vehicle matches identifier '{raw_token}'.",
            staff_id=current_user.id
        )
        db.add(scan_event)
        db.commit()

        return {
            "valid": False,
            "result": "not_found",
            "message": f"No registered vehicle matches identifier '{raw_token}'.",
            "vehicle": None,
            "is_parked": False
        }

    # 2. Blocked
    if vehicle.status == "blocked":
        scan_event = ScanEvent(
            scanned_token=raw_token,
            scan_type=scan_type,
            result="blocked",
            message=f"Vehicle {vehicle.plate_number} is flagged as BLOCKED by security.",
            vehicle_id=vehicle.id,
            staff_id=current_user.id
        )
        db.add(scan_event)
        db.commit()

        return {
            "valid": False,
            "result": "blocked",
            "message": f"SECURITY ALERT: Vehicle {vehicle.plate_number} is currently BLOCKED from entering or exiting.",
            "vehicle": enrich_vehicle_response(vehicle, db),
            "is_parked": False
        }

    # 3. Inactive
    if vehicle.status == "inactive":
        scan_event = ScanEvent(
            scanned_token=raw_token,
            scan_type=scan_type,
            result="inactive",
            message=f"Vehicle {vehicle.plate_number} is deactivated/inactive.",
            vehicle_id=vehicle.id,
            staff_id=current_user.id
        )
        db.add(scan_event)
        db.commit()

        return {
            "valid": False,
            "result": "inactive",
            "message": f"Vehicle {vehicle.plate_number} is INACTIVE. Please re-activate in vehicle management.",
            "vehicle": enrich_vehicle_response(vehicle, db),
            "is_parked": False
        }

    # 4. Valid Active Vehicle - Check Parking State
    active_txn = db.query(ParkingTransaction).filter(
        ParkingTransaction.vehicle_id == vehicle.id,
        ParkingTransaction.status == "parked"
    ).first()

    parked_duration = None
    if active_txn:
        delta = datetime.now(timezone.utc) - active_txn.entry_time.replace(tzinfo=timezone.utc if active_txn.entry_time.tzinfo is None else None)
        parked_duration = max(1, int(delta.total_seconds() / 60))

    scan_event = ScanEvent(
        scanned_token=raw_token,
        scan_type=scan_type,
        result="success",
        message=f"Vehicle verified. Currently {'Parked' if active_txn else 'Not Parked'}.",
        vehicle_id=vehicle.id,
        staff_id=current_user.id
    )
    db.add(scan_event)
    db.commit()

    return {
        "valid": True,
        "result": "success",
        "message": f"Vehicle {vehicle.plate_number} verified successfully.",
        "vehicle": enrich_vehicle_response(vehicle, db),
        "is_parked": active_txn is not None,
        "active_transaction_id": active_txn.transaction_id if active_txn else None,
        "parked_duration_minutes": parked_duration
    }


@router.get("/history", response_model=ScanEventListResponse, summary="Retrieve Scan History")
def get_scan_history(
    limit: int = Query(50, ge=1, le=200),
    result: Optional[str] = None,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
):
    """Retrieve chronologically ordered scan events."""
    query = db.query(ScanEvent)
    if result:
        query = query.filter(ScanEvent.result == result)

    total = query.count()
    events = query.order_by(ScanEvent.scanned_at.desc()).limit(limit).all()

    items = []
    for e in events:
        items.append({
            "id": e.id,
            "scanned_token": e.scanned_token,
            "scan_type": e.scan_type,
            "result": e.result,
            "message": e.message,
            "vehicle_id": e.vehicle_id,
            "plate_number": e.vehicle.plate_number if e.vehicle else None,
            "staff_name": e.staff.full_name if e.staff else "System",
            "scanned_at": e.scanned_at
        })

    return {"total": total, "items": items}
