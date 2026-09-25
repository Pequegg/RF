"""
Rutas de autenticación: registro, login, logout, perfil.
"""
from flask import Blueprint, request, jsonify, session
from backend.models import db, Usuario
from backend.auth import login_requerido, usuario_actual

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/registro")
def registro():
    """Registro de nuevos usuarios (quedan en estado pendiente)."""
    data = request.get_json() or {}
    nombre = (data.get("nombre") or "").strip()
    usuario = (data.get("usuario") or "").strip().lower()
    password = data.get("password") or ""

    if not all([nombre, usuario, password]):
        return jsonify({"error": "Nombre, usuario y contraseña son obligatorios."}), 400
    if len(password) < 6:
        return jsonify({"error": "La contraseña debe tener al menos 6 caracteres."}), 400
    if Usuario.query.filter_by(usuario=usuario).first():
        return jsonify({"error": "Ese usuario ya existe."}), 409

    nuevo = Usuario(nombre=nombre, usuario=usuario, rol="vendedor", estado="pendiente")
    nuevo.set_password(password)
    db.session.add(nuevo)
    db.session.commit()

    return jsonify({
        "mensaje": "Registro exitoso. Espera a que el administrador active tu cuenta.",
        "usuario": nuevo.to_dict()
    }), 201


@auth_bp.post("/login")
def login():
    """Inicia sesión y crea sesión persistente."""
    data = request.get_json() or {}
    usuario = (data.get("usuario") or "").strip().lower()
    password = data.get("password") or ""

    user = Usuario.query.filter_by(usuario=usuario).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Credenciales inválidas."}), 401
    if user.estado == "pendiente":
        return jsonify({"error": "Tu cuenta está pendiente de aprobación."}), 403
    if user.estado == "inactivo":
        return jsonify({"error": "Tu cuenta está inactiva. Contacta al administrador."}), 403

    session.permanent = True
    session["usuario_id"] = user.id
    session["rol"] = user.rol
    session["nombre"] = user.nombre

    return jsonify({"mensaje": "Login exitoso", "usuario": user.to_dict()})


@auth_bp.post("/logout")
def logout():
    """Cierra la sesión."""
    session.clear()
    return jsonify({"mensaje": "Sesión cerrada"})


@auth_bp.get("/me")
@login_requerido
def me():
    """Devuelve el usuario logueado."""
    u = usuario_actual()
    return jsonify(u.to_dict())
