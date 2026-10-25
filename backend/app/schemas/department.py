from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List


class DepartmentCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    code: str = Field(..., min_length=2, max_length=20)
    description: Optional[str] = None


class DepartmentResponse(BaseModel):
    id: int
    name: str
    code: str
    description: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ParkingAreaCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    code: str = Field(..., min_length=2, max_length=20)
    total_capacity: int = Field(50, ge=1)


class ParkingAreaResponse(BaseModel):
    id: int
    name: str
    code: str
    total_capacity: int
    occupied_count: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
