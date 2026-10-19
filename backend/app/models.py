"""
Módulo: models.py
Propósito: Definición de las entidades y tablas relacionales usando SQLAlchemy ORM.
Relaciones:
  - User 1 ──< N Job (Un reclutador puede crear múltiples ofertas laborales)
  - Job  1 ──< N Application (Un empleo puede tener múltiples candidatos postulados)
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base


class User(Base):
    """
    Tabla de usuarios del sistema.
    Roles permitidos:
      - 'reclutador': Puede publicar y eliminar ofertas, y ver postulantes.
      - 'candidato': Solo puede postularse a vacantes.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="candidato", nullable=False) # 'candidato' o 'reclutador'
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relación: Empleos publicados por este usuario si es reclutador
    jobs = relationship("Job", back_populates="recruiter", cascade="all, delete-orphan")


class Job(Base):
    """
    Tabla de ofertas laborales publicadas.
    """
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    company = Column(String, nullable=False)
    location = Column(String, nullable=False)
    job_type = Column(String, default="Remoto", nullable=False) # 'Remoto', 'Presencial', 'Híbrido'
    description = Column(Text, nullable=False)
    salary = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Clave foránea que apunta al reclutador que creó la oferta
    recruiter_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relación inversa hacia el usuario reclutador
    recruiter = relationship("User", back_populates="jobs")

    # Relación: Si se elimina la oferta, se eliminan todas sus postulaciones (cascade)
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")


class Application(Base):
    """
    Tabla de postulaciones realizadas por candidatos a un empleo.
    """
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    candidate_name = Column(String, nullable=False)
    candidate_email = Column(String, nullable=False)
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relación hacia el empleo al que pertenece esta postulación
    job = relationship("Job", back_populates="applications")