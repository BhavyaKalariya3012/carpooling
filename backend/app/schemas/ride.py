import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class RideCreate(BaseModel):
    vehicle_id: uuid.UUID
    pickup_address: str = Field(min_length=1, max_length=500)
    destination_address: str = Field(min_length=1, max_length=500)
    pickup_lat: float = Field(ge=-90, le=90)
    pickup_lng: float = Field(ge=-180, le=180)
    destination_lat: float = Field(ge=-90, le=90)
    destination_lng: float = Field(ge=-180, le=180)
    departure_time: datetime
    seats_total: int = Field(gt=0, le=20)
    fare_per_seat: float = Field(gt=0)


class RideResponse(BaseModel):
    id: uuid.UUID
    driver_id: uuid.UUID
    vehicle_id: uuid.UUID
    pickup_address: str
    destination_address: str
    departure_time: datetime
    seats_total: int
    seats_available: int
    fare_per_seat: float
    status: str

    class Config:
        from_attributes = True


class RideSearchParams(BaseModel):
    pickup_lat: float = Field(ge=-90, le=90)
    pickup_lng: float = Field(ge=-180, le=180)
    destination_lat: float = Field(ge=-90, le=90)
    destination_lng: float = Field(ge=-180, le=180)
    date: datetime | None = None
    seats_needed: int = Field(default=1, gt=0, le=20)
    radius_km: float = Field(default=3.0, gt=0, le=50, description="Search radius around pickup/destination")
