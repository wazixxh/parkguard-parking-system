from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List


class ParkingEntryRequest(BaseModel):
    vehicle_identifier: str = Field(..., description="Plate number, QR token, or barcode token")
    entry_method: str = Field("manual", pattern="^(qr_scan|barcode_scan|manual)$")
    parking_area_id: Optional[int] = None
    notes: Optional[str] = None


class ParkingExitRequest(BaseModel):
    vehicle_identifier: str = Field(..., description="Plate number, QR token, barcode token, or transaction ID")
    exit_method: str = Field("manual", pattern="^(qr_scan|barcode_scan|manual)$")
    notes: Optional[str] = None


class ParkingTransactionResponse(BaseModel):
    id: int
    transaction_id: str
    vehicle_id: int
    plate_number: str
    vehicle_type: str
    owner_name: str
    make: str
    model: str
    entry_time: datetime
    exit_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    entry_method: str
    exit_method: Optional[str] = None
    parking_area_name: Optional[str] = None
    status: str
    notes: Optional[str] = None
    entry_staff_name: Optional[str] = None
    exit_staff_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ParkingTransactionListResponse(BaseModel):
    total: int
    page: int
    limit: int
    items: List[ParkingTransactionResponse]
