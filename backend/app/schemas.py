"""
Módulo: schemas.py
Propósito: Validación y serialización con Pydantic V2 (usando ConfigDict).
"""

from pydantic import BaseModel, EmailStr, ConfigDict
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


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: int
    created_at: datetime

    # Sintaxis estándar de Pydantic V2
    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
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