import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, ConfigDict


# ── Request schemas ──────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str  # Tối thiểu 8 ký tự – validate ở router


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ── Response schemas ─────────────────────────────────────────────────────────

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    created_at: datetime
