"""Utility helpers for image processing and validation."""

import base64
from typing import Iterable

SUPPORTED_IMAGE_MIME_TYPES: Iterable[str] = (
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
)


def is_supported_image_mime(content_type: str) -> bool:
    return content_type.lower() in SUPPORTED_IMAGE_MIME_TYPES if content_type else False


def encode_image_to_base64(image_bytes: bytes) -> str:
    return base64.b64encode(image_bytes).decode("utf-8")
