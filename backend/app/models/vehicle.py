import uuid

from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Vehicle(Base):
    """
    A driver's registered vehicle. Vehicle-first constraint (product.md):
    a user must have at least one vehicle before they can publish a ride.
    """
    __tablename__ = "vehicles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )

    model: Mapped[str] = mapped_column(String(255), nullable=False)
    registration_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    seating_capacity: Mapped[int] = mapped_column(Integer, nullable=False)

    owner: Mapped["User"] = relationship("User", back_populates="vehicles")
    organization: Mapped["Organization"] = relationship("Organization", back_populates="vehicles")
    rides: Mapped[list["Ride"]] = relationship("Ride", back_populates="vehicle")
