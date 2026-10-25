# ParkGuard — Parking Management & Barcode System

ParkGuard is a secure, enterprise-grade, browser-based web application designed for parking facilities, commercial campuses, offices, educational institutions, and restricted vehicle zones.

It delivers end-to-end vehicle record lifecycle management, instant cryptographic QR and barcode credential scanning via web camera or hardware scanner, automated gate entry/exit auditing with duration calculations, role-based access control (Super Administrator & Parking Staff), security incident reporting and resolution, streaming CSV reports, and security audit logs.

---

## Web Architecture Overview

ParkGuard is built as a responsive web application running across desktop, laptop, tablet, and mobile browsers:

```text
parkguard-parking-system/
├── frontend/                     # React 19 + TypeScript + Vite + Tailwind CSS v4
│   ├── src/
│   │   ├── components/           # UI Modals & Nav (Navbar, Footer, LoginModal, PrintableCardModal, etc.)
│   │   ├── pages/                # Views (Dashboard, Scanner, Vehicles, Parking, History, Incidents, Reports, Staff, Zones, Audit)
│   │   ├── services/             # Axios API client with automatic JWT bearer authorization
│   │   └── types/                # Strict TypeScript domain interfaces and DTOs
│   ├── public/                   # Static browser assets
│   ├── vercel.json               # SPA routing rewrite rules for Vercel
│   └── package.json              # Web dependencies and build scripts
├── backend/                      # Python 3.14 + FastAPI + SQLAlchemy 2 + Pydantic v2
│   ├── app/
│   │   ├── api/                  # API routers (v1 endpoints for auth, vehicles, scanner, parking, etc.)
│   │   ├── core/                 # Config (BaseSettings), database factory, PBKDF2 security, logging
│   │   ├── middleware/           # Centralized structured JSON error handlers
│   │   ├── models/               # SQLAlchemy relational database models (User, Vehicle, ParkingTransaction, etc.)
│   │   ├── schemas/              # Pydantic v2 request/response schemas with ConfigDict(from_attributes=True)
│   │   ├── services/             # Business logic (bootstrap, audit trail, qrcode generation)
│   │   └── main.py               # FastAPI lifespan & application entrypoint
│   ├── tests/                    # Automated pytest test suite (14 passing tests)
│   ├── requirements.txt          # Python requirements
│   ├── pytest.ini               # Pytest configuration
│   └── .env.example              # Backend environment template
├── docs/                         # Postman collection & environment documentation
├── vercel.json                   # Root Vercel deployment configuration
├── .gitignore                    # Git ignore file for secrets, venvs, DBs, and build outputs
└── README.md                     # Project master documentation
```

---

## Technology Stack

- **Web Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Axios, `html5-qrcode`, `qrcode`.
- **Backend API**: Python 3.14, FastAPI, Pydantic v2, SQLAlchemy 2, PyJWT, PBKDF2-HMAC-SHA256 password hashing.
- **Database**: SQLite for local zero-config development; fully compatible with PostgreSQL via standard SQLAlchemy database URLs (`postgresql+psycopg2://...`).
- **Security**: Scoped RBAC (`super_admin`, `staff`), token revocation, rate-limited login, cryptographic QR/barcode tokens (`PGQR-...`), sanitized log formatter.

---

## Local Development Setup

### 1. Backend Setup

1. Open a terminal in the backend directory:
   ```bash
   cd backend
   ```
2. Activate the Python virtual environment:
   ```powershell
   # Windows
   .\venv\Scripts\activate

   # Linux / macOS
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the automated test suite:
   ```powershell
   .\venv\Scripts\pytest.exe -v
   ```
5. Start the FastAPI development server:
   ```powershell
   .\venv\Scripts\uvicorn.exe app.main:app --reload --host 127.0.0.1 --port 8000
   ```
6. Interactive API Documentation:
   - **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
   - **Health Diagnostic**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

### 2. Frontend Setup

1. Open a second terminal in the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run TypeScript type checks and build verification:
   ```bash
   npm run build
   ```
4. Start the Vite local development server:
   ```bash
   npm run dev
   ```
5. Access the web application:
   - **Web Dashboard**: [http://localhost:5173](http://localhost:5173)

---

## Initial Default Super Administrator Credentials

Upon first startup, the database is automatically created and seeded with default departments, parking areas, and an initial Super Administrator:

- **Email**: `admin@parkguard.com`
- **Password**: `Admin@ParkGuard2026!`
- **Role**: `super_admin`

> **Security Note:** You can safely change the password via the `/api/v1/auth/change-password` endpoint or via the authenticated UI.

---

## Core System Features

1. **Authentication & Role-Based Access Control**:
   - Super Admin & Parking Staff permissions.
   - JWT tokens with 12-hour expiration.
   - Safe password reset and change workflows.

2. **Vehicle Management**:
   - Registration with Plate Number, Vehicle Type (Car, Motorcycle, Van, Truck, Bus), Make, Model, Color, Owner Name, Phone, Department, and Zone.
   - Unique QR token (`PGQR-XXXX`) and Barcode token (`PGBAR-XXXX`) generation.
   - Printable Vehicle Permit Pass modal with high-density QR code rendering.
   - Search, filter by category and active/deactivated status, and duplicate registration protection.

3. **QR & Barcode Scanner**:
   - Web browser camera integration powered by `html5-qrcode`.
   - Manual license plate and token lookup fallback.
   - Instant validation: detects unregistered vehicles, blocked permits, and active parking states.
   - 1-click Check-in and Check-out directly from the scanning console.

4. **Live Parking & Duration Tracking**:
   - Real-time list of currently parked vehicles.
   - Automated duration calculation (e.g. `2h 15m`).
   - Duplicate entry prevention (rejects entry for already parked vehicles).
   - Exit validation (requires existing open entry session).

5. **Security Incidents**:
   - Report wrong parking, blocked driveways, unauthorized parking, and security follow-ups.
   - Resolution workflow with security officer notes and audit tracking.

6. **Executive Dashboard & Reports**:
   - Non-mocked KPI metrics: Registered Permits, Currently Parked, Daily Entries, Daily Exits, Open Incidents, Occupancy %.
   - 7-day entry/exit trend graphs.
   - Vehicle category distribution bars.
   - RFC 4180 streaming CSV exports for Vehicles, Parking Transactions, Incidents, and Scan Events.

7. **Zones & Departments Management**:
   - Institutional department management with unique codes.
   - Parking zone management with total bay capacity and real-time occupancy visual indicators.

8. **Audit Trail**:
   - Immutable security log of logins, vehicle creations, token regenerations, and gate actions.
   - Sensitive credential redactor preventing password leaks.

---

## API Endpoints Reference

| Category | Method | Endpoint | Access |
|---|---|---|---|
| **System** | `GET` | `/health` | Public |
| | `GET` | `/ready` | Public |
| | `GET` | `/api/v1/health` | Public |
| **Auth** | `POST` | `/api/v1/auth/login` | Public |
| | `GET` | `/api/v1/auth/me` | Authenticated |
| | `POST` | `/api/v1/auth/change-password` | Authenticated |
| **Vehicles** | `GET` | `/api/v1/vehicles` | Staff / Admin |
| | `POST` | `/api/v1/vehicles` | Staff / Admin |
| | `GET` | `/api/v1/vehicles/{id}` | Staff / Admin |
| | `PUT` | `/api/v1/vehicles/{id}` | Staff / Admin |
| | `PATCH`| `/api/v1/vehicles/{id}/deactivate` | Staff / Admin |
| | `POST` | `/api/v1/vehicles/{id}/regenerate-tokens` | Staff / Admin |
| | `GET` | `/api/v1/vehicles/{id}/card` | Staff / Admin |
| **Scanner** | `POST` | `/api/v1/scanner/validate` | Staff / Admin |
| | `GET` | `/api/v1/scanner/history` | Staff / Admin |
| **Parking** | `POST` | `/api/v1/parking/entry` | Staff / Admin |
| | `POST` | `/api/v1/parking/exit` | Staff / Admin |
| | `GET` | `/api/v1/parking/parked` | Staff / Admin |
| | `GET` | `/api/v1/parking/transactions` | Staff / Admin |
| **Dashboard**| `GET` | `/api/v1/dashboard/stats` | Staff / Admin |
| **Reports** | `GET` | `/api/v1/reports/export-csv` | Staff / Admin |
| **Incidents**| `GET` | `/api/v1/incidents` | Staff / Admin |
| | `POST` | `/api/v1/incidents` | Staff / Admin |
| | `PUT` | `/api/v1/incidents/{id}` | Staff / Admin |
| **Users** | `GET` | `/api/v1/users` | Super Admin |
| | `POST` | `/api/v1/users` | Super Admin |
| | `PUT` | `/api/v1/users/{id}` | Super Admin |
| **Zones** | `GET` | `/api/v1/departments` | Staff / Admin |
| | `POST` | `/api/v1/departments` | Super Admin |
| | `GET` | `/api/v1/parking-areas` | Staff / Admin |
| | `POST` | `/api/v1/parking-areas` | Super Admin |
| **Audit** | `GET` | `/api/v1/audit` | Super Admin |

---

## Vercel Deployment Guide

1. Push code to the GitHub repository: `parkguard-parking-system`.
2. Connect the repository in your [Vercel Dashboard](https://vercel.com).
3. Set the **Framework Preset** to `Vite`.
4. Configure the **Root Directory** as `frontend` (or leave as root; `vercel.json` will build `frontend/dist`).
5. Set Environment Variable:
   - `VITE_API_BASE_URL`: `https://your-backend-domain.com/api/v1`
6. Deploy! The frontend is an SPA with SPA client rewrite rules configured in `vercel.json`.

---

## Required Footer Notice

Parking Management & Barcode System | Designed & Developed by Abeha Inam
