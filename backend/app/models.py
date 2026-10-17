from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime, timezone
from app.database import Base

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    company = Column(String, nullable=False)
    location = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    salary = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))