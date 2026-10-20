"""
Módulo: auth.py
Propósito: Gestionar el cifrado seguro de contraseñas, la emisión/validación de tokens JWT
y el control de acceso basado en roles (RBAC) y verificación de correo.
Nota de arquitectura: Usamos la librería 'bcrypt' directamente para evitar los bugs
conocidos de compatibilidad entre passlib y las versiones modernas de bcrypt (>= 4.1.0).
"""

from datetime import datetime, timedelta, timezone
from typing import Optional
import bcrypt
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
import os

# En producción se inyecta desde las variables de entorno de Render/Railway
# Si no existe (desarrollo local), usa la clave por defecto
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "CLAVE_DEV_INSEGURA_SOLO_LOCAL_2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

# Esquema OAuth2 que espera el token en la cabecera: "Authorization: Bearer <TOKEN>"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def hash_password(password: str) -> str:
    """
    Cifra una contraseña en texto plano:
    1. Trunca a 72 bytes si excede el límite inherente del algoritmo bcrypt.
    2. Genera una 'salt' aleatoria única para evitar ataques de diccionario.
    3. Devuelve el hash en formato string UTF-8 para guardarlo en SQLite.
    """
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Compara de forma segura una contraseña enviada con su hash almacenado.
    """
    pwd_bytes = plain_password.encode("utf-8")[:72]
    hashed_bytes = hashed_password.encode("utf-8")
    return bcrypt.checkpw(pwd_bytes, hashed_bytes)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Crea un token JWT firmado criptográficamente con los datos del usuario.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    """
    Middleware de dependencia para proteger rutas:
    Valida la firma del token, carga el usuario autenticado y exige cuenta verificada.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales no válidas o sesión expirada",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Debes verificar tu correo electrónico antes de acceder a esta función.",
        )

    return user


def require_admin(current_user: models.User = Depends(get_current_user)) -> models.User:
    """
    Dependencia exclusiva para endpoints de administración general.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado. Se requieren privilegios de administrador.",
        )
    return current_user
