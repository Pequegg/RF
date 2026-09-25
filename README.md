# 🏗️ Sistema de Comisiones — Ferretería (Venezuela)

Sistema web completo para gestionar comisiones de ventas de empleados de una ferretería que vende por **Mercado Libre, Facebook Marketplace, WhatsApp y tienda local**.

La comisión es del **5%** del monto neto, con **período de maduración** según canal y considerada parte del salario (art. 104 LOTTT).

## ✨ Características

### Roles
- **Admin**: dashboard con gráficos, aprueba/rechaza ventas, resuelve disputas, registra reversiones, gestiona empleados y pagos.
- **Vendedor**: registra ventas con evidencias, ve estado y resumen de comisiones, abre disputas.

### Reglas de negocio (centralizadas en el backend)
- Comisión: **5% del monto neto**
- Maduración: ML **30 días** · Facebook **15** · WhatsApp **15** · Tienda **3**
- Códigos de venta: `FER-AAAA-NNNNN`
- Subida de evidencias (comprobante + aporte) en `/uploads`

### Diseño
- Estilo **Apple / iOS**: glassmorphism, esquinas redondeadas, sombras suaves, animaciones spring.
- **Modo claro / oscuro** con toggle persistente.
- **Responsive**: nav inferior en móvil, sidebar en desktop.
- Gráficos con **Chart.js**.

## 🧱 Stack

| Capa        | Tecnología                       |
|-------------|-----------------------------------|
| Backend     | Python 3.11+ · Flask · SQLAlchemy |
| Base datos  | SQLite                            |
| Frontend    | HTML5 · Tailwind CSS · JS vanilla |
| Auth        | Sesiones Flask · Werkzeug hashes  |
| Config      | python-dotenv                     |

## 🚀 Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/TU-USUARIO/ferreteria-comisiones.git
cd ferreteria-comisiones
```

### 2. Crear entorno virtual
**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```
**Linux / macOS:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Instalar dependencias
```bash
pip install -r requirements.txt
```

### 4. Configurar variables de entorno
```bash
cp .env.example .env
```
Edita `.env` y cambia `SECRET_KEY` por una cadena segura.

### 5. Ejecutar
```bash
python run.py
```

Abre **http://localhost:5000**

La base de datos se crea automáticamente con datos de prueba la primera vez.

## 👤 Credenciales de prueba

| Rol       | Usuario | Contraseña  |
|-----------|---------|-------------|
| Admin     | admin   | admin123    |
| Vendedor  | carlos  | carlos123   |
| Vendedor  | maria   | maria123    |

## 🔐 Seguridad

- Contraseñas hasheadas con **Werkzeug** (nunca en texto plano).
- Sesiones persistentes con cookies `HttpOnly` y `SameSite=Lax`.
- Protección de rutas por rol con decoradores (`@rol_requerido`).
- Un vendedor **nunca** puede ver datos de otro vendedor ni vistas de admin.

## 📄 Licencia

MIT — ver [LICENSE](LICENSE).
