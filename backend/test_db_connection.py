"""
Módulo: test_db_connection.py
Propósito: Script de diagnóstico y verificación de conectividad con la base de datos.
Ejecuta un health check (SELECT 1), identifica el motor activo (PostgreSQL / SQLite)
y valida la presencia de las tablas del sistema.

Uso:
  python test_db_connection.py
"""

import sys
from typing import Dict, Any

# Asegurar codificación utf-8 en consolas Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from sqlalchemy import text, inspect
from app.database import engine, Base
from app import models  # Asegura el registro de modelos en metadata


def mask_database_url(url_str: str) -> str:
    """Enmascara contraseñas en URLs de conexión para salida segura en consola."""
    if "@" in url_str and "://" in url_str:
        prefix, rest = url_str.split("://", 1)
        creds, host_db = rest.split("@", 1)
        if ":" in creds:
            user, _ = creds.split(":", 1)
            return f"{prefix}://{user}:*****@{host_db}"
    return url_str


def verify_database_connection() -> Dict[str, Any]:
    """
    Prueba la conexión activa al engine configurado, ejecutando una consulta trivial (SELECT 1)
    e inspeccionando el esquema de base de datos.
    """
    dialect_name: str = engine.dialect.name
    masked_url: str = mask_database_url(str(engine.url))

    print("=" * 65)
    print(" [INFO] INICIANDO DIAGNOSTICO DE CONEXION A LA BASE DE DATOS")
    print("=" * 65)
    print(f" * URL Configurada : {masked_url}")
    print(f" * Motor Detectado : {dialect_name.upper()}")

    try:
        # 1. Prueba de enlace directo (ping)
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            scalar_value = result.scalar()
            if scalar_value != 1:
                raise RuntimeError(f"Resultado inesperado de prueba de ping: {scalar_value}")

        # Mensaje requerido explícitamente:
        print(f"\nConexión exitosa a la base de datos: [{dialect_name}]")

        # 2. Inspección del catálogo de tablas
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        expected_tables = ["users", "jobs", "applications"]

        print("\n[ESTADO DE LAS TABLAS DEL MODELO]:")
        for table in expected_tables:
            status_text = "PRESENTE" if table in existing_tables else "PENDIENTE (Se creara al iniciar la app)"
            print(f"   [{status_text}] Tabla: {table}")

        print("=" * 65)
        return {"success": True, "dialect": dialect_name, "tables": existing_tables}

    except Exception as exc:
        print(f"\n[ERROR] Fallo al conectar a la base de datos [{dialect_name}]: {exc}", file=sys.stderr)
        print("=" * 65, file=sys.stderr)
        return {"success": False, "dialect": dialect_name, "error": str(exc)}


if __name__ == "__main__":
    result = verify_database_connection()
    if not result["success"]:
        sys.exit(1)
    sys.exit(0)

