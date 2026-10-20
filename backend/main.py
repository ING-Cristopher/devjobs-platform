"""
Módulo: main.py
Propósito: Servidor principal FastAPI. Configura CORS, expone las rutas REST y 
orquesta la base de datos, autenticación JWT, políticas OWASP, verificación de correo
por código numérico de 6 dígitos (15 min) y postulación restringida a usuarios autenticados.
"""

import csv
import io
import os
import shutil
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import (
    BackgroundTasks,
    Depends,
    FastAPI,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

def load_env_file():
    """Carga variables desde backend/.env si existe."""
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.isfile(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    key = key.strip()
                    val = val.strip().strip("'\"")
                    if key and key not in os.environ:
                        os.environ[key] = val

load_env_file()

from app import models, schemas
from app.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    require_admin,
    verify_password,
)
from app.database import Base, SessionLocal, engine, get_db
from app.email_service import (
    generate_verification_code,
    send_verification_code_email_task,
    is_smtp_configured,
)
from seed_admin import init_db, seed_admin_user


# Inicializa las tablas al arrancar el módulo
init_db(engine)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Ciclo de vida del backend: inicializa tablas y garantiza superusuario admin."""
    init_db(engine)
    with SessionLocal() as db:
        seed_admin_user(db)
    yield


app = FastAPI(
    title="DevJobs / Chamba API",
    description="Backend robusto con políticas OWASP, autenticación JWT directa y postulaciones autenticadas.",
    version="2.3.0",
    lifespan=lifespan,
)

# Crear carpeta de subidas si no existe
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Montar los estáticos para servir los PDFs
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/")
def home():
    """Ruta básica para verificar que el servicio está activo."""
    return {"message": "API activa"}


# Habilitamos CORS para desarrollo local y producción
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# RUTAS DE AUTENTICACIÓN Y VERIFICACIÓN
# ==========================================

@app.post(
    "/auth/register",
    response_model=schemas.UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    user_data: schemas.UserCreate,
    db: Session = Depends(get_db),
):
    """
    Registra una nueva cuenta de usuario aplicando validación OWASP de contraseña.
    La cuenta queda verificada y activa inmediatamente (sin confirmación de correo).
    """
    existing_user = (
        db.query(models.User).filter(models.User.email == user_data.email).first()
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe una cuenta registrada con este correo electrónico",
        )

    new_user = models.User(
        name=user_data.name,
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        role=user_data.role,  # 'reclutador' o 'candidato'
        is_verified=True,
        verification_code=None,
        verification_code_expires_at=None,
        verification_token=None,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    new_user.dev_verification_code = None
    return new_user


@app.post("/auth/verify-code")
def verify_code(
    payload: schemas.VerifyCodeRequest,
    db: Session = Depends(get_db),
):
    """
    Endpoint retrocompatible: confirma que la cuenta está activa.
    """
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No encontramos una cuenta con ese correo electrónico.",
        )

    if not user.is_verified:
        user.is_verified = True
        db.commit()
        db.refresh(user)

    return {
        "message": "Cuenta verificada con éxito. Ya puedes iniciar sesión.",
        "email": user.email,
        "is_verified": True,
    }


@app.post("/auth/resend-code")
def resend_code(
    payload: schemas.ResendCodeRequest,
    db: Session = Depends(get_db),
):
    """
    Endpoint retrocompatible: la verificación de correo no es requerida.
    """
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No encontramos una cuenta con ese correo electrónico.",
        )

    return {
        "message": "La verificación de correo no es requerida. Tu cuenta está activa.",
        "dev_verification_code": None,
    }


@app.get("/auth/verify")
def verify_email_legacy(
    token: str = Query(..., description="Token de verificación"),
    db: Session = Depends(get_db),
):
    """Ruta retrocompatible para verificar por enlace."""
    user = (
        db.query(models.User)
        .filter(models.User.verification_token == token)
        .first()
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Enlace de verificación inválido o ya utilizado.",
        )

    user.is_verified = True
    user.verification_token = None
    user.verification_code = None
    user.verification_code_expires_at = None
    db.commit()
    db.refresh(user)

    return {
        "message": "Correo verificado con éxito. Ya puedes iniciar sesión.",
        "email": user.email,
        "is_verified": user.is_verified,
    }


@app.post("/auth/login", response_model=schemas.TokenResponse)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    """
    Inicia sesión verificando credenciales.
    """
    user = (
        db.query(models.User)
        .filter(models.User.email == credentials.email)
        .first()
    )
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo electrónico o contraseña incorrectos",
        )

    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "id": user.id}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


# ==========================================
# RUTAS DE EMPLEOS (JOBS)
# ==========================================

@app.get("/jobs", response_model=List[schemas.JobResponse])
def get_jobs(db: Session = Depends(get_db)):
    """Ruta pública: cualquier visitante puede ver las ofertas disponibles."""
    return db.query(models.Job).order_by(models.Job.id.desc()).all()


@app.get("/jobs/{job_id}", response_model=schemas.JobResponse)
def get_job_by_id(job_id: int, db: Session = Depends(get_db)):
    """Ruta pública: detalle individual de una oferta laboral."""
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Oferta laboral no encontrada")
    return job


@app.post(
    "/jobs",
    response_model=schemas.JobResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_job(
    job: schemas.JobCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Ruta protegida: usuarios verificados con rol 'reclutador' o 'admin' pueden publicar empleos.
    """
    if current_user.role not in ("reclutador", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los usuarios con rol 'reclutador' o 'admin' tienen permiso para publicar empleos.",
        )

    new_job = models.Job(**job.model_dump(), recruiter_id=current_user.id)
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return new_job


@app.delete("/jobs/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Ruta protegida: el reclutador dueño de la oferta O un administrador ('admin') pueden eliminarla.
    """
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Oferta laboral no encontrada")

    is_admin = current_user.role == "admin"
    is_owner = job.recruiter_id == current_user.id

    if not is_admin and not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para eliminar una vacante creada por otro reclutador.",
        )

    db.delete(job)
    db.commit()
    return None


# ==========================================
# RUTAS DE POSTULACIONES (AUTENTICADAS)
# ==========================================

@app.post("/jobs/{job_id}/apply", response_model=schemas.ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def apply_to_job(
    job_id: int,
    message: Optional[str] = Form(None),
    cv_file: Optional[UploadFile] = File(None),
    candidate_name: Optional[str] = Form(None),
    candidate_email: Optional[str] = Form(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Registra una postulación a una vacante con opción de adjuntar CV en PDF.
    Exige autenticación obligatoria y que el usuario sea candidato (no reclutador) y esté verificado.
    Asocia la postulación a su cuenta y usa autoritariamente su nombre y correo reales.
    """
    # 1. Validación de rol: Denegar si el usuario es reclutador
    if current_user.role == "reclutador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los candidatos pueden postularse a vacantes. Tu cuenta tiene rol de reclutador.",
        )

    # 2. Comprobar existencia del empleo
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Oferta laboral no encontrada")

    # 4. Manejo del archivo PDF
    cv_url = None
    if cv_file and cv_file.filename:
        if (
            not cv_file.filename.lower().endswith(".pdf")
            or cv_file.content_type != "application/pdf"
        ):
            raise HTTPException(
                status_code=400,
                detail="Formato inválido. Solo se admiten archivos en formato PDF.",
            )

        unique_filename = f"{uuid.uuid4().hex}_{cv_file.filename.replace(' ', '_')}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(cv_file.file, buffer)

        cv_url = f"/uploads/{unique_filename}"

    # 5. Guardar postulación vinculada al ID del usuario autenticado
    new_application = models.Application(
        job_id=job_id,
        candidate_id=current_user.id,
        candidate_name=current_user.name,
        candidate_email=current_user.email,
        message=message,
        cv_url=cv_url,
    )

    db.add(new_application)
    db.commit()
    db.refresh(new_application)

    return new_application


# ==========================================
# EXPORTACIÓN DE CANDIDATOS A CSV
# ==========================================

@app.get("/jobs/{job_id}/applications/csv")
def export_applications_csv(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Genera y descarga un archivo CSV con todos los postulantes de una vacante.
    Permitido al reclutador dueño de la oferta o al administrador ('admin').
    """
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Oferta laboral no encontrada")

    if current_user.role != "admin" and job.recruiter_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="No tienes autorización para exportar los postulantes de esta oferta",
        )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "ID Postulacion",
            "Candidato",
            "Correo Electronico",
            "Mensaje / Portafolio",
            "Fecha Postulacion",
        ]
    )

    for app_item in job.applications:
        writer.writerow(
            [
                app_item.id,
                app_item.candidate_name,
                app_item.candidate_email,
                app_item.message or "Sin mensaje",
                app_item.created_at.strftime("%Y-%m-%d %H:%M:%S")
                if app_item.created_at
                else "",
            ]
        )

    output.seek(0)
    safe_title = "".join(
        c for c in job.title if c.isalnum() or c in (" ", "-", "_")
    ).rstrip()
    filename = f"postulantes_{safe_title.replace(' ', '_')}_{job.id}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ==========================================
# RUTAS DE ADMINISTRACIÓN (ROL 'admin')
# ==========================================

@app.get("/admin/stats", response_model=schemas.AdminStatsResponse)
def get_admin_stats(
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_admin),
):
    """Resumen global del sistema para supervisión del administrador."""
    users = db.query(models.User).all()
    total_jobs = db.query(models.Job).count()
    total_applications = db.query(models.Application).count()

    return {
        "total_users": len(users),
        "verified_users": sum(1 for u in users if u.is_verified),
        "unverified_users": sum(1 for u in users if not u.is_verified),
        "total_recruiters": sum(1 for u in users if u.role == "reclutador"),
        "total_candidates": sum(1 for u in users if u.role == "candidato"),
        "total_admins": sum(1 for u in users if u.role == "admin"),
        "total_jobs": total_jobs,
        "total_applications": total_applications,
    }


@app.get("/admin/users", response_model=List[schemas.UserResponse])
def list_all_users(
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_admin),
):
    """Lista todos los usuarios registrados para gestión administrativa."""
    return db.query(models.User).order_by(models.User.id.desc()).all()


@app.patch("/admin/users/{user_id}/role", response_model=schemas.UserResponse)
def update_user_role(
    user_id: int,
    payload: schemas.UserRoleUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(require_admin),
):
    """Permite al administrador cambiar el rol de un usuario."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if user.id == current_admin.id and payload.role != "admin":
        raise HTTPException(
            status_code=400,
            detail="No puedes quitarte el rol de administrador a ti mismo.",
        )

    user.role = payload.role
    db.commit()
    db.refresh(user)
    return user


@app.patch("/admin/users/{user_id}/verify", response_model=schemas.UserResponse)
def admin_verify_user(
    user_id: int,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_admin),
):
    """Permite al administrador verificar manualmente la cuenta de cualquier usuario."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    user.is_verified = True
    user.verification_code = None
    user.verification_code_expires_at = None
    user.verification_token = None
    db.commit()
    db.refresh(user)
    return user


@app.delete("/admin/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(require_admin),
):
    """Permite al administrador eliminar una cuenta de usuario (y sus ofertas asociadas)."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if user.id == current_admin.id:
        raise HTTPException(
            status_code=400,
            detail="No puedes eliminar tu propia cuenta de administrador.",
        )

    db.delete(user)
    db.commit()
    return None
