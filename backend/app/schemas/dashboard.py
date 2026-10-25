from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.schemas.parking import ParkingTransactionResponse
from app.schemas.scan import ScanEventResponse


class DailyTrendPoint(BaseModel):
    date: str
    entries: int
    exits: int


class TypeDistributionPoint(BaseModel):
    type: str
    count: int


class DashboardStatsResponse(BaseModel):
    total_vehicles: int
    currently_parked: int
    entered_today: int
    exited_today: int
    active_staff_count: int
    blocked_vehicles_count: int
    open_incidents_count: int
    occupancy_rate_percent: float
    vehicle_type_distribution: List[TypeDistributionPoint]
    daily_activity_trends: List[DailyTrendPoint]
    recent_transactions: List[ParkingTransactionResponse]
    recent_scans: List[ScanEventResponse]
