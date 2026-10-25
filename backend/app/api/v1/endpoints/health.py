from datetime import datetime, timezone
from fastapi import APIRouter, status, Response
from app.core.config import settings
from app.core.database import check_db_connection

router = APIRouter()


@router.get("/health", summary="Basic Health Check")
def health_check():
    """Returns general health status of the API."""
    db_ok = check_db_connection()
    return {
        "status": "healthy" if db_ok else "degraded",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "database": "connected" if db_ok else "disconnected",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/health/ready", summary="Service Readiness Probe")
def readiness_check(response: Response):
    """
    Readiness probe to verify database connectivity.
    Returns HTTP 200 when ready, HTTP 503 if database is unavailable.
    """
    db_ok = check_db_connection()
    if not db_ok:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {
            "status": "unavailable",
            "database": "disconnected",
            "message": "Database connection cannot be established.",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    return {
        "status": "ready",
        "database": "connected",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
