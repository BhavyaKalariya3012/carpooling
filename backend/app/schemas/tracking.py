import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class LocationUpdate(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)


class LocationResponse(BaseModel):
    ride_id: uuid.UUID
    is_sharing_location: bool
    current_lat: float | None
    current_lng: float | None
    location_updated_at: datetime | None
