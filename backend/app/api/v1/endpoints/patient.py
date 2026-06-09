from datetime import timedelta, datetime, timezone
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from io import BytesIO

from app.core.config import settings
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token
from app.models.user import User as UserModel
from app.models.vaccination import Vaccination as VaccinationModel
from app.schemas.user import UserResponse, PatientSignup, PatientLogin, Token
from app.schemas.vaccination import VaccinationResponse

# ReportLab libraries for PDF generation
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/patient/login")

def get_current_patient_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> UserModel:
    """Dependency to retrieve the currently authenticated user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        user_id_str = payload.get("sub")
        token_type = payload.get("type")
        if user_id_str is None or token_type != "access":
            raise credentials_exception
        user_id = UUID(user_id_str)
    except (JWTError, ValueError):
        raise credentials_exception

    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if user is None:
        raise credentials_exception

    # Check status
    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your user account has been disabled. Please contact support."
        )

    return user


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: PatientSignup, db: Session = Depends(get_db)):
    """API endpoint to sign up a new patient user."""
    # Check phone uniqueness
    if payload.phone_number:
        db_user = db.query(UserModel).filter(UserModel.phone_number == payload.phone_number).first()
        if db_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this phone number already exists."
            )
            
    # Check email uniqueness
    if payload.email:
        db_user = db.query(UserModel).filter(UserModel.email == payload.email).first()
        if db_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email already exists."
            )

    hashed_password = get_password_hash(payload.password)
    
    new_user = UserModel(
        phone_number=payload.phone_number,
        email=payload.email,
        name=payload.name,
        language_preference=payload.language_preference,
        hashed_password=hashed_password,
        is_admin=False,
        status="active"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=Token)
def login(payload: PatientLogin, db: Session = Depends(get_db)):
    """API endpoint to log in a patient user (email or phone + password)."""
    user = db.query(UserModel).filter(
        (UserModel.email == payload.username) | 
        (UserModel.phone_number == payload.username)
    ).first()
    
    if not user or not user.hashed_password or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect username, email, or password."
        )

    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been disabled. Please contact support."
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
    
    return {
        "access_token": create_access_token(user.id, expires_delta=access_token_expires),
        "refresh_token": create_refresh_token(user.id, expires_delta=refresh_token_expires),
        "token_type": "bearer",
    }


@router.get("/me", response_model=UserResponse)
def get_me(current_user: UserModel = Depends(get_current_patient_user)):
    """Retrieve details for the currently logged-in patient."""
    return current_user


@router.put("/profile", response_model=UserResponse)
def update_profile(
    name: Optional[str] = None,
    email: Optional[str] = None,
    language_preference: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_patient_user)
):
    """Allows a patient to update their profile. Phone number remains immutable."""
    if email and email != current_user.email:
        db_user = db.query(UserModel).filter(UserModel.email == email).first()
        if db_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address already exists."
            )
        current_user.email = email
        
    if name:
        current_user.name = name
    if language_preference:
        current_user.language_preference = language_preference
        
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/vaccinations", response_model=List[VaccinationResponse])
def get_vaccinations(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_patient_user)):
    """List all scheduled vaccinations for the logged-in patient."""
    vaccinations = db.query(VaccinationModel).filter(VaccinationModel.user_id == current_user.id).all()
    return vaccinations


@router.get("/report")
def get_report(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_patient_user)):
    """Generates and streams a custom styled PDF vaccination report."""
    vaccinations = db.query(VaccinationModel).filter(VaccinationModel.user_id == current_user.id).all()
    
    # ReportLab pdf generation
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    story = []
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#16A34A'),
        spaceAfter=15
    )
    section_style = ParagraphStyle(
        'SectionStyle',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=10,
        spaceBefore=15
    )
    body_style = styles['Normal']
    
    # Title
    story.append(Paragraph("HealthGuard AI - Vaccination Report", title_style))
    story.append(Spacer(1, 10))
    
    # Patient Info Table
    patient_info = [
        [Paragraph("<b>Patient Name:</b>", body_style), Paragraph(current_user.name or "N/A", body_style)],
        [Paragraph("<b>Phone Number:</b>", body_style), Paragraph(current_user.phone_number or "N/A", body_style)],
        [Paragraph("<b>Email:</b>", body_style), Paragraph(current_user.email or "N/A", body_style)],
        [Paragraph("<b>Preferred Language:</b>", body_style), Paragraph(current_user.language_preference.upper(), body_style)]
    ]
    t_info = Table(patient_info, colWidths=[150, 400])
    t_info.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('PADDING', (0,0), (-1,-1), 8),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0'))
    ]))
    story.append(t_info)
    story.append(Spacer(1, 15))
    
    story.append(Paragraph("Vaccination Records Summary", section_style))
    
    # Table header
    vacc_data = [["Vaccine Name", "Dose Number", "Scheduled Date", "Administered Date", "Status"]]
    
    for v in vaccinations:
        status_text = "Administered" if v.administered_date else "Scheduled"
        vacc_data.append([
            v.vaccine_name,
            str(v.dose_number),
            str(v.scheduled_date),
            str(v.administered_date) if v.administered_date else "Pending",
            status_text
        ])
        
    t_vacc = Table(vacc_data, colWidths=[150, 80, 110, 110, 90])
    t_vacc.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#16A34A')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')])
    ]))
    
    story.append(t_vacc)
    doc.build(story)
    
    buffer.seek(0)
    
    filename = f"vaccination_report_{current_user.name.replace(' ', '_')}.pdf"
    
    return StreamingResponse(
        buffer, 
        media_type="application/pdf", 
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
