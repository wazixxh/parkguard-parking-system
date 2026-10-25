from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import hash_password
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserListResponse
from app.api.deps import require_super_admin, get_client_ip
from app.services.audit_service import record_audit

router = APIRouter()


@router.get("", response_model=UserListResponse, summary="List Staff & Admin Accounts")
def list_users(
    skip: int = 0,
    limit: int = 50,
    role: Optional[str] = None,
    current_admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Super Admin: View all registered staff and admin accounts."""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    
    total = query.count()
    items = query.order_by(User.id.asc()).offset(skip).limit(limit).all()
    return {"total": total, "items": items}


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED, summary="Create User Account")
def create_user(
    user_in: UserCreate,
    request: Request,
    current_admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Super Admin: Create a new staff or admin user."""
    ip = get_client_ip(request)
    existing = db.query(User).filter(User.email == user_in.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An account with email '{user_in.email}' already exists."
        )

    new_user = User(
        email=user_in.email.lower().strip(),
        full_name=user_in.full_name.strip(),
        hashed_password=hash_password(user_in.password),
        role=user_in.role,
        department=user_in.department,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    record_audit(
        db=db,
        action="USER_CREATE",
        resource_type="user",
        resource_id=str(new_user.id),
        outcome="SUCCESS",
        actor_id=current_admin.id,
        actor_email=current_admin.email,
        ip_address=ip,
        details=f"Created {new_user.role} user: {new_user.email}"
    )

    return new_user


@router.put("/{user_id}", response_model=UserResponse, summary="Update User Account")
def update_user(
    user_id: int,
    user_in: UserUpdate,
    request: Request,
    current_admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Super Admin: Update user details, role, or active status."""
    ip = get_client_ip(request)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} was not found."
        )

    # Protect against self-deactivation or demotion of primary admin
    if user.id == current_admin.id:
        if user_in.is_active is False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot deactivate your own administrative account."
            )
        if user_in.role and user_in.role != "super_admin":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot remove super admin privileges from yourself."
            )

    if user_in.full_name is not None:
        user.full_name = user_in.full_name.strip()
    if user_in.role is not None:
        user.role = user_in.role
    if user_in.department is not None:
        user.department = user_in.department
    if user_in.is_active is not None:
        user.is_active = user_in.is_active
    if user_in.password:
        user.hashed_password = hash_password(user_in.password)

    db.commit()
    db.refresh(user)

    record_audit(
        db=db,
        action="USER_UPDATE",
        resource_type="user",
        resource_id=str(user.id),
        outcome="SUCCESS",
        actor_id=current_admin.id,
        actor_email=current_admin.email,
        ip_address=ip,
        details=f"Updated details for user: {user.email}"
    )

    return user
