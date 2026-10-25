from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List


class IncidentCreate(BaseModel):
    category: str = Field("wrong_parking", pattern="^(wrong_parking|blocked_access|unauthorized_parking|security_followup|other)$")
    location: str = Field(..., min_length=2, max_length=100)
    description: str = Field(..., min_length=5)
    vehicle_identifier: Optional[str] = None


class IncidentUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(open|under_review|resolved|dismissed)$")
    resolution_notes: Optional[str] = None


class IncidentResponse(BaseModel):
    id: int
    incident_id: str
    category: str
    location: str
    description: str
    status: str
    resolution_notes: Optional[str] = None
    vehicle_id: Optional[int] = None
    plate_number: Optional[str] = None
    owner_name: Optional[str] = None
    owner_phone: Optional[str] = None
    reporter_id: int
    reporter_name: Optional[str] = None
    resolved_by_name: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class IncidentListResponse(BaseModel):
    total: int
    items: List[IncidentResponse]
