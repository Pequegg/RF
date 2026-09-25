"""
Datos de prueba: 1 admin + 2 vendedores + ventas en distintos estados.
Solo se ejecuta si la tabla de usuarios está vacía.
"""
from datetime import datetime, timedelta
from backend.models import db, Usuario, Venta
from backend.utils import calcular_comision, calcular_fecha_maduracion, generar_codigo_venta


def ejecutar_seed():
    """Crea datos de prueba si la BD está vacía."""
    if Usuario.query.first():
        return  # Ya hay datos

    print("🌱 Ejecutando seed de datos de prueba...")

    # --- Admin ---
    admin = Usuario(nombre="Dueño Ferretería", usuario="admin", rol="admin", estado="activo")
    admin.set_password("admin123")

    # --- Vendedores ---
    v1 = Usuario(nombre="Carlos Pérez", usuario="carlos", rol="vendedor", estado="activo")
    v1.set_password("carlos123")

    v2 = Usuario(nombre="María González", usuario="maria", rol="vendedor", estado="activo")
    v2.set_password("maria123")

    db.session.add_all([admin, v1, v2])
    db.session.commit()

    # --- Ventas de ejemplo ---
    ahora = datetime.utcnow()
    ventas_data = [
        {"v": v1, "canal": "Mercado Libre", "n_orden": "ML-1001", "monto": 200.0,
         "producto": "Taladro Bosch 500W", "estado": "en_maduracion",
         "fecha": ahora - timedelta(days=5)},
        {"v": v1, "canal": "WhatsApp", "n_orden": "WA-2001", "monto": 80.0,
         "producto": "Juego de llaves 12 pzs", "estado": "pagada",
         "fecha": ahora - timedelta(days=40)},
        {"v": v1, "canal": "Facebook", "n_orden": "FB-3001", "monto": 150.0,
         "producto": "Martillo Stanley", "estado": "rechazada",
         "motivo": "Evidencia insuficiente", "fecha": ahora - timedelta(days=10)},
        {"v": v2, "canal": "Tienda local", "n_orden": "TL-4001", "monto": 45.0,
         "producto": "Cinta métrica 5m", "estado": "aprobada",
         "fecha": ahora - timedelta(days=1)},
        {"v": v2, "canal": "Mercado Libre", "n_orden": "ML-5001", "monto": 320.0,
         "producto": "Compresor de aire", "estado": "pendiente_revision",
         "fecha": ahora - timedelta(days=2)},
        {"v": v2, "canal": "WhatsApp", "n_orden": "WA-6001", "monto": 120.0,
         "producto": "Set destornilladores", "estado": "en_maduracion",
         "fecha": ahora - timedelta(days=8)},
    ]

    for vd in ventas_data:
        codigo = generar_codigo_venta(db)
        comision = calcular_comision(vd["monto"])
        fecha_reg = vd["fecha"]
        fecha_mad = calcular_fecha_maduracion(vd["canal"], fecha_reg)

        venta = Venta(
            codigo=codigo,
            id_vendedor=vd["v"].id,
            fecha_registro=fecha_reg,
            canal=vd["canal"],
            n_orden=vd["n_orden"],
            monto_neto=vd["monto"],
            comision=comision,
            producto=vd["producto"],
            estado=vd["estado"],
            fecha_maduracion=fecha_mad if vd["estado"] in ("aprobada", "en_maduracion", "pagada") else None,
            fecha_pago=fecha_reg + timedelta(days=_dias_canal(vd["canal"])) if vd["estado"] == "pagada" else None,
            motivo_rechazo=vd.get("motivo"),
        )
        db.session.add(venta)

    db.session.commit()
    print("✅ Seed completado: admin/admin123, carlos/carlos123, maria/maria123")


def _dias_canal(canal):
    """Helper local para el seed."""
    from backend.config import Config
    return Config.DIAS_MADURACION.get(canal, 3)
