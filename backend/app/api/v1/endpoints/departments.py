from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.department import Department
from app.models.parking_area import ParkingArea
from app.schemas.department import (
    DepartmentCreate, DepartmentResponse, ParkingAreaCreate, ParkingAreaResponse
)
from app.api.deps import require_staff_or_admin, require_super_admin, get_client_ip
from app.services.audit_service import record_audit

router = APIRouter()


# --- DEPARTMENTS ---

@router.get("/departments", response_model=List[DepartmentResponse], summary="List Departments")
def list_departments(
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
):
    """Retrieve all operational departments."""
    return db.query(Department).filter(Department.is_active == True).order_by(Department.name.asc()).all()


@router.post("/departments", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED, summary="Create Department")
def create_department(
    dept_in: DepartmentCreate,
    request: Request,
    current_admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Super Admin: Register a new department."""
    ip = get_client_ip(request)
    existing = db.query(Department).filter(Department.code == dept_in.code.upper().strip()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Department code already in use.")

    new_dept = Department(
        name=dept_in.name.strip(),
        code=dept_in.code.upper().strip(),
        description=dept_in.description
    )
    db.add(new_dept)
    db.commit()
    db.refresh(new_dept)

    record_audit(
        db=db,
        action="DEPARTMENT_CREATE",
        resource_type="config",
        resource_id=new_dept.code,
        outcome="SUCCESS",
        actor_id=current_admin.id,
        actor_email=current_admin.email,
        ip_address=ip,
        details=f"Created department {new_dept.name}"
    )

    return new_dept


# --- PARKING AREAS ---

@router.get("/parking-areas", response_model=List[ParkingAreaResponse], summary="List Parking Areas & Capacities")
def list_parking_areas(
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
):
    """Retrieve active parking areas with current occupancy tracking."""
    return db.query(ParkingArea).filter(ParkingArea.is_active == True).order_by(ParkingArea.name.asc()).all()


@router.post("/parking-areas", response_model=ParkingAreaResponse, status_code=status.HTTP_201_CREATED, summary="Create Parking Area")
def create_parking_area(
    area_in: ParkingAreaCreate,
    request: Request,
    current_admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Super Admin: Add a parking zone or lot with capacity."""
    ip = get_client_ip(request)
    existing = db.query(ParkingArea).filter(ParkingArea.code == area_in.code.upper().strip()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Parking area code already in use.")

    new_area = ParkingArea(
        name=area_in.name.strip(),
        code=area_in.code.upper().strip(),
        total_capacity=area_in.total_capacity,
        occupied_count=0
    )
    db.add(new_area)
    db.commit()
    db.refresh(new_area)

    record_audit(
        db=db,
        action="PARKING_AREA_CREATE",
        resource_type="config",
        resource_id=new_area.code,
        outcome="SUCCESS",
        actor_id=current_admin.id,
        actor_email=current_admin.email,
        ip_address=ip,
        details=f"Created parking zone {new_area.name} (Cap: {new_area.total_capacity})"
    )

    return new_area
