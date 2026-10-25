from datetime import datetime
from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, List
import re


class VehicleCreate(BaseModel):
    plate_number: str = Field(..., min_length=2, max_length=20)
    vehicle_type: str = Field("car", pattern="^(car|motorcycle|van|truck|suv|other)$")
    make: str = Field(..., min_length=1, max_length=100)
    model: str = Field(..., min_length=1, max_length=100)
    color: Optional[str] = None
    owner_name: str = Field(..., min_length=2, max_length=150)
    owner_phone: Optional[str] = None
    department_id: Optional[int] = None
    parking_area_id: Optional[int] = None
    notes: Optional[str] = None

    @field_validator("plate_number")
    @classmethod
    def normalize_plate(cls, v: str) -> str:
        cleaned = re.sub(r'[^A-Za-z0-9-]', '', v.strip().upper())
        if len(cleaned) < 2:
            raise ValueError("Plate number must contain at least 2 alphanumeric characters.")
        return cleaned


class VehicleUpdate(BaseModel):
    vehicle_type: Optional[str] = Field(None, pattern="^(car|motorcycle|van|truck|suv|other)$")
    make: Optional[str] = None
    model: Optional[str] = None
    color: Optional[str] = None
    owner_name: Optional[str] = None
    owner_phone: Optional[str] = None
    department_id: Optional[int] = None
    parking_area_id: Optional[int] = None
    status: Optional[str] = Field(None, pattern="^(active|inactive|blocked)$")
    notes: Optional[str] = None


class VehicleResponse(BaseModel):
    id: int
    vehicle_id: str
    plate_number: str
    vehicle_type: str
    make: str
    model: str
    color: Optional[str] = None
    owner_name: str
    owner_phone: Optional[str] = None
    department_id: Optional[int] = None
    parking_area_id: Optional[int] = None
    status: str
    notes: Optional[str] = None
    qr_token: str
    barcode_token: str
    created_at: datetime
    updated_at: datetime
    is_parked: Optional[bool] = False
    current_transaction_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class VehicleListResponse(BaseModel):
    total: int
    page: int
    limit: int
    items: List[VehicleResponse]


class PrintableCardResponse(BaseModel):
    vehicle_id: str
    plate_number: str
    vehicle_type: str
    make_model: str
    owner_name: str
    department_name: Optional[str] = None
    parking_area_name: Optional[str] = None
    qr_token: str
    barcode_token: str
    qr_image_data_uri: str
    registration_date: str
