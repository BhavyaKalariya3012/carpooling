import enum
import uuid
from datetime import datetime

from sqlalchemy import String, Integer, Numeric, DateTime, Boolean, ForeignKey, Enum as SqlEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geometry

from app.core.database import Base


class RideStatus(str, enum.Enum):
    PUBLISHED = "published"
    STARTED = "started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Ride(Base):
    """
    A published ride offer. Route must be confirmed before the ride goes
    live (product.md). Capacity is bounded by the vehicle's seating
    capacity (hard constraint).
    """
    __tablename__ = "rides"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True
    )
    driver_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    vehicle_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=False, index=True
    )

    pickup_address: Mapped[str] = mapped_column(String(500), nullable=False)
    destination_address: Mapped[str] = mapped_column(String(500), nullable=False)

    # PostGIS point geometries (lon, lat) - SRID 4326 (WGS84)
    pickup_location: Mapped[str] = mapped_column(Geometry(geometry_type="POINT", srid=4326), nullable=False)
    destination_location: Mapped[str] = mapped_column(Geometry(geometry_type="POINT", srid=4326), nullable=False)
    route_geometry: Mapped[str | None] = mapped_column(
        Geometry(geometry_type="LINESTRING", srid=4326), nullable=True
    )

    departure_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    seats_total: Mapped[int] = mapped_column(Integer, nullable=False)
    seats_available: Mapped[int] = mapped_column(Integer, nullable=False)
    fare_per_seat: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    status: Mapped[RideStatus] = mapped_column(SqlEnum(RideStatus), default=RideStatus.PUBLISHED, nullable=False)

    # Live tracking: the driver's most recently reported position while the
    # ride is started/in_progress. Nullable until the driver shares a
    # location; not a PostGIS column since it's overwritten frequently and
    # doesn't need spatial queries, just plain lat/lng for display.
    is_sharing_location: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    current_lat: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)
    current_lng: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)
    location_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    organization: Mapped["Organization"] = relationship("Organization", back_populates="rides")
    driver: Mapped["User"] = relationship("User", back_populates="rides_offered")
    vehicle: Mapped["Vehicle"] = relationship("Vehicle", back_populates="rides")
    bookings: Mapped[list["Booking"]] = relationship("Booking", back_populates="ride")
