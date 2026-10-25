from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from app.schemas.vehicle import VehicleResponse


class ScanValidationRequest(BaseModel):
    token: str = Field(..., min_length=1, max_length=100)
    scan_type: str = Field("qr", pattern="^(qr|barcode|manual)$")


class ScanValidationResponse(BaseModel):
    valid: bool
    result: str  # success, not_found, blocked, inactive, revoked
    message: str
    vehicle: Optional[VehicleResponse] = None
    is_parked: bool = False
    active_transaction_id: Optional[str] = None
    parked_duration_minutes: Optional[int] = None


class ScanEventResponse(BaseModel):
    id: int
    scanned_token: str
    scan_type: str
    result: str
    message: Optional[str] = None
    vehicle_id: Optional[int] = None
    plate_number: Optional[str] = None
    staff_name: Optional[str] = None
    scanned_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ScanEventListResponse(BaseModel):
    total: int
    items: List[ScanEventResponse]
