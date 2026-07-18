import uuid

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
    AdminUserResponse,
    AdminRideResponse,
    AdminBookingResponse,
    SetUserActiveRequest,
)

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


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
