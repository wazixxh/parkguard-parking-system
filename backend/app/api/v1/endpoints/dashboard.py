from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.parking_area import ParkingArea
from app.models.parking_transaction import ParkingTransaction
from app.models.scan_event import ScanEvent
from app.models.incident import Incident
from app.schemas.dashboard import DashboardStatsResponse
from app.api.deps import require_staff_or_admin
from app.api.v1.endpoints.parking import format_transaction_response

router = APIRouter()


@router.get("/stats", response_model=DashboardStatsResponse, summary="Retrieve Live Dashboard Statistics")
def get_dashboard_stats(
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
):
    """
    Computes accurate, non-simulated real-time parking metrics,
    occupancy rates, 7-day trend analysis, and vehicle distributions.
    """
    now = datetime.now(timezone.utc)
    today_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)

    # 1. Core Summary Totals
    total_vehicles = db.query(Vehicle).count()
    currently_parked = db.query(ParkingTransaction).filter(ParkingTransaction.status == "parked").count()
    entered_today = db.query(ParkingTransaction).filter(ParkingTransaction.entry_time >= today_start).count()
    exited_today = db.query(ParkingTransaction).filter(
        ParkingTransaction.exit_time.isnot(None),
        ParkingTransaction.exit_time >= today_start
    ).count()
    active_staff_count = db.query(User).filter(User.is_active == True).count()
    blocked_vehicles_count = db.query(Vehicle).filter(Vehicle.status == "blocked").count()
    open_incidents_count = db.query(Incident).filter(Incident.status.in_(["open", "under_review"])).count()

    # 2. Total Capacity & Occupancy Rate
    total_capacity = db.query(func.sum(ParkingArea.total_capacity)).scalar() or 260
    occupancy_rate = round((currently_parked / total_capacity * 100), 1) if total_capacity > 0 else 0.0

    # 3. Vehicle Type Distribution
    type_counts = db.query(
        Vehicle.vehicle_type, func.count(Vehicle.id)
    ).group_by(Vehicle.vehicle_type).all()

    type_dist = [{"type": t[0].capitalize(), "count": t[1]} for t in type_counts]
    if not type_dist:
        type_dist = [{"type": "Car", "count": 0}, {"type": "Motorcycle", "count": 0}]

    # 4. Last 7 Days Activity Trends
    trends = []
    for i in range(6, -1, -1):
        day_date = (now - timedelta(days=i)).date()
        day_start = datetime(day_date.year, day_date.month, day_date.day, tzinfo=timezone.utc)
        day_end = day_start + timedelta(days=1)
        
        day_entries = db.query(ParkingTransaction).filter(
            ParkingTransaction.entry_time >= day_start,
            ParkingTransaction.entry_time < day_end
        ).count()

        day_exits = db.query(ParkingTransaction).filter(
            ParkingTransaction.exit_time.isnot(None),
            ParkingTransaction.exit_time >= day_start,
            ParkingTransaction.exit_time < day_end
        ).count()

        trends.append({
            "date": day_date.strftime("%b %d"),
            "entries": day_entries,
            "exits": day_exits
        })

    # 5. Recent Transactions
    recent_txns = db.query(ParkingTransaction).order_by(
        ParkingTransaction.created_at.desc()
    ).limit(6).all()

    # 6. Recent Scans
    recent_scans_raw = db.query(ScanEvent).order_by(
        ScanEvent.scanned_at.desc()
    ).limit(6).all()

    recent_scans = []
    for s in recent_scans_raw:
        recent_scans.append({
            "id": s.id,
            "scanned_token": s.scanned_token,
            "scan_type": s.scan_type,
            "result": s.result,
            "message": s.message,
            "vehicle_id": s.vehicle_id,
            "plate_number": s.vehicle.plate_number if s.vehicle else None,
            "staff_name": s.staff.full_name if s.staff else "System",
            "scanned_at": s.scanned_at
        })

    return {
        "total_vehicles": total_vehicles,
        "currently_parked": currently_parked,
        "entered_today": entered_today,
        "exited_today": exited_today,
        "active_staff_count": active_staff_count,
        "blocked_vehicles_count": blocked_vehicles_count,
        "open_incidents_count": open_incidents_count,
        "occupancy_rate_percent": occupancy_rate,
        "vehicle_type_distribution": type_dist,
        "daily_activity_trends": trends,
        "recent_transactions": [format_transaction_response(t) for t in recent_txns],
        "recent_scans": recent_scans
    }
