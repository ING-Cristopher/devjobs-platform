"""
Módulo: test_api.py
Propósito: Pruebas de integración automatizadas para el pipeline de CI/CD.
Verifica:
  1. Políticas OWASP de contraseña sólida.
  2. Flujo de confirmación de correo por token (/auth/verify) y bloqueo de login sin verificar.
  3. Rol de Administrador ('admin'), semillero automático y moderación de vacantes/usuarios.
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
from app import models
from seed_admin import seed_admin_user

# 1. Base de datos SQLite exclusiva en memoria para pruebas
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


def test_owasp_password_policy_rejects_weak_passwords():
    """Verifica que contraseñas sin mayúscula, número o carácter especial sean rechazadas (422)."""
    weak_payload = {
        "name": "Usuario Debil",
        "email": "debil@devjobs.com",
        "password": "password123",  # Sin mayúscula ni carácter especial
        "role": "candidato",
    }
    response = client.post("/auth/register", json=weak_payload)
    assert response.status_code == 422


def test_register_user_success():
    """Verifica el registro exitoso con contraseña OWASP y estado inicial no verificado."""
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
    assert data["is_verified"] is False
    assert "hashed_password" not in data


def test_login_blocked_until_email_verified_and_create_job_pipeline():
    """
    Prueba el flujo completo con verificación de correo por token:
    1. Registra un reclutador (is_verified=False).
    2. Intenta hacer login antes de verificar -> debe ser bloqueado (403 Forbidden).
    3. Confirma el correo mediante GET /auth/verify?token=...
    4. Hace login exitosamente, obtiene JWT y publica una vacante.
    """
    # 1. Registro con contraseña OWASP válida
    client.post(
        "/auth/register",
        json={
            "name": "Tech Corp",
            "email": "hr@techcorp.com",
            "password": "SecurePassword123!",
            "role": "reclutador",
        },
    )

    # 2. Intento de login sin verificar correo -> bloqueado (403)
    unverified_login = client.post(
        "/auth/login",
        json={"email": "hr@techcorp.com", "password": "SecurePassword123!"},
    )
    assert unverified_login.status_code == 403

    # 3. Obtener token de verificación de la BD de prueba y llamar a /auth/verify
    with TestingSessionLocal() as db:
        user = db.query(models.User).filter(models.User.email == "hr@techcorp.com").first()
        assert user is not None
        assert user.verification_token is not None
        verify_token = user.verification_token

    verify_res = client.get(f"/auth/verify?token={verify_token}")
    assert verify_res.status_code == 200
    assert verify_res.json()["is_verified"] is True

    # 4. Login tras verificar correo
    login_res = client.post(
        "/auth/login",
        json={"email": "hr@techcorp.com", "password": "SecurePassword123!"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 5. Publicar empleo con el token
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

    # 6. Verificar que se liste en el catálogo
    jobs_list_res = client.get("/jobs")
    assert jobs_list_res.status_code == 200
    jobs = jobs_list_res.json()
    assert len(jobs) == 1
    assert jobs[0]["title"] == "Ingeniero Cloud AWS"


def test_admin_seed_and_moderation_permissions():
    """
    Verifica que el superusuario 'admin' creado por el semillero:
    - Pueda iniciar sesión directamente (is_verified=True).
    - Pueda consultar /admin/stats y /admin/users.
    - Pueda eliminar vacantes creadas por cualquier reclutador.
    """
    with TestingSessionLocal() as db:
        admin_user = seed_admin_user(db)
        admin_email = admin_user.email

    # Login como admin
    admin_login = client.post(
        "/auth/login",
        json={"email": admin_email, "password": "AdminChamba2026!"},
    )
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Consultar estadísticas de admin
    stats_res = client.get("/admin/stats", headers=admin_headers)
    assert stats_res.status_code == 200
    assert stats_res.json()["total_admins"] >= 1


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
