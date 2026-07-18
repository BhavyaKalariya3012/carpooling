import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.ride import Ride, RideStatus
from app.models.booking import Booking, BookingStatus
from app.schemas.booking import BookingCreate, BookingResponse

router = APIRouter(prefix="/api/v1/bookings", tags=["bookings"])


@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def book_ride(
    payload: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ride = (
        db.query(Ride)
        .filter(
            Ride.id == payload.ride_id,
            Ride.organization_id == current_user.organization_id,
            Ride.status == RideStatus.PUBLISHED,
        )
        .first()
    )
    if ride is None:
        raise HTTPException(status_code=404, detail="Ride not found or not available")

    if ride.driver_id == current_user.id:
        raise HTTPException(status_code=400, detail="Drivers cannot book their own ride")

    if payload.seats_booked > ride.seats_available:
        raise HTTPException(status_code=400, detail="Not enough seats available")

    booking = Booking(
        organization_id=current_user.organization_id,
        ride_id=ride.id,
        passenger_id=current_user.id,
        seats_booked=payload.seats_booked,
        status=BookingStatus.BOOKED,
    )
    ride.seats_available -= payload.seats_booked

    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


@router.get("/my-trips", response_model=list[BookingResponse])
def my_trips(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """My Trips: booked rides through their full lifecycle."""
    return (
        db.query(Booking)
        .filter(
            Booking.passenger_id == current_user.id,
            Booking.organization_id == current_user.organization_id,
        )
        .all()
    )


@router.post("/{booking_id}/cancel", response_model=BookingResponse)
def cancel_booking(
    booking_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = (
        db.query(Booking)
        .filter(
            Booking.id == booking_id,
            Booking.passenger_id == current_user.id,
            Booking.organization_id == current_user.organization_id,
        )
        .first()
    )
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status not in (BookingStatus.BOOKED,):
        raise HTTPException(status_code=400, detail="Only a booked (not-yet-started) trip can be cancelled")

    ride = db.get(Ride, booking.ride_id)
    if ride is not None:
        ride.seats_available += booking.seats_booked

    booking.status = BookingStatus.CANCELLED
    db.commit()
    db.refresh(booking)
    return booking
