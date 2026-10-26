# ParkGuard — Testing & Quality Assurance Guide

### 1. Overview
ParkGuard maintains high code quality through multi-layered automated testing and manual End-to-End (E2E) verification:
- **Backend Tests**: Automated regression suite powered by `pytest` and `fastapi.testclient.TestClient` using an isolated in-memory/file test database (`test_parkguard.db`).
- **Frontend Verification**: Static type safety checks via `tsc -b`, bundle optimization via `vite build`, and static analysis via `oxlint`.
- **E2E Smoke Verification**: Full-cycle validation covering authentication, permit creation, QR generation, entry/exit operations, incident reporting, and CSV data extraction.

---

### 2. Backend Automated Test Suite

#### 2.1. Executing Pytest
Run the full test suite with verbose output from the `backend/` directory:
```bash
# Windows
.\venv\Scripts\pytest.exe -v

# Linux / macOS
pytest -v
```

#### 2.2. Automated Test Matrix

| Test Function | Target Feature | Validation Rules |
| :--- | :--- | :--- |
| `test_admin_login_success` | Auth / JWT | Correct password returns Bearer JWT, `super_admin` role, and user email. |
| `test_login_invalid_password` | Security | Invalid password returns HTTP 401 with standard error envelope. |
| `test_staff_creation_and_login` | RBAC / Staff | Admin can create staff user; new staff can authenticate and receive JWT. |
| `test_vehicle_registration_and_duplicate_prevention` | Vehicles | Registering a vehicle creates record; attempting duplicate plate raises HTTP 400. |
| `test_printable_vehicle_card` | Pass Cards | Returns vehicle data, owner, department, and valid active QR/barcode token. |
| `test_scanner_validation` | Scanner Engine | QR token or plate returns valid vehicle status and suggested action (entry/exit). |
| `test_parking_entry_and_exit_workflow` | Parking Flow | Entry creates active session and increments zone count; exit updates session and decrements zone count. |
| `test_incident_lifecycle` | Incidents | Reports incident; Admin updates status to resolved with resolution notes. |
| `test_dashboard_and_csv_export` | Analytics & Reports | Returns aggregated counts; streams valid CSV report with proper headers. |
| `test_password_change_flow` | Account Security | User updates password; old password fails; new password succeeds. |
| `test_system_settings_rbac_and_update` | Settings / RBAC | Admin reads and patches operational settings; Staff attempt receives HTTP 403 Forbidden. |
| `test_vehicle_update_flow` | Vehicle CRUD | Admin updates vehicle color, model, notes; persistence verified. |
| `test_root_endpoint` | Probes | Root endpoint responds with active service status. |
| `test_health_check` | Diagnostics | Liveness probe `/health` returns database connectivity status. |
| `test_health_ready` | Diagnostics | Readiness probe confirms database connection pool is operational. |
| `test_api_v1_health_check` | Diagnostics | Versioned health check validates API router routing. |
| `test_not_found_structured_error` | Error Handling | Unhandled routes return standard error JSON schema. |

---

### 3. Frontend Verification

#### 3.1. TypeScript Compiler & Production Build
Validate that all React components, hooks, and types compile cleanly without warnings or type errors:
```bash
cd frontend
npm run build
```
*Expected Output: `tsc -b && vite build` completes with 0 errors and generates minified assets in `frontend/dist/`.*

#### 3.2. Static Linting
Run the Oxlint static analysis engine:
```bash
cd frontend
npm run lint
```
*Expected Output: 0 errors.*

---

### 4. Manual End-to-End (E2E) Verification Checklist

Follow these 16 steps to manually verify the full parking management lifecycle:
1. **Bootstrap Admin**: Confirm Super Admin (`admin@parkguard.com`) is seeded or created via `create_admin.py`.
2. **Super Admin Login**: Open `http://localhost:5173/`, click **Sign In**, and authenticate with administrator credentials.
3. **Inspect Dashboard**: Verify summary cards (Total Vehicles, Currently Parked, Available Spaces, Daily Trends) populate from live database records.
4. **Create Department**: Navigate to **Zones & Depts** and create a new department (e.g., `Engineering - ENG`).
5. **Create Parking Zone**: Create a new parking area (e.g., `Zone D - Tech Wing`, capacity 45).
6. **Register Vehicle**: Go to **Vehicles**, click **Register Vehicle**, input license plate, select vehicle type, owner, and assign the new department.
7. **Generate & Print Pass**: Click the vehicle's **ID Card** button. Verify QR code and barcode render accurately.
8. **Create Staff Account**: Navigate to **Staff Accounts** and register a new staff operator.
9. **Staff Login**: Log out of Super Admin and sign in with the new staff credentials. Notice that administrative tabs (Staff, Zones, Audit, Settings) are hidden.
10. **Vehicle Entry via Scanner**: Go to **Scan & Verify**, enter or scan the vehicle's QR token or license plate. Confirm permit status is valid and click **Record Entry**.
11. **Verify Live Occupancy**: Go to **Live Parking**. Verify that the vehicle is listed as currently parked and zone occupancy incremented.
12. **Record Vehicle Exit**: From **Live Parking** or **Scan & Verify**, initiate exit for the vehicle and confirm.
13. **Verify Parking History**: Navigate to **History**. Confirm completed transaction shows calculated duration and both entry/exit operator timestamps.
14. **Report an Incident**: Go to **Incidents**, submit an incident report (e.g., "Tailgating at Gate B").
15. **Resolve Incident**: Sign in as Super Admin and mark the incident as `Resolved` with resolution remarks.
16. **Export Analytical Report**: Go to **Reports**, select **Vehicles** or **Parking Sessions**, and click **Export CSV**. Confirm file downloads and parses in spreadsheet software.
