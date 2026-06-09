from fastapi import APIRouter
from app.api.v1.endpoints import admin, chatbot, vaccinations, system, patient

api_router = APIRouter()

api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(chatbot.router, prefix="/chatbot", tags=["chatbot"])
api_router.include_router(vaccinations.router, prefix="/vaccinations", tags=["vaccinations"])
api_router.include_router(system.router, prefix="/system", tags=["system"])
api_router.include_router(patient.router, prefix="/patient", tags=["patient"])

