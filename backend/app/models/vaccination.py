import uuid
from sqlalchemy import Column, String, Integer, Date, Boolean, ForeignKey, DateTime, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class Vaccination(Base):
    __tablename__ = "vaccinations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    vaccine_name = Column(String(100), nullable=False)
    dose_number = Column(Integer, nullable=False, default=1)
    scheduled_date = Column(Date, nullable=False)
    administered_date = Column(Date, nullable=True)
    notification_sent = Column(Boolean, nullable=False, default=False)
    sms_delivery_status = Column(String(50), nullable=True)
    sms_sent_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="vaccinations")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    target_language = Column(String(10), nullable=False, default="all")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    sent_count = Column(Integer, nullable=False, default=0)
