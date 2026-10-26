# ParkGuard — Database Schema & Data Models

### 1. Overview
The database layer is designed using **SQLAlchemy 2.0 ORM** with declarative models. It adheres to strict normalization standards, foreign key constraints, unique indexes, and audit timestamps. The schema is portable between **SQLite** (local development and single-server deployments) and **PostgreSQL** (distributed multi-container deployments).

---

### 2. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS ||--o{ AUDIT_LOGS : performs
    USERS ||--o{ PARKING_SESSIONS : records_entry
    USERS ||--o{ PARKING_SESSIONS : records_exit
    USERS ||--o{ INCIDENTS : reports
    USERS ||--o{ INCIDENTS : resolves

    DEPARTMENTS ||--o{ VEHICLES : categorizes
    PARKING_AREAS ||--o{ PARKING_SESSIONS : hosts
    PARKING_AREAS ||--o{ INCIDENTS : locates

    VEHICLES ||--o{ VEHICLE_CODES : possesses
    VEHICLES ||--o{ PARKING_SESSIONS : enters
    VEHICLES ||--o{ INCIDENTS : involves

    USERS {
        int id PK
        string email UK
        string full_name
        string hashed_password
        string role "super_admin | staff"
        boolean is_active
        datetime last_login_at
        datetime created_at
        datetime updated_at
    }

    DEPARTMENTS {
        int id PK
        string name
        string code UK
        string description
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    PARKING_AREAS {
        int id PK
        string name
        string code UK
        int total_capacity
        int current_occupancy
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    VEHICLES {
        int id PK
        string plate_number UK
        string vehicle_type "car | motorcycle | scooter | van | pickup | truck | bus | other"
        string owner_name
        string owner_contact
        string make
        string model
        string color
        int department_id FK
        string status "active | inactive | banned"
        string notes
        datetime created_at
        datetime updated_at
    }

    VEHICLE_CODES {
        int id PK
        int vehicle_id FK
        string code_token UK
        string code_type "qr | barcode"
        string status "active | revoked | expired"
        datetime issued_at
        datetime revoked_at
    }

    PARKING_SESSIONS {
        int id PK
        string session_uid UK
        int vehicle_id FK
        int parking_area_id FK
        datetime entry_time
        datetime exit_time
        int entry_operator_id FK
        int exit_operator_id FK
        string status "parked | completed | cancelled"
        string notes
        datetime created_at
        datetime updated_at
    }

    INCIDENTS {
        int id PK
        string incident_uid UK
        string category "unauthorized_entry | damaged_property | overstay | invalid_code | capacity_breach | other"
        string priority "low | medium | high | critical"
        string status "open | under_review | resolved | closed"
        string description
        int vehicle_id FK
        int parking_area_id FK
        int reported_by_id FK
        int resolved_by_id FK
        string resolution_notes
        datetime resolved_at
        datetime created_at
        datetime updated_at
    }

    AUDIT_LOGS {
        int id PK
        int user_id FK
        string action
        string resource_type
        string resource_id
        string ip_address
        json details
        datetime created_at
    }

    SYSTEM_SETTINGS {
        int id PK
        string setting_key UK
        string setting_value
        string description
        datetime updated_at
    }
```

---

### 3. Detailed Table Specifications

#### 3.1. `users`
Stores administrative and staff credentials, roles, and account statuses.
- `id` (INTEGER, Primary Key, Autoincrement)
- `email` (VARCHAR(255), Unique, Not Null, Indexed)
- `full_name` (VARCHAR(255), Not Null)
- `hashed_password` (VARCHAR(255), Not Null) — Argon2id or Bcrypt hash
- `role` (VARCHAR(50), Not Null, Default `'staff'`) — Values: `'super_admin'`, `'staff'`
- `is_active` (BOOLEAN, Not Null, Default `TRUE`)
- `last_login_at` (DATETIME, Nullable)
- `created_at` (DATETIME, Default UTC Now)
- `updated_at` (DATETIME, Default UTC Now)

#### 3.2. `departments`
Enterprise organizational divisions for vehicular classification.
- `id` (INTEGER, Primary Key, Autoincrement)
- `name` (VARCHAR(255), Not Null)
- `code` (VARCHAR(50), Unique, Not Null, Indexed)
- `description` (TEXT, Nullable)
- `is_active` (BOOLEAN, Not Null, Default `TRUE`)
- `created_at` (DATETIME, Default UTC Now)
- `updated_at` (DATETIME, Default UTC Now)

#### 3.3. `parking_areas`
Physical parking zones, garages, or lots with capacity enforcement.
- `id` (INTEGER, Primary Key, Autoincrement)
- `name` (VARCHAR(255), Not Null)
- `code` (VARCHAR(50), Unique, Not Null, Indexed)
- `total_capacity` (INTEGER, Not Null, Check `total_capacity >= 0`)
- `current_occupancy` (INTEGER, Not Null, Default `0`, Check `current_occupancy >= 0`)
- `is_active` (BOOLEAN, Not Null, Default `TRUE`)
- `created_at` (DATETIME, Default UTC Now)
- `updated_at` (DATETIME, Default UTC Now)

#### 3.4. `vehicles`
Master registry of authorized vehicles.
- `id` (INTEGER, Primary Key, Autoincrement)
- `plate_number` (VARCHAR(50), Unique, Not Null, Indexed)
- `vehicle_type` (VARCHAR(50), Not Null, Default `'car'`) — Allowed: `car`, `motorcycle`, `scooter`, `van`, `pickup`, `truck`, `bus`, `other`
- `owner_name` (VARCHAR(255), Not Null)
- `owner_contact` (VARCHAR(50), Nullable)
- `make` (VARCHAR(100), Nullable)
- `model` (VARCHAR(100), Nullable)
- `color` (VARCHAR(50), Nullable)
- `department_id` (INTEGER, Foreign Key referencing `departments.id`, Nullable)
- `status` (VARCHAR(50), Not Null, Default `'active'`) — Allowed: `'active'`, `'inactive'`, `'banned'`
- `notes` (TEXT, Nullable)
- `created_at` (DATETIME, Default UTC Now)
- `updated_at` (DATETIME, Default UTC Now)

#### 3.5. `vehicle_codes`
High-entropy cryptographic tokens for QR codes and barcodes.
- `id` (INTEGER, Primary Key, Autoincrement)
- `vehicle_id` (INTEGER, Foreign Key referencing `vehicles.id`, Not Null, Indexed)
- `code_token` (VARCHAR(100), Unique, Not Null, Indexed) — High-entropy UUID hex
- `code_type` (VARCHAR(50), Not Null, Default `'qr'`) — Values: `'qr'`, `'barcode'`
- `status` (VARCHAR(50), Not Null, Default `'active'`) — Values: `'active'`, `'revoked'`, `'expired'`
- `issued_at` (DATETIME, Default UTC Now)
- `revoked_at` (DATETIME, Nullable)

#### 3.6. `parking_sessions`
Transactional record of entry, exit, duration, and supervisory staff.
- `id` (INTEGER, Primary Key, Autoincrement)
- `session_uid` (VARCHAR(100), Unique, Not Null, Indexed)
- `vehicle_id` (INTEGER, Foreign Key referencing `vehicles.id`, Not Null, Indexed)
- `parking_area_id` (INTEGER, Foreign Key referencing `parking_areas.id`, Not Null, Indexed)
- `entry_time` (DATETIME, Not Null, Default UTC Now, Indexed)
- `exit_time` (DATETIME, Nullable)
- `entry_operator_id` (INTEGER, Foreign Key referencing `users.id`, Nullable)
- `exit_operator_id` (INTEGER, Foreign Key referencing `users.id`, Nullable)
- `status` (VARCHAR(50), Not Null, Default `'parked'`) — Values: `'parked'`, `'completed'`, `'cancelled'`
- `notes` (TEXT, Nullable)
- `created_at` (DATETIME, Default UTC Now)
- `updated_at` (DATETIME, Default UTC Now)

#### 3.7. `incidents`
Security reports, property damage, unauthorized entry attempts, or overstays.
- `id` (INTEGER, Primary Key, Autoincrement)
- `incident_uid` (VARCHAR(100), Unique, Not Null, Indexed)
- `category` (VARCHAR(100), Not Null)
- `priority` (VARCHAR(50), Not Null, Default `'medium'`) — Values: `'low'`, `'medium'`, `'high'`, `'critical'`
- `status` (VARCHAR(50), Not Null, Default `'open'`) — Values: `'open'`, `'under_review'`, `'resolved'`, `'closed'`
- `description` (TEXT, Not Null)
- `vehicle_id` (INTEGER, Foreign Key referencing `vehicles.id`, Nullable)
- `parking_area_id` (INTEGER, Foreign Key referencing `parking_areas.id`, Nullable)
- `reported_by_id` (INTEGER, Foreign Key referencing `users.id`, Nullable)
- `resolved_by_id` (INTEGER, Foreign Key referencing `users.id`, Nullable)
- `resolution_notes` (TEXT, Nullable)
- `resolved_at` (DATETIME, Nullable)
- `created_at` (DATETIME, Default UTC Now)
- `updated_at` (DATETIME, Default UTC Now)

#### 3.8. `audit_logs`
Tamper-resistant audit log capturing all system operations.
- `id` (INTEGER, Primary Key, Autoincrement)
- `user_id` (INTEGER, Foreign Key referencing `users.id`, Nullable, Indexed)
- `action` (VARCHAR(100), Not Null, Indexed)
- `resource_type` (VARCHAR(100), Not Null, Indexed)
- `resource_id` (VARCHAR(100), Nullable)
- `ip_address` (VARCHAR(50), Nullable)
- `details` (JSON / TEXT, Nullable)
- `created_at` (DATETIME, Default UTC Now, Indexed)

#### 3.9. `system_settings`
Dynamic key-value operational preferences configured by Super Admin.
- `id` (INTEGER, Primary Key, Autoincrement)
- `setting_key` (VARCHAR(100), Unique, Not Null, Indexed)
- `setting_value` (TEXT, Not Null)
- `description` (VARCHAR(255), Nullable)
- `updated_at` (DATETIME, Default UTC Now)

---

### 4. Integrity Rules & Business Invariants
1. **Single Active Parking Session**: A vehicle cannot have more than one record in `parking_sessions` where `status = 'parked'`. An attempt to record an entry while parked raises HTTP `400 Bad Request`.
2. **Atomic Capacity Synchronization**: When an entry is recorded, `parking_areas.current_occupancy` increments atomically. When exit is recorded, `current_occupancy` decrements safely (guarded against underflow below zero).
3. **No Hard Deletes**: Vehicles, departments, and parking zones with historical parking sessions or incident associations cannot be deleted via API. Deactivation flags (`status = 'inactive'`, `is_active = FALSE`) are applied to preserve auditability.
4. **Token Invalidation**: When a vehicle's pass is revoked or regenerated, all previous `vehicle_codes` are marked `revoked` and immediately rejected by the scanner endpoint.
