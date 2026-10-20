"""
Módulo: test_api.py
Propósito: Pruebas de integración automatizadas para el pipeline de CI/CD.
Verifica:
  1. Políticas OWASP de contraseña sólida.
  2. Verificación por código numérico de 6 dígitos (/auth/verify-code).
  3. Bloqueo de login hasta ingresar el código correcto.
  4. Restricción de postulaciones: solo candidatos autenticados y verificados.
  5. Semillero y permisos del superusuario 'admin'.
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

# Base de datos SQLite en memoria para pruebas
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    """Crea tablas limpias antes de cada prueba."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


# ==========================================
# CASOS DE PRUEBA
# ==========================================

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "API activa"}


def test_owasp_password_policy_rejects_weak_passwords():
    weak_payload = {
        "name": "Usuario Débil",
        "email": "debil@devjobs.com",
        "password": "password123",  # Sin mayúscula ni carácter especial
        "role": "candidato",
    }
    response = client.post("/auth/register", json=weak_payload)
    assert response.status_code == 422


def test_register_and_six_digit_code_verification_pipeline():
    """
    1. Registra un usuario (is_verified=False).
    2. Intento de login previo a verificar código -> 403 Forbidden.
    3. Intento de código inválido -> 400 Bad Request.
    4. Ingreso de código de 6 dígitos correcto -> Cuenta activada.
    5. Login exitoso con JWT.
    """
    reg_res = client.post(
        "/auth/register",
        json={
            "name": "Ana Morales",
            "email": "ana@devjobs.com",
            "password": "Password123!",
            "role": "candidato",
        },
    )
    assert reg_res.status_code == 201
    assert reg_res.json()["is_verified"] is False

    # Login antes de verificar -> 403
    login_before = client.post(
        "/auth/login",
        json={"email": "ana@devjobs.com", "password": "Password123!"},
    )
    assert login_before.status_code == 403

    # Obtener el código de 6 dígitos generado en BD
    with TestingSessionLocal() as db:
        user = db.query(models.User).filter(models.User.email == "ana@devjobs.com").first()
        assert user is not None
        assert user.verification_code is not None
        assert len(user.verification_code) == 6
        real_code = user.verification_code

    # Probar código incorrecto -> 400
    bad_verify = client.post(
        "/auth/verify-code",
        json={"email": "ana@devjobs.com", "code": "000000"},
    )
    assert bad_verify.status_code == 400

    # Probar código correcto -> 200
    good_verify = client.post(
        "/auth/verify-code",
        json={"email": "ana@devjobs.com", "code": real_code},
    )
    assert good_verify.status_code == 200
    assert good_verify.json()["is_verified"] is True

    # Login tras verificación -> 200 OK
    login_after = client.post(
        "/auth/login",
        json={"email": "ana@devjobs.com", "password": "Password123!"},
    )
    assert login_after.status_code == 200
    assert "access_token" in login_after.json()


def test_job_application_requires_authenticated_candidate():
    """
    Verifica que:
    1. Un usuario anónimo no pueda postularse a una vacante (401).
    2. Un reclutador autenticado sea denegado al intentar postularse (403).
    3. Un candidato autenticado y verificado pueda postularse exitosamente.
    """
    with TestingSessionLocal() as db:
        # Crear reclutador verificado
        recruiter = models.User(
            name="Recruiter One",
            email="recruiter@devjobs.com",
            hashed_password="fake",
            role="reclutador",
            is_verified=True,
        )
        db.add(recruiter)
        db.commit()
        db.refresh(recruiter)

        # Crear vacante
        job = models.Job(
            title="Frontend Developer",
            company="Startup Tech",
            location="Remoto",
            description="Requisitos React",
            recruiter_id=recruiter.id,
        )
        db.add(job)

        # Crear candidato verificado
        candidate = models.User(
            name="Dev Candidate",
            email="candidate@devjobs.com",
            hashed_password="fake",
            role="candidato",
            is_verified=True,
        )
        db.add(candidate)
        db.commit()
        db.refresh(job)
        db.refresh(candidate)

        job_id = job.id
        recruiter_id = recruiter.id
        candidate_id = candidate.id

    # 1. Postulación sin token -> 401
    anon_res = client.post(f"/jobs/{job_id}/apply", data={"message": "Hola"})
    assert anon_res.status_code == 401

    # 2. Postulación con token de reclutador -> 403
    from app.auth import create_access_token
    recruiter_token = create_access_token({"sub": "recruiter@devjobs.com", "role": "reclutador", "id": recruiter_id})
    rec_res = client.post(
        f"/jobs/{job_id}/apply",
        data={"message": "Soy reclutador"},
        headers={"Authorization": f"Bearer {recruiter_token}"},
    )
    assert rec_res.status_code == 403
    assert "reclutador" in rec_res.json()["detail"].lower()

    # 3. Postulación con token de candidato -> 201 Created
    candidate_token = create_access_token({"sub": "candidate@devjobs.com", "role": "candidato", "id": candidate_id})
    cand_res = client.post(
        f"/jobs/{job_id}/apply",
        data={"message": "Mi portafolio: https://github.com"},
        headers={"Authorization": f"Bearer {candidate_token}"},
    )
    assert cand_res.status_code == 201
    data = cand_res.json()
    assert data["candidate_name"] == "Dev Candidate"
    assert data["candidate_email"] == "candidate@devjobs.com"


def test_admin_seed_and_moderation():
    with TestingSessionLocal() as db:
        admin_user = seed_admin_user(db)
        admin_email = admin_user.email

    admin_login = client.post(
        "/auth/login",
        json={"email": admin_email, "password": "AdminChamba2026!"},
    )
    assert admin_login.status_code == 200
    token = admin_login.json()["access_token"]

    stats_res = client.get("/admin/stats", headers={"Authorization": f"Bearer {token}"})
    assert stats_res.status_code == 200
    assert stats_res.json()["total_admins"] >= 1
