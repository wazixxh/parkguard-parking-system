# ParkGuard — Parking Management & Barcode System

ParkGuard is a secure, enterprise-grade parking management and vehicle identification system designed for offices, educational institutions, commercial facilities, and restricted parking zones. It delivers real-time vehicle records, QR and barcode credential scanning, automated entry/exit auditing, role-based access control, incident management, and analytical reporting.

---

## Architecture Overview

ParkGuard is architected with a decoupled frontend and backend:

```text
parkguard-parking-system/
├── frontend/                     # React 19 + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/           # Reusable UI components (Footer, Modal, Navbar, etc.)
│   │   ├── layouts/              # Dashboard and auth layout wrappers
│   │   ├── pages/                # Route views (Dashboard, Vehicles, Scanner, Reports)
│   │   ├── features/             # Domain-specific modules
│   │   ├── hooks/                # Custom React hooks
│   │   ├── services/             # Axios API client and backend service wrappers
│   │   ├── types/                # TypeScript interfaces and DTOs
│   │   ├── utils/                # Date, string, and formatting helpers
│   │   └── assets/               # Static icons and assets
│   ├── public/                   # Public static files
│   ├── package.json              # Frontend dependencies and build scripts
│   ├── vercel.json               # SPA routing rewrite rules for Vercel
│   └── vite.config.ts            # Vite + React + TailwindCSS plugin setup
├── backend/                      # Python + FastAPI + SQLAlchemy + SQLite/PostgreSQL
│   ├── app/
│   │   ├── api/                  # API routers (v1 endpoints for health, auth, vehicles, etc.)
│   │   ├── core/                 # Config (BaseSettings), database factory, structured logging
│   │   ├── middleware/           # Centralized error and validation handlers
│   │   ├── models/               # SQLAlchemy relational database models
│   │   ├── repositories/         # Database access layer
│   │   ├── schemas/              # Pydantic request/response validation schemas
│   │   ├── services/             # Business logic layer
│   │   └── main.py               # FastAPI application entrypoint
│   ├── tests/                    # Automated pytest test suite
│   ├── requirements.txt          # Python package requirements
│   ├── pytest.ini               # Pytest path and runner configuration
│   └── .env.example              # Backend environment template
├── docs/                         # Architecture, schemas, and API documentation
├── .gitignore                    # Git ignore file for secrets, venvs, and build outputs
├── README.md                     # Project documentation and developer setup
└── .env.example                  # Master environment variable template
```

---

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, React Router, Lucide Icons, Axios.
- **Backend**: Python 3.14, FastAPI, Pydantic v2, SQLAlchemy 2, Alembic, PyJWT.
- **Database**: SQLite (initial development), designed for seamless PostgreSQL migration via SQLAlchemy database URLs.
- **Authentication**: JWT token-based authentication with role-based access control (Super Admin, Parking Staff).

---

## Local Development Setup

### Prerequisites
- Python 3.11+ (Python 3.14 supported)
- Node.js 18+ (Node.js 20+ recommended)
- npm or pnpm

### 1. Backend Setup

1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # Windows
   py -m venv venv
   .\venv\Scripts\activate

   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
5. Run the automated test suite:
   ```bash
   pytest -v
   ```
6. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
7. Open interactive API documentation in your browser:
   - Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - ReDoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
   - Health Probe: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

### 2. Frontend Setup

1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
4. Verify TypeScript checks and build bundle:
   ```bash
   npm run build
   ```
5. Start the frontend development server:
   ```bash
   npm run dev
   ```
6. Open the application in your browser:
   - Dashboard: [http://localhost:5173](http://localhost:5173)

---

## API Endpoints (Stage 1 Core)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Root API service information |
| `GET` | `/health` | Live system health and database connectivity |
| `GET` | `/ready` | Readiness probe (returns 200 or 503) |
| `GET` | `/api/v1/health` | API v1 versioned health endpoint |

---

## Footer Notice

Parking Management & Barcode System | Designed & Developed by Abeha Inam
