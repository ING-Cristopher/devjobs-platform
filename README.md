<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Inter&weight=800&size=42&duration=3000&pause=1000&color=4F7CFF&center=true&vCenter=true&width=700&lines=Chamba+%C2%B7+DevJobs;Empleo+Tech+Fullstack;FastAPI+%2B+React+%2B+Neon" alt="DevJobs / Chamba" />

### Plataforma fullstack de empleo tech con autenticación JWT, roles, match de habilidades y persistencia en la nube

<br/>

<a href="https://devjobs-platform.vercel.app/"><img src="https://img.shields.io/badge/%F0%9F%9A%80_Ver_Demo_en_Vivo-4F7CFF?style=for-the-badge" alt="Demo" /></a>
&nbsp;
<a href="https://devjobs-platform.onrender.com/docs"><img src="https://img.shields.io/badge/%F0%9F%93%96_Documentaci%C3%B3n_API-009688?style=for-the-badge" alt="API Docs" /></a>
&nbsp;
<a href="https://github.com/ING-Cristopher/devjobs-platform/issues"><img src="https://img.shields.io/badge/%F0%9F%90%9B_Reportar_Incidencia-E5484D?style=for-the-badge" alt="Issues" /></a>

<br/><br/>

<img src="https://img.shields.io/badge/Frontend-React_+_Vite-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="Frontend" />
<img src="https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" alt="Backend" />
<img src="https://img.shields.io/badge/Database-Neon_PostgreSQL-00E599?style=flat-square&logo=postgresql&logoColor=white" alt="Database" />
<img src="https://img.shields.io/badge/Cloud-Vercel_+_Render-000000?style=flat-square&logo=vercel&logoColor=white" alt="Cloud" />
<img src="https://img.shields.io/badge/Testing-Pytest_5%2F5-0A9EDC?style=flat-square&logo=pytest&logoColor=white" alt="Testing" />
<img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="License" />

<br/>

<a href="https://github.com/ING-Cristopher/devjobs-platform/actions/workflows/ci.yml"><img src="https://github.com/ING-Cristopher/devjobs-platform/actions/workflows/ci.yml/badge.svg" alt="CI Status" /></a>

</div>

---

## 🖼️ Preview

<div align="center">
  <img src="./docs/screenshots/app-preview.png.png" alt="Vista principal de Chamba / DevJobs" width="92%" />
  <br/><br/>
  <table>
    <tr>
      <td align="center"><img src="./docs/screenshots/swagger-api.png.png" alt="Swagger API" width="100%" /><br/><sub><b>📖 Swagger / OpenAPI</b></sub></td>
      <td align="center"><img src="./docs/screenshots/ci-pipeline.png.png" alt="Pipeline CI" width="100%" /><br/><sub><b>⚙️ Pipeline CI (GitHub Actions)</b></sub></td>
    </tr>
  </table>
</div>

---

## 📊 Métricas & Destacados

<table align="center">
  <tr>
    <td align="center" width="33%">
      <h1>⚡</h1>
      <h3>&lt; 2.0s</h3>
      <b>Tests Passing</b><br/>
      <sub>Suite Pytest en SQLite en memoria</sub>
    </td>
    <td align="center" width="33%">
      <h1>🔒</h1>
      <h3>OWASP</h3>
      <b>Hardened</b><br/>
      <sub>Contraseñas fuertes · Bcrypt · JWT</sub>
    </td>
    <td align="center" width="33%">
      <h1>☁️</h1>
      <h3>Neon</h3>
      <b>PostgreSQL Persisted</b><br/>
      <sub>Datos persistentes y serverless</sub>
    </td>
  </tr>
</table>

---

## 🛡️ Seguridad

<div align="center">

![8+ Chars](https://img.shields.io/badge/Password-8%2B_Chars_·_Upper_·_Lower_·_Digit_·_Symbol-success?style=for-the-badge&logo=letsencrypt&logoColor=white)
![Bcrypt](https://img.shields.io/badge/Hashing-Bcrypt-blue?style=for-the-badge&logo=gnuprivacyguard&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT_Bearer-black?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![6-Digit Code](https://img.shields.io/badge/Verification-6--Digit_Code_(opcional)-orange?style=for-the-badge&logo=maildotru&logoColor=white)

</div>

---

## 🔄 Ciclo de vida de la postulación

```mermaid
flowchart LR
    A["👤 Usuario Registrado"] --> B["📧 Código 6 dígitos<br/>(opcional)"]
    B --> C["✅ Cuenta Verificada"]
    C --> D["🎯 Cálculo Match %"]
    D --> E["📄 Subida CV en PDF"]
    E --> F["📊 Exportación CSV<br/>por Reclutador"]

    style A fill:#4F7CFF,stroke:#2F5CE0,color:#fff
    style B fill:#F59E0B,stroke:#B45309,color:#fff
    style C fill:#10B981,stroke:#047857,color:#fff
    style D fill:#8B5CF6,stroke:#6D28D9,color:#fff
    style E fill:#0EA5E9,stroke:#0369A1,color:#fff
    style F fill:#EF4444,stroke:#B91C1C,color:#fff
```

> [!NOTE]
> La confirmación por código de 6 dígitos está **desactivada por defecto**: las cuentas nuevas quedan activas al registrarse. Los endpoints `/auth/verify-code` y `/auth/resend-code` se mantienen por retrocompatibilidad.

---

## 👥 Roles y permisos

| Capacidad | 🧑‍💻 Candidato | 🏢 Reclutador | 🛡️ Administrador |
| :--- | :---: | :---: | :---: |
| Explorar y filtrar vacantes | ✅ | ✅ | ✅ |
| Ver match % de habilidades | ✅ | ✅ | ✅ |
| Postularse (requiere sesión) | ✅ | ❌ | ✅ |
| Adjuntar CV en PDF | ✅ | ❌ | ✅ |
| Publicar vacantes | ❌ | ✅ | ✅ |
| Eliminar vacantes propias | ❌ | ✅ | ✅ |
| Eliminar cualquier vacante | ❌ | ❌ | ✅ |
| Exportar postulantes a CSV | ❌ | ✅ | ✅ |
| Gestionar usuarios y roles | ❌ | ❌ | ✅ |
| Ver estadísticas globales | ❌ | ❌ | ✅ |

---

## 🧰 Stack tecnológico

| Capa | Tecnología | Propósito |
| :---: | :--- | :--- |
| <img src="https://cdn.simpleicons.org/react/61DAFB" width="24" /> | **React 18 + Vite** | SPA rápida con React Router y estado de sesión |
| <img src="https://cdn.simpleicons.org/tailwindcss/06B6D4" width="24" /> | **Tailwind CSS** | Estilos utilitarios con tema claro/oscuro |
| <img src="https://cdn.simpleicons.org/fastapi/009688" width="24" /> | **FastAPI** | API REST asíncrona con OpenAPI automático |
| <img src="https://cdn.simpleicons.org/sqlalchemy/D71F00" width="24" /> | **SQLAlchemy 2** | ORM agnóstico (PostgreSQL / SQLite) |
| <img src="https://cdn.simpleicons.org/postgresql/4169E1" width="24" /> | **Neon PostgreSQL** | Base de datos serverless en producción |
| <img src="https://cdn.simpleicons.org/sqlite/003B57" width="24" /> | **SQLite** | Desarrollo local y tests sin configuración |
| <img src="https://cdn.simpleicons.org/jsonwebtokens/ffffff" width="24" /> | **JWT + Bcrypt** | Sesiones sin estado y hashing seguro |
| <img src="https://cdn.simpleicons.org/pytest/0A9EDC" width="24" /> | **Pytest** | Pruebas de integración automatizadas |
| <img src="https://cdn.simpleicons.org/githubactions/2088FF" width="24" /> | **GitHub Actions** | CI en cada push |
| <img src="https://cdn.simpleicons.org/vercel/888888" width="24" /> | **Vercel · Render** | Despliegue de frontend y backend |

---

## ⚙️ Guías de configuración

<details>
<summary><b>🐍 Backend — .env y comandos</b></summary>

<br/>

**1. Entorno virtual e instalación**

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS / Linux
pip install -r requirements.txt
```

**2. Variables de entorno (`backend/.env`)**

```env
# SQLite por defecto si se omite. Para Neon:
DATABASE_URL=postgresql://USUARIO:PASSWORD@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require

JWT_SECRET_KEY=cambia_esta_clave_en_produccion
ADMIN_NAME=Administrador General
ADMIN_EMAIL=admin@chamba.do
ADMIN_PASSWORD=CambiaEstaClave2026!
```

> [!WARNING]
> Nunca subas `backend/.env` al repositorio. Ya está en `.gitignore`.

**3. Comandos útiles**

```bash
uvicorn main:app --reload          # API en http://127.0.0.1:8000
python seed_admin.py               # Crea tablas y superusuario admin
python test_db_connection.py       # Diagnóstico de conexión a la BD
python view_db.py                  # Inspecciona users / jobs / applications
```

Al iniciar, la app ejecuta `create_all` y siembra el administrador desde `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

</details>

<details>
<summary><b>⚛️ Frontend — variables Vite y scripts</b></summary>

<br/>

**Variables (`frontend/.env`)**

```env
VITE_API_URL=http://127.0.0.1:8000
```

**Scripts**

```bash
cd frontend
npm install
npm run dev        # Servidor de desarrollo
npm run build      # Build de producción en /dist
npm run preview    # Previsualiza el build
```

</details>

<details>
<summary><b>🗄️ Esquema de base de datos (User → Job → Application)</b></summary>

<br/>

```mermaid
erDiagram
    USERS ||--o{ JOBS : "publica (CASCADE)"
    JOBS ||--o{ APPLICATIONS : "recibe (CASCADE)"
    USERS ||--o{ APPLICATIONS : "realiza"

    USERS {
        int id PK
        string name
        string email UK
        string hashed_password
        string role "admin | reclutador | candidato"
        bool is_verified
        datetime created_at
    }
    JOBS {
        int id PK
        string title
        string company
        string location
        string job_type
        string salary
        text description
        int recruiter_id FK
        datetime created_at
    }
    APPLICATIONS {
        int id PK
        string candidate_name
        string candidate_email
        text message
        string cv_url
        int job_id FK
        int candidate_id FK
        datetime created_at
    }
```

</details>

<details>
<summary><b>🧪 Suite de pruebas automatizadas (Pytest)</b></summary>

<br/>

```bash
cd backend
python -m pytest -v
```

| Prueba | Valida |
| :--- | :--- |
| `test_read_root` | API activa |
| `test_owasp_password_policy_rejects_weak_passwords` | Rechazo de contraseñas débiles (422) |
| `test_register_and_immediate_login_pipeline` | Registro y login inmediato con JWT |
| `test_job_application_requires_authenticated_candidate` | 401 anónimo · 403 reclutador · 201 candidato |
| `test_admin_seed_and_moderation` | Semillero admin y endpoints de moderación |

Las pruebas usan SQLite en memoria, por lo que no tocan Neon.

</details>

---

## 🚀 Inicio rápido

```bash
git clone https://github.com/ING-Cristopher/devjobs-platform.git
cd devjobs-platform

# Terminal 1 — API
cd backend && pip install -r requirements.txt && uvicorn main:app --reload

# Terminal 2 — Web
cd frontend && npm install && npm run dev
```

---

<div align="center">

Hecho con ❤️ por **[ING-Cristopher](https://github.com/ING-Cristopher)** · ⭐ Si te gusta el proyecto, deja una estrella

</div>
