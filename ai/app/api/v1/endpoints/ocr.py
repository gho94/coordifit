"""OCR endpoints for text extraction from images."""

from fastapi import APIRouter, UploadFile, File, HTTPException, status
from app.services.ocr_service import extract_text_from_image, OCRError
from app.schemas.ocr import OCRResponse
from app.utils.image_io import is_supported_image_mime

router = APIRouter()


@router.post("/extract", response_model=OCRResponse)
async def perform_ocr(file: UploadFile = File(...)) -> dict:
    """이미지에서 텍스트 추출"""
    
    # 파일 타입 검증
    if not is_supported_image_mime(file.content_type or ""):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Please upload a PNG, JPG, or WEBP image.",
        )
    
    # 파일 읽기
    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )
    
    try:
        # OCR 수행
        results = extract_text_from_image(image_bytes)
        
        response = OCRResponse(
            count=len(results),
            results=results
        )
        
        return response.model_dump()
        
    except OCRError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc