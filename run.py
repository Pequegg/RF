"""
Punto de entrada principal de la aplicación.
Ejecuta: python run.py
"""
import os
from backend.app import create_app
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
load_dotenv()

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_ENV", "development") == "development"
    print(f"\n🚀 Servidor corriendo en http://localhost:{port}\n")
    app.run(host="0.0.0.0", port=port, debug=debug)
