import uuid

from pydantic import BaseModel, Field


class VehicleCreate(BaseModel):
    model: str = Field(min_length=1, max_length=255)
    registration_number: str = Field(min_length=1, max_length=50)
    seating_capacity: int = Field(gt=0, le=20)


class VehicleResponse(BaseModel):
    id: uuid.UUID
    model: str
    registration_number: str
    seating_capacity: int

    class Config:
        from_attributes = True
