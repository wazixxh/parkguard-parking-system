import csv
import io
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.parking_transaction import ParkingTransaction
from app.models.incident import Incident
from app.models.scan_event import ScanEvent
from app.api.deps import require_staff_or_admin, require_super_admin, get_client_ip
from app.services.audit_service import record_audit

router = APIRouter()


@router.get("/export-csv", summary="Export Data Reports as CSV")
def export_csv(
    request: Request,
    report_type: str = Query(..., pattern="^(vehicles|transactions|incidents|scans)$"),
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
):
    """
    Generate downloadable CSV file from real database records.
    Enforces authorization and logs report generation audit events.
    """
    ip = get_client_ip(request)
    output = io.StringIO()
    writer = csv.writer(output)
    timestamp_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filename = f"parkguard_{report_type}_{timestamp_str}.csv"

    if report_type == "vehicles":
        writer.writerow([
            "Internal ID", "Plate Number", "Type", "Make", "Model",
            "Color", "Owner Name", "Owner Phone", "Department", "Status", "Registered Date"
        ])
        vehicles = db.query(Vehicle).order_by(Vehicle.created_at.desc()).all()
        for v in vehicles:
            writer.writerow([
                v.vehicle_id,
                v.plate_number,
                v.vehicle_type,
                v.make,
                v.model,
                v.color or "N/A",
                v.owner_name,
                v.owner_phone or "N/A",
                v.department.name if v.department else "Unassigned",
                v.status,
                v.created_at.strftime("%Y-%m-%d %H:%M:%S")
            ])

    elif report_type == "transactions":
        writer.writerow([
            "Transaction ID", "Plate Number", "Vehicle Type", "Owner", "Entry Time (UTC)",
            "Exit Time (UTC)", "Duration (Mins)", "Entry Method", "Exit Method", "Parking Area", "Status"
        ])
        transactions = db.query(ParkingTransaction).order_by(ParkingTransaction.entry_time.desc()).all()
        for t in transactions:
            duration = None
            if t.exit_time:
                duration = int((t.exit_time - t.entry_time).total_seconds() / 60)
            writer.writerow([
                t.transaction_id,
                t.vehicle.plate_number if t.vehicle else "N/A",
                t.vehicle.vehicle_type if t.vehicle else "N/A",
                t.vehicle.owner_name if t.vehicle else "N/A",
                t.entry_time.strftime("%Y-%m-%d %H:%M:%S"),
                t.exit_time.strftime("%Y-%m-%d %H:%M:%S") if t.exit_time else "In Progress",
                duration or "Active",
                t.entry_method,
                t.exit_method or "N/A",
                t.parking_area.name if t.parking_area else "General",
                t.status
            ])

    elif report_type == "incidents":
        writer.writerow([
            "Incident ID", "Category", "Location", "Plate Number", "Status",
            "Reported By", "Description", "Resolution Notes", "Reported At"
        ])
        incidents = db.query(Incident).order_by(Incident.created_at.desc()).all()
        for inc in incidents:
            writer.writerow([
                inc.incident_id,
                inc.category,
                inc.location,
                inc.vehicle.plate_number if inc.vehicle else "N/A",
                inc.status,
                inc.reporter.full_name if inc.reporter else "Staff",
                inc.description,
                inc.resolution_notes or "",
                inc.created_at.strftime("%Y-%m-%d %H:%M:%S")
            ])

    elif report_type == "scans":
        writer.writerow([
            "Scan ID", "Scanned Token", "Type", "Result", "Plate Number", "Staff", "Message", "Timestamp"
        ])
        scans = db.query(ScanEvent).order_by(ScanEvent.scanned_at.desc()).limit(1000).all()
        for s in scans:
            writer.writerow([
                s.id,
                s.scanned_token,
                s.scan_type,
                s.result,
                s.vehicle.plate_number if s.vehicle else "N/A",
                s.staff.full_name if s.staff else "System",
                s.message or "",
                s.scanned_at.strftime("%Y-%m-%d %H:%M:%S")
            ])

    record_audit(
        db=db,
        action="REPORT_EXPORT",
        resource_type="report",
        resource_id=report_type,
        outcome="SUCCESS",
        actor_id=current_user.id,
        actor_email=current_user.email,
        ip_address=ip,
        details=f"Exported {report_type} CSV report ({filename})"
    )

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
