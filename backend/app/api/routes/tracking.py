import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.ride import Ride, RideStatus
from app.models.booking import Booking, BookingStatus
from app.schemas.tracking import LocationUpdate, LocationResponse

router = APIRouter(prefix="/api/v1/rides", tags=["tracking"])


@router.put("/{ride_id}/location", response_model=LocationResponse)
def update_location(
    ride_id: uuid.UUID,
    payload: LocationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Driver reports their current position while the ride is live."""
    ride = (
        db.query(Ride)
        .filter(
            Ride.id == ride_id,
            Ride.driver_id == current_user.id,
            Ride.organization_id == current_user.organization_id,
        )
        .first()
    )
    if ride is None:
        raise HTTPException(status_code=404, detail="Ride not found")

    if ride.status not in (RideStatus.STARTED, RideStatus.IN_PROGRESS):
        raise HTTPException(status_code=400, detail="Location can only be shared while the ride is active")

    ride.current_lat = payload.lat
    ride.current_lng = payload.lng
    ride.location_updated_at = datetime.now(timezone.utc)
    ride.is_sharing_location = True
    if ride.status == RideStatus.STARTED:
        ride.status = RideStatus.IN_PROGRESS

    db.commit()
    db.refresh(ride)
    return LocationResponse(
        ride_id=ride.id,
        is_sharing_location=ride.is_sharing_location,
        current_lat=ride.current_lat,
        current_lng=ride.current_lng,
        location_updated_at=ride.location_updated_at,
    )


@router.get("/{ride_id}/location", response_model=LocationResponse)
def get_location(
    ride_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Fetch the driver's latest reported location. Accessible to the driver
    themselves, or a passenger with an active (non-cancelled) booking on
    this ride — never to arbitrary users in the org.
    """
    ride = (
        db.query(Ride)
        .filter(Ride.id == ride_id, Ride.organization_id == current_user.organization_id)
        .first()
    )
    if ride is None:
        raise HTTPException(status_code=404, detail="Ride not found")

    is_driver = ride.driver_id == current_user.id
    has_booking = (
        db.query(Booking)
        .filter(
            Booking.ride_id == ride.id,
            Booking.passenger_id == current_user.id,
            Booking.status != BookingStatus.CANCELLED,
        )
        .first()
        is not None
    )
    if not is_driver and not has_booking:
        raise HTTPException(status_code=403, detail="Not authorized to view this ride's location")

    return LocationResponse(
        ride_id=ride.id,
        is_sharing_location=ride.is_sharing_location,
        current_lat=ride.current_lat,
        current_lng=ride.current_lng,
        location_updated_at=ride.location_updated_at,
    )
