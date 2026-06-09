import uuid
from sqlalchemy import Column, String, Integer, Text, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

class FAQCache(Base):
    __tablename__ = "faq_cache"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    query_hash = Column(String(64), unique=True, index=True, nullable=False)
    original_query = Column(Text, nullable=False)
    translated_query = Column(Text, nullable=False)
    resolved_intent = Column(String(100), nullable=True)
    answer_text = Column(Text, nullable=False)
    hits = Column(Integer, nullable=False, default=1)
    last_accessed_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
