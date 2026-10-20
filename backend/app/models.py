"""
Módulo: models.py
Propósito: Definición de las entidades y tablas relacionales usando SQLAlchemy ORM.
Totalmente compatible con PostgreSQL (Neon/Render) y SQLite (local).
Relaciones:
  - User 1 ──< N Job (cascade="all, delete-orphan", ondelete="CASCADE")
  - Job  1 ──< N Application (cascade="all, delete-orphan", ondelete="CASCADE")
  - User 1 ──< N Application (postulaciones realizadas por el candidato)
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base


class User(Base):
    """
    Tabla 'users': Representa a los usuarios del sistema.
    Roles admitidos: 'admin', 'reclutador', 'candidato'.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="candidato", nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_code = Column(String(6), nullable=True, index=True)
    verification_code_expires_at = Column(DateTime(timezone=True), nullable=True)
    verification_token = Column(String(255), nullable=True, index=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relación: Empleos publicados por este usuario si es reclutador/admin
    jobs = relationship(
        "Job",
        back_populates="recruiter",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    # Relación: Postulaciones realizadas por este usuario si es candidato
    applications = relationship(
        "Application",
        back_populates="candidate",
        passive_deletes=True,
    )


class Job(Base):
    """
    Tabla 'jobs': Ofertas laborales publicadas por reclutadores o administradores.
    """
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), index=True, nullable=False)
    company = Column(String(200), nullable=False)
    location = Column(String(200), nullable=False)
    job_type = Column(String(50), default="Remoto", nullable=False)  # 'Remoto', 'Presencial', 'Híbrido'
    salary = Column(String(100), nullable=True)
    description = Column(Text, nullable=False)
    recruiter_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
    )
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relación inversa hacia el usuario reclutador
    recruiter = relationship("User", back_populates="jobs")

    # Relación hacia las postulaciones recibidas
    applications = relationship(
        "Application",
        back_populates="job",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Application(Base):
    """
    Tabla 'applications': Postulaciones realizadas por candidatos a una vacante.
    """
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    candidate_name = Column(String(150), nullable=False)
    candidate_email = Column(String(255), nullable=False)
    message = Column(Text, nullable=True)
    cv_url = Column(String(500), nullable=True)
    job_id = Column(
        Integer,
        ForeignKey("jobs.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relación hacia el empleo al que pertenece esta postulación
    job = relationship("Job", back_populates="applications")

    # Relación hacia el candidato autenticado
    candidate = relationship("User", back_populates="applications")
