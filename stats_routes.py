"""
Rutas de estadísticas y dashboard para el admin.
"""
from flask import Blueprint, jsonify, session
from datetime import datetime, timedelta
from sqlalchemy import func
from backend.models import db, Venta, Usuario
from backend.auth import login_requerido, rol_requerido
from backend.utils import venta_esta_madura

stats_bp = Blueprint("stats", __name__)


@stats_bp.get("/dashboard")
@login_requerido
@rol_requerido("admin")
def dashboard():
    """Estadísticas generales del dashboard."""
    total_ventas = Venta.query.count()
    todas = Venta.query.all()

    por_canal = {}
    for v in todas:
        por_canal.setdefault(v.canal, {"total": 0.0, "comisiones": 0.0, "count": 0})
        por_canal[v.canal]["total"] += v.monto_neto
        por_canal[v.canal]["comisiones"] += v.comision
        por_canal[v.canal]["count"] += 1
    for k in por_canal:
        por_canal[k]["total"] = round(por_canal[k]["total"], 2)
        por_canal[k]["comisiones"] = round(por_canal[k]["comisiones"], 2)

    top = []
    for u in Usuario.query.filter_by(rol="vendedor").all():
        vs = Venta.query.filter_by(id_vendedor=u.id).all()
        total_com = sum(x.comision for x in vs if x.estado in ("aprobada", "en_maduracion", "pagada"))
        top.append({
            "nombre": u.nombre,
            "usuario": u.usuario,
            "total_comision": round(total_com, 2),
            "cantidad_ventas": len(vs),
        })
    top.sort(key=lambda x: x["total_comision"], reverse=True)

    comisiones_pagadas = sum(x.comision for x in todas if x.estado == "pagada")
    comisiones_pendientes = sum(x.comision for x in todas if x.estado in ("aprobada", "en_maduracion"))
    comisiones_por_pagar = sum(x.comision for x in todas if x.estado == "en_maduracion" and venta_esta_madura(x))

    estados = {}
    for v in todas:
        estados[v.estado] = estados.get(v.estado, 0) + 1

    tendencia = []
    ahora = datetime.utcnow()
    for i in range(5, -1, -1):
        ref = ahora - timedelta(days=30 * i)
        inicio = ref.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if i == 0:
            fin = ahora
        else:
            sig = (inicio + timedelta(days=32)).replace(day=1)
            fin = sig
        vs = Venta.query.filter(Venta.fecha_registro >= inicio, Venta.fecha_registro < fin).all()
        tendencia.append({
            "mes": inicio.strftime("%Y-%m"),
            "total": round(sum(x.monto_neto for x in vs), 2),
            "comisiones": round(sum(x.comision for x in vs), 2),
            "cantidad": len(vs),
        })

    return jsonify({
        "total_ventas": total_ventas,
        "por_canal": por_canal,
        "top_vendedores": top[:5],
        "comisiones": {
            "pagadas": round(comisiones_pagadas, 2),
            "pendientes": round(comisiones_pendientes, 2),
            "listas_para_pagar": round(comisiones_por_pagar, 2),
        },
        "estados": estados,
        "tendencia": tendencia,
    })
