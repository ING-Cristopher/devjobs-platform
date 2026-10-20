"""
Módulo: seed_admin.py
Propósito: Inicialización agnóstica de tablas (PostgreSQL / SQLite) y semillero
automático del superusuario 'admin' desde variables de entorno.
"""

import os
from sqlalchemy import text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session
from app.database import engine, SessionLocal, Base
from app import models
from app.auth import hash_password


def init_db(db_engine: Engine) -> None:
    """
    Crea automáticamente todas las tablas relacionales en el motor configurado.
    Si el motor es SQLite, efectúa una comprobación preventiva de columnas para retrocompatibilidad local.
    """
    Base.metadata.create_all(bind=db_engine)

    if db_engine.dialect.name == "sqlite":
        with db_engine.connect() as conn:
            result = conn.execute(text("PRAGMA table_info(users)"))
            columns = {row[1] for row in result.fetchall()}

            if "is_verified" not in columns:
                conn.execute(
                    text("ALTER TABLE users ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT 1")
                )
                conn.commit()

            if "verification_token" not in columns:
                conn.execute(
                    text("ALTER TABLE users ADD COLUMN verification_token VARCHAR(255)")
                )
                conn.commit()


def seed_admin_user(db: Session) -> models.User:
    """
    Crea o actualiza el superusuario administrador usando variables de entorno:
      - ADMIN_NAME (por defecto: 'Administrador General')
      - ADMIN_EMAIL (por defecto: 'admin@chamba.do')
      - ADMIN_PASSWORD (por defecto: 'AdminChamba2026!')
    """
    admin_name = os.getenv("ADMIN_NAME", "Administrador General")
    admin_email = os.getenv("ADMIN_EMAIL", "admin@chamba.do")
    admin_password = os.getenv("ADMIN_PASSWORD", "AdminChamba2026!")

    existing_admin = (
        db.query(models.User).filter(models.User.email == admin_email).first()
    )

    if existing_admin:
        updated = False
        if existing_admin.role != "admin":
            existing_admin.role = "admin"
            updated = True
        if not existing_admin.is_verified:
            existing_admin.is_verified = True
            existing_admin.verification_token = None
            updated = True
        if updated:
            db.commit()
            db.refresh(existing_admin)
        return existing_admin

    new_admin = models.User(
        name=admin_name,
        email=admin_email,
        hashed_password=hash_password(admin_password),
        role="admin",
        is_verified=True,
        verification_token=None,
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)
    print(f"[SEED] Superusuario administrador inicializado: {admin_email}")
    return new_admin


if __name__ == "__main__":
    print(f"[INIT] Inicializando base de datos en motor: {engine.dialect.name.upper()}...")
    init_db(engine)
    with SessionLocal() as session:
        admin = seed_admin_user(session)
        print(f"[INIT] Admin verificado -> ID: {admin.id} | Email: {admin.email} | Rol: {admin.role}")
