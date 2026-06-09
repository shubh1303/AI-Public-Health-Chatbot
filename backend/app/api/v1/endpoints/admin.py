from datetime import timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token
from app.models.user import User as UserModel
from app.models.vaccination import Vaccination as VaccinationModel
from app.schemas.user import UserResponse, UserCreate, Token, TokenPayload
from uuid import UUID
from sqlalchemy import func
router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/admin/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> UserModel:
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

        if user_id_str is None:
            raise credentials_exception

        user_id = UUID(user_id_str)

    except (JWTError, ValueError):
        raise credentials_exception

    user = (
        db.query(UserModel)
        .filter(UserModel.id == user_id)
        .first()
    )

    if user is None:
        raise credentials_exception

    return user

def get_current_admin_user(current_user: UserModel = Depends(get_current_user)) -> UserModel:
    """Dependency to verify the authenticated user has administrative privileges."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have administrative privileges"
        )
    return current_user


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(user_in: UserCreate, db: Session = Depends(get_db)):
    """API endpoint to sign up a new user (or admin user)."""
    # Check if phone number already registered
    if user_in.phone_number:
        db_user = db.query(UserModel).filter(UserModel.phone_number == user_in.phone_number).first()
        if db_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this phone number already exists."
            )
            
    hashed_password = None

    if user_in.password:
        hashed_password = get_password_hash(user_in.password)

    new_user = UserModel(
        phone_number=user_in.phone_number,
        name=user_in.name,
        language_preference=user_in.language_preference,
        status=user_in.status,
        hashed_password=hashed_password,
        is_admin=user_in.is_admin
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """OAuth2 compatible token login, retrieve a JWT access token."""
    # Find user by phone number or name
    user = db.query(UserModel).filter(
        (UserModel.phone_number == form_data.username) | 
        (UserModel.name == form_data.username)
    ).first()
    
    if not user or not user.hashed_password or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect username or password"
        )
    elif not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Non-admin user."
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": create_access_token(user.id, expires_delta=access_token_expires),
        "refresh_token": create_refresh_token(user.id, expires_delta=refresh_token_expires),
        "token_type": "bearer",
    }


@router.post("/refresh", response_model=Token)
def refresh(refresh_token: str, db: Session = Depends(get_db)):
    """OAuth2 compatible token refresh, retrieve a new set of access and refresh tokens."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate refresh credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            refresh_token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        user_id_str = payload.get("sub")
        token_type = payload.get("type")
        if user_id_str is None or token_type != "refresh":
            raise credentials_exception
        user_id = UUID(user_id_str)
    except (JWTError, ValueError):
        raise credentials_exception
        
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if user is None:
        raise credentials_exception
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": create_access_token(user.id, expires_delta=access_token_expires),
        "refresh_token": create_refresh_token(user.id, expires_delta=refresh_token_expires),
        "token_type": "bearer",
    }


@router.get("/me", response_model=UserResponse)
def read_user_me(current_user: UserModel = Depends(get_current_admin_user)):
    """Retrieve details for the currently logged-in user."""
    return current_user


@router.get("/users", response_model=List[UserResponse])
def read_users(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db), 
    current_admin: UserModel = Depends(get_current_admin_user)
):
    """Retrieve list of registered users. Requires administrator privileges."""
    users = db.query(UserModel).offset(skip).limit(limit).all()
    return users


@router.get("/analytics")
def get_admin_analytics(db: Session = Depends(get_db), current_admin: UserModel = Depends(get_current_admin_user)):
    """Retrieve compiled analytics and Recharts datasets using aggregated database queries."""
    from datetime import date
    
    # 1. Total patients
    total_patients = db.query(UserModel).filter(UserModel.is_admin == False).count()
    
    # 2. Vaccination counts
    total_scheduled = db.query(VaccinationModel).count()
    total_administered = db.query(VaccinationModel).filter(VaccinationModel.administered_date != None).count()
    pending_count = total_scheduled - total_administered
    
    # 3. SMS metrics
    sms_sent = db.query(VaccinationModel).filter(VaccinationModel.sms_delivery_status == "sent").count()
    sms_failed = db.query(VaccinationModel).filter(VaccinationModel.sms_delivery_status == "failed").count()
    sms_total = sms_sent + sms_failed
    sms_success_rate = (sms_sent / sms_total * 100) if sms_total > 0 else 100.0
    
    # 4. Trend Chart Data (Vaccinations over time)
    trend_results = db.query(
        VaccinationModel.scheduled_date,
        func.count(VaccinationModel.id)
    ).group_by(VaccinationModel.scheduled_date).order_by(VaccinationModel.scheduled_date).all()
    
    trend_data = [{"date": str(r[0]), "count": r[1]} for r in trend_results]
    
    # 5. Delivery Chart Data
    sms_pending = db.query(VaccinationModel).filter(
        VaccinationModel.notification_sent == False,
        VaccinationModel.administered_date == None
    ).count()
    
    delivery_data = [
        {"name": "Sent", "value": sms_sent},
        {"name": "Pending", "value": sms_pending},
        {"name": "Failed", "value": sms_failed}
    ]
    
    # 6. Status Chart Data (Administered, Upcoming, Missed)
    today = date.today()
    upcoming_count = db.query(VaccinationModel).filter(
        VaccinationModel.administered_date == None,
        VaccinationModel.scheduled_date >= today
    ).count()
    
    missed_count = db.query(VaccinationModel).filter(
        VaccinationModel.administered_date == None,
        VaccinationModel.scheduled_date < today
    ).count()
    
    status_data = [
        {"name": "Administered", "value": total_administered},
        {"name": "Upcoming", "value": upcoming_count},
        {"name": "Missed", "value": missed_count}
    ]
    
    return {
        "total_patients": total_patients,
        "total_scheduled": total_scheduled,
        "total_administered": total_administered,
        "pending_count": pending_count,
        "sms_success_rate": round(sms_success_rate, 2),
        "trend_data": trend_data,
        "delivery_data": delivery_data,
        "status_data": status_data
    }


@router.put("/users/{id}/status", response_model=UserResponse)
def update_user_status(
    id: str,
    status_payload: dict,
    db: Session = Depends(get_db),
    current_admin: UserModel = Depends(get_current_admin_user)
):
    """Allows an administrator to disable or reactivate a patient user's status."""
    try:
        user_uuid = UUID(str(id))
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format. Must be a valid UUID."
        )
        
    user = db.query(UserModel).filter(UserModel.id == user_uuid).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
        
    new_status = status_payload.get("status")
    if new_status not in {"active", "inactive", "suspended"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status. Must be active, inactive, or suspended."
        )
        
    user.status = new_status
    db.commit()
    db.refresh(user)
    return user
