"""
Módulo: main.py
Propósito: Servidor principal FastAPI. Configura CORS, expone las rutas REST y 
orquesta la base de datos, autenticación y lógica de negocio.
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import io
import csv
from fastapi.responses import StreamingResponse
import os
import shutil
import uuid
from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.staticfiles import StaticFiles

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

# Crear carpeta de subidas si no existe
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Montar los estáticos para servir los PDFs
# Ejemplo de acceso: http://127.0.0.1:8000/uploads/archivo.pdf
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

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

@app.post("/jobs/{job_id}/apply", status_code=status.HTTP_201_CREATED)
async def apply_to_job(
    job_id: int,
    candidate_name: str = Form(...),
    candidate_email: str = Form(...),
    message: Optional[str] = Form(None),
    cv_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    Registra una postulación a una vacante con opción de adjuntar CV en PDF.
    """
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Oferta laboral no encontrada")

    cv_url = None

    # Si el usuario subió un archivo, validamos y guardamos
    if cv_file and cv_file.filename:
        # Validación de extensión y tipo de contenido
        if not cv_file.filename.lower().endswith(".pdf") or cv_file.content_type != "application/pdf":
            raise HTTPException(
                status_code=400,
                detail="Formato inválido. Solo se admiten archivos en formato PDF."
            )

        # Generar nombre único para evitar colisiones de archivos
        file_extension = ".pdf"
        unique_filename = f"{uuid.uuid4().hex}_{cv_file.filename.replace(' ', '_')}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)

        # Guardar en disco
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(cv_file.file, buffer)

        # Generamos la URL relativa que se guardará en la base de datos
        cv_url = f"/uploads/{unique_filename}"

    # Crear la postulación
    new_application = models.Application(
        job_id=job_id,
        candidate_name=candidate_name,
        candidate_email=candidate_email,
        message=message,
        cv_url=cv_url
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
    current_user: models.User = Depends(get_current_user)
):
    """
    Genera y descarga un archivo CSV con todos los postulantes de una vacante.
    Solo el reclutador dueño de la oferta puede exportar los datos.
    """
    # 1. Verificar existencia de la oferta
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Oferta laboral no encontrada")

    # 2. Verificar permisos del reclutador
    if job.recruiter_id != current_user.id:
        raise HTTPException(
            status_code=403, 
            detail="No tienes autorización para exportar los postulantes de esta oferta"
        )

    # 3. Construir el archivo CSV en memoria
    output = io.StringIO()
    writer = csv.writer(output)

    # Encabezados del reporte
    writer.writerow(["ID Postulacion", "Candidato", "Correo Electronico", "Mensaje / Portafolio", "Fecha Postulacion"])

    # Escribir los registros de postulantes
    for app_item in job.applications:
        writer.writerow([
            app_item.id,
            app_item.candidate_name,
            app_item.candidate_email,
            app_item.message or "Sin mensaje",
            app_item.created_at.strftime("%Y-%m-%d %H:%M:%S") if app_item.created_at else ""
        ])

    output.seek(0)

    # Limpiar el título para el nombre del archivo
    safe_title = "".join(c for c in job.title if c.isalnum() or c in (" ", "-", "_")).rstrip()
    filename = f"postulantes_{safe_title.replace(' ', '_')}_{job.id}.csv"

    # Retornar el flujo con cabeceras de descarga de archivo
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )