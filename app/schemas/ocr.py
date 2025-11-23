"""Schemas for OCR endpoints."""

from pydantic import BaseModel
from typing import List


class OCRItem(BaseModel):
    """Individual OCR result item."""
    text: str
    confidence: float


class OCRResponse(BaseModel):
    """Response model for OCR endpoint."""
    count: int
    results: List[OCRItem]