import uuid
from sqlalchemy import Column, String, Boolean, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phone_number = Column(String(20), unique=True, index=True, nullable=True)
    name = Column(String(100), nullable=True)
    language_preference = Column(String(10), nullable=False, default="en")
    email = Column(String(255), unique=True, index=True, nullable=True)
    onboarded_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(20), nullable=False, default="active") # active, inactive, suspended
    
    # Credentials (used primarily for administrative console access)
    hashed_password = Column(String(255), nullable=True)
    is_admin = Column(Boolean, nullable=False, default=False)

    # Relationships
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    vaccinations = relationship("Vaccination", back_populates="user", cascade="all, delete-orphan")
