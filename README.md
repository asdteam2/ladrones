# RiskVerify

Plataforma web tipo startup para verificacion de riesgo sobre posibles estafas y vehiculos robados.

## Stack

- Frontend: React + Vite + TailwindCSS
- Backend: Node.js + Express
- Base de datos: PostgreSQL (Railway en esta primera etapa) + Prisma ORM
- Autenticacion: JWT

## Caracteristicas clave

- Home estilo startup con hero, buscador grande y UI clara tipo producto SaaS.
- Busqueda instantanea por nombre, RUT y patente con normalizacion previa.
- Normalizacion reutilizable de RUT y patente en backend y frontend.
- Reportes siempre en estado `pending` al crearse.
- Moderacion admin para aprobar, rechazar o eliminar reportes.
- Publicacion solo de reportes `approved`.
- Validacion con Zod, sanitizacion basica y rate limiting anti-spam.
- Disclaimer legal visible y checkbox obligatorio al crear reportes.
- Arquitectura portable: para salir de Railway solo cambia `DATABASE_URL`.

## Estructura

- frontend: aplicacion React
- backend: API Express + Prisma

## Configuracion de variables de entorno

### Backend

1. Copia `backend/.env.example` a `backend/.env`
2. Ajusta `DATABASE_URL`, `JWT_SECRET`, `PORT` y `CORS_ORIGIN`
3. Si usas Railway, pega la URL PostgreSQL entregada por Railway en `DATABASE_URL`

Ejemplo de variables:

```env
DATABASE_URL="postgresql://postgres:password@containers-us-west-xx.railway.app:5432/railway"
JWT_SECRET="cambia-esto-por-un-secreto-seguro"
PORT="4000"
CORS_ORIGIN="http://localhost:5173"
JWT_EXPIRES_IN="7d"
```

Nota: no hay dependencia rigida con Railway. Prisma usa una conexion PostgreSQL estandar, por lo que puedes migrar a Neon, Render, Supabase, RDS o un servidor propio modificando solo `DATABASE_URL`.

### Frontend

1. Copia `frontend/.env.example` a `frontend/.env`
2. Ajusta `VITE_API_URL` si necesitas otro host o puerto

## Base de datos y Prisma

Desde backend:

1. Generar cliente Prisma:
   `npm run prisma:generate`
2. Crear migracion inicial local:
   `npm run prisma:migrate -- --name init`
3. Aplicar migraciones en produccion:
   `npm run prisma:migrate:deploy`

## Railway

1. Crea una base PostgreSQL en Railway.
2. Copia la variable de conexion PostgreSQL entregada por Railway.
3. Pega esa URL en `backend/.env` como `DATABASE_URL`.
4. Ejecuta desde `backend`:
   `npm run prisma:generate`
5. Ejecuta la migracion inicial:
   `npm run prisma:migrate -- --name init`

Si luego migras a otro proveedor, repites exactamente el mismo flujo con otra `DATABASE_URL`.

## Ejecucion en desarrollo

En dos terminales:

1. Backend
   - `cd backend`
   - `npm install`
   - `npm run dev`

2. Frontend
   - `cd frontend`
   - `npm install`
   - `npm run dev`

La app frontend queda en http://localhost:5173 y la API en http://localhost:4000.

## Publicar frontend en GitHub Pages

El repositorio quedo organizado para que GitHub Pages sirva el frontend desde la carpeta `docs` en la raiz.

1. Desde `frontend`, ejecuta `npm run build:github`
2. Eso genera `docs/index.html` y sus assets en la raiz del repo
3. En GitHub, ve a Settings > Pages
4. En Source, selecciona `Deploy from a branch`
5. Elige la rama `main` y la carpeta `/docs`

Importante: GitHub Pages solo puede servir el frontend estatico. El backend Express y PostgreSQL deben seguir desplegados aparte.

## Cuentas y roles

- Registro e inicio de sesion disponibles en la interfaz.
- El rol por defecto es USER.
- Para probar moderacion, cambia manualmente un usuario a ADMIN en la base de datos.

## Endpoints principales

- GET /api/search?q=valor
- POST /api/reports
- GET /api/reports/:id
- PATCH /api/reports/:id (ADMIN)
- POST /api/auth/register
- POST /api/auth/login
- GET /api/admin/reports/pending (ADMIN)
- DELETE /api/admin/reports/:id (ADMIN)

## Aviso legal usado en la interfaz

Esta plataforma muestra reportes generados por usuarios. La informacion debe ser verificada antes de tomar decisiones.
