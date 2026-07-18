import enum
import uuid

from sqlalchemy import String, ForeignKey, Enum as SqlEnum, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class UserRole(str, enum.Enum):
    EMPLOYEE = "employee"
    ADMIN = "admin"


class User(Base):
    """
    An org-scoped employee (rider and/or driver) or admin. Every query on
    this table must filter by organization_id at the service layer.
    """
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True
    )

    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(SqlEnum(UserRole), default=UserRole.EMPLOYEE, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    organization: Mapped["Organization"] = relationship("Organization", back_populates="users")
    vehicles: Mapped[list["Vehicle"]] = relationship("Vehicle", back_populates="owner")
    rides_offered: Mapped[list["Ride"]] = relationship("Ride", back_populates="driver")
    bookings: Mapped[list["Booking"]] = relationship("Booking", back_populates="passenger")
