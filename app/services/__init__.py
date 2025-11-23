"""Service layer exports."""

from app.services.background_service import BackgroundRemovalError, remove_background

__all__ = ["BackgroundRemovalError", "remove_background"]
