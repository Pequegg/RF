"""
Modelos de base de datos (SQLAlchemy).
"""
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


class Usuario(db.Model):
    """Usuarios del sistema: admin y vendedores."""
    __tablename__ = "usuarios"

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(120), nullable=False)
    usuario = db.Column(db.String(60), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    rol = db.Column(db.String(20), nullable=False, default="vendedor")  # admin | vendedor
    estado = db.Column(db.String(20), nullable=False, default="pendiente")  # pendiente | activo | inactivo
    fecha_registro = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    ventas = db.relationship("Venta", backref="vendedor", lazy=True, foreign_keys="Venta.id_vendedor")
    disputas = db.relationship("Disputa", backref="vendedor", lazy=True)

    def set_password(self, password: str):
        """Hashea y guarda la contraseña."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        """Verifica la contraseña contra el hash."""
        return check_password_hash(self.password_hash, password)

    def to_dict(self, include_sensitive=False):
        """Serializa el usuario. Nunca expone el hash."""
        data = {
            "id": self.id,
            "nombre": self.nombre,
            "usuario": self.usuario,
            "rol": self.rol,
            "estado": self.estado,
            "fecha_registro": self.fecha_registro.isoformat(),
        }
        return data


class Venta(db.Model):
    """Ventas registradas por los vendedores."""
    __tablename__ = "ventas"

    codigo = db.Column(db.String(20), primary_key=True)  # FER-AAAA-NNNNN
    id_vendedor = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=False, index=True)
    fecha_registro = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    canal = db.Column(db.String(30), nullable=False)
    n_orden = db.Column(db.String(80), nullable=False)
    monto_neto = db.Column(db.Float, nullable=False)
    comision = db.Column(db.Float, nullable=False)
    producto = db.Column(db.String(200), nullable=False)
    foto_comprobante = db.Column(db.String(255))
    evidencia_aporte = db.Column(db.String(255))
    estado = db.Column(db.String(30), nullable=False, default="pendiente_revision", index=True)
    fecha_maduracion = db.Column(db.DateTime)
    fecha_pago = db.Column(db.DateTime)
    motivo_rechazo = db.Column(db.Text)
    notas_admin = db.Column(db.Text)

    disputas = db.relationship("Disputa", backref="venta", lazy=True)
    reversiones = db.relationship("Reversion", backref="venta", lazy=True)

    def to_dict(self, incluir_vendedor=True):
        data = {
            "codigo": self.codigo,
            "id_vendedor": self.id_vendedor,
            "fecha_registro": self.fecha_registro.isoformat(),
            "canal": self.canal,
            "n_orden": self.n_orden,
            "monto_neto": round(self.monto_neto, 2),
            "comision": round(self.comision, 2),
            "producto": self.producto,
            "foto_comprobante": self.foto_comprobante,
            "evidencia_aporte": self.evidencia_aporte,
            "estado": self.estado,
            "fecha_maduracion": self.fecha_maduracion.isoformat() if self.fecha_maduracion else None,
            "fecha_pago": self.fecha_pago.isoformat() if self.fecha_pago else None,
            "motivo_rechazo": self.motivo_rechazo,
            "notas_admin": self.notas_admin,
        }
        if incluir_vendedor and self.vendedor:
            data["vendedor_nombre"] = self.vendedor.nombre
            data["vendedor_usuario"] = self.vendedor.usuario
        return data


class Disputa(db.Model):
    """Disputas abiertas por los vendedores sobre una venta."""
    __tablename__ = "disputas"

    id = db.Column(db.Integer, primary_key=True)
    codigo_venta = db.Column(db.String(20), db.ForeignKey("ventas.codigo"), nullable=False, index=True)
    id_vendedor = db.Column(db.Integer, db.ForeignKey("usuarios.id"), nullable=False)
    motivo = db.Column(db.Text, nullable=False)
    estado = db.Column(db.String(20), default="abierta", nullable=False)  # abierta | resuelta
    fecha = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    resolucion = db.Column(db.Text)

    def to_dict(self):
        return {
            "id": self.id,
            "codigo_venta": self.codigo_venta,
            "id_vendedor": self.id_vendedor,
            "vendedor_nombre": self.vendedor.nombre if self.vendedor else None,
            "motivo": self.motivo,
            "estado": self.estado,
            "fecha": self.fecha.isoformat(),
            "resolucion": self.resolucion,
        }


class Reversion(db.Model):
    """Reversiones de ventas aprobadas (devoluciones, anulaciones)."""
    __tablename__ = "reversiones"

    id = db.Column(db.Integer, primary_key=True)
    codigo_venta = db.Column(db.String(20), db.ForeignKey("ventas.codigo"), nullable=False, index=True)
    monto_revertido = db.Column(db.Float, nullable=False)
    motivo = db.Column(db.Text, nullable=False)
    fecha = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    pagada = db.Column(db.Boolean, default=False, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "codigo_venta": self.codigo_venta,
            "monto_revertido": round(self.monto_revertido, 2),
            "motivo": self.motivo,
            "fecha": self.fecha.isoformat(),
            "pagada": self.pagada,
        }
