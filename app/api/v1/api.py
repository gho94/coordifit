from fastapi import APIRouter

from app.api.v1.endpoints import remove, ocr

api_router = APIRouter()
api_router.include_router(remove.router, prefix="/background", tags=["background"])
api_router.include_router(ocr.router, prefix="/ocr", tags=["ocr"])
