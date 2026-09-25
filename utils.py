"""
Utilidades centralizadas: lógica de negocio, validaciones, helpers.
"""
import os
import uuid
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename
from backend.config import Config


def calcular_comision(monto_neto: float) -> float:
    """Calcula la comisión (5%) sobre el monto neto."""
    return round(float(monto_neto) * Config.COMISION_PORCENTAJE, 2)


def calcular_fecha_maduracion(canal: str, desde: datetime = None) -> datetime:
    """Devuelve la fecha de maduración según el canal."""
    if desde is None:
        desde = datetime.utcnow()
    dias = Config.DIAS_MADURACION.get(canal, 3)
    return desde + timedelta(days=dias)


def generar_codigo_venta(db, anio: int = None) -> str:
    """
    Genera un código único con formato FER-AAAA-NNNNN.
    NNNNN es un contador secuencial por año.
    """
    from backend.models import Venta
    if anio is None:
        anio = datetime.utcnow().year

    prefijo = f"FER-{anio}-"
    ultima = (
        Venta.query
        .filter(Venta.codigo.like(f"{prefijo}%"))
        .order_by(Venta.codigo.desc())
        .first()
    )
    if ultima:
        try:
            secuencial = int(ultima.codigo.split("-")[-1]) + 1
        except ValueError:
            secuencial = 1
    else:
        secuencial = 1
    return f"{prefijo}{secuencial:05d}"


def extension_permitida(filename: str) -> bool:
    """Verifica que la extensión del archivo sea permitida."""
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in Config.ALLOWED_EXTENSIONS
    )


def guardar_archivo(file_storage, subcarpeta: str = "evidencias") -> str:
    """
    Guarda un archivo subido en /uploads/<subcarpeta>/ con nombre único.
    Devuelve la ruta relativa (para guardar en BD).
    """
    if not file_storage or not file_storage.filename:
        return None
    if not extension_permitida(file_storage.filename):
        raise ValueError("Extensión de archivo no permitida.")

    # Nombre único: uuid + extensión original
    ext = file_storage.filename.rsplit(".", 1)[1].lower()
    nombre_unico = f"{uuid.uuid4().hex}.{ext}"

    carpeta_destino = os.path.join(Config.UPLOAD_FOLDER, subcarpeta)
    os.makedirs(carpeta_destino, exist_ok=True)

    ruta_fisica = os.path.join(carpeta_destino, nombre_unico)
    file_storage.save(ruta_fisica)

    # Ruta relativa para servir desde /uploads
    return f"{subcarpeta}/{nombre_unico}"


def venta_esta_madura(venta) -> bool:
    """Indica si una venta ya cumplió su período de maduración."""
    if not venta.fecha_maduracion:
        return False
    return datetime.utcnow() >= venta.fecha_maduracion


def validar_canal(canal: str) -> bool:
    """Valida que el canal sea uno de los permitidos."""
    return canal in Config.CANALES_VALIDOS
