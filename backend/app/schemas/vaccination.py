from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from uuid import UUID

class VaccinationBase(BaseModel):
    vaccine_name: str
    dose_number: int = 1
    scheduled_date: date
    administered_date: Optional[date] = None

class VaccinationCreate(VaccinationBase):
    user_id: str

class VaccinationUpdate(BaseModel):
    vaccine_name: Optional[str] = None
    dose_number: Optional[int] = None
    scheduled_date: Optional[date] = None
    administered_date: Optional[date] = None
    notification_sent: Optional[bool] = None

class VaccinationResponse(VaccinationBase):
    id: UUID
    user_id: UUID
    notification_sent: bool
    sms_delivery_status: Optional[str] = None
    sms_sent_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class AlertBase(BaseModel):
    title: str
    content: str
    target_language: str = "all"

class AlertCreate(AlertBase):
    pass

class AlertResponse(AlertBase):
    id: str
    created_at: datetime
    sent_count: int

    model_config = ConfigDict(from_attributes=True)
