import io
import base64
import secrets
from typing import Optional
import qrcode
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.core.security import generate_qr_token, generate_barcode_token
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.department import Department
from app.models.parking_area import ParkingArea
from app.models.parking_transaction import ParkingTransaction
from app.schemas.vehicle import (
    VehicleCreate, VehicleUpdate, VehicleResponse, VehicleListResponse, PrintableCardResponse
)
from app.api.deps import require_staff_or_admin, require_super_admin, get_client_ip
from app.services.audit_service import record_audit

router = APIRouter()


def create_qr_base64_uri(token: str) -> str:
    """Generate base64 PNG data URI for printable QR code."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=2,
    )
    qr.add_data(token)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0a0b10", back_color="#ffffff")
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{img_str}"


def enrich_vehicle_response(vehicle: Vehicle, db: Session) -> dict:
    """Helper to attach live parking status to vehicle response."""
    active_txn = db.query(ParkingTransaction).filter(
        ParkingTransaction.vehicle_id == vehicle.id,
        ParkingTransaction.status == "parked"
    ).first()
    
    return {
        "id": vehicle.id,
        "vehicle_id": vehicle.vehicle_id,
        "plate_number": vehicle.plate_number,
        "vehicle_type": vehicle.vehicle_type,
        "make": vehicle.make,
        "model": vehicle.model,
        "color": vehicle.color,
        "owner_name": vehicle.owner_name,
        "owner_phone": vehicle.owner_phone,
        "department_id": vehicle.department_id,
        "parking_area_id": vehicle.parking_area_id,
        "status": vehicle.status,
        "notes": vehicle.notes,
        "qr_token": vehicle.qr_token,
        "barcode_token": vehicle.barcode_token,
        "created_at": vehicle.created_at,
        "updated_at": vehicle.updated_at,
        "is_parked": active_txn is not None,
        "current_transaction_id": active_txn.transaction_id if active_txn else None
    }


@router.get("", response_model=VehicleListResponse, summary="List & Search Vehicles")
def list_vehicles(
    search: Optional[str] = Query(None, description="Search by plate, owner, vehicle ID, make or model"),
    vehicle_type: Optional[str] = None,
    department_id: Optional[int] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
):
    """Retrieve paginated vehicle records with multi-parameter search and filters."""
    query = db.query(Vehicle)

    if search:
        s = f"%{search.strip().upper()}%"
        query = query.filter(
            or_(
                Vehicle.plate_number.ilike(s),
                Vehicle.vehicle_id.ilike(s),
                Vehicle.owner_name.ilike(f"%{search.strip()}%"),
                Vehicle.make.ilike(f"%{search.strip()}%"),
                Vehicle.model.ilike(f"%{search.strip()}%")
            )
        )

    if vehicle_type:
        query = query.filter(Vehicle.vehicle_type == vehicle_type)
    if department_id:
        query = query.filter(Vehicle.department_id == department_id)
    if status_filter:
        query = query.filter(Vehicle.status == status_filter)

    total = query.count()
    offset = (page - 1) * limit
    vehicles = query.order_by(Vehicle.created_at.desc()).offset(offset).limit(limit).all()

    items = [enrich_vehicle_response(v, db) for v in vehicles]
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "items": items
    }


@router.post("", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED, summary="Register Vehicle")
def register_vehicle(
    vehicle_in: VehicleCreate,
    request: Request,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
):
    """Register a new vehicle with duplicate plate prevention and unique QR/barcode generation."""
    ip = get_client_ip(request)
    normalized_plate = vehicle_in.plate_number.strip().upper()

    # Check duplicate plate number
    existing = db.query(Vehicle).filter(Vehicle.plate_number == normalized_plate).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Vehicle with plate number '{normalized_plate}' is already registered (Status: {existing.status})."
        )

    # Generate sequential unique internal ID
    count = db.query(Vehicle).count()
    vehicle_id_code = f"PG-VEH-{count + 1001}"
    
    # Generate unique tokens
    qr_token = generate_qr_token()
    barcode_token = generate_barcode_token()

    new_vehicle = Vehicle(
        vehicle_id=vehicle_id_code,
        plate_number=normalized_plate,
        vehicle_type=vehicle_in.vehicle_type,
        make=vehicle_in.make.strip(),
        model=vehicle_in.model.strip(),
        color=vehicle_in.color.strip() if vehicle_in.color else None,
        owner_name=vehicle_in.owner_name.strip(),
        owner_phone=vehicle_in.owner_phone.strip() if vehicle_in.owner_phone else None,
        department_id=vehicle_in.department_id,
        parking_area_id=vehicle_in.parking_area_id,
        status="active",
        notes=vehicle_in.notes,
        qr_token=qr_token,
        barcode_token=barcode_token,
        created_by_id=current_user.id
    )
    db.add(new_vehicle)
    db.commit()
    db.refresh(new_vehicle)

    record_audit(
        db=db,
        action="VEHICLE_REGISTER",
        resource_type="vehicle",
        resource_id=str(new_vehicle.id),
        outcome="SUCCESS",
        actor_id=current_user.id,
        actor_email=current_user.email,
        ip_address=ip,
        details=f"Registered vehicle {new_vehicle.plate_number} ({new_vehicle.vehicle_type}) for {new_vehicle.owner_name}"
    )

    return enrich_vehicle_response(new_vehicle, db)


@router.get("/{vehicle_id}", response_model=VehicleResponse, summary="Get Vehicle Details")
def get_vehicle_details(
    vehicle_id: int,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
):
    """Retrieve detailed vehicle profile and current parking status."""
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle with ID {vehicle_id} does not exist."
        )
    return enrich_vehicle_response(vehicle, db)


@router.put("/{vehicle_id}", response_model=VehicleResponse, summary="Update Vehicle Details")
def update_vehicle(
    vehicle_id: int,
    vehicle_in: VehicleUpdate,
    request: Request,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
):
    """Edit vehicle attributes."""
    ip = get_client_ip(request)
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle with ID {vehicle_id} does not exist."
        )

    for field, val in vehicle_in.model_dump(exclude_unset=True).items():
        setattr(vehicle, field, val)

    db.commit()
    db.refresh(vehicle)

    record_audit(
        db=db,
        action="VEHICLE_UPDATE",
        resource_type="vehicle",
        resource_id=str(vehicle.id),
        outcome="SUCCESS",
        actor_id=current_user.id,
        actor_email=current_user.email,
        ip_address=ip,
        details=f"Updated details for vehicle {vehicle.plate_number}"
    )

    return enrich_vehicle_response(vehicle, db)


@router.patch("/{vehicle_id}/deactivate", response_model=VehicleResponse, summary="Deactivate Vehicle")
def deactivate_vehicle(
    vehicle_id: int,
    request: Request,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Deactivate vehicle without deleting historical parking logs."""
    ip = get_client_ip(request)
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle with ID {vehicle_id} does not exist."
        )

    vehicle.status = "inactive"
    db.commit()
    db.refresh(vehicle)

    record_audit(
        db=db,
        action="VEHICLE_DEACTIVATE",
        resource_type="vehicle",
        resource_id=str(vehicle.id),
        outcome="SUCCESS",
        actor_id=current_user.id,
        actor_email=current_user.email,
        ip_address=ip,
        details=f"Deactivated vehicle {vehicle.plate_number}"
    )

    return enrich_vehicle_response(vehicle, db)


@router.post("/{vehicle_id}/regenerate-tokens", response_model=VehicleResponse, summary="Regenerate QR / Barcode Tokens")
def regenerate_tokens(
    vehicle_id: int,
    request: Request,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Generate new unique QR and barcode tokens, revoking old credentials."""
    ip = get_client_ip(request)
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found.")

    vehicle.qr_token = generate_qr_token()
    vehicle.barcode_token = generate_barcode_token()
    db.commit()
    db.refresh(vehicle)

    record_audit(
        db=db,
        action="TOKEN_REGENERATE",
        resource_type="vehicle",
        resource_id=str(vehicle.id),
        outcome="SUCCESS",
        actor_id=current_user.id,
        actor_email=current_user.email,
        ip_address=ip,
        details=f"Regenerated credentials for vehicle {vehicle.plate_number}"
    )

    return enrich_vehicle_response(vehicle, db)


@router.get("/{vehicle_id}/card", response_model=PrintableCardResponse, summary="Get Printable Vehicle Pass Card")
def get_printable_card(
    vehicle_id: int,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
):
    """Retrieve formatted card metadata and base64 QR code for printing."""
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found.")

    dept_name = vehicle.department.name if vehicle.department else "General / Unassigned"
    area_name = vehicle.parking_area.name if vehicle.parking_area else "Any Permitted Area"
    qr_data_uri = create_qr_base64_uri(vehicle.qr_token)

    return {
        "vehicle_id": vehicle.vehicle_id,
        "plate_number": vehicle.plate_number,
        "vehicle_type": vehicle.vehicle_type.upper(),
        "make_model": f"{vehicle.make} {vehicle.model}",
        "owner_name": vehicle.owner_name,
        "department_name": dept_name,
        "parking_area_name": area_name,
        "qr_token": vehicle.qr_token,
        "barcode_token": vehicle.barcode_token,
        "qr_image_data_uri": qr_data_uri,
        "registration_date": vehicle.created_at.strftime("%Y-%m-%d")
    }
