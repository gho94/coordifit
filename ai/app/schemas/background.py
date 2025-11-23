"""Schemas for background removal endpoints."""

from typing import Literal
from pydantic import BaseModel, Field

class BackgroundRemovalData(BaseModel):
    result_image: str = Field(..., alias="resultImage", description="Base64 encoded PNG image")

    model_config = {
        "populate_by_name": True,
        "validate_by_name": True
    }

class BackgroundRemovalResponse(BaseModel):
    status: Literal["success"] = Field("success")
    data: BackgroundRemovalData

    model_config = {
        "populate_by_name": True,
        "validate_by_name": True
    }