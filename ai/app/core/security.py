"""Security utilities and stubs for future authentication implementations."""

from typing import Any


def get_password_hash(_: str) -> str:
    """Placeholder password hashing implementation."""
    raise NotImplementedError("Security features are not implemented yet.")


def verify_password(_: str, __: str) -> bool:
    """Placeholder password verification implementation."""
    raise NotImplementedError("Security features are not implemented yet.")


def create_access_token(_: Any) -> str:
    """Placeholder token creation implementation."""
    raise NotImplementedError("Security features are not implemented yet.")
