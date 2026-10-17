from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    company = Column(String, nullable=False)
    location = Column(String, nullable=False)
    job_type = Column(String, default="Remoto", nullable=False) # Nueva columna: "Remoto", "Presencial", "Híbrido"
    description = Column(Text, nullable=False)
    salary = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    candidate_name = Column(String, nullable=False)
    candidate_email = Column(String, nullable=False)
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    job = relationship("Job", back_populates="applications")