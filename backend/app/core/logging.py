import logging
import re
import sys
from app.core.config import settings

# Sensitive keys to scrub from logs
SENSITIVE_PATTERNS = [
    re.compile(r'(password["\']?\s*[:=]\s*["\'])([^"\']+)(["\'])', re.IGNORECASE),
    re.compile(r'(token["\']?\s*[:=]\s*["\'])([^"\']+)(["\'])', re.IGNORECASE),
    re.compile(r'(secret["\']?\s*[:=]\s*["\'])([^"\']+)(["\'])', re.IGNORECASE),
    re.compile(r'(authorization["\']?\s*[:=]\s*["\']Bearer\s+)([^"\']+)(["\'])', re.IGNORECASE),
]


class SafeFormatter(logging.Formatter):
    """Custom logging formatter that strips potential sensitive credentials."""

    def format(self, record: logging.LogRecord) -> str:
        original = super().format(record)
        sanitized = original
        for pattern in SENSITIVE_PATTERNS:
            sanitized = pattern.sub(r'\1***REDACTED***\3', sanitized)
        return sanitized


def setup_logging():
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    
    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # Avoid duplicate handlers if already configured
    if not root_logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(log_level)
        formatter = SafeFormatter(
            fmt="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        handler.setFormatter(formatter)
        root_logger.addHandler(handler)

    # Set external libraries to warning to keep logs clean
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)


logger = logging.getLogger("parkguard")
