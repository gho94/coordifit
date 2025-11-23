"""OCR service for text extraction from images using EasyOCR."""
import os
from dotenv import load_dotenv
import easyocr
import numpy as np
import cv2
import logging
import traceback
from typing import List, Dict, Any

load_dotenv()

EASYOCR_MODEL_DIR = os.getenv("EASYOCR_MODEL_DIR", "/root/.EasyOCR")
U2NET_MODEL_DIR = os.getenv("U2NET_MODEL_DIR", "/root/.u2net")

print("🔍 Loaded EASYOCR_MODEL_DIR:", EASYOCR_MODEL_DIR)
print("🔍 Loaded U2NET_MODEL_DIR:", U2NET_MODEL_DIR)

os.makedirs(EASYOCR_MODEL_DIR, exist_ok=True)
os.makedirs(U2NET_MODEL_DIR, exist_ok=True)

logger = logging.getLogger("uvicorn.error")

class OCRError(Exception):
    """Raised when an OCR operation fails."""

try:
    logger.info("📦 Loading EasyOCR models...")
    reader = easyocr.Reader(
        ['ko', 'en'], 
        gpu=False, 
        download_enabled=True,
        model_storage_directory=EASYOCR_MODEL_DIR
    )
    logger.info("✅ EasyOCR model loaded successfully.")
except Exception as e:
    logger.error(f"❌ Failed to load EasyOCR model: {e}")
    raise


def extract_text_from_image(image_bytes: bytes) -> List[Dict[str, Any]]:
    """이미지 바이트에서 텍스트 추출"""
    try:
        np_image = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(np_image, cv2.IMREAD_COLOR)
        
        if image is None:
            logger.error("❌ [OCR] Failed to decode image - image is None")
            raise OCRError("Failed to decode image")
        
        logger.info("✅ [OCR] Image decoded successfully")
        logger.info("🧠 [OCR] Running EasyOCR...")

        results = reader.readtext(image)
        
        logger.info(f"🔍 [OCR Raw Results]: {results}")
        
        texts = [{
            "text": text,
            "confidence": float(conf)
        } for (bbox, text, conf) in results]
        
        logger.info(f"✅ [OCR] Extracted {len(texts)} text items")
        return texts
        
    except Exception as exc:
        logger.error("🔥 [OCR ERROR] Exception occurred:")
        logger.error(traceback.format_exc())
        raise OCRError(f"Failed to extract text from image: {str(exc)}") from exc
