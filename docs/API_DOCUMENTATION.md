# ParkGuard — REST API Documentation (v1)

### 1. Base URL & Authentication Protocol
- **Base Endpoint**: `/api/v1`
- **Protocol**: HTTP/1.1 or HTTP/2 over TLS (HTTPS in production)
- **Authentication Scheme**: Bearer Token Authorization Header
  ```http
  Authorization: Bearer <access_token>
  ```
- **Direct Download Token Support**: For browser file downloads (such as CSV export), the token may be supplied as a URL query parameter:
  ```http
  GET /api/v1/reports/export-csv?report_type=vehicles&token=<access_token>
  ```
- **Standard Error Response Format**:
  ```json
  {
    "error": {
      "code": "BAD_REQUEST",
      "message": "Human readable error description",
      "timestamp": "2026-10-26T12:00:00Z"
    }
  }
  ```

---

### 2. Authentication Endpoints (`/api/v1/auth`)

#### 2.1. Login
- **Method & Path**: `POST /api/v1/auth/login`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "admin@parkguard.com",
    "password": "YourStrongPassword123!"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
    "token_type": "bearer",
    "role": "super_admin",
    "email": "admin@parkguard.com",
    "full_name": "ParkGuard Super Administrator"
  }
  ```

#### 2.2. Get Current Authenticated Profile
- **Method & Path**: `GET /api/v1/auth/me`
- **Access**: Authenticated (Super Admin or Staff)
- **Success Response (200 OK)**:
  ```json
  {
    "id": 1,
    "email": "admin@parkguard.com",
    "full_name": "ParkGuard Super Administrator",
    "role": "super_admin",
    "is_active": true,
    "last_login_at": "2026-10-26T10:15:30Z"
  }
  ```

#### 2.3. Change Account Password
- **Method & Path**: `POST /api/v1/auth/change-password`
- **Access**: Authenticated (Super Admin or Staff)
- **Request Body**:
  ```json
  {
    "current_password": "OldPassword123!",
    "new_password": "NewStrongPassword456!"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Password changed successfully"
  }
  ```

---

### 3. Dashboard Endpoints (`/api/v1/dashboard`)

#### 3.1. Overview Statistics
- **Method & Path**: `GET /api/v1/dashboard/stats`
- **Access**: Authenticated
- **Success Response (200 OK)**:
  ```json
  {
    "total_vehicles": 142,
    "currently_parked": 28,
    "entries_today": 64,
    "exits_today": 36,
    "open_incidents": 2,
    "total_capacity": 260,
    "available_spaces": 232,
    "occupancy_rate_pct": 10.77,
    "vehicle_type_distribution": [
      { "type": "car", "count": 110 },
      { "type": "motorcycle", "count": 22 },
      { "type": "van", "count": 10 }
    ],
    "daily_activity_trends": [
      { "date": "2026-10-20", "entries": 42, "exits": 40 },
      { "date": "2026-10-26", "entries": 64, "exits": 36 }
    ]
  }
  ```

---

### 4. Vehicle Management Endpoints (`/api/v1/vehicles`)

#### 4.1. List Vehicles
- **Method & Path**: `GET /api/v1/vehicles?page=1&limit=20&search=ABC&vehicle_type=car&status=active`
- **Access**: Authenticated
- **Success Response (200 OK)**:
  ```json
  {
    "items": [
      {
        "id": 1,
        "plate_number": "ABC-1234",
        "vehicle_type": "car",
        "owner_name": "Dr. Sarah Connor",
        "owner_contact": "+1-555-0199",
        "make": "Toyota",
        "model": "Camry Hybrid",
        "color": "Midnight Black",
        "department_id": 2,
        "department_name": "Executive Management",
        "status": "active",
        "created_at": "2026-10-25T08:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
  ```

#### 4.2. Register Vehicle
- **Method & Path**: `POST /api/v1/vehicles`
- **Access**: Super Admin
- **Request Body**:
  ```json
  {
    "plate_number": "XYZ-9876",
    "vehicle_type": "car",
    "owner_name": "John Doe",
    "owner_contact": "+1-555-0122",
    "make": "Tesla",
    "model": "Model 3",
    "color": "Pearl White",
    "department_id": 1,
    "notes": "VIP parking sticker issued"
  }
  ```
- **Success Response (201 Created)**: Returns the newly registered vehicle object with auto-generated initial QR/Barcode token.

#### 4.3. Update Vehicle
- **Method & Path**: `PUT /api/v1/vehicles/{vehicle_id}`
- **Access**: Super Admin
- **Request Body**: Same fields as registration.

#### 4.4. Deactivate Vehicle
- **Method & Path**: `POST /api/v1/vehicles/{vehicle_id}/deactivate`
- **Access**: Super Admin

#### 4.5. Printable Vehicle Pass Card
- **Method & Path**: `GET /api/v1/vehicles/{vehicle_id}/printable-card`
- **Access**: Authenticated

---

### 5. Scanner & Parking Verification (`/api/v1/scanner` & `/api/v1/parking`)

#### 5.1. Scan & Lookup Identifier
- **Method & Path**: `POST /api/v1/scanner/verify`
- **Access**: Authenticated (Staff & Super Admin)
- **Request Body**:
  ```json
  {
    "identifier": "QR_CODE_TOKEN_OR_PLATE_NUMBER"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "vehicle": {
      "id": 1,
      "plate_number": "ABC-1234",
      "owner_name": "Dr. Sarah Connor",
      "vehicle_type": "car",
      "status": "active"
    },
    "current_status": "parked",
    "active_session": {
      "session_uid": "SESS-2026-0001",
      "parking_area_name": "Zone A — Executive Lot",
      "entry_time": "2026-10-26T08:30:00Z"
    },
    "suggested_action": "exit"
  }
  ```

#### 5.2. Record Vehicle Entry
- **Method & Path**: `POST /api/v1/parking/entry`
- **Access**: Authenticated
- **Request Body**:
  ```json
  {
    "vehicle_id": 1,
    "parking_area_id": 1,
    "notes": "Verified at Gate 1"
  }
  ```

#### 5.3. Record Vehicle Exit
- **Method & Path**: `POST /api/v1/parking/exit`
- **Access**: Authenticated
- **Request Body**:
  ```json
  {
    "vehicle_id": 1,
    "notes": "Cleared via East Gate"
  }
  ```

#### 5.4. List Active Sessions
- **Method & Path**: `GET /api/v1/parking/active`
- **Access**: Authenticated

#### 5.5. Search Parking History
- **Method & Path**: `GET /api/v1/parking/history?page=1&limit=25&status=completed`
- **Access**: Authenticated

---

### 6. Incidents Management (`/api/v1/incidents`)

#### 6.1. List Incidents
- **Method & Path**: `GET /api/v1/incidents?status=open&priority=high`
- **Access**: Authenticated

#### 6.2. Report Incident
- **Method & Path**: `POST /api/v1/incidents`
- **Access**: Authenticated
- **Request Body**:
  ```json
  {
    "category": "unauthorized_entry",
    "priority": "high",
    "description": "Vehicle entered without stopping for badge verification",
    "vehicle_id": 1,
    "parking_area_id": 2
  }
  ```

#### 6.3. Update Incident / Resolve
- **Method & Path**: `PUT /api/v1/incidents/{incident_id}`
- **Access**: Super Admin
- **Request Body**:
  ```json
  {
    "status": "resolved",
    "resolution_notes": "Driver identified and security clearance verified"
  }
  ```

---

### 7. Reports & CSV Export (`/api/v1/reports`)

#### 7.1. Export Analytical CSV
- **Method & Path**: `GET /api/v1/reports/export-csv?report_type=vehicles|parking|incidents&token=<token>`
- **Access**: Super Admin
- **Response**: Streamed CSV attachment (`Content-Type: text/csv`)

---

### 8. System Settings (`/api/v1/settings`)

#### 8.1. Get Settings
- **Method & Path**: `GET /api/v1/settings`
- **Access**: Authenticated

#### 8.2. Update Settings
- **Method & Path**: `PATCH /api/v1/settings`
- **Access**: Super Admin
- **Request Body**:
  ```json
  {
    "settings": {
      "organization_name": "ParkGuard Global HQ",
      "facility_location": "Gate A & Gate B North Wing",
      "timezone": "America/New_York",
      "enforce_capacity_limits": "true",
      "default_grace_period_mins": "20",
      "max_duration_hours": "48"
    }
  }
  ```

---

### 9. Audit Logs (`/api/v1/audit-logs`)
- **Method & Path**: `GET /api/v1/audit-logs?page=1&limit=50&action=update_settings`
- **Access**: Super Admin
