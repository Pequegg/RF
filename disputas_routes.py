"""
Rutas de disputas: crear, listar, resolver.
"""
from flask import Blueprint, request, jsonify, session
from datetime import datetime
from backend.models import db, Disputa, Venta
from backend.auth import login_requerido, rol_requerido

disputas_bp = Blueprint("disputas", __name__)


@disputas_bp.post("")
@login_requerido
@rol_requerido("vendedor")
def crear_disputa():
    """Un vendedor abre una disputa sobre una venta propia."""
    data = request.get_json() or {}
    codigo_venta = (data.get("codigo_venta") or "").strip()
    motivo = (data.get("motivo") or "").strip()

    if not codigo_venta or not motivo:
        return jsonify({"error": "Código y motivo son obligatorios."}), 400

    venta = Venta.query.get_or_404(codigo_venta)
    if venta.id_vendedor != session["usuario_id"]:
        return jsonify({"error": "Solo puedes disputar tus propias ventas."}), 403
    if venta.estado == "pagada":
        return jsonify({"error": "No se puede disputar una venta ya pagada."}), 400

    existente = Disputa.query.filter_by(
        codigo_venta=codigo_venta, id_vendedor=session["usuario_id"], estado="abierta"
    ).first()
    if existente:
        return jsonify({"error": "Ya tienes una disputa abierta sobre esta venta."}), 409

    disputa = Disputa(
        codigo_venta=codigo_venta,
        id_vendedor=session["usuario_id"],
        motivo=motivo,
        estado="abierta",
    )
    db.session.add(disputa)
    db.session.commit()
    return jsonify({"mensaje": "Disputa abierta.", "disputa": disputa.to_dict()}), 201


@disputas_bp.get("/mis-disputas")
@login_requerido
@rol_requerido("vendedor")
def mis_disputas():
    """Lista las disputas del vendedor logueado."""
    ds = Disputa.query.filter_by(id_vendedor=session["usuario_id"]).order_by(Disputa.fecha.desc()).all()
    return jsonify([d.to_dict() for d in ds])


@disputas_bp.get("/todas")
@login_requerido
@rol_requerido("admin")
def todas_disputas():
    """Lista todas las disputas (admin)."""
    ds = Disputa.query.order_by(Disputa.fecha.desc()).all()
    return jsonify([d.to_dict() for d in ds])


@disputas_bp.post("/<int:id>/resolver")
@login_requerido
@rol_requerido("admin")
def resolver_disputa(id):
    """Resuelve una disputa (admin)."""
    data = request.get_json() or {}
    resolucion = (data.get("resolucion") or "").strip()
    if not resolucion:
        return jsonify({"error": "La resolución es obligatoria."}), 400

    d = Disputa.query.get_or_404(id)
    if d.estado == "resuelta":
        return jsonify({"error": "Esta disputa ya fue resuelta."}), 400

    d.estado = "resuelta"
    d.resolucion = resolucion
    db.session.commit()
    return jsonify({"mensaje": "Disputa resuelta.", "disputa": d.to_dict()})
