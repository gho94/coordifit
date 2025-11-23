"""Domain logic for background removal operations (sharp mode)."""
import os
import logging
import traceback
from io import BytesIO
from PIL import Image
from rembg import remove, new_session

logger = logging.getLogger("uvicorn.error")

class BackgroundRemovalError(Exception):
    """Raised when a background removal operation fails."""

U2NET_MODEL_DIR = os.getenv("U2NET_MODEL_DIR", "/root/.u2net")
logger.info(f"🧩 [INIT] U2Net model directory: {U2NET_MODEL_DIR}")

try:
    logger.info("🧠 [INIT] Loading U2Net model session...")
    session = new_session("u2net", model_dir=U2NET_MODEL_DIR)
    logger.info("✅ [INIT] U2Net model loaded successfully.")
except Exception as e:
    logger.error("❌ [INIT] Failed to load U2Net model:")
    logger.error(traceback.format_exc())
    raise BackgroundRemovalError(f"Failed to load U2Net model: {e}") from e

def remove_background(image_bytes: bytes) -> bytes:
    """Remove the background from the provided image and return PNG bytes (sharp preset)."""
    try:
        logger.info("⚙️ [STEP 1-1] Running rembg.remove() with sharp preset...")
        # ⚙️ sharp preset 적용 — 옷 상품 등록용, 경계가 또렷하게
        result_bytes = remove(
            image_bytes,
            session=session,
            alpha_matting=False,    # 경계 흐림 제거
            post_process_mask=True  # 잔여 픽셀/노이즈 제거
        )
        logger.info("✅ [STEP 1-2] Background removed successfully.")
    except Exception as exc:
        logger.error("🔥 [ERROR] During background removal stage:")
        logger.error(traceback.format_exc())
        raise BackgroundRemovalError("Failed to remove background") from exc

    try:
        logger.info("🖼️ [STEP 2] Converting result image to RGBA PNG...")
        with Image.open(BytesIO(result_bytes)) as processed_image:
            buffered = BytesIO()
            processed_image.convert("RGBA").save(buffered, format="PNG")
        logger.info("✅ [STEP 2] Image converted and saved successfully.")
    except Exception as exc:
        logger.error("🔥 [ERROR] During image post-processing stage:")
        logger.error(traceback.format_exc())
        raise BackgroundRemovalError("Failed to process output image") from exc

    logger.info("🎯 [COMPLETE] Background removal process finished successfully.")
    return buffered.getvalue()
