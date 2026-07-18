import uuid

from pydantic import BaseModel, Field


class BookingCreate(BaseModel):
    ride_id: uuid.UUID
    seats_booked: int = Field(default=1, gt=0, le=20)


class BookingResponse(BaseModel):
    id: uuid.UUID
    ride_id: uuid.UUID
    passenger_id: uuid.UUID
    seats_booked: int
    status: str

    class Config:
        from_attributes = True
