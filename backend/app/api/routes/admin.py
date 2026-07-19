import uuid
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import require_admin
from app.models.user import User, UserRole
from app.models.vehicle import Vehicle
from app.models.ride import Ride, RideStatus
from app.models.booking import Booking, BookingStatus
from app.schemas.admin import (
    AdminStats,
    AdminAnalytics,
    ChartPoint,
    AdminUserResponse,
    AdminRideResponse,
    AdminBookingResponse,
    SetUserActiveRequest,
)

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

# Human-friendly labels for enum values shown in charts.
_STATUS_LABELS = {
    "published": "Published",
    "started": "Started",
    "in_progress": "In Progress",
    "completed": "Completed",
    "payment_pending": "Payment Pending",
    "payment_completed": "Payment Completed",
    "booked": "Booked",
    "cancelled": "Cancelled",
}


def _label(status_value: str) -> str:
    return _STATUS_LABELS.get(status_value, status_value)


@router.get("/stats", response_model=AdminStats)
def get_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Org-scoped dashboard stats. All queries filter by the admin's own
    organization_id — an admin can never see another organization's data."""
    org_id = admin.organization_id

    total_users = db.query(func.count(User.id)).filter(User.organization_id == org_id).scalar() or 0
    total_drivers = (
        db.query(func.count(func.distinct(Ride.driver_id)))
        .filter(Ride.organization_id == org_id)
        .scalar()
        or 0
    )
    total_vehicles = db.query(func.count(Vehicle.id)).filter(Vehicle.organization_id == org_id).scalar() or 0
    total_rides = db.query(func.count(Ride.id)).filter(Ride.organization_id == org_id).scalar() or 0
    active_rides = (
        db.query(func.count(Ride.id))
        .filter(Ride.organization_id == org_id, Ride.status.in_([RideStatus.STARTED, RideStatus.IN_PROGRESS]))
        .scalar()
        or 0
    )
    total_bookings = db.query(func.count(Booking.id)).filter(Booking.organization_id == org_id).scalar() or 0
    completed_bookings = (
        db.query(func.count(Booking.id))
        .filter(Booking.organization_id == org_id, Booking.status == BookingStatus.PAYMENT_COMPLETED)
        .scalar()
        or 0
    )
    total_revenue = (
        db.query(func.coalesce(func.sum(Booking.amount), 0))
        .filter(Booking.organization_id == org_id, Booking.status == BookingStatus.PAYMENT_COMPLETED)
        .scalar()
        or 0
    )

    return AdminStats(
        total_users=total_users,
        total_drivers=total_drivers,
        total_vehicles=total_vehicles,
        total_rides=total_rides,
        active_rides=active_rides,
        total_bookings=total_bookings,
        completed_bookings=completed_bookings,
        total_revenue=float(total_revenue),
    )


@router.get("/analytics", response_model=AdminAnalytics)
def get_analytics(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Aggregated, org-scoped data for the dashboard charts: status
    breakdowns, a 14-day rides/revenue trend, and seat utilization."""
    org_id = admin.organization_id

    # --- Status breakdowns (for donut charts) ---
    rides_status_rows = (
        db.query(Ride.status, func.count(Ride.id))
        .filter(Ride.organization_id == org_id)
        .group_by(Ride.status)
        .all()
    )
    rides_by_status = [
        ChartPoint(label=_label(getattr(s, "value", s)), value=float(c)) for s, c in rides_status_rows
    ]

    bookings_status_rows = (
        db.query(Booking.status, func.count(Booking.id))
        .filter(Booking.organization_id == org_id)
        .group_by(Booking.status)
        .all()
    )
    bookings_by_status = [
        ChartPoint(label=_label(getattr(s, "value", s)), value=float(c)) for s, c in bookings_status_rows
    ]

    # --- 14-day trend (grouped by ride departure date) ---
    today = date.today()
    window_start = today - timedelta(days=13)
    day_expr = func.date(Ride.departure_time)

    rides_rows = (
        db.query(day_expr.label("d"), func.count(Ride.id))
        .filter(Ride.organization_id == org_id, day_expr >= window_start)
        .group_by("d")
        .all()
    )
    rides_map = {str(d): int(c) for d, c in rides_rows}

    revenue_rows = (
        db.query(day_expr.label("d"), func.coalesce(func.sum(Booking.amount), 0))
        .join(Ride, Booking.ride_id == Ride.id)
        .filter(
            Booking.organization_id == org_id,
            Booking.status == BookingStatus.PAYMENT_COMPLETED,
            day_expr >= window_start,
        )
        .group_by("d")
        .all()
    )
    revenue_map = {str(d): float(a) for d, a in revenue_rows}

    # Fill every day in the window so the trend line/bars are continuous.
    rides_per_day: list[ChartPoint] = []
    revenue_per_day: list[ChartPoint] = []
    for i in range(14):
        d = window_start + timedelta(days=i)
        key = d.isoformat()
        short = d.strftime("%d %b")
        rides_per_day.append(ChartPoint(label=short, value=float(rides_map.get(key, 0))))
        revenue_per_day.append(ChartPoint(label=short, value=revenue_map.get(key, 0.0)))

    # --- Seat utilization ---
    seats_offered = (
        db.query(func.coalesce(func.sum(Ride.seats_total), 0))
        .filter(Ride.organization_id == org_id)
        .scalar()
        or 0
    )
    seats_booked = (
        db.query(func.coalesce(func.sum(Booking.seats_booked), 0))
        .filter(
            Booking.organization_id == org_id,
            Booking.status != BookingStatus.CANCELLED,
        )
        .scalar()
        or 0
    )

    return AdminAnalytics(
        rides_by_status=rides_by_status,
        bookings_by_status=bookings_by_status,
        rides_per_day=rides_per_day,
        revenue_per_day=revenue_per_day,
        seats_offered=int(seats_offered),
        seats_booked=int(seats_booked),
    )


@router.get("/users", response_model=list[AdminUserResponse])
def list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    return (
        db.query(User)
        .filter(User.organization_id == admin.organization_id)
        .order_by(User.full_name)
        .all()
    )


@router.patch("/users/{user_id}/active", response_model=AdminUserResponse)
def set_user_active(
    user_id: uuid.UUID,
    payload: SetUserActiveRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Admins cannot deactivate their own account")

    user = (
        db.query(User)
        .filter(User.id == user_id, User.organization_id == admin.organization_id)
        .first()
    )
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = payload.is_active
    db.commit()
    db.refresh(user)
    return user


@router.post("/users/{user_id}/promote", response_model=AdminUserResponse)
def promote_user_to_admin(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = (
        db.query(User)
        .filter(User.id == user_id, User.organization_id == admin.organization_id)
        .first()
    )
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = UserRole.ADMIN
    db.commit()
    db.refresh(user)
    return user


@router.get("/rides", response_model=list[AdminRideResponse])
def list_rides(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    return (
        db.query(Ride)
        .filter(Ride.organization_id == admin.organization_id)
        .order_by(Ride.departure_time.desc())
        .all()
    )


@router.get("/bookings", response_model=list[AdminBookingResponse])
def list_bookings(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    return (
        db.query(Booking)
        .filter(Booking.organization_id == admin.organization_id)
        .order_by(Booking.id.desc())
        .all()
    )
