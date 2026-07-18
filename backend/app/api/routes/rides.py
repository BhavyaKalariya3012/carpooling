import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from geoalchemy2.functions import ST_DWithin, ST_MakePoint, ST_SetSRID
from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.ride import Ride, RideStatus
from app.models.booking import Booking, BookingStatus
from app.schemas.ride import RideCreate, RideResponse, RideSearchParams

router = APIRouter(prefix="/api/v1/rides", tags=["rides"])


def _make_point(lat: float, lng: float):
    return ST_SetSRID(ST_MakePoint(lng, lat), 4326)


@router.post("", response_model=RideResponse, status_code=status.HTTP_201_CREATED)
def offer_ride(
    payload: RideCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Vehicle-first constraint: the vehicle must exist, be registered, and
    # belong to this driver within their organization.
    vehicle = (
        db.query(Vehicle)
        .filter(
            Vehicle.id == payload.vehicle_id,
            Vehicle.owner_id == current_user.id,
            Vehicle.organization_id == current_user.organization_id,
        )
        .first()
    )
    if vehicle is None:
        raise HTTPException(
            status_code=400,
            detail="A registered vehicle is required before offering a ride",
        )

    if payload.seats_total > vehicle.seating_capacity:
        raise HTTPException(
            status_code=400,
            detail=f"seats_total ({payload.seats_total}) exceeds vehicle capacity ({vehicle.seating_capacity})",
        )

    ride = Ride(
        organization_id=current_user.organization_id,
        driver_id=current_user.id,
        vehicle_id=vehicle.id,
        pickup_address=payload.pickup_address,
        destination_address=payload.destination_address,
        pickup_location=_make_point(payload.pickup_lat, payload.pickup_lng),
        destination_location=_make_point(payload.destination_lat, payload.destination_lng),
        departure_time=payload.departure_time,
        seats_total=payload.seats_total,
        seats_available=payload.seats_total,
        fare_per_seat=payload.fare_per_seat,
        status=RideStatus.PUBLISHED,
    )
    db.add(ride)
    db.commit()
    db.refresh(ride)
    return ride


@router.post("/search", response_model=list[RideResponse])
def find_rides(
    params: RideSearchParams,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Find a Ride: search by pickup/destination (route confirmed via
    proximity match), date, and seats needed. Scoped to the caller's org
    only (multi-tenant isolation).
    """
    pickup_point = _make_point(params.pickup_lat, params.pickup_lng)
    radius_m = params.radius_km * 1000

    query = db.query(Ride).filter(
        Ride.organization_id == current_user.organization_id,
        Ride.status == RideStatus.PUBLISHED,
        Ride.seats_available >= params.seats_needed,
        ST_DWithin(Ride.pickup_location, pickup_point, radius_m),
    )

    if params.date:
        query = query.filter(
            and_(
                Ride.departure_time >= params.date.replace(hour=0, minute=0, second=0),
                Ride.departure_time <= params.date.replace(hour=23, minute=59, second=59),
            )
        )

    return query.order_by(Ride.departure_time.asc()).all()


@router.get("/{ride_id}", response_model=RideResponse)
def get_ride(
    ride_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ride = (
        db.query(Ride)
        .filter(Ride.id == ride_id, Ride.organization_id == current_user.organization_id)
        .first()
    )
    if ride is None:
        raise HTTPException(status_code=404, detail="Ride not found")
    return ride


@router.get("", response_model=list[RideResponse])
def list_my_offered_rides(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Ride)
        .filter(Ride.driver_id == current_user.id, Ride.organization_id == current_user.organization_id)
        .order_by(Ride.departure_time.desc())
        .all()
    )


def _get_owned_ride(db: Session, ride_id: uuid.UUID, current_user: User) -> Ride:
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
    return ride


@router.post("/{ride_id}/start", response_model=RideResponse)
def start_ride(
    ride_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Driver starts the ride. Enables live location sharing and moves
    active bookings into the STARTED state."""
    ride = _get_owned_ride(db, ride_id, current_user)
    if ride.status != RideStatus.PUBLISHED:
        raise HTTPException(status_code=400, detail="Only a published ride can be started")

    ride.status = RideStatus.STARTED
    ride.is_sharing_location = True

    db.query(Booking).filter(
        Booking.ride_id == ride.id, Booking.status == BookingStatus.BOOKED
    ).update({Booking.status: BookingStatus.STARTED})

    db.commit()
    db.refresh(ride)
    return ride


@router.post("/{ride_id}/complete", response_model=RideResponse)
def complete_ride(
    ride_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Driver marks the ride complete. Stops live location sharing and
    moves bookings to PAYMENT_PENDING with the fare snapshotted."""
    ride = _get_owned_ride(db, ride_id, current_user)
    if ride.status not in (RideStatus.STARTED, RideStatus.IN_PROGRESS):
        raise HTTPException(status_code=400, detail="Only a started ride can be completed")

    ride.status = RideStatus.COMPLETED
    ride.is_sharing_location = False

    bookings = (
        db.query(Booking)
        .filter(
            Booking.ride_id == ride.id,
            Booking.status.in_([BookingStatus.STARTED, BookingStatus.IN_PROGRESS]),
        )
        .all()
    )
    for booking in bookings:
        booking.status = BookingStatus.PAYMENT_PENDING
        booking.amount = booking.seats_booked * ride.fare_per_seat

    db.commit()
    db.refresh(ride)
    return ride
