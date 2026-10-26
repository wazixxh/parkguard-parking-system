from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.system_setting import SystemSetting
from app.schemas.setting import SettingsResponse, SettingsUpdateRequest
from app.api.deps import require_super_admin, get_client_ip, get_current_user
from app.services.audit_service import record_audit

router = APIRouter()

DEFAULT_SETTINGS = {
    "organization_name": "ParkGuard Campus Facilities",
    "facility_location": "Main Campus & Corporate Center",
    "timezone": "UTC",
    "enforce_capacity_limits": "true",
    "default_grace_period_mins": "15",
    "max_duration_hours": "24",
    "require_phone_on_register": "false",
    "auto_verify_scans": "true",
}


@router.get("", response_model=SettingsResponse, summary="Get System Settings")
def get_settings(
    db: Session = Depends(get_db)
):
    """Retrieve operational system configuration settings."""
    db_settings = db.query(SystemSetting).all()
    settings_dict = dict(DEFAULT_SETTINGS)

    for s in db_settings:
        settings_dict[s.setting_key] = s.setting_value

    return {
        "settings": settings_dict,
        "metadata": {
            "total_configured": len(settings_dict),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    }


@router.patch("", response_model=SettingsResponse, summary="Update System Settings")
def update_settings(
    payload: SettingsUpdateRequest,
    request: Request,
    current_admin: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    """Super Admin: Update system operational configuration preferences."""
    ip = get_client_ip(request)
    updated_keys = []

    for key, val in payload.settings.items():
        key_str = key.strip()
        val_str = str(val).strip()

        setting = db.query(SystemSetting).filter(SystemSetting.setting_key == key_str).first()
        if setting:
            setting.setting_value = val_str
            setting.updated_by_id = current_admin.id
            setting.updated_at = datetime.now(timezone.utc)
        else:
            setting = SystemSetting(
                setting_key=key_str,
                setting_value=val_str,
                updated_by_id=current_admin.id
            )
            db.add(setting)
        updated_keys.append(key_str)

    db.commit()

    record_audit(
        db=db,
        action="SETTINGS_UPDATE",
        resource_type="config",
        resource_id="system_settings",
        outcome="SUCCESS",
        actor_id=current_admin.id,
        actor_email=current_admin.email,
        ip_address=ip,
        details=f"Updated settings: {', '.join(updated_keys)}"
    )

    return get_settings(db)
