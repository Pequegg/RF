"""
Rutas de ventas: registrar, listar propias, detalle.
"""
from flask import Blueprint, request, jsonify, session
from datetime import datetime
from backend.models import db, Venta, Usuario
from backend.auth import login_requerido, rol_requerido
from backend.utils import (
    calcular_comision, calcular_fecha_maduracion,
    generar_codigo_venta, guardar_archivo, validar_canal, venta_esta_madura
)

ventas_bp = Blueprint("ventas", __name__)


@ventas_bp.get("/canales")
@login_requerido
def canales():
    """Devuelve los canales válidos y sus días de maduración."""
    from backend.config import Config
    return jsonify({
        "canales": Config.CANALES_VALIDOS,
        "dias_maduracion": Config.DIAS_MADURACION,
        "comision_porcentaje": Config.COMISION_PORCENTAJE,
    })


@ventas_bp.post("")
@login_requerido
@rol_requerido("vendedor")
def registrar_venta():
    """Registra una nueva venta con evidencias."""
    canal = request.form.get("canal", "").strip()
    n_orden = request.form.get("n_orden", "").strip()
    producto = request.form.get("producto", "").strip()
    monto_str = request.form.get("monto_neto", "").strip()

    if not all([canal, n_orden, producto, monto_str]):
        return jsonify({"error": "Todos los campos son obligatorios."}), 400
    if not validar_canal(canal):
        return jsonify({"error": "Canal no válido."}), 400
    try:
        monto = float(monto_str)
        if monto <= 0:
            raise ValueError
    except ValueError:
        return jsonify({"error": "Monto neto inválido."}), 400

    foto_comprobante = None
    evidencia_aporte = None
    try:
        if "foto_comprobante" in request.files:
            foto_comprobante = guardar_archivo(request.files["foto_comprobante"], "comprobantes")
        if "evidencia_aporte" in request.files:
            evidencia_aporte = guardar_archivo(request.files["evidencia_aporte"], "aportes")
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    if not foto_comprobante or not evidencia_aporte:
        return jsonify({"error": "Debes adjuntar foto del comprobante y evidencia de tu aporte."}), 400

    codigo = generar_codigo_venta(db)
    comision = calcular_comision(monto)
    fecha_mad = calcular_fecha_maduracion(canal)

    venta = Venta(
        codigo=codigo,
        id_vendedor=session["usuario_id"],
        canal=canal,
        n_orden=n_orden,
        monto_neto=monto,
        comision=comision,
        producto=producto,
        foto_comprobante=foto_comprobante,
        evidencia_aporte=evidencia_aporte,
        estado="pendiente_revision",
        fecha_maduracion=fecha_mad,
    )
    db.session.add(venta)
    db.session.commit()

    return jsonify({
        "mensaje": "Venta registrada. Queda pendiente de revisión.",
        "venta": venta.to_dict()
    }), 201


@ventas_bp.get("/mis-ventas")
@login_requerido
@rol_requerido("vendedor")
def mis_ventas():
    """Lista las ventas del vendedor logueado con filtros."""
    q = Venta.query.filter_by(id_vendedor=session["usuario_id"])

    estado = request.args.get("estado")
    canal = request.args.get("canal")
    if estado:
        q = q.filter_by(estado=estado)
    if canal:
        q = q.filter_by(canal=canal)

    ventas = q.order_by(Venta.fecha_registro.desc()).all()
    return jsonify([v.to_dict(incluir_vendedor=False) for v in ventas])


@ventas_bp.get("/<codigo>")
@login_requerido
def detalle_venta(codigo):
    """Detalle de una venta. Vendedor solo ve las suyas; admin ve todas."""
    venta = Venta.query.get_or_404(codigo)
    if session["rol"] == "vendedor" and venta.id_vendedor != session["usuario_id"]:
        return jsonify({"error": "Permiso denegado"}), 403
    data = venta.to_dict()
    data["esta_madura"] = venta_esta_madura(venta)
    data["disputas"] = [d.to_dict() for d in venta.disputas]
    data["reversiones"] = [r.to_dict() for r in venta.reversiones]
    return jsonify(data)


@ventas_bp.get("/mis-resumen")
@login_requerido
@rol_requerido("vendedor")
def mi_resumen():
    """Resumen de comisiones del vendedor: generado, madurando, pagado."""
    uid = session["usuario_id"]
    ventas = Venta.query.filter_by(id_vendedor=uid).all()

    total_generado = sum(v.comision for v in ventas if v.estado in ("aprobada", "en_maduracion", "pagada"))
    madurando = sum(v.comision for v in ventas if v.estado == "en_maduracion" or (v.estado == "aprobada" and not venta_esta_madura(v)))
    listo_pagar = sum(v.comision for v in ventas if v.estado == "aprobada" and venta_esta_madura(v))
    pagado = sum(v.comision for v in ventas if v.estado == "pagada")
    pendiente_rev = sum(v.comision for v in ventas if v.estado == "pendiente_revision")

    return jsonify({
        "total_generado": round(total_generado, 2),
        "madurando": round(madurando, 2),
        "listo_para_pagar": round(listo_pagar, 2),
        "pagado": round(pagado, 2),
        "pendiente_revision": round(pendiente_rev, 2),
        "cantidad_ventas": len(ventas),
    })
