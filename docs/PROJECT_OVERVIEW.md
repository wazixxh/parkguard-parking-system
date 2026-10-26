# ParkGuard — Parking Management & Barcode System
## System Architecture & Project Overview

### 1. Executive Summary
**ParkGuard** is a centralized, production-grade, web-based parking management and barcode/QR verification platform designed for enterprise offices, university campuses, medical centers, commercial facilities, and high-density parking operations. It replaces manual paper logbooks, handwritten receipts, and error-prone gatekeeping with a digital, tamper-resistant, real-time tracking workflow.

The system is delivered strictly as a modern, responsive browser web application accessible across desktop workstations, tablets, and mobile web browsers without requiring native app installations.

---

### 2. Core Missions & Objectives
- **Zero-Friction Access**: Instant verification of authorized vehicles through browser camera QR scanning, physical USB barcode scanners, or manual license plate lookup.
- **Strict Role-Based Access Control (RBAC)**: Secure separation between Super Administrative controls (staff onboarding, capacity rules, system settings, financial/operational reports, audit trails) and Operational Staff privileges (scanning, vehicle entry/exit, incident reporting).
- **Accurate Capacity & Occupancy Tracking**: Live per-zone and campus-wide vehicle accounting with automated capacity limit enforcement to prevent overfilling.
- **Auditability & Traceability**: Immutable event trail capturing all administrative, security, and parking transactions with IP address logging and actor identification.
- **Physical Identification Issuance**: Printable vehicle passes featuring high-entropy encrypted QR tokens and barcodes formatted for standard desktop and thermal card printers.

---

### 3. Architecture Overview

```
+-----------------------------------------------------------------------------------+
|                                  BROWSER CLIENT                                   |
|  React 19 + TypeScript + Vite + Tailwind CSS (Lucide Icons, Html5-QRCode, JsBarcode)|
+-----------------------------------------+-----------------------------------------+
                                          |
                        HTTPS / JSON REST API with Bearer Token
                                          |
+-----------------------------------------v-----------------------------------------+
|                               FASTAPI APPLICATION                                 |
|  - Uvicorn ASGI Server                                                           |
|  - Authentication & RBAC (Argon2id password hashing, PyJWT Bearer validation)     |
|  - REST API Routers (/auth, /vehicles, /parking, /incidents, /reports, /settings) |
|  - Pydantic v2 Input/Output Serialization & Validation Filters                   |
|  - Audit Service & Concurrency Protections                                       |
+-----------------------------------------+-----------------------------------------+
                                          |
                               SQLAlchemy 2.0 ORM
                                          |
+-----------------------------------------v-----------------------------------------+
|                                PERSISTENCE LAYER                                  |
|  SQLite (Local Development / Edge) <---> PostgreSQL (Multi-Worker Cloud Production)|
|  Managed schema versioning via Alembic Migrations                                 |
+-----------------------------------------------------------------------------------+
```

---

### 4. User Roles & Capabilities

| Capability / Resource | Super Admin | Parking Staff | Anonymous / Public |
| :--- | :---: | :---: | :---: |
| Authenticate via Email & Password | Yes | Yes | No |
| Change Own Password | Yes | Yes | No |
| Live Dashboard Metrics & Graphs | Full Campus | Zone-Specific | No |
| Scan QR / Barcode & Lookup Plates | Yes | Yes | No |
| Record Vehicle Entry & Exit | Yes | Yes | No |
| Register & Edit Vehicles | Yes | View Only | No |
| Print Vehicle Pass Cards | Yes | Yes | No |
| Generate / Revoke Vehicle Barcodes | Yes | No | No |
| Report Operational Incidents | Yes | Yes | No |
| Resolve / Close Incidents | Yes | No | No |
| Export Analytical CSV Reports | Yes | No | No |
| Manage Staff Accounts | Yes | No | No |
| Configure Parking Zones & Capacities | Yes | No | No |
| Manage Departments | Yes | No | No |
| Configure System Preferences & Settings | Yes | No | No |
| Inspect Audit Trail Logs | Yes | No | No |

---

### 5. Technology Stack Summary

#### Frontend
- **Framework**: React 19 with TypeScript
- **Bundler & Tooling**: Vite 8.3
- **Styling**: Tailwind CSS (Dark charcoal `#0a0b10`, deep violet `#7c3aed`, neon accents `#a855f7`)
- **Icons**: Lucide React
- **Scanning**: Html5-QRCode (browser camera video stream with manual input fallback)
- **Barcode & QR Rendering**: JsBarcode + QrCode canvas generators
- **HTTP Client**: Axios with JWT Bearer interceptor and unified error handling

#### Backend
- **Language**: Python 3.14 / 3.11+
- **Framework**: FastAPI (Asynchronous REST API)
- **Data Validation**: Pydantic v2
- **ORM**: SQLAlchemy 2.0
- **Database Engine**: SQLite with WAL mode (PostgreSQL ready)
- **Migrations**: Alembic
- **Security & Crypto**: Passlib with Argon2id / Bcrypt, PyJWT for JWT access tokens
- **Testing**: Pytest with HTTPX TestClient

---

### 6. Design System & Aesthetics
ParkGuard embraces a modern, high-contrast, security-focused dark theme:
- **Base Background**: Deep Charcoal `#0a0b10` and Obsidian `#0f1019`
- **Surface Elevation**: `#161826` and `#1a1d30` with subtle glassmorphic borders (`#25283d`)
- **Accent Elements**: Vibrant Purple & Violet gradients (`#7c3aed` to `#6366f1`)
- **Status Semantics**:
  - Emerald Green (`#10b981`) for Parked / Active / Online
  - Crimson Red (`#ef4444`) for High-Priority Incidents / Overstay / Exited
  - Amber Orange (`#f59e0b`) for Warnings / Maintenance / Under-Review
  - Cyan Blue (`#06b6d4`) for Information / Badges

---

### 7. Mandated Legal & Branding Footer
Every administrative and operational screen in ParkGuard displays the exact required branding footer:
```text
Parking Management & Barcode System | Designed & Developed by Abeha Inam
```
