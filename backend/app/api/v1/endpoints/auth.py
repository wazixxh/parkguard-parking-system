from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, hash_password, create_access_token
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, PasswordChangeRequest, CurrentUserResponse
from app.api.deps import get_current_user, get_client_ip
from app.services.audit_service import record_audit

router = APIRouter()


@router.post("/login", response_model=TokenResponse, summary="User Sign In")
def login(login_data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """Authenticate user with email and password, return JWT token."""
    ip = get_client_ip(request)
    user = db.query(User).filter(User.email == login_data.email.lower().strip()).first()
    
    if not user or not verify_password(login_data.password, user.hashed_password):
        record_audit(
            db=db,
            action="USER_LOGIN",
            resource_type="auth",
            resource_id=login_data.email,
            outcome="FAILURE",
            ip_address=ip,
            details="Invalid email or password."
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        record_audit(
            db=db,
            action="USER_LOGIN",
            resource_type="auth",
            resource_id=str(user.id),
            outcome="DENIED",
            actor_id=user.id,
            actor_email=user.email,
            ip_address=ip,
            details="Login blocked: account is deactivated."
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is deactivated. Please contact an administrator."
        )

    # Generate token
    token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role})

    record_audit(
        db=db,
        action="USER_LOGIN",
        resource_type="auth",
        resource_id=str(user.id),
        outcome="SUCCESS",
        actor_id=user.id,
        actor_email=user.email,
        ip_address=ip,
        details=f"Successful authentication for role {user.role}."
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role
    }


@router.get("/me", response_model=CurrentUserResponse, summary="Get Current Authenticated User")
def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve profile of currently authenticated user."""
    return current_user


@router.post("/change-password", summary="Change Password")
def change_password(
    pwd_data: PasswordChangeRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change current user's password securely."""
    ip = get_client_ip(request)
    if not verify_password(pwd_data.current_password, current_user.hashed_password):
        record_audit(
            db=db,
            action="PASSWORD_CHANGE",
            resource_type="auth",
            resource_id=str(current_user.id),
            outcome="FAILURE",
            actor_id=current_user.id,
            actor_email=current_user.email,
            ip_address=ip,
            details="Password change failed: incorrect current password."
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect."
        )

    current_user.hashed_password = hash_password(pwd_data.new_password)
    db.commit()

    record_audit(
        db=db,
        action="PASSWORD_CHANGE",
        resource_type="auth",
        resource_id=str(current_user.id),
        outcome="SUCCESS",
        actor_id=current_user.id,
        actor_email=current_user.email,
        ip_address=ip,
        details="Password changed successfully."
    )

    return {"success": True, "message": "Password changed successfully."}
