"""
Configuración centralizada de la aplicación.
"""
import os
from pathlib import Path

# Directorio raíz del proyecto
BASE_DIR = Path(__file__).resolve().parent.parent


class Config:
    """Configuración base de Flask."""
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-me")

    # Base de datos SQLite dentro de /instance
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{BASE_DIR / 'instance' / 'ferreteria.db'}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Carpeta de uploads
    UPLOAD_FOLDER = str(BASE_DIR / os.getenv("UPLOAD_FOLDER", "uploads"))
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH_MB", 16)) * 1024 * 1024

    # Extensiones permitidas para evidencias
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp", "pdf"}

    # Sesión persistente
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    PERMANENT_SESSION_LIFETIME = 60 * 60 * 24 * 30  # 30 días

    # Reglas de negocio (centralizadas aquí)
    COMISION_PORCENTAJE = 0.05  # 5%

    DIAS_MADURACION = {
        "Mercado Libre": 30,
        "Facebook": 15,
        "WhatsApp": 15,
        "Tienda local": 3,
    }

    CANALES_VALIDOS = list(DIAS_MADURACION.keys())
