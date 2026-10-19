# DevJobs - Plataforma Web Fullstack de Empleos Tech

[![Continuous Integration (DevJobs CI)](https://github.com/ING-Cristopher/plataforma-empleos/actions/workflows/ci.yml/badge.svg)](https://github.com/ING-Cristopher/plataforma-empleos/actions/workflows/ci.yml)
[![Vercel Deployment](https://img.shields.io/badge/Frontend-Vercel-black?style=flat&logo=vercel)](https://devjobs-platform.vercel.app/)
[![Render Backend](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat&logo=render&logoColor=white)](https://render.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

DevJobs es una plataforma web completa orientada a la publicación, búsqueda y gestión de vacantes tecnológicas. Desarrollada bajo una arquitectura desacoplada con backend en Python (FastAPI) y frontend en React (Vite + Tailwind CSS), implementando control de acceso basado en roles (RBAC) con tokens JWT y un pipeline automatizado de Integración y Despliegue Continuo (CI/CD).

🔗 **Demo en Producción:** [https://devjobs-platform.vercel.app/](https://devjobs-platform.vercel.app/)  
📖 **API Docs (Swagger):** `https://devjobs-platform.onrender.com/docs`

---

## 📸 Capturas de Pantalla

| Feed Principal y Filtros en Tiempo Real | Documentación Interactiva Swagger (FastAPI) |
| :---: | :---: |
| ![DevJobs Feed](./docs/screenshots/feed.png) | ![Swagger API Docs](./docs/screenshots/swagger.png) |

---

## 🚀 Características Principales

- **Gestión de Vacantes (CRUD):** Creación, lectura, detalle individual y eliminación en cascada de ofertas laborales.
- **Filtros Reactivos:** Búsqueda simultánea por puesto/empresa, ubicación geográfica y modalidad de trabajo (*Remoto*, *Híbrido*, *Presencial*).
- **Enrutamiento SPA:** Navegación por rutas dinámicas (`/jobs/:id`) con React Router DOM y botón de copiado de enlace directo al portapapeles.
- **Flujo de Postulaciones:** Envío de candidaturas vinculadas relacionalmente (1 a N) con panel de revisión restringido para el reclutador dueño de la vacante.
- **Autenticación y Seguridad JWT:**
  - Hashing criptográfico directo con `bcrypt` (mitigación de límites de 72 bytes).
  - Emisión de tokens de acceso Bearer JWT.
  - Distinción de perfiles mediante roles (`reclutador` y `candidato`).
- **Pipeline CI/CD:**
  - **CI:** GitHub Actions ejecutando suites de pruebas unitarias/integración con `pytest` y validando la compilación del frontend con `npm run build` en cada push.
  - **CD:** Despliegue continuo desacoplado en Render (API REST) y Vercel (Single Page Application).

---

## 🛠️ Stack Tecnológico

### Backend
- **Lenguaje:** Python 3.12+
- **Framework:** FastAPI
- **ORM & Base de Datos:** SQLAlchemy con SQLite (compatible con PostgreSQL)
- **Validación de Datos:** Pydantic V2 (`ConfigDict`, `EmailStr`)
- **Seguridad:** PyJWT, Bcrypt, Passlib
- **Testing:** Pytest, HTTPX, FastAPI TestClient

### Frontend
- **Librería UI:** React 18+ (Vite)
- **Estilos:** Tailwind CSS
- **Iconos:** Lucide React
- **Navegación:** React Router DOM v6+
- **Manejo de Estado:** React Context API (`AuthContext`)

### DevOps & Cloud
- **CI:** GitHub Actions (Ubuntu Runners)
- **Hosting API:** Render (Web Service con Uvicorn)
- **Hosting Frontend:** Vercel (con soporte de rewrites SPA)

---

## 🏛️ Arquitectura del Sistema

```text
plataforma-empleos/
├── .github/
│   └── workflows/
│       └── ci.yml               # Pipeline de CI (Pytest + Vite Build)
├── backend/
│   ├── app/
│   │   ├── auth.py              # Lógica de hashing, tokens y middleware get_current_user
│   │   ├── database.py          # Configuración de SQLAlchemy Engine y sesiones
│   │   ├── models.py            # Entidades ORM (User, Job, Application)
│   │   └── schemas.py           # Esquemas Pydantic V2 (DTOs)
│   ├── tests/
│   │   └── test_api.py          # Pruebas automatizadas de integración
│   ├── main.py                  # Endpoints REST, CORS y configuración de la app
│   └── requirements.txt         # Dependencias del backend
├── frontend/
│   ├── src/
│   │   ├── components/          # Componentes reutilizables (Modales, JobCard, SearchBar)
│   │   ├── context/             # AuthContext (Persistencia y estado global de sesión)
│   │   ├── pages/               # Vistas principales (HomePage, JobDetailPage)
│   │   └── services/api.js      # Cliente HTTP desacoplado mediante variables de entorno
│   ├── vercel.json              # Reglas de reescritura para rutas SPA
│   ├── package.json
│   └── vite.config.js
└── README.md