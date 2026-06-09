import logging
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import engine, Base, get_db
from app.core.logging_config import setup_logging
from app.core.metrics import metrics_tracker

# Import models to ensure they are registered with Base for auto-creation
from app.models.user import User
from app.models.message import Conversation, Message
from app.models.vaccination import Vaccination, Alert
from app.models.faq import FAQCache
from app.api.v1.router import api_router

# Initialize structured logging formatter
setup_logging()
logger = logging.getLogger("app.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    logger.info("Starting up application diagnostics...")
    logger.info(f"Project Name: {settings.PROJECT_NAME}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"CORS Allowed Origins: {settings.BACKEND_CORS_ORIGINS}")
    
    logger.info("Initializing database connection...")
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Database connection validated successfully.")
    except Exception as e:
        logger.critical(f"CRITICAL: Database connection failed: {e}", exc_info=True)
        if settings.ENVIRONMENT == "production":
            raise e
            
    logger.info("Initializing database tables...")
    try:
        # Automatically creates tables if they do not exist
        # Useful for local dev, while production uses Alembic migrations
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully.")
    except Exception as e:
        logger.error(f"Error initializing database tables: {e}")
    yield
    # Shutdown actions
    logger.info("Shutting down application...")

app = FastAPI(
    title="HealthGuard AI Portal",
    description="Production-grade AI-Driven Public Health Chatbot and Immunization Analytics Console.",
    version="1.0.0",
    contact={
        "name": "HealthGuard Support",
        "email": "support@healthguard.gov",
    },
    license_info={
        "name": "Apache 2.0",
        "url": "https://www.apache.org/licenses/LICENSE-2.0.html",
    },
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Request performance and metrics middleware
@app.middleware("http")
async def monitor_request_performance(request: Request, call_next):
    start_time = time.time()
    
    # Record route hit
    metrics_tracker.record_hit(request.method, request.url.path)
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    
    # Structured JSON log for the request
    logger.info(
        "HTTP Request Processed",
        extra={
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "process_time_sec": process_time,
            "client_ip": request.client.host if request.client else None
        }
    )
    return response

# Global exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global unhandled exception occurred: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again later."},
    )

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    logger.warning(
        f"HTTP Exception on {request.url.path}",
        extra={"detail": exc.detail, "status_code": exc.status_code}
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

# CORS Policy configuration (allowing dynamic CORS origins)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include unified API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/", tags=["healthcheck"])
def read_root():
    """Application status check endpoint."""
    return {
        "status": "healthy",
        "app_name": settings.PROJECT_NAME,
        "api_version": "v1.0.0"
    }

@app.get("/health", tags=["health"])
def health_check():
    """Liveness probe: Basic API status check."""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "app_name": settings.PROJECT_NAME
    }

@app.get("/ready", tags=["health"])
def readiness_check(db: Session = Depends(get_db)):
    """Readiness probe: Validates database connectivity."""
    try:
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        return {
            "status": "ready",
            "database": "connected"
        }
    except Exception as e:
        logger.error(f"Readiness probe failed: {e}")
        raise HTTPException(status_code=503, detail="Database connection is unhealthy")

# Force reload uvicorn 1
