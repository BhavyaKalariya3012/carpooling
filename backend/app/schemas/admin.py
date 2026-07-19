import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr


class AdminStats(BaseModel):
    total_users: int
    total_drivers: int
    total_vehicles: int
    total_rides: int
    active_rides: int
    total_bookings: int
    completed_bookings: int
    total_revenue: float


class ChartPoint(BaseModel):
    label: str
    value: float


class AdminAnalytics(BaseModel):
    rides_by_status: list[ChartPoint]
    bookings_by_status: list[ChartPoint]
    rides_per_day: list[ChartPoint]
    revenue_per_day: list[ChartPoint]
    seats_offered: int
    seats_booked: int


class AdminUserResponse(BaseModel):
    id: uuid.UUID
    full_name: str
    email: EmailStr
    role: str
    is_active: bool

    class Config:
        from_attributes = True


class AdminRideResponse(BaseModel):
    id: uuid.UUID
    driver_id: uuid.UUID
    pickup_address: str
    destination_address: str
    departure_time: datetime
    seats_total: int
    seats_available: int
    fare_per_seat: float
    status: str

    class Config:
        from_attributes = True


class AdminBookingResponse(BaseModel):
    id: uuid.UUID
    ride_id: uuid.UUID
    passenger_id: uuid.UUID
    seats_booked: int
    status: str
    amount: float | None

    class Config:
        from_attributes = True


class SetUserActiveRequest(BaseModel):
    is_active: bool
