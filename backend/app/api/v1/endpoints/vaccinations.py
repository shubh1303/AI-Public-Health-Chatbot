from datetime import date, datetime, timezone
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User as UserModel
from app.models.vaccination import Vaccination as VaccinationModel
from app.schemas.vaccination import VaccinationResponse, VaccinationCreate, VaccinationUpdate
from app.api.v1.endpoints.admin import get_current_admin_user
from app.services.twilio_client import twilio_client

router = APIRouter()

@router.post("/schedule", response_model=VaccinationResponse, status_code=status.HTTP_201_CREATED)
def create_vaccination(
    payload: VaccinationCreate,
    db: Session = Depends(get_db),
    current_admin: UserModel = Depends(get_current_admin_user)
):
    """Creates a vaccination schedule reminder for a user. Requires admin role."""
    # Check if target user exists
    try:
        user_uuid = UUID(str(payload.user_id))
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format. Must be a valid UUID."
        )

    user = db.query(UserModel).filter(UserModel.id == user_uuid).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {payload.user_id} not found."
        )

    db_vacc = VaccinationModel(
        user_id=user_uuid,
        vaccine_name=payload.vaccine_name,
        dose_number=payload.dose_number,
        scheduled_date=payload.scheduled_date,
        administered_date=payload.administered_date,
        notification_sent=False
    )
    db.add(db_vacc)
    db.commit()
    db.refresh(db_vacc)
    return db_vacc


@router.get("/", response_model=List[VaccinationResponse])
def get_vaccinations(
    user_id: Optional[str] = None,
    notification_sent: Optional[bool] = None,
    due_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_admin: UserModel = Depends(get_current_admin_user)
):
    """List all scheduled vaccinations with optional filters."""
    query = db.query(VaccinationModel)
    if user_id:
        try:
            user_uuid = UUID(str(user_id))
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user ID format. Must be a valid UUID."
            )
        query = query.filter(VaccinationModel.user_id == user_uuid)
    if notification_sent is not None:
        query = query.filter(VaccinationModel.notification_sent == notification_sent)
    if due_date:
        query = query.filter(VaccinationModel.scheduled_date == due_date)
        
    return query.all()


@router.get("/{id}", response_model=VaccinationResponse)
def get_vaccination(
    id: str,
    db: Session = Depends(get_db),
    current_admin: UserModel = Depends(get_current_admin_user)
):
    """Retrieve details of a specific vaccination schedule."""
    try:
        vacc_uuid = UUID(str(id))
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid vaccination ID format. Must be a valid UUID."
        )
    vacc = db.query(VaccinationModel).filter(VaccinationModel.id == vacc_uuid).first()
    if not vacc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vaccination record with ID {id} not found."
        )
    return vacc


@router.put("/{id}", response_model=VaccinationResponse)
def update_vaccination(
    id: str,
    payload: VaccinationUpdate,
    db: Session = Depends(get_db),
    current_admin: UserModel = Depends(get_current_admin_user)
):
    """Update details of a scheduled vaccination."""
    try:
        vacc_uuid = UUID(str(id))
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid vaccination ID format. Must be a valid UUID."
        )
    vacc = db.query(VaccinationModel).filter(VaccinationModel.id == vacc_uuid).first()
    if not vacc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vaccination record with ID {id} not found."
        )
        
    update_data = payload.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(vacc, key, val)
        
    db.commit()
    db.refresh(vacc)
    return vacc


@router.post("/trigger-reminders", status_code=status.HTTP_200_OK)
def trigger_reminders(
    due_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_admin: UserModel = Depends(get_current_admin_user)
):
    """Scans and dispatches alerts for vaccination reminders scheduled for a specific date (defaults to today)."""
    target_date = due_date or date.today()
    
    # Query vaccinations scheduled for today that haven't received alerts yet and haven't been administered
    due_vaccinations = db.query(VaccinationModel).filter(
        VaccinationModel.scheduled_date == target_date,
        VaccinationModel.notification_sent == False,
        VaccinationModel.administered_date == None
    ).all()
    
    sent_count = 0
    for vacc in due_vaccinations:
        # Strict duplicate safety check
        if vacc.notification_sent:
            continue
            
        user = vacc.user
        if not user or not user.phone_number:
            continue
            
        # Compose localized reminder text
        # If user preference is Hindi, translate or compose in Hindi
        lang = user.language_preference
        msg = f"Friendly reminder: Your child's {vacc.vaccine_name} (Dose {vacc.dose_number}) is scheduled for today ({vacc.scheduled_date})."
        
        if lang == "hi":
            msg = f"अनुस्मारक: आपके बच्चे का {vacc.vaccine_name} (खुराक {vacc.dose_number}) आज ({vacc.scheduled_date}) के लिए निर्धारित है।"
        elif lang == "te":
            msg = f"రిమైండర్: మీ పిల్లల {vacc.vaccine_name} (డోస్ {vacc.dose_number}) ఈరోజు ({vacc.scheduled_date}) షెడ్యూల్ చేయబడింది."
            
        channel = "whatsapp" if user.phone_number.startswith("whatsapp:") else "sms"
        
        # Track timestamp of dispatch attempt
        vacc.sms_sent_at = datetime.now(timezone.utc)
        
        success = False
        if channel == "whatsapp":
            success = twilio_client.send_whatsapp(user.phone_number, msg)
        else:
            success = twilio_client.send_sms(user.phone_number, msg)
            
        if success:
            vacc.notification_sent = True
            vacc.sms_delivery_status = "sent"
            sent_count += 1
        else:
            vacc.sms_delivery_status = "failed"
            
    db.commit()
    return {"status": "success", "reminders_sent": sent_count, "scheduled_date": str(target_date)}
