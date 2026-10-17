from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./jobs.db"

# connect_args={"check_same_thread": False} es necesario únicamente para SQLite
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependencia para obtener la sesión de base de datos en cada endpoint
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()