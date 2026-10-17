from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# Propiedades comunes que comparte un empleo
class JobBase(BaseModel):
    title: str
    company: str
    location: str
    description: str
    salary: Optional[str] = None

# Datos requeridos para crear un empleo (vienen del frontend)
class JobCreate(JobBase):
    pass

# Datos que la API devuelve al cliente (incluye ID y fecha generada)
class JobResponse(JobBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True