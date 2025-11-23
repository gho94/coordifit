from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.core.config import Settings, get_settings
from app.schemas.background import BackgroundRemovalData, BackgroundRemovalResponse
from app.services.background_service import BackgroundRemovalError, remove_background
from app.utils.image_io import encode_image_to_base64, is_supported_image_mime

router = APIRouter()


@router.post("/remove-bg", response_model=BackgroundRemovalResponse)
async def remove_background_endpoint(
    file: UploadFile = File(...),
    settings: Settings = Depends(get_settings),
) -> dict:
    if not is_supported_image_mime(file.content_type or ""):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Please upload a PNG, JPG, or WEBP image.",
        )

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    if len(file_bytes) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds the maximum allowed size of {settings.max_upload_mb} MB.",
        )

    try:
        processed_bytes = remove_background(file_bytes)
    except BackgroundRemovalError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc

    encoded_image = encode_image_to_base64(processed_bytes)
    response = BackgroundRemovalResponse(
        data=BackgroundRemovalData(resultImage=encoded_image)
    )
    return response.dict(by_alias=True)
