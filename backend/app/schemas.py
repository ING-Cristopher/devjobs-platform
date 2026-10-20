"""
Módulo: schemas.py
Propósito: Validación y serialización con Pydantic V2 (usando ConfigDict),
políticas de seguridad OWASP para contraseñas y verificación con código numérico de 6 dígitos.
"""

import re
from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
from datetime import datetime
from typing import Optional, List


# ==========================================
# ESQUEMAS DE AUTENTICACIÓN Y USUARIOS
# ==========================================

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str = "candidato"


class UserCreate(UserBase):
    password: str

    @field_validator("password")
    @classmethod
    def validate_strong_password(cls, value: str) -> str:
        """
        Política de contraseña sólida (OWASP):
        - Mínimo 8 caracteres
        - Al menos una letra mayúscula
        - Al menos una letra minúscula
        - Al menos un número
        - Al menos un carácter especial
        """
        if len(value) < 8:
            raise ValueError("La contraseña debe tener al menos 8 caracteres.")
        if not re.search(r"[A-Z]", value):
            raise ValueError("La contraseña debe incluir al menos una letra mayúscula.")
        if not re.search(r"[a-z]", value):
            raise ValueError("La contraseña debe incluir al menos una letra minúscula.")
        if not re.search(r"\d", value):
            raise ValueError("La contraseña debe incluir al menos un número.")
        if not re.search(r"[^A-Za-z0-9\s]", value):
            raise ValueError(
                "La contraseña debe incluir al menos un carácter especial (ej. !@#$%^&*)."
            )
        return value

    @field_validator("role")
    @classmethod
    def validate_public_role(cls, value: str) -> str:
        """
        Evita que un usuario se auto-asigne el rol 'admin' desde el endpoint público de registro.
        """
        allowed = {"candidato", "reclutador"}
        if value not in allowed:
            raise ValueError("El rol debe ser 'candidato' o 'reclutador'.")
        return value


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: int
    is_verified: bool = True
    created_at: datetime
    dev_verification_code: Optional[str] = None  # Retrocompatibilidad

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class VerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str

    @field_validator("code")
    @classmethod
    def validate_six_digit_code(cls, value: str) -> str:
        cleaned = value.strip()
        if not re.fullmatch(r"\d{6}", cleaned):
            raise ValueError("El código de verificación debe contener exactamente 6 dígitos numéricos.")
        return cleaned


class ResendCodeRequest(BaseModel):
    email: EmailStr


class UserRoleUpdate(BaseModel):
    role: str

    @field_validator("role")
    @classmethod
    def validate_any_role(cls, value: str) -> str:
        if value not in {"candidato", "reclutador", "admin"}:
            raise ValueError("El rol debe ser 'candidato', 'reclutador' o 'admin'.")
        return value


class AdminStatsResponse(BaseModel):
    total_users: int
    verified_users: int
    unverified_users: int
    total_recruiters: int
    total_candidates: int
    total_admins: int
    total_jobs: int
    total_applications: int


# ==========================================
# ESQUEMAS DE POSTULACIONES
# ==========================================

class ApplicationBase(BaseModel):
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    message: Optional[str] = None
    cv_url: Optional[str] = None


class ApplicationCreate(ApplicationBase):
    pass


class ApplicationResponse(BaseModel):
    id: int
    job_id: int
    candidate_id: Optional[int] = None
    candidate_name: str
    candidate_email: str
    message: Optional[str] = None
    cv_url: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# ESQUEMAS DE EMPLEOS
# ==========================================

class JobBase(BaseModel):
    title: str
    company: str
    location: str
    job_type: Optional[str] = "Remoto"
    description: str
    salary: Optional[str] = None


class JobCreate(JobBase):
    pass


class JobResponse(JobBase):
    id: int
    created_at: datetime
    recruiter_id: Optional[int] = None
    applications: List[ApplicationResponse] = []

    model_config = ConfigDict(from_attributes=True)