from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.core.database import check_db_connection
from app.middleware.error_handler import (
    http_exception_handler,
    validation_exception_handler,
    sqlalchemy_exception_handler,
    global_exception_handler,
)
from app.api.v1.router import api_router
from app.api.v1.endpoints.health import health_check, readiness_check

# Initialize Structured Logging
setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown routines."""
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION} [{settings.ENVIRONMENT}]")
    db_connected = check_db_connection()
    if db_connected:
        logger.info("Database connectivity verified.")
    else:
        logger.warning("Database connection could not be established at startup.")
    yield
    logger.info("Application shutting down.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-minded Parking Management & Barcode/QR System API",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Centralized Error Handlers
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

# Root level health and readiness shortcuts (as specified in Section 14)
app.add_api_route("/health", health_check, methods=["GET"], tags=["Health"])
app.add_api_route("/ready", readiness_check, methods=["GET"], tags=["Health"])


@app.get("/", tags=["Root"])
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "documentation": "/docs",
        "health": "/health",
        "api_v1": settings.API_V1_PREFIX
    }


# Include API v1 routes
app.include_router(api_router, prefix=settings.API_V1_PREFIX)
