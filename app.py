"""
Fábrica de la aplicación Flask.
"""
import os
from flask import Flask, send_from_directory, render_template, session, redirect
from flask_cors import CORS
from backend.config import Config
from backend.models import db
from backend.auth import login_requerido


def create_app():
    app = Flask(__name__,
                template_folder="../frontend/templates",
                static_folder="../frontend/static")
    app.config.from_object(Config)

    CORS(app, supports_credentials=True)
    db.init_app(app)

    # Asegurar carpetas necesarias
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(os.path.join(os.path.dirname(Config.UPLOAD_FOLDER), "instance"), exist_ok=True)

    # Registrar blueprints
    from backend.routes.auth_routes import auth_bp
    from backend.routes.ventas_routes import ventas_bp
    from backend.routes.admin_routes import admin_bp
    from backend.routes.disputas_routes import disputas_bp
    from backend.routes.stats_routes import stats_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(ventas_bp, url_prefix="/api/ventas")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(disputas_bp, url_prefix="/api/disputas")
    app.register_blueprint(stats_bp, url_prefix="/api/stats")

    # Crear tablas y ejecutar seed si la BD está vacía
    with app.app_context():
        db.create_all()
        from backend.seed import ejecutar_seed
        ejecutar_seed()

    # --- Vistas ---
    @app.route("/")
    @login_requerido
    def index():
        return render_template("index.html")

    @app.route("/login")
    def login_page():
        if "usuario_id" in session:
            return redirect("/")
        return render_template("login.html")

    @app.route("/logout")
    def logout_page():
        session.clear()
        return redirect("/login")

    # --- Servir archivos subidos ---
    @app.route("/uploads/<path:filename>")
    @login_requerido
    def uploaded_file(filename):
        return send_from_directory(Config.UPLOAD_FOLDER, filename)

    # --- Manejo de errores ---
    @app.errorhandler(413)
    def too_large(e):
        return {"error": "Archivo demasiado grande"}, 413

    @app.errorhandler(404)
    def not_found(e):
        return {"error": "No encontrado"}, 404

    return app
