import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db
from app.services.bootstrap_service import init_db
from app.core.config import settings

# Test in-memory SQLite database
TEST_DATABASE_URL = "sqlite:///./test_parkguard.db"
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

# Initialize database schema and admin for tests
Base.metadata.drop_all(bind=test_engine)
Base.metadata.create_all(bind=test_engine)
db_session = TestingSessionLocal()
init_db(db_session)
db_session.close()

client = TestClient(app)


# 1. Authentication & Roles Tests
def test_admin_login_success():
    response = client.post("/api/v1/auth/login", json={
        "email": settings.INITIAL_ADMIN_EMAIL,
        "password": settings.INITIAL_ADMIN_PASSWORD
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "super_admin"
    assert data["email"] == settings.INITIAL_ADMIN_EMAIL


def test_login_invalid_password():
    response = client.post("/api/v1/auth/login", json={
        "email": settings.INITIAL_ADMIN_EMAIL,
        "password": "WrongPassword123!"
    })
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["error"]["message"]


def test_staff_creation_and_login():
    # Login as admin first
    admin_login = client.post("/api/v1/auth/login", json={
        "email": settings.INITIAL_ADMIN_EMAIL,
        "password": settings.INITIAL_ADMIN_PASSWORD
    })
    token = admin_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create staff user
    staff_email = "staff.test@parkguard.com"
    create_res = client.post("/api/v1/users", json={
        "email": staff_email,
        "full_name": "Test Officer",
        "password": "StaffPassword2026!",
        "role": "staff",
        "department": "Security"
    }, headers=headers)
    assert create_res.status_code == 201
    assert create_res.json()["role"] == "staff"

    # Login as staff
    staff_login = client.post("/api/v1/auth/login", json={
        "email": staff_email,
        "password": "StaffPassword2026!"
    })
    assert staff_login.status_code == 200
    assert staff_login.json()["role"] == "staff"

    # Staff trying to access super-admin-only user list should be 403 Forbidden
    staff_token = staff_login.json()["access_token"]
    staff_headers = {"Authorization": f"Bearer {staff_token}"}
    forbidden_res = client.get("/api/v1/users", headers=staff_headers)
    assert forbidden_res.status_code == 403


# 2. Vehicle Registration & Validation Tests
def test_vehicle_registration_and_duplicate_prevention():
    # Get staff token
    staff_login = client.post("/api/v1/auth/login", json={
        "email": "staff.test@parkguard.com",
        "password": "StaffPassword2026!"
    })
    staff_headers = {"Authorization": f"Bearer {staff_login.json()['access_token']}"}

    # Register vehicle
    reg_res = client.post("/api/v1/vehicles", json={
        "plate_number": "ABC-9999",
        "vehicle_type": "car",
        "make": "Toyota",
        "model": "Camry",
        "color": "Midnight Black",
        "owner_name": "Sarah Connor",
        "owner_phone": "+1-555-0199",
        "notes": "VIP Staff Vehicle"
    }, headers=staff_headers)
    assert reg_res.status_code == 201
    data = reg_res.json()
    assert data["plate_number"] == "ABC-9999"
    assert "PGQR-" in data["qr_token"]
    assert "PGBC" in data["barcode_token"]

    # Test duplicate registration rejection
    dup_res = client.post("/api/v1/vehicles", json={
        "plate_number": "abc-9999",  # lowercase variation
        "vehicle_type": "car",
        "make": "Honda",
        "model": "Civic",
        "owner_name": "John Doe"
    }, headers=staff_headers)
    assert dup_res.status_code == 400
    assert "already registered" in dup_res.json()["error"]["message"]


# 3. Printable Card Test
def test_printable_vehicle_card():
    staff_login = client.post("/api/v1/auth/login", json={
        "email": "staff.test@parkguard.com",
        "password": "StaffPassword2026!"
    })
    headers = {"Authorization": f"Bearer {staff_login.json()['access_token']}"}

    card_res = client.get("/api/v1/vehicles/1/card", headers=headers)
    assert card_res.status_code == 200
    data = card_res.json()
    assert "qr_image_data_uri" in data
    assert data["qr_image_data_uri"].startswith("data:image/png;base64,")


# 4. Scanner Validation Test
def test_scanner_validation():
    staff_login = client.post("/api/v1/auth/login", json={
        "email": "staff.test@parkguard.com",
        "password": "StaffPassword2026!"
    })
    headers = {"Authorization": f"Bearer {staff_login.json()['access_token']}"}

    # Validate existing plate
    scan_res = client.post("/api/v1/scanner/validate", json={
        "token": "ABC-9999",
        "scan_type": "manual"
    }, headers=headers)
    assert scan_res.status_code == 200
    assert scan_res.json()["valid"] is True
    assert scan_res.json()["vehicle"]["plate_number"] == "ABC-9999"

    # Validate non-existent token
    scan_fake = client.post("/api/v1/scanner/validate", json={
        "token": "UNKNOWN-TOKEN-12345",
        "scan_type": "qr"
    }, headers=headers)
    assert scan_fake.status_code == 200
    assert scan_fake.json()["valid"] is False
    assert scan_fake.json()["result"] == "not_found"


# 5. Parking Entry, Duplicate Entry Prevention, and Exit Tests
def test_parking_entry_and_exit_workflow():
    staff_login = client.post("/api/v1/auth/login", json={
        "email": "staff.test@parkguard.com",
        "password": "StaffPassword2026!"
    })
    headers = {"Authorization": f"Bearer {staff_login.json()['access_token']}"}

    # 1. Record Entry
    entry_res = client.post("/api/v1/parking/entry", json={
        "vehicle_identifier": "ABC-9999",
        "entry_method": "qr_scan"
    }, headers=headers)
    assert entry_res.status_code == 201
    entry_data = entry_res.json()
    assert entry_data["status"] == "parked"
    txn_id = entry_data["transaction_id"]

    # 2. Duplicate Entry Prevention
    dup_entry = client.post("/api/v1/parking/entry", json={
        "vehicle_identifier": "ABC-9999",
        "entry_method": "manual"
    }, headers=headers)
    assert dup_entry.status_code == 400
    assert "DUPLICATE ENTRY" in dup_entry.json()["error"]["message"]

    # 3. Check Currently Parked List
    parked_res = client.get("/api/v1/parking/parked", headers=headers)
    assert parked_res.status_code == 200
    assert parked_res.json()["total"] >= 1

    # 4. Record Exit
    exit_res = client.post("/api/v1/parking/exit", json={
        "vehicle_identifier": "ABC-9999",
        "exit_method": "qr_scan",
        "notes": "Left on time"
    }, headers=headers)
    assert exit_res.status_code == 200
    exit_data = exit_res.json()
    assert exit_data["status"] == "exited"
    assert exit_data["exit_time"] is not None

    # 5. Invalid Exit Prevention (vehicle already exited)
    invalid_exit = client.post("/api/v1/parking/exit", json={
        "vehicle_identifier": "ABC-9999"
    }, headers=headers)
    assert invalid_exit.status_code == 400
    assert "INVALID EXIT" in invalid_exit.json()["error"]["message"]


# 6. Incident Reporting and Resolution
def test_incident_lifecycle():
    staff_login = client.post("/api/v1/auth/login", json={
        "email": "staff.test@parkguard.com",
        "password": "StaffPassword2026!"
    })
    headers = {"Authorization": f"Bearer {staff_login.json()['access_token']}"}

    # Report incident
    report_res = client.post("/api/v1/incidents", json={
        "category": "wrong_parking",
        "location": "Zone B - Loading Bay",
        "description": "Vehicle parked across two designated stalls.",
        "vehicle_identifier": "ABC-9999"
    }, headers=headers)
    assert report_res.status_code == 201
    inc_data = report_res.json()
    assert inc_data["status"] == "open"
    inc_id = inc_data["id"]

    # Resolve incident
    resolve_res = client.put(f"/api/v1/incidents/{inc_id}", json={
        "status": "resolved",
        "resolution_notes": "Driver notified and vehicle relocated."
    }, headers=headers)
    assert resolve_res.status_code == 200
    assert resolve_res.json()["status"] == "resolved"


# 7. Dashboard and Reports
def test_dashboard_and_csv_export():
    admin_login = client.post("/api/v1/auth/login", json={
        "email": settings.INITIAL_ADMIN_EMAIL,
        "password": settings.INITIAL_ADMIN_PASSWORD
    })
    headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    # Dashboard metrics
    dash_res = client.get("/api/v1/dashboard/stats", headers=headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert "total_vehicles" in dash_data
    assert "daily_activity_trends" in dash_data
    assert len(dash_data["daily_activity_trends"]) == 7

    # CSV Export
    csv_res = client.get("/api/v1/reports/export-csv?report_type=vehicles", headers=headers)
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]
    assert "Internal ID" in csv_res.text

    # CSV Export via token query param (browser direct download)
    token = admin_login.json()["access_token"]
    direct_csv = client.get(f"/api/v1/reports/export-csv?report_type=vehicles&token={token}")
    assert direct_csv.status_code == 200
    assert "text/csv" in direct_csv.headers["content-type"]


# 8. Password Change Workflow
def test_password_change_flow():
    staff_login = client.post("/api/v1/auth/login", json={
        "email": "staff.test@parkguard.com",
        "password": "StaffPassword2026!"
    })
    token = staff_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Change password
    new_pwd = "NewStaffPassword2026!"
    change_res = client.post("/api/v1/auth/change-password", json={
        "current_password": "StaffPassword2026!",
        "new_password": new_pwd
    }, headers=headers)
    assert change_res.status_code == 200
    assert change_res.json()["success"] is True

    # Old password should now fail
    old_login = client.post("/api/v1/auth/login", json={
        "email": "staff.test@parkguard.com",
        "password": "StaffPassword2026!"
    })
    assert old_login.status_code == 401

    # New password should succeed
    new_login = client.post("/api/v1/auth/login", json={
        "email": "staff.test@parkguard.com",
        "password": new_pwd
    })
    assert new_login.status_code == 200

