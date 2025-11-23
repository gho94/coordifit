import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.api import api_router
from app.core.config import get_settings

load_dotenv()

EASYOCR_MODEL_DIR = os.getenv("EASYOCR_MODEL_DIR", "/root/.EasyOCR")
U2NET_MODEL_DIR = os.getenv("U2NET_MODEL_DIR", "/root/.u2net")

print("🔍 Loaded EASYOCR_MODEL_DIR:", EASYOCR_MODEL_DIR)
print("🔍 Loaded U2NET_MODEL_DIR:", U2NET_MODEL_DIR)

os.makedirs(EASYOCR_MODEL_DIR, exist_ok=True)
os.makedirs(U2NET_MODEL_DIR, exist_ok=True)

settings = get_settings()

app = FastAPI(title="Background Removal API", version="1.0.0")

origins = settings.allowed_origins_list or ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}
