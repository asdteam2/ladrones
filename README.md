# Radar Ciudadano

Plataforma fullstack para reportes ciudadanos de posibles estafas y vehiculos robados.

## Stack

- Frontend: React + Vite + TailwindCSS
- Backend: Node.js + Express
- Base de datos: PostgreSQL + Prisma ORM
- Autenticacion: JWT

## Caracteristicas clave

- Busqueda por nombre, RUT y patente con normalizacion previa.
- Normalizacion de RUT y patente en backend antes de guardar y antes de buscar.
- Reportes siempre en estado pendiente al crearse.
- Moderacion admin para aprobar, rechazar o eliminar reportes.
- Publicacion solo de reportes aprobados.
- Validacion con Zod, sanitizacion basica y rate limiting anti-spam.
- Disclaimer legal visible y checkbox obligatorio para enviar reportes.

## Estructura

- frontend: aplicacion React
- backend: API Express + Prisma

## Configuracion de variables de entorno

### Backend

1. Copia backend/.env.example a backend/.env
2. Ajusta DATABASE_URL, JWT_SECRET y CORS_ORIGIN

### Frontend

1. Copia frontend/.env.example a frontend/.env
2. Ajusta VITE_API_URL si necesitas otro host o puerto

## Base de datos y Prisma

Desde backend:

1. Generar cliente Prisma:
   npm run prisma:generate
2. Crear migracion inicial:
   npm run prisma:migrate -- --name init

## Ejecucion en desarrollo

En dos terminales:

1. Backend
   - cd backend
   - npm install
   - npm run dev

2. Frontend
   - cd frontend
   - npm install
   - npm run dev

La app frontend queda en http://localhost:5173 y la API en http://localhost:4000.

## Cuentas y roles

- Registro e inicio de sesion disponibles en la interfaz.
- El rol por defecto es USER.
- Para probar moderacion, cambia manualmente un usuario a ADMIN en la base de datos.

## Endpoints principales

- GET /api/reports/search?q=valor
- POST /api/reports
- POST /api/auth/register
- POST /api/auth/login
- GET /api/admin/reports/pending (ADMIN)
- PATCH /api/admin/reports/:id/moderate (ADMIN)
- DELETE /api/admin/reports/:id (ADMIN)

## Aviso legal usado en la interfaz

La informacion publicada es de caracter referencial y debe ser verificada por el usuario. La plataforma no se responsabiliza por el uso indebido de los datos.
