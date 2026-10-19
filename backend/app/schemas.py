"""
Módulo: schemas.py
Propósito: Validación de datos de entrada y salida mediante Pydantic (Data Transfer Objects).
Evita que contraseñas u otros datos sensibles salgan expuestos en las respuestas HTTP.
"""

from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List


# ==========================================
# ESQUEMAS DE AUTENTICACIÓN Y USUARIOS
# ==========================================

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str = "candidato" # Por defecto entra como candidato


class UserCreate(UserBase):
    """Datos necesarios para registrar un usuario (incluye contraseña plana)."""
    password: str


class UserLogin(BaseModel):
    """Datos necesarios para iniciar sesión."""
    email: EmailStr
    password: str


class UserResponse(UserBase):
    """Respuesta pública del usuario: NUNCA expone el campo password."""
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Respuesta al hacer login con éxito."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ==========================================
# ESQUEMAS DE POSTULACIONES
# ==========================================

class ApplicationBase(BaseModel):
    candidate_name: str
    candidate_email: str
    message: Optional[str] = None


class ApplicationCreate(ApplicationBase):
    pass


class ApplicationResponse(ApplicationBase):
    id: int
    job_id: int
    created_at: datetime

    class Config:
        from_attributes = True


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

    class Config:
        from_attributes = True