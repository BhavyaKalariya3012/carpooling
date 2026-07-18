import uuid

import razorpay
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.payments import get_razorpay_client
from app.api.deps import get_current_user
from app.models.user import User
from app.models.booking import Booking, BookingStatus
from app.schemas.payment import (
    PaymentOrderResponse,
    PaymentVerifyRequest,
    PaymentVerifyResponse,
)

router = APIRouter(prefix="/api/v1/payments", tags=["payments"])


def _get_payable_booking(db: Session, booking_id: uuid.UUID, current_user: User) -> Booking:
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
    if booking.status != BookingStatus.PAYMENT_PENDING:
        raise HTTPException(status_code=400, detail="Booking is not awaiting payment")
    if booking.amount is None or booking.amount <= 0:
        raise HTTPException(status_code=400, detail="Booking has no payable amount")
    return booking


@router.post("/bookings/{booking_id}/order", response_model=PaymentOrderResponse)
def create_payment_order(
    booking_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a Razorpay order (test mode) for a completed ride's fare."""
    booking = _get_payable_booking(db, booking_id, current_user)

    amount_paise = int(round(float(booking.amount) * 100))
    client = get_razorpay_client()
    try:
        order = client.order.create(
            {
                "amount": amount_paise,
                "currency": "INR",
                "receipt": str(booking.id),
                "notes": {"booking_id": str(booking.id)},
            }
        )
    except razorpay.errors.BadRequestError as exc:
        raise HTTPException(status_code=502, detail=f"Razorpay order creation failed: {exc}")

    booking.razorpay_order_id = order["id"]
    db.commit()

    return PaymentOrderResponse(
        booking_id=booking.id,
        razorpay_order_id=order["id"],
        razorpay_key_id=settings.RAZORPAY_KEY_ID,
        amount_paise=amount_paise,
    )


@router.post("/verify", response_model=PaymentVerifyResponse)
def verify_payment(
    payload: PaymentVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Verify the Razorpay checkout signature server-side before trusting that
    a payment succeeded. Never mark a booking paid based on client-reported
    success alone.
    """
    booking = (
        db.query(Booking)
        .filter(
            Booking.id == payload.booking_id,
            Booking.passenger_id == current_user.id,
            Booking.organization_id == current_user.organization_id,
        )
        .first()
    )
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status != BookingStatus.PAYMENT_PENDING:
        raise HTTPException(status_code=400, detail="Booking is not awaiting payment")
    if booking.razorpay_order_id != payload.razorpay_order_id:
        raise HTTPException(status_code=400, detail="Order does not match this booking")

    client = get_razorpay_client()
    try:
        client.utility.verify_payment_signature(
            {
                "razorpay_order_id": payload.razorpay_order_id,
                "razorpay_payment_id": payload.razorpay_payment_id,
                "razorpay_signature": payload.razorpay_signature,
            }
        )
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Payment signature verification failed")

    booking.razorpay_payment_id = payload.razorpay_payment_id
    booking.status = BookingStatus.PAYMENT_COMPLETED
    db.commit()

    return PaymentVerifyResponse(booking_id=booking.id, status=booking.status.value)
