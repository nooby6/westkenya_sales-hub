from pydantic import BaseModel, EmailStr, Field

from app.models.enums import AppRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class BootstrapAdminRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=255)
    password: str = Field(min_length=8)
    role: AppRole = AppRole.manager


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AuthenticatedUser(BaseModel):
    user_id: str
    email: EmailStr
    role: AppRole
