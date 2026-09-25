"""
Decoradores y helpers de autenticación.
"""
from functools import wraps
from flask import session, jsonify, redirect, request


def login_requerido(f):
    """Exige sesión activa. Para API devuelve 401 JSON; para vistas redirige."""
    @wraps(f)
    def wrapper(*args, **kwargs):
        if "usuario_id" not in session:
            if request.path.startswith("/api/"):
                return jsonify({"error": "No autenticado"}), 401
            return redirect("/login")
        return f(*args, **kwargs)
    return wrapper


def rol_requerido(*roles):
    """Exige que el usuario tenga uno de los roles indicados."""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            if "usuario_id" not in session:
                return jsonify({"error": "No autenticado"}), 401
            if session.get("rol") not in roles:
                return jsonify({"error": "Permiso denegado"}), 403
            return f(*args, **kwargs)
        return wrapper
    return decorator


def usuario_actual():
    """Devuelve el usuario logueado (o None)."""
    from backend.models import Usuario
    uid = session.get("usuario_id")
    return Usuario.query.get(uid) if uid else None
