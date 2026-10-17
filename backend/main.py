from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from app.database import engine, Base, get_db
from app import models, schemas

# Crea las tablas en jobs.db automáticamente si no existen
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Portal de Empleos API",
    description="API para gestionar ofertas laborales y postulaciones",
    version="1.0.0"
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
]
# Permitimos que la futura app de React haga peticiones
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "API de Empleos activa y funcionando"}

# 1. Obtener lista de todos los empleos
@app.get("/jobs", response_model=List[schemas.JobResponse])
def get_jobs(db: Session = Depends(get_db)):
    return db.query(models.Job).all()

# 2. Crear una nueva oferta de empleo
@app.post("/jobs", response_model=schemas.JobResponse)
def create_job(job: schemas.JobCreate, db: Session = Depends(get_db)):
    new_job = models.Job(**job.model_dump())
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return new_job

# 3. Obtener un empleo específico por ID
@app.get("/jobs/{job_id}", response_model=schemas.JobResponse)
def get_job_by_id(job_id: int, db: Session = Depends(get_db)):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Oferta de empleo no encontrada")
    return job