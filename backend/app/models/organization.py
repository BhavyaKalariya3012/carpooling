import uuid

from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Organization(Base):
    """
    A registered company/tenant. Every user, vehicle, and ride belongs to
    exactly one organization (multi-tenant isolation, see product.md).
    """
    __tablename__ = "organizations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    domain: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)  # e.g. company email domain

    users: Mapped[list["User"]] = relationship("User", back_populates="organization")
    vehicles: Mapped[list["Vehicle"]] = relationship("Vehicle", back_populates="organization")
    rides: Mapped[list["Ride"]] = relationship("Ride", back_populates="organization")
