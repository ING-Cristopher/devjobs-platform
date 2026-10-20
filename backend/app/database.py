"""
Módulo: database.py
Propósito: Configuración y conexión agnóstica a la base de datos (PostgreSQL / SQLite).
Soporta despliegues en Neon, Render, Railway y desarrollo local con SQLite.
"""

import os
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# 1. Carga automática de variables de entorno desde backend/.env si existe
ENV_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
if os.path.isfile(ENV_PATH):
    with open(ENV_PATH, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                key = key.strip()
                val = val.strip().strip("'\"")
                if key and key not in os.environ:
                    os.environ[key] = val

# 2. Lectura y normalización de DATABASE_URL
RAW_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./jobs.db")

# Render y otros proveedores Cloud a menudo exportan 'postgres://'
# SQLAlchemy 1.4+ exige estrictamente el driver 'postgresql://'
if RAW_DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = RAW_DATABASE_URL.replace("postgres://", "postgresql://", 1)
else:
    DATABASE_URL = RAW_DATABASE_URL

# 3. Argumentos de conexión específicos según el motor (Dialect)
is_sqlite: bool = DATABASE_URL.startswith("sqlite")
engine_kwargs = {}

if is_sqlite:
    # check_same_thread: False es obligatorio en SQLite para permitir concurrencia de FastAPI
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Optimizaciones para PostgreSQL en Cloud (Neon / Render):
    # pool_pre_ping valida conexiones activas previniendo errores por 'idle connection timeout'
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 300

engine = create_engine(DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    Dependencia de FastAPI para proveer una sesión de base de datos aislada por petición.
    Garantiza el cierre adecuado de la conexión en el bloque finally.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
