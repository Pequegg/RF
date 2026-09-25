"""
Rutas de administrador: gestión de ventas, empleados, pagos, reversiones.
"""
from flask import Blueprint, request, jsonify, session
from datetime import datetime
from backend.models import db, Venta, Usuario, Disputa, Reversion
from backend.auth import login_requerido, rol_requerido
from backend.utils import venta_esta_madura

admin_bp = Blueprint("admin", __name__)


@admin_bp.get("/ventas")
@login_requerido
@rol_requerido("admin")
def listar_ventas():
    """Lista todas las ventas con filtros."""
    q = Venta.query

    id_vendedor = request.args.get("id_vendedor")
    canal = request.args.get("canal")
    estado = request.args.get("estado")
    desde = request.args.get("desde")
    hasta = request.args.get("hasta")

    if id_vendedor:
        q = q.filter_by(id_vendedor=int(id_vendedor))
    if canal:
        q = q.filter_by(canal=canal)
    if estado:
        q = q.filter_by(estado=estado)
    if desde:
        q = q.filter(Venta.fecha_registro >= datetime.fromisoformat(desde))
    if hasta:
        q = q.filter(Venta.fecha_registro <= datetime.fromisoformat(hasta))

    ventas = q.order_by(Venta.fecha_registro.desc()).all()
    return jsonify([v.to_dict() for v in ventas])


@admin_bp.post("/ventas/<codigo>/aprobar")
@login_requerido
@rol_requerido("admin")
def aprobar_venta(codigo):
    """Aprueba una venta: pasa a en_maduracion."""
    venta = Venta.query.get_or_404(codigo)
    if venta.estado != "pendiente_revision":
        return jsonify({"error": "Solo se pueden aprobar ventas pendientes de revisión."}), 400

    venta.estado = "en_maduracion"
    data = request.get_json() or {}
    venta.notas_admin = data.get("notas_admin", venta.notas_admin)
    db.session.commit()
    return jsonify({"mensaje": "Venta aprobada.", "venta": venta.to_dict()})


@admin_bp.post("/ventas/<codigo>/rechazar")
@login_requerido
@rol_requerido("admin")
def rechazar_venta(codigo):
    """Rechaza una venta (motivo obligatorio)."""
    data = request.get_json() or {}
    motivo = (data.get("motivo") or "").strip()
    if not motivo:
        return jsonify({"error": "El motivo de rechazo es obligatorio."}), 400

    venta = Venta.query.get_or_404(codigo)
    if venta.estado not in ("pendiente_revision", "aprobada", "en_maduracion"):
        return jsonify({"error": "No se puede rechazar en este estado."}), 400

    venta.estado = "rechazada"
    venta.motivo_rechazo = motivo
    db.session.commit()
    return jsonify({"mensaje": "Venta rechazada.", "venta": venta.to_dict()})


@admin_bp.post("/ventas/<codigo>/pagar")
@login_requerido
@rol_requerido("admin")
def pagar_venta(codigo):
    """Marca una venta como pagada (solo si está madura)."""
    venta = Venta.query.get_or_404(codigo)
    if venta.estado not in ("aprobada", "en_maduracion"):
        return jsonify({"error": "Solo se pueden pagar ventas aprobadas/en maduración."}), 400
    if not venta_esta_madura(venta):
        return jsonify({"error": "La venta aún no ha madurado."}), 400

    venta.estado = "pagada"
    venta.fecha_pago = datetime.utcnow()
    db.session.commit()
    return jsonify({"mensaje": "Comisión marcada como pagada.", "venta": venta.to_dict()})


@admin_bp.post("/ventas/<codigo>/revertir")
@login_requerido
@rol_requerido("admin")
def revertir_venta(codigo):
    """Registra una reversión (devolución/anulación)."""
    data = request.get_json() or {}
    motivo = (data.get("motivo") or "").strip()
    monto = data.get("monto_revertido")

    if not motivo:
        return jsonify({"error": "El motivo es obligatorio."}), 400

    venta = Venta.query.get_or_404(codigo)
    if venta.estado not in ("aprobada", "en_maduracion", "pagada"):
        return jsonify({"error": "Solo se revierten ventas aprobadas o pagadas."}), 400

    try:
        monto_f = float(monto) if monto is not None else venta.comision
        if monto_f <= 0:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({"error": "Monto a revertir inválido."}), 400

    reversion = Reversion(
        codigo_venta=codigo,
        monto_revertido=monto_f,
        motivo=motivo,
    )
    venta.estado = "rechazada"
    venta.motivo_rechazo = f"Revertida: {motivo}"
    db.session.add(reversion)
    db.session.commit()
    return jsonify({"mensaje": "Reversión registrada.", "reversion": reversion.to_dict()})


@admin_bp.get("/empleados")
@login_requerido
@rol_requerido("admin")
def listar_empleados():
    """Lista todos los vendedores."""
    emps = Usuario.query.filter_by(rol="vendedor").order_by(Usuario.fecha_registro.desc()).all()
    return jsonify([e.to_dict() for e in emps])


@admin_bp.post("/empleados/<int:id>/activar")
@login_requerido
@rol_requerido("admin")
def activar_empleado(id):
    """Activa un empleado pendiente o inactivo."""
    emp = Usuario.query.get_or_404(id)
    if emp.rol != "vendedor":
        return jsonify({"error": "Solo se activan vendedores."}), 400
    emp.estado = "activo"
    db.session.commit()
    return jsonify({"mensaje": "Empleado activado.", "empleado": emp.to_dict()})


@admin_bp.post("/empleados/<int:id>/desactivar")
@login_requerido
@rol_requerido("admin")
def desactivar_empleado(id):
    """Desactiva un empleado."""
    emp = Usuario.query.get_or_404(id)
    emp.estado = "inactivo"
    db.session.commit()
    return jsonify({"mensaje": "Empleado desactivado.", "empleado": emp.to_dict()})


@admin_bp.get("/resumen-pagos")
@login_requerido
@rol_requerido("admin")
def resumen_pagos():
    """Resumen por empleado: pendiente, madurando, listo para pagar, pagado."""
    vendedores = Usuario.query.filter_by(rol="vendedor").all()
    resumen = []
    for v in vendedores:
        ventas = Venta.query.filter_by(id_vendedor=v.id).all()
        pendiente = sum(x.comision for x in ventas if x.estado == "pendiente_revision")
        madurando = sum(x.comision for x in ventas if x.estado == "en_maduracion")
        listo = sum(x.comision for x in ventas if x.estado == "aprobada" and venta_esta_madura(x))
        pagado = sum(x.comision for x in ventas if x.estado == "pagada")
        resumen.append({
            "empleado": v.to_dict(),
            "pendiente_revision": round(pendiente, 2),
            "madurando": round(madurando, 2),
            "listo_para_pagar": round(listo, 2),
            "pagado": round(pagado, 2),
            "total_generado": round(pendiente + madurando + listo + pagado, 2),
        })
    return jsonify(resumen)


@admin_bp.get("/ventas-listas-para-pagar")
@login_requerido
@rol_requerido("admin")
def ventas_listas_para_pagar():
    """Ventas maduras listas para marcar como pagadas."""
    ventas = Venta.query.filter_by(estado="en_maduracion").all()
    listas = [v for v in ventas if venta_esta_madura(v)]
    return jsonify([v.to_dict() for v in listas])
