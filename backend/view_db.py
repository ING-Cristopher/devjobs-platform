"""
Script: view_db.py
Propósito: Inspeccionar rápidamente el contenido de la base de datos configurada (Neon PostgreSQL / SQLite).
Muestra las tablas 'users', 'jobs' y 'applications' en consola con formato ordenado.
"""

import sys
import os

# Configurar salida UTF-8 en consola de Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, SessionLocal, DATABASE_URL
from app import models


def mask_url(url: str) -> str:
    if "@" in url:
        prefix, rest = url.split("@", 1)
        scheme, user_info = prefix.split("://", 1)
        if ":" in user_info:
            user, _ = user_info.split(":", 1)
            return f"{scheme}://{user}:*****@{rest}"
    return url


def show_database_content():
    print("=" * 70)
    print(" [DATABASE VIEWER - CHAMBA / DEVJOBS]")
    print("=" * 70)
    print(f" * Motor: {engine.dialect.name.upper()}")
    print(f" * URL  : {mask_url(DATABASE_URL)}")
    print("=" * 70)

    with SessionLocal() as db:
        # 1. USUARIOS
        users = db.query(models.User).order_by(models.User.id.asc()).all()
        print(f"\n--- [TABLA: USERS] ({len(users)} registros) ---")
        if not users:
            print("  (Sin usuarios registrados)")
        else:
            for u in users:
                print(
                    f"  [ID: {u.id:2d}] Rol: {u.role:<10} | Email: {u.email:<30} | Nombre: {u.name}"
                )

        # 2. VACANTES / EMPLEOS
        jobs = db.query(models.Job).order_by(models.Job.id.asc()).all()
        print(f"\n--- [TABLA: JOBS] ({len(jobs)} registros) ---")
        if not jobs:
            print("  (Sin vacantes publicadas)")
        else:
            for j in jobs:
                print(
                    f"  [ID: {j.id:2d}] {j.title:<30} | Empresa: {j.company:<20} | Reclutador ID: {j.recruiter_id}"
                )

        # 3. POSTULACIONES
        apps = db.query(models.Application).order_by(models.Application.id.asc()).all()
        print(f"\n--- [TABLA: APPLICATIONS] ({len(apps)} registros) ---")
        if not apps:
            print("  (Sin postulaciones enviadas)")
        else:
            for a in apps:
                print(
                    f"  [ID: {a.id:2d}] Empleo ID: {a.job_id:2d} | Candidato: {a.candidate_name:<20} | Email: {a.candidate_email}"
                )

    print("\n" + "=" * 70)


if __name__ == "__main__":
    show_database_content()

