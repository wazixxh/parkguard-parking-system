from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import engine, Base
from app.core.logging import logger
from app.core.security import hash_password
from app.models.user import User
from app.models.department import Department
from app.models.parking_area import ParkingArea
from app.models.audit_log import AuditLog
from app.models.system_setting import SystemSetting



def init_db(db: Session):
    """
    Initializes database schema and bootstraps initial super administrator
    and standard parking zones if not already present.
    """
    # Create all tables safely
    Base.metadata.create_all(bind=engine)

    # 1. Check/Bootstrap Super Administrator
    admin = db.query(User).filter(User.role == "super_admin").first()
    if not admin:
        logger.info(f"Bootstrapping initial super administrator: {settings.INITIAL_ADMIN_EMAIL}")
        admin_user = User(
            email=settings.INITIAL_ADMIN_EMAIL,
            full_name=settings.INITIAL_ADMIN_NAME,
            hashed_password=hash_password(settings.INITIAL_ADMIN_PASSWORD),
            role="super_admin",
            is_active=True,
            department="Administration"
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

        # Audit event for bootstrap
        bootstrap_audit = AuditLog(
            actor_id=admin_user.id,
            actor_email=admin_user.email,
            action="SYSTEM_BOOTSTRAP",
            resource_type="auth",
            resource_id=str(admin_user.id),
            outcome="SUCCESS",
            details="Initial super administrator bootstrapped securely."
        )
        db.add(bootstrap_audit)
        db.commit()
        logger.info("Super administrator account created successfully.")

    # 2. Seed Default Departments if empty
    if db.query(Department).count() == 0:
        default_depts = [
            Department(name="Executive & Administration", code="ADMIN", description="Corporate leadership and management"),
            Department(name="Engineering & IT", code="ENG", description="Software development and technical infrastructure"),
            Department(name="Security & Operations", code="SEC", description="Physical security and site operations"),
            Department(name="Visitors & Contractors", code="VISITOR", description="Temporary authorized guests"),
        ]
        db.add_all(default_depts)
        db.commit()
        logger.info("Default departments seeded.")

    # 3. Seed Default Parking Areas if empty
    if db.query(ParkingArea).count() == 0:
        default_areas = [
            ParkingArea(name="Zone A — Executive Lot", code="ZONE-A", total_capacity=30),
            ParkingArea(name="Zone B — Staff Deck", code="ZONE-B", total_capacity=100),
            ParkingArea(name="Zone C — Visitor Parking", code="ZONE-C", total_capacity=50),
            ParkingArea(name="Basement Level B1", code="B1", total_capacity=80),
        ]
        db.add_all(default_areas)
        db.commit()
        logger.info("Default parking areas seeded.")

    # 4. Seed Default System Settings if empty
    if db.query(SystemSetting).count() == 0:
        default_settings = [
            SystemSetting(setting_key="organization_name", setting_value="ParkGuard Campus Facilities", description="Organization name displayed on cards and headers"),
            SystemSetting(setting_key="facility_location", setting_value="Main Campus & Corporate Center", description="Facility site or campus location"),
            SystemSetting(setting_key="timezone", setting_value="UTC", description="System reference timezone"),
            SystemSetting(setting_key="enforce_capacity_limits", setting_value="true", description="Reject entry when zone capacity is reached"),
            SystemSetting(setting_key="default_grace_period_mins", setting_value="15", description="Grace period before overstay flags"),
            SystemSetting(setting_key="max_duration_hours", setting_value="24", description="Maximum continuous parking duration permitted"),
            SystemSetting(setting_key="require_phone_on_register", setting_value="false", description="Make driver phone number mandatory on vehicle registration"),
            SystemSetting(setting_key="auto_verify_scans", setting_value="true", description="Automatically verify and display live vehicle permit status upon scan"),
        ]
        db.add_all(default_settings)
        db.commit()
        logger.info("Default system settings seeded.")

