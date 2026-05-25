<div align="center">

# 🎓 VinculaTec

**Sistema de Gestión de Residencias Profesionales**  
Tecnológico Nacional de México — Departamento de Sistemas

[![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?style=flat-square&logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54-000020?style=flat-square&logo=expo)](https://expo.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://mysql.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8-010101?style=flat-square&logo=socket.io)](https://socket.io/)

*Plataforma web/móvil para el seguimiento y gestión de residentes, asesores y proyectos de residencia profesional en tiempo real.*

</div>

---

## Descripción

VinculaTec es una aplicación full-stack que digitaliza y centraliza el proceso de residencias profesionales del TecNM. Permite que los tres actores del proceso — **Residente**, **Asesor** y **Jefe de Vinculación** — interactúen desde una misma plataforma con roles y permisos diferenciados.

### Funcionalidades principales

- 📁 Entrega y seguimiento de reportes parciales y final
- 💬 Retroalimentación del asesor con notificaciones en tiempo real
- 🏢 Gestión de empresas y convenios de vinculación
- 📊 Estadísticas y dashboards por rol y período
- 📅 Calendario de citas y reuniones
- 🔔 Sistema de notificaciones con WebSockets
- 👤 Gestión de perfiles con foto de usuario

---

## 🏗️ Arquitectura

```
VinculaTec/
├── backend/               # API REST + WebSockets (Node.js + Express)
│   ├── routes/            # Endpoints por rol (auth, asesor, jefe, residente...)
│   ├── db.js              # Pool de conexiones MySQL
│   ├── middleware.js       # JWT auth + verificación de roles
│   ├── schema.sql         # Esquema de la base de datos
│   ├── seed.js            # Datos de prueba
│   └── server.js          # Punto de entrada
│
└── src/                   # Frontend (React Native + Expo)
    ├── roles/
    │   ├── asesor/        # App del Asesor
    │   ├── jefe/          # App del Jefe de Vinculación
    │   └── residente/     # App del Residente
    ├── screens/           # Pantallas compartidas
    ├── context/           # Estado global (Auth, Proyectos, Reportes...)
    ├── components/        # Componentes reutilizables
    └── config/api.js      # URL del backend (configurable por entorno)
```

---

##  Roles del sistema

| Rol | Acceso | Funciones |
|-----|--------|-----------|
| **Residente** | Solo sus propios datos | Entrega de reportes, seguimiento de su proyecto, contacto con asesor |
| **Asesor** | Solo sus residentes asignados | Revisión de reportes, feedback, solicitud de avance de fase |
| **Jefe de Vinculación** | Vista global del departamento | Registro de usuarios, asignación de proyectos, gestión de empresas, estadísticas |

---

##  Instalación y configuración

### Prerrequisitos

- [Node.js](https://nodejs.org/) v18+
- [MySQL](https://dev.mysql.com/downloads/mysql/) 8.0+
- [Expo CLI](https://expo.dev/) (`npm install -g expo-cli`)

---

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/VinculaTec.git
cd VinculaTec
```

---

### 2. Configurar el Backend

```bash
cd backend
npm install
```

Crea el archivo **`backend/.env`**:

```env
# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=vinculatec

# Autenticación JWT (usa una cadena larga y aleatoria)
JWT_SECRET=tu_secreto_super_seguro_aqui

# Servidor
PORT=3001
NODE_ENV=development
```

Crea la base de datos y tablas:

```bash
# Opción A — Script automático
node sync-database.js

# Opción B — Manual desde MySQL
mysql -u root -p < schema.sql
```

*(Opcional)* Carga datos de prueba:

```bash
node seed.js
```

Inicia el servidor:

```bash
npm start          # producción
npm run dev        # desarrollo con hot-reload (nodemon)
```

El servidor queda en `http://localhost:3001`. Verifica con:

```bash
curl http://localhost:3001/api/health
# {"ok":true,"mensaje":"VinculaTec API corriendo 🚀"}
```

---

### 3. Configurar el Frontend

Desde la raíz del proyecto:

```bash
npm install
```

Crea el archivo **`.env.local`** en la raíz:

```env
# URL del backend
# Para pruebas en localhost (navegador en la misma máquina):
REACT_APP_API_URL=http://localhost:3001/api

# Para dispositivos físicos en la misma red Wi-Fi:
# REACT_APP_API_URL=http://TU_IP_LOCAL:3001/api

# Para acceso externo con ngrok:
# REACT_APP_API_URL=https://xxxx.ngrok-free.app/api
```

> **¿Cómo saber tu IP local?**  
> Windows: `ipconfig` → busca "Dirección IPv4"  
> Mac/Linux: `ifconfig | grep "inet "`

Inicia la app:

```bash
expo start          # Menú interactivo
expo start --web    # Solo web (recomendado para demo)
```

---

## Demo con ngrok (múltiples dispositivos)

Para demostrar el sistema en tiempo real con los 3 roles desde computadoras distintas:

**1. Instala ngrok:** [ngrok.com/download](https://ngrok.com/download)

**2. Expón el backend:**
```bash
ngrok http 3001
# Forwarding  https://abc123.ngrok-free.app → localhost:3001
```

**3. En CADA computadora de la demo**, crea o actualiza `.env.local`:
```env
REACT_APP_API_URL=https://abc123.ngrok-free.app/api
```

**4. Reinicia Expo** en cada computadora:
```bash
expo start --web
```

> El backend ya tiene CORS configurado para aceptar dominios de ngrok.

---

## Esquema de la base de datos

```
usuarios          — Todos los usuarios del sistema (residente, asesor, jefe)
residentes        — Perfil académico del residente (num_control, carrera, horas)
asesores          — Perfil del asesor (departamento, num_empleado)
jefes_vinculacion — Jefes del departamento
empresas          — Empresas con convenio activo
proyectos         — Proyectos de residencia (fases: propuesto→desarrollo→revisión→concluido)
proyecto_asesores — Relación N:M proyectos-asesores
reportes          — Reportes parciales y final (preliminar, parcial1-3, final)
citas             — Citas y reuniones entre participantes
notificaciones    — Historial de notificaciones
fuentes_informacion — Fuentes declaradas por residentes
```

---

## API Endpoints principales

| Método | Endpoint | Rol requerido | Descripción |
|--------|----------|---------------|-------------|
| `POST` | `/api/auth/login` | — | Inicio de sesión |
| `GET` | `/api/auth/me` | Cualquiera | Datos del usuario actual |
| `GET` | `/api/asesor/dashboard` | asesor | Stats del asesor |
| `GET` | `/api/asesor/proyectos` | asesor | Proyectos con residentes y reportes |
| `PUT` | `/api/asesor/reportes/:id/revisar` | asesor | Aprobar/rechazar reporte |
| `GET` | `/api/residente/reportes` | residente | Reportes del residente |
| `PUT` | `/api/residente/reportes/:tipo` | residente | Subir reporte |
| `GET` | `/api/jefe/dashboard` | jefe | Stats globales |
| `POST` | `/api/jefe/registrar-usuario` | jefe | Crear residente o asesor |
| `POST` | `/api/jefe/asignacion` | jefe | Crear proyecto y asignar |
| `GET` | `/api/jefe/grafica-reportes` | jefe | Datos para gráfica circular |

---

## Seguridad implementada

- **JWT** con expiración de 8 horas y secreto por variable de entorno
- **Middleware de roles** — cada ruta valida `rol` del token antes de ejecutarse
- **Aislamiento por asesor** — queries filtradas por `asesor_id` del token, no por parámetro URL
- **Rate limiting** — 200 req/15min global, 10 intentos de login/15min por IP
- **Validación de archivos** — extensión + magic bytes (PDF y DOCX únicamente)
- **Tamaño máximo** de archivos: 10 MB
- **Sanitización de rutas** en `path.basename()` para prevenir path traversal
- **CORS** restringido por ambiente (solo orígenes explícitos en producción)

---

## Tecnologías

**Frontend**
- React Native 0.81 + Expo 54
- Socket.io Client (tiempo real)
- react-native-chart-kit (gráficas)
- react-native-svg
- @expo/vector-icons (Feather)
- @expo-google-fonts/sora

**Backend**
- Node.js + Express 4
- MySQL 2 (promise-based pool)
- Socket.io 4.8 (WebSockets)
- JSON Web Tokens (jsonwebtoken)
- bcryptjs (hashing de contraseñas)
- express-rate-limit

---

## 👨‍💻 Equipo de desarrollo

Proyecto desarrollado como proyecto escolar para el **Tecnológico Nacional de México**.

---

## 📄 Licencia

Este proyecto es de uso académico interno del Departamento de Sistemas del TecNM.
