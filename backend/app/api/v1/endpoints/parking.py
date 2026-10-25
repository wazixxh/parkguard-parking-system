import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from app.core.database import get_db
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.parking_area import ParkingArea
from app.models.parking_transaction import ParkingTransaction
from app.schemas.parking import (
    ParkingEntryRequest, ParkingExitRequest, ParkingTransactionResponse, ParkingTransactionListResponse
)
from app.api.deps import require_staff_or_admin, get_client_ip
from app.services.audit_service import record_audit

router = APIRouter()


def format_transaction_response(txn: ParkingTransaction) -> dict:
    """Format transaction model into response dictionary with duration calculation."""
    duration_mins = None
    if txn.exit_time:
        delta = txn.exit_time - txn.entry_time
        duration_mins = max(1, int(delta.total_seconds() / 60))
    elif txn.status == "parked":
        delta = datetime.now(timezone.utc) - txn.entry_time.replace(tzinfo=timezone.utc if txn.entry_time.tzinfo is None else None)
        duration_mins = max(1, int(delta.total_seconds() / 60))

    return {
        "id": txn.id,
        "transaction_id": txn.transaction_id,
        "vehicle_id": txn.vehicle_id,
        "plate_number": txn.vehicle.plate_number if txn.vehicle else "UNKNOWN",
        "vehicle_type": txn.vehicle.vehicle_type if txn.vehicle else "car",
        "owner_name": txn.vehicle.owner_name if txn.vehicle else "Unknown",
        "make": txn.vehicle.make if txn.vehicle else "",
        "model": txn.vehicle.model if txn.vehicle else "",
        "entry_time": txn.entry_time,
        "exit_time": txn.exit_time,
        "duration_minutes": duration_mins,
        "entry_method": txn.entry_method,
        "exit_method": txn.exit_method,
        "parking_area_name": txn.parking_area.name if txn.parking_area else "General Area",
        "status": txn.status,
        "notes": txn.notes,
        "entry_staff_name": txn.entry_staff.full_name if txn.entry_staff else None,
        "exit_staff_name": txn.exit_staff.full_name if txn.exit_staff else None,
    }


@router.post("/entry", response_model=ParkingTransactionResponse, status_code=status.HTTP_201_CREATED, summary="Record Vehicle Entry")
def record_entry(
    entry_data: ParkingEntryRequest,
    request: Request,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
):
    """
    Record vehicle entry into facility.
    Guarantees no duplicate active entry for the same vehicle.
    """
    ip = get_client_ip(request)
    ident = entry_data.vehicle_identifier.strip()

    # Find vehicle by qr_token, barcode_token, plate, or vehicle_id
    vehicle = db.query(Vehicle).filter(
        or_(
            Vehicle.qr_token == ident,
            Vehicle.barcode_token == ident,
            Vehicle.plate_number == ident.upper(),
            Vehicle.vehicle_id == ident.upper()
        )
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No registered vehicle found matching '{ident}'."
        )

    if vehicle.status == "blocked":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"ENTRY DENIED: Vehicle {vehicle.plate_number} is flagged as BLOCKED by security."
        )

    if vehicle.status == "inactive":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"ENTRY REJECTED: Vehicle {vehicle.plate_number} is currently INACTIVE."
        )

    # Concurrency and duplicate entry prevention: check for active parked status
    active_txn = db.query(ParkingTransaction).filter(
        ParkingTransaction.vehicle_id == vehicle.id,
        ParkingTransaction.status == "parked"
    ).first()

    if active_txn:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"DUPLICATE ENTRY: Vehicle {vehicle.plate_number} already has an active entry logged at {active_txn.entry_time.strftime('%H:%M:%S')} (Txn: {active_txn.transaction_id})."
        )

    # Determine parking area
    area_id = entry_data.parking_area_id or vehicle.parking_area_id
    if area_id:
        area = db.query(ParkingArea).filter(ParkingArea.id == area_id).first()
        if area:
            area.occupied_count = min(area.total_capacity, area.occupied_count + 1)

    # Generate unique transaction code
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    random_suffix = secrets.token_hex(3).upper()
    txn_id = f"TXN-{date_str}-{random_suffix}"

    new_txn = ParkingTransaction(
        transaction_id=txn_id,
        vehicle_id=vehicle.id,
        entry_time=datetime.now(timezone.utc),
        entry_staff_id=current_user.id,
        entry_method=entry_data.entry_method,
        parking_area_id=area_id,
        status="parked",
        notes=entry_data.notes
    )
    db.add(new_txn)
    db.commit()
    db.refresh(new_txn)

    record_audit(
        db=db,
        action="PARKING_ENTRY",
        resource_type="parking",
        resource_id=new_txn.transaction_id,
        outcome="SUCCESS",
        actor_id=current_user.id,
        actor_email=current_user.email,
        ip_address=ip,
        details=f"Entry recorded for {vehicle.plate_number} via {entry_data.entry_method}"
    )

    return format_transaction_response(new_txn)


@router.post("/exit", response_model=ParkingTransactionResponse, summary="Record Vehicle Exit")
def record_exit(
    exit_data: ParkingExitRequest,
    request: Request,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
):
    """
    Record vehicle exit from facility.
    Requires an active parked transaction.
    """
    ip = get_client_ip(request)
    ident = exit_data.vehicle_identifier.strip()

    # Look up by transaction_id first, then vehicle tokens
    txn = db.query(ParkingTransaction).filter(
        ParkingTransaction.transaction_id == ident.upper(),
        ParkingTransaction.status == "parked"
    ).first()

    if not txn:
        vehicle = db.query(Vehicle).filter(
            or_(
                Vehicle.qr_token == ident,
                Vehicle.barcode_token == ident,
                Vehicle.plate_number == ident.upper(),
                Vehicle.vehicle_id == ident.upper()
            )
        ).first()

        if vehicle:
            txn = db.query(ParkingTransaction).filter(
                ParkingTransaction.vehicle_id == vehicle.id,
                ParkingTransaction.status == "parked"
            ).first()

    if not txn:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"INVALID EXIT: No active parked transaction found matching '{ident}'. Exit cannot be recorded without an active entry."
        )

    # Process Exit
    txn.exit_time = datetime.now(timezone.utc)
    txn.exit_staff_id = current_user.id
    txn.exit_method = exit_data.exit_method
    txn.status = "exited"
    if exit_data.notes:
        txn.notes = f"{txn.notes or ''} | Exit Note: {exit_data.notes}".strip(" |")

    # Update parking area occupancy
    if txn.parking_area_id:
        area = db.query(ParkingArea).filter(ParkingArea.id == txn.parking_area_id).first()
        if area:
            area.occupied_count = max(0, area.occupied_count - 1)

    db.commit()
    db.refresh(txn)

    delta = txn.exit_time - txn.entry_time
    duration_mins = max(1, int(delta.total_seconds() / 60))

    record_audit(
        db=db,
        action="PARKING_EXIT",
        resource_type="parking",
        resource_id=txn.transaction_id,
        outcome="SUCCESS",
        actor_id=current_user.id,
        actor_email=current_user.email,
        ip_address=ip,
        details=f"Exit recorded for {txn.vehicle.plate_number}. Duration: {duration_mins} min."
    )

    return format_transaction_response(txn)


@router.get("/parked", response_model=ParkingTransactionListResponse, summary="List Currently Parked Vehicles")
def list_currently_parked(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = None,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
):
    """Retrieve all vehicles with active parked status."""
    query = db.query(ParkingTransaction).join(Vehicle).filter(ParkingTransaction.status == "parked")

    if search:
        s = f"%{search.strip().upper()}%"
        query = query.filter(
            or_(
                Vehicle.plate_number.ilike(s),
                Vehicle.owner_name.ilike(f"%{search.strip()}%"),
                ParkingTransaction.transaction_id.ilike(s)
            )
        )

    total = query.count()
    offset = (page - 1) * limit
    txns = query.order_by(ParkingTransaction.entry_time.desc()).offset(offset).limit(limit).all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "items": [format_transaction_response(t) for t in txns]
    }


@router.get("/transactions", response_model=ParkingTransactionListResponse, summary="Parking Transaction History")
def list_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    vehicle_type: Optional[str] = None,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
):
    """Retrieve complete searchable historical transaction logs."""
    query = db.query(ParkingTransaction).join(Vehicle)

    if status_filter:
        query = query.filter(ParkingTransaction.status == status_filter)
    if vehicle_type:
        query = query.filter(Vehicle.vehicle_type == vehicle_type)
    if search:
        s = f"%{search.strip().upper()}%"
        query = query.filter(
            or_(
                Vehicle.plate_number.ilike(s),
                Vehicle.owner_name.ilike(f"%{search.strip()}%"),
                ParkingTransaction.transaction_id.ilike(s)
            )
        )

    total = query.count()
    offset = (page - 1) * limit
    txns = query.order_by(ParkingTransaction.entry_time.desc()).offset(offset).limit(limit).all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "items": [format_transaction_response(t) for t in txns]
    }
