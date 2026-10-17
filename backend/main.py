from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from app.database import engine, Base, get_db
from app import models, schemas

# Crea las tablas si no existen en la base de datos
Base.metadata.create_all(bind=engine)

app = FastAPI(title="DevJobs API", version="1.0.0")

# Permitir orígenes cruzados en local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "API activa"}

# 1. Obtener lista de todos los empleos (los más recientes primero)
@app.get("/jobs", response_model=List[schemas.JobResponse])
def get_jobs(db: Session = Depends(get_db)):
    return db.query(models.Job).order_by(models.Job.id.desc()).all()

# 2. Crear una oferta laboral
@app.post("/jobs", response_model=schemas.JobResponse)
def create_job(job: schemas.JobCreate, db: Session = Depends(get_db)):
    new_job = models.Job(**job.model_dump())
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return new_job

# 3. Postularse a un empleo específico
@app.post("/jobs/{job_id}/apply", response_model=schemas.ApplicationResponse)
def apply_to_job(job_id: int, application: schemas.ApplicationCreate, db: Session = Depends(get_db)):
    # Validamos que el empleo exista
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

# 4. Eliminar una oferta laboral y sus postulaciones asociadas
@app.delete("/jobs/{job_id}", status_code=204)
def delete_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Oferta laboral no encontrada")
    
    db.delete(job)
    db.commit()
    return None