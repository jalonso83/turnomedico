# TurnoMédico

SaaS de gestión de citas y turnos médicos para República Dominicana. El médico paga una suscripción mensual; el paciente lo usa gratis.

## Estructura

```
turnomedico/
├── backend/    # API REST — NestJS 11 + Prisma + PostgreSQL
└── frontend/   # Web app — Next.js 16 (App Router) + Tailwind
```

## Backend (`backend/`)

```bash
cd backend
npm install
cp .env.example .env   # configura DATABASE_URL y JWT_SECRET
npx prisma generate
npm run start:dev      # http://localhost:3000  (Swagger en /api/docs)
```

## Frontend (`frontend/`)

```bash
cd frontend
npm install
# crea .env.local con NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
npm run dev            # http://localhost:3001
```

## Funcionalidades principales

- Agenda del día por turnos, walk-ins y cola de sala de espera (pantalla en TV).
- Cobro de consulta con copago del paciente + aporte de ARS (seguros), cortesías y caja diaria.
- Expediente clínico (notas SOAP, signos vitales, recetas).
- Roles: **doctor** (acceso total) y **secretaria** (agenda, cobro y datos básicos del paciente; sin expediente clínico).
- Horarios semanales y bloqueo de días/rangos (vacaciones, feriados).

> Variables de entorno y credenciales **no** se versionan (ver `.gitignore`).
