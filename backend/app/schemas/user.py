from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from uuid import UUID

class UserBase(BaseModel):
    phone_number: Optional[str] = Field(None, description="E.164 phone number, e.g. +1234567890")
    name: Optional[str] = None
    email: Optional[str] = None
    language_preference: str = "en"
    status: str = "active"

class UserCreate(UserBase):
    password: Optional[str] = None
    is_admin: bool = False

class UserUpdate(BaseModel):
    name: Optional[str] = None
    language_preference: Optional[str] = None
    status: Optional[str] = None
    password: Optional[str] = None
    is_admin: Optional[bool] = None

class UserResponse(UserBase):
    id: UUID
    onboarded_at: datetime
    is_admin: bool
    
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None

class AdminLogin(BaseModel):
    username: str = Field(..., description="Phone number or username")
    password: str

class PatientSignup(BaseModel):
    name: str
    phone_number: str
    email: str
    password: str
    language_preference: str = "en"

class PatientLogin(BaseModel):
    username: str
    password: str

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    language_preference: Optional[str] = None
