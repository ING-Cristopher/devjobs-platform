"""
Módulo: test_api.py
Propósito: Pruebas de integración automatizadas para el pipeline de CI/CD.
Usa TestClient de FastAPI para verificar endpoints críticos sin levantar Uvicorn.
"""

import sys
from pathlib import Path

# Añade la carpeta backend al path de Python para resolver 'main.py' y 'app'
sys.path.append(str(Path(__file__).resolve().parent.parent))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from app.database import Base, get_db

# 1. Base de datos SQLite exclusiva en memoria para pruebas
# Esto garantiza que las pruebas no alteren ni ensucien la base de datos real (jobs.db)
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# 2. Reemplazamos la dependencia de la base de datos de producción por la de pruebas
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

# Cliente de pruebas que simula llamadas HTTP
client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    """Se ejecuta antes de cada prueba creando tablas limpias y las destruye al finalizar."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


# ==========================================
# CASOS DE PRUEBA (TEST SUITE)
# ==========================================

def test_read_root():
    """Verifica que la raíz de la API responda con código 200 OK."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "API activa"}


def test_register_user_success():
    """Verifica el registro exitoso de un reclutador."""
    payload = {
        "name": "Reclutador Test",
        "email": "reclutador@devjobs.com",
        "password": "Password123!",
        "role": "reclutador",
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "reclutador@devjobs.com"
    assert "hashed_password" not in data  # La contraseña nunca debe exponerse


def test_login_and_create_job_pipeline():
    """
    Prueba el flujo completo con autenticación:
    1. Registra un reclutador.
    2. Hace login y obtiene el token JWT.
    3. Publica una vacante enviando el Header 'Authorization: Bearer <token>'.
    4. Lee el listado de empleos y confirma que la vacante esté disponible.
    """
    # 1. Registro
    client.post(
        "/auth/register",
        json={
            "name": "Tech Corp",
            "email": "hr@techcorp.com",
            "password": "SecurePassword123",
            "role": "reclutador",
        },
    )

    # 2. Login
    login_res = client.post(
        "/auth/login",
        json={"email": "hr@techcorp.com", "password": "SecurePassword123"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Publicar empleo con el token
    job_payload = {
        "title": "Ingeniero Cloud AWS",
        "company": "Tech Corp",
        "location": "Remoto",
        "job_type": "Remoto",
        "salary": "$4,000 USD",
        "description": "Buscamos especialista en arquitecturas escalables.",
    }
    create_job_res = client.post("/jobs", json=job_payload, headers=headers)
    assert create_job_res.status_code == 201
    job_id = create_job_res.json()["id"]

    # 4. Verificar que se liste en el catálogo
    jobs_list_res = client.get("/jobs")
    assert jobs_list_res.status_code == 200
    jobs = jobs_list_res.json()
    assert len(jobs) == 1
    assert jobs[0]["title"] == "Ingeniero Cloud AWS"


def test_unauthorized_user_cannot_create_job():
    """Verifica que una petición sin token a /jobs sea rechazada con 401 Unauthorized."""
    job_payload = {
        "title": "Hack Job",
        "company": "Fake",
        "location": "Nowhere",
        "description": "Intento no autenticado",
    }
    response = client.post("/jobs", json=job_payload)
    assert response.status_code == 401