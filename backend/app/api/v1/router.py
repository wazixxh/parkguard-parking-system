from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    auth,
    users,
    vehicles,
    parking,
    scanner,
    dashboard,
    reports,
    incidents,
    departments,
    audit,
)

api_router = APIRouter()

# Health & Diagnostics
api_router.include_router(health.router, tags=["Health"])

# Authentication & Sessions
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Staff & Role Management
api_router.include_router(users.router, prefix="/users", tags=["Staff & Roles"])

# Vehicle Management
api_router.include_router(vehicles.router, prefix="/vehicles", tags=["Vehicles"])

# Parking Operations (Entry / Exit / Live Parked)
api_router.include_router(parking.router, prefix="/parking", tags=["Parking Operations"])

# QR & Barcode Scanner
api_router.include_router(scanner.router, prefix="/scanner", tags=["Scanner & Verification"])

# Dashboard & Realtime Analytics
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard Analytics"])

# Reports & Exports
api_router.include_router(reports.router, prefix="/reports", tags=["Reports & CSV Exports"])

# Incidents & Wrong Parking
api_router.include_router(incidents.router, prefix="/incidents", tags=["Incidents"])

# Departments & Parking Areas
api_router.include_router(departments.router, tags=["Departments & Parking Areas"])

# Security Audit Logs
api_router.include_router(audit.router, prefix="/audit", tags=["Audit Logs"])
