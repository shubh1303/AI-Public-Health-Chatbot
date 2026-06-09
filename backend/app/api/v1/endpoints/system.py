from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.metrics import metrics_tracker
from app.models.vaccination import Vaccination

router = APIRouter()

@router.get("/info", tags=["system"])
def get_system_info(db: Session = Depends(get_db)):
    """Retrieve detailed project metadata, diagnostics, database status, and metrics."""
    # Check DB status
    db_status = "active"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "inactive"
        
    db_type = "postgresql" if settings.DATABASE_URL.startswith("postgresql") else "sqlite"
    
    # Twilio database metrics
    total_vaccinations = db.query(Vaccination).count()
    sent_reminders = db.query(Vaccination).filter(Vaccination.notification_sent == True).count()
    failed_reminders = db.query(Vaccination).filter(Vaccination.sms_delivery_status == "failed").count()
    
    return {
        "project_name": settings.PROJECT_NAME,
        "version": "v1.0.0",
        "environment": settings.ENVIRONMENT,
        "database": {
            "type": db_type,
            "status": db_status
        },
        "metrics": {
            "endpoint_hits": dict(metrics_tracker.route_hits),
            "twilio_sms": {
                "in_memory_total_attempts": metrics_tracker.sms_attempts,
                "in_memory_successes": metrics_tracker.sms_successes,
                "in_memory_failures": metrics_tracker.sms_failures,
                "database_reminder_total": total_vaccinations,
                "database_reminder_sent": sent_reminders,
                "database_reminder_failed": failed_reminders
            }
        }
    }
