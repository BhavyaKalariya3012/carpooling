import enum
import uuid

from sqlalchemy import Integer, Numeric, String, ForeignKey, Enum as SqlEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class BookingStatus(str, enum.Enum):
    """
    Trip lifecycle per product.md:
    Booked -> Started -> In Progress -> Completed -> Payment Pending -> Payment Completed
    (plus Cancelled as an edge case, handled in Phase 3)
    """
    BOOKED = "booked"
    STARTED = "started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    PAYMENT_PENDING = "payment_pending"
    PAYMENT_COMPLETED = "payment_completed"
    CANCELLED = "cancelled"


class Booking(Base):
    """
    A passenger's booking on a ride. organization_id is denormalized here
    (copied from the ride at booking time) to keep tenant-scoped queries
    on this table simple and enforceable without an extra join.
    """
    __tablename__ = "bookings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False, index=True
    )
    ride_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("rides.id"), nullable=False, index=True
    )
    passenger_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )

    seats_booked: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    status: Mapped[BookingStatus] = mapped_column(SqlEnum(BookingStatus), default=BookingStatus.BOOKED, nullable=False)

    # Payment (Razorpay test mode). amount is seats_booked * ride.fare_per_seat,
    # snapshotted at order-creation time so later fare edits don't retroactively
    # change what's owed on an already-created order.
    amount: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    razorpay_order_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    razorpay_payment_id: Mapped[str | None] = mapped_column(String(64), nullable=True)

    ride: Mapped["Ride"] = relationship("Ride", back_populates="bookings")
    passenger: Mapped["User"] = relationship("User", back_populates="bookings")
