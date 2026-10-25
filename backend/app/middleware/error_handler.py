import sys
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.exc import SQLAlchemyError
from app.core.logging import logger
from app.core.config import settings


async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle standard HTTP exceptions with structured response."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": f"HTTP_{exc.status_code}",
                "message": exc.detail if isinstance(exc.detail, str) else "Request error",
                "details": exc.detail if not isinstance(exc.detail, str) else None
            }
        }
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle request validation errors cleanly without leaking internal schemas."""
    errors = []
    for error in exc.errors():
        field = " -> ".join([str(loc) for loc in error.get("loc", []) if loc != "body"])
        msg = error.get("msg", "Invalid input")
        errors.append({"field": field or "body", "message": msg})

    logger.warning(f"Validation error on {request.method} {request.url.path}: {errors}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Input validation failed. Please check the submitted fields.",
                "details": errors
            }
        }
    )


async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    """Handle database errors safely without exposing SQL queries or stack traces."""
    logger.error(f"Database error on {request.method} {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "DATABASE_ERROR",
                "message": "A database error occurred. Your request could not be processed.",
                "details": None
            }
        }
    )


async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all unexpected exception handler to prevent stack trace leaks."""
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {str(exc)}", exc_info=True)
    details = str(exc) if settings.DEBUG and settings.ENVIRONMENT == "development" else None
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred. Please contact system support.",
                "details": details
            }
        }
    )
