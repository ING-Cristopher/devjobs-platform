from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

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


class JobBase(BaseModel):
    title: str
    company: str
    location: str
    job_type: Optional[str] = "Remoto" # Remoto, Presencial o Híbrido
    description: str
    salary: Optional[str] = None

class JobCreate(JobBase):
    pass

class JobResponse(JobBase):
    id: int
    created_at: datetime
    applications: List[ApplicationResponse] = []

    class Config:
        from_attributes = True