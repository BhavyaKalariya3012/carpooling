import uuid

from pydantic import BaseModel, Field


class PaymentOrderResponse(BaseModel):
    """Everything the frontend Razorpay Checkout widget needs to open."""
    booking_id: uuid.UUID
    razorpay_order_id: str
    razorpay_key_id: str
    amount_paise: int
    currency: str = "INR"


class PaymentVerifyRequest(BaseModel):
    booking_id: uuid.UUID
    razorpay_order_id: str = Field(min_length=1)
    razorpay_payment_id: str = Field(min_length=1)
    razorpay_signature: str = Field(min_length=1)


class PaymentVerifyResponse(BaseModel):
    booking_id: uuid.UUID
    status: str
