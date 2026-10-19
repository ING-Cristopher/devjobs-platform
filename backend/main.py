"""
Módulo: main.py
Propósito: Servidor principal FastAPI. Configura CORS, expone las rutas REST y 
orquesta la base de datos, autenticación y lógica de negocio.
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from app.database import engine, Base, get_db
from app import models, schemas
from app.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)

# Inicializa las tablas en la base de datos SQLite si aún no existen
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="DevJobs API",
    description="Backend robusto para plataforma de empleos con autenticación JWT y roles.",
    version="2.0.0",
)

@app.get("/")
def home():
    """Ruta básica para verificar que el servicio está activo."""
    return {"message": "API activa"}

# Habilitamos CORS para desarrollo local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# RUTAS DE AUTENTICACIÓN
# ==========================================

@app.post("/auth/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Registra una nueva cuenta de usuario.
    Verifica que el email no esté duplicado y guarda la contraseña hasheada.
    """
    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe una cuenta registrada con este correo electrónico",
        )

    # Creamos el usuario con la contraseña cifrada
    new_user = models.User(
        name=user_data.name,
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        role=user_data.role, # 'reclutador' o 'candidato'
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.post("/auth/login", response_model=schemas.TokenResponse)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    """
    Inicia sesión verificando credenciales.
    Devuelve un token JWT con el email y el rol para que React lo almacene.
    """
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo electrónico o contraseña incorrectos",
        )

    # Creamos el token JWT guardando el email en el 'sub' (subject) y el rol
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


@app.post("/jobs", response_model=schemas.JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(
    job: schemas.JobCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user), # Ruta protegida con JWT
):
    """
    Ruta protegida: solo usuarios autenticados con rol 'reclutador' pueden publicar empleos.
    """
    if current_user.role != "reclutador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los usuarios con rol 'reclutador' tienen permiso para publicar empleos.",
        )

    new_job = models.Job(
        **job.model_dump(),
        recruiter_id=current_user.id # Vinculamos la vacante al reclutador
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return new_job


@app.delete("/jobs/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user), # Ruta protegida
):
    """
    Ruta protegida: solo el reclutador dueño de la oferta puede eliminarla.
    """
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Oferta laboral no encontrada")

    if job.recruiter_id and job.recruiter_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para eliminar una vacante creada por otro reclutador.",
        )

    db.delete(job)
    db.commit()
    return None


# ==========================================
# RUTAS DE POSTULACIONES
# ==========================================

@app.post("/jobs/{job_id}/apply", response_model=schemas.ApplicationResponse)
def apply_to_job(job_id: int, application: schemas.ApplicationCreate, db: Session = Depends(get_db)):
    """Cualquier candidato puede postularse a un empleo existente."""
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Oferta laboral no encontrada")

    new_app = models.Application(
        job_id=job_id,
        candidate_name=application.candidate_name,
        candidate_email=application.candidate_email,
        message=application.message,
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    return new_app