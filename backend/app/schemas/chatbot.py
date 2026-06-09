from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class WebQueryRequest(BaseModel):
    user_id: Optional[str] = Field(None, description="Optional existing User UUID. If none provided, a guest user will be created/re-used.")
    message: str = Field(..., description="Message string sent by the user.")
    language: str = Field("en", description="ISO language preference, e.g. en, hi, te")
    channel: str = Field("web", description="Interaction channel: web, sms, whatsapp")

class WebQueryResponse(BaseModel):
    message_id: str
    original_query: str
    detected_language: str
    response_text: str
    timestamp: datetime
