# Arquitectura Tecnica - TurnoMedico RD

## Plataforma SaaS Multi-Tenant de Gestion de Turnos Medicos

**Version:** 1.0
**Fecha:** 2026-02-26
**Autor:** Equipo de Arquitectura
**Mercado objetivo:** Republica Dominicana, expansion a LATAM

---

## Tabla de Contenidos

1. [Arquitectura General](#1-arquitectura-general)
2. [Stack Tecnologico Recomendado](#2-stack-tecnologico-recomendado)
3. [Modelo de Datos](#3-modelo-de-datos)
4. [APIs Principales](#4-apis-principales)
5. [Integraciones](#5-integraciones)
6. [Fases de Implementacion](#6-fases-de-implementacion)
7. [Estimacion de Costos](#7-estimacion-de-costos)
8. [Consideraciones Tecnicas Especiales](#8-consideraciones-tecnicas-especiales)

---

## 1. Arquitectura General

### 1.1 Diagrama de Alto Nivel

```
                                    INTERNET
                                       |
                         +-------------+-------------+
                         |                           |
                    [Vercel CDN]              [Railway Cloud]
                         |                           |
              +----------+----------+     +----------+----------+
              |                     |     |                     |
        [Next.js App]        [Next.js App]  [NestJS API]   [WebSocket
         Landing +            Portal        Backend         Server]
         Dashboard]           Paciente         |               |
              |                     |     +----+----+          |
              |                     |     |         |          |
              +----------+----------+  [PostgreSQL] [Redis]    |
                         |                |                    |
                         +----------------+--------------------+
                                         |
                              +----------+----------+
                              |          |          |
                          [Twilio]  [WhatsApp] [AWS SES]
                           SMS      Business    Email
                                     API
```

### 1.2 Diagrama de Componentes Detallado

```
+------------------------------------------------------------------+
|                        CAPA DE PRESENTACION                       |
|                          (Vercel Edge)                            |
|                                                                  |
|  +------------------+  +------------------+  +-----------------+ |
|  |   Landing Page   |  |   Dashboard      |  |  Portal         | |
|  |   + SEO          |  |   Medico/        |  |  Paciente       | |
|  |   + Busqueda     |  |   Secretaria     |  |  (PWA)          | |
|  |   publica        |  |                  |  |                 | |
|  +------------------+  +------------------+  +-----------------+ |
|                                                                  |
|  +------------------+  +------------------+                      |
|  |   Pantalla       |  |   Panel Admin    |                      |
|  |   Sala Espera    |  |   Plataforma     |                      |
|  |   (Display Mode) |  |                  |                      |
|  +------------------+  +------------------+                      |
+------------------------------------------------------------------+
                              |
                         [API Gateway]
                              |
+------------------------------------------------------------------+
|                        CAPA DE NEGOCIO                            |
|                      (Railway - NestJS)                           |
|                                                                  |
|  +------------------+  +------------------+  +-----------------+ |
|  |  Auth Module     |  |  Appointments    |  |  Tenants        | |
|  |  (JWT + Guards)  |  |  Module          |  |  Module         | |
|  +------------------+  +------------------+  +-----------------+ |
|                                                                  |
|  +------------------+  +------------------+  +-----------------+ |
|  |  Notifications   |  |  Billing Module  |  |  WebSocket      | |
|  |  Module          |  |  (Suscripciones) |  |  Gateway        | |
|  +------------------+  +------------------+  +-----------------+ |
|                                                                  |
|  +------------------+  +------------------+  +-----------------+ |
|  |  Patients        |  |  Schedule        |  |  Reviews        | |
|  |  Module          |  |  Module          |  |  Module         | |
|  +------------------+  +------------------+  +-----------------+ |
|                                                                  |
|  +------------------+  +------------------+                      |
|  |  Analytics       |  |  Admin           |                      |
|  |  Module          |  |  Module          |                      |
|  +------------------+  +------------------+                      |
+------------------------------------------------------------------+
                              |
+------------------------------------------------------------------+
|                        CAPA DE DATOS                              |
|                                                                  |
|  +------------------+  +------------------+  +-----------------+ |
|  |  PostgreSQL      |  |  Redis           |  |  S3/R2          | |
|  |  (Railway)       |  |  (Cache + Queue) |  |  (Archivos)     | |
|  |  Row-Level       |  |  Bull Queue      |  |  Imagenes       | |
|  |  Security        |  |  Sessions        |  |  perfil         | |
|  +------------------+  +------------------+  +-----------------+ |
+------------------------------------------------------------------+
```

### 1.3 Estrategia Multi-Tenancy: Row-Level Security (RLS)

**Decision: Base de datos compartida con Row-Level Security (RLS) de PostgreSQL.**

#### Justificacion

| Estrategia | Ventajas | Desventajas | Veredicto |
|---|---|---|---|
| **BD por tenant** | Aislamiento total | Costoso, complejo de mantener, migraciones pesadas | Descartado |
| **Schema por tenant** | Buen aislamiento | Complejidad en migraciones, no escala a miles de tenants | Descartado |
| **Shared + RLS** | Simple, economico, escala bien, migraciones unicas | Menor aislamiento (mitigado con RLS) | **Seleccionado** |

Para una plataforma que apunta a cientos/miles de medicos con datos que no son extremadamente sensibles (no son historiales clinicos completos), el enfoque compartido con RLS es optimo.

#### Implementacion de RLS en PostgreSQL

```sql
-- Habilitar RLS en la tabla de citas
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Politica: cada tenant solo ve sus propios datos
CREATE POLICY tenant_isolation ON appointments
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- En cada request, NestJS setea el tenant
-- SET LOCAL app.current_tenant = 'uuid-del-medico';
```

#### Middleware de Tenant en NestJS

```typescript
// tenant.middleware.ts
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly dataSource: DataSource) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = this.extractTenantId(req);

    if (tenantId) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.query(
        `SET LOCAL app.current_tenant = '${tenantId}'`
      );
      req['tenantId'] = tenantId;
    }

    next();
  }

  private extractTenantId(req: Request): string | null {
    // Extraer de JWT token, subdomain, o header
    return req.headers['x-tenant-id'] as string
      || req.user?.tenantId
      || null;
  }
}
```

### 1.4 API-First Design

Toda la plataforma sigue un enfoque API-first:

- **REST API** para operaciones CRUD estandar
- **WebSocket** exclusivamente para la pantalla de sala de espera y notificaciones en tiempo real
- **OpenAPI/Swagger** autogenerado desde NestJS para documentacion
- Versionado de API: `/api/v1/...`
- Todas las respuestas en formato JSON estandarizado:

```json
{
  "success": true,
  "data": { },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150
  },
  "error": null
}
```

### 1.5 Real-Time: WebSockets para Sala de Espera

```
+-------------------+         +-------------------+         +------------------+
|   Smart TV /      |  WSS    |   NestJS          |  Events |   Dashboard      |
|   Pantalla Sala   |<------->|   WebSocket       |<--------|   Secretaria     |
|   de Espera       |         |   Gateway         |         |   (REST API)     |
+-------------------+         +-------------------+         +------------------+
                                       |
                                  [Redis Pub/Sub]
                                       |
                              (Escala horizontal si
                               hay multiples instancias)
```

**Flujo:**
1. La pantalla de sala de espera se conecta via WebSocket a una sala (room) identificada por `tenant_id`.
2. Cuando la secretaria cambia el estado de un paciente (llego, en consulta, atendido), el backend emite un evento WebSocket.
3. La pantalla recibe el evento y actualiza la UI en tiempo real.
4. Redis Pub/Sub permite escalar a multiples instancias del servidor WebSocket.

---

## 2. Stack Tecnologico Recomendado

### 2.1 Tabla de Stack

| Capa | Tecnologia | Version | Justificacion |
|---|---|---|---|
| **Frontend Web** | Next.js 15 (App Router) | 15.x | SSR para SEO, RSC para performance, un solo proyecto para landing + dashboard + portal paciente. Vercel como hosting nativo. |
| **App Paciente** | PWA (Next.js) | - | Evita costos de app stores, instalable en Android/iOS. El mercado RD tiene alta adopcion de Android donde PWA funciona excelente. Ahorra meses de desarrollo nativo. |
| **UI Components** | shadcn/ui + Tailwind CSS 4 | - | Componentes accesibles, altamente personalizables, sin vendor lock-in. Tailwind para rapid prototyping. |
| **Backend API** | NestJS | 11.x | Framework enterprise Node.js. Modular, inyeccion de dependencias, decoradores, excelente con TypeScript. Guards para multi-tenancy. |
| **ORM** | Prisma | 6.x | Type-safe, migraciones declarativas, excelente DX, funciona perfecto con PostgreSQL RLS. |
| **Base de Datos** | PostgreSQL | 16 | Robusta, RLS nativo, JSON support, full-text search para busqueda de medicos. Railway ofrece managed PostgreSQL. |
| **Cache / Queue** | Redis (Upstash) | 7.x | Cache de slots disponibles, sesiones, Bull queue para jobs asincrono (notificaciones, recordatorios). Upstash ofrece serverless Redis compatible con Railway. |
| **Real-Time** | Socket.io (sobre NestJS Gateway) | 4.x | Bidireccional, rooms para tenants, fallback a long-polling, reconexion automatica. Integrado nativamente en NestJS. |
| **Autenticacion** | NextAuth.js v5 (pacientes) + JWT custom (medicos) | 5.x | Pacientes: login minimo con telefono + OTP. Medicos: email + password + JWT con refresh tokens. |
| **Hosting Frontend** | Vercel | - | Deploy automatico, edge functions, optimizado para Next.js, CDN global, free tier generoso. |
| **Hosting Backend** | Railway | - | Managed containers, PostgreSQL incluido, auto-scaling, deploys desde GitHub. Buena relacion precio/performance. |
| **Storage** | Cloudflare R2 | - | Almacenamiento de imagenes de perfil de medicos. Compatible con S3 API, sin egress fees. |
| **SMS** | Twilio | - | Soporte completo para Republica Dominicana (+1-809, +1-829, +1-849). Confiable, API madura. |
| **WhatsApp** | Twilio WhatsApp Business API | - | Integrado con Twilio, misma cuenta, templates aprobados para recordatorios medicos. |
| **Email** | Resend | - | API moderna, React Email para templates, mas simple que AWS SES, free tier de 3,000 emails/mes. |
| **Pagos** | Stripe | - | Suscripciones recurrentes, portal del cliente, webhooks confiables. Funciona en RD con tarjetas internacionales. Alternativa local: Azul para tarjetas dominicanas. |
| **Mapas** | Google Maps API | - | Ubication de consultorios, direcciones, busqueda por cercania. Alta adopcion en RD. |
| **Monitoreo** | Sentry + Vercel Analytics | - | Error tracking en frontend y backend, performance monitoring, free tier suficiente para MVP. |
| **CI/CD** | GitHub Actions | - | Deploy automatico a Vercel (frontend) y Railway (backend) en push a main. |
| **Lenguaje** | TypeScript | 5.x | Un solo lenguaje en todo el stack. Type safety end-to-end con Prisma + tRPC o REST tipado. |

### 2.2 Justificacion de PWA vs App Nativa

```
PWA (Seleccionado)                    App Nativa
+----------------------------+        +----------------------------+
| - 1 codebase (Next.js)    |        | - 2 codebases (iOS + And) |
| - Sin app store fees       |        | - $99/yr Apple + $25 Goog |
| - Deploy instantaneo       |        | - Review process 1-7 dias |
| - Instalable en Android    |        | - Mejor UX nativa         |
| - Push notifications (*)   |        | - Push notifications full |
| - Desarrollo: 0 meses add |        | - Desarrollo: +3-4 meses  |
| - Mantenimiento: minimo    |        | - Mantenimiento: alto     |
+----------------------------+        +----------------------------+

(*) Push notifications en PWA funcionan en Android y desktop.
    En iOS 16.4+ tambien funcionan. Suficiente para el mercado RD.

VEREDICTO: PWA para MVP. Evaluar app nativa en Fase 3 si el mercado lo demanda.
```

### 2.3 Monorepo con Turborepo

```
turnomedico/
|-- apps/
|   |-- web/                    # Next.js - Landing + Dashboard + Portal Paciente
|   |-- api/                    # NestJS - Backend API + WebSocket
|-- packages/
|   |-- ui/                     # Componentes compartidos (shadcn/ui)
|   |-- db/                     # Prisma schema + client + migraciones
|   |-- shared/                 # Types, utils, constantes compartidas
|   |-- email-templates/        # React Email templates
|   |-- config-ts/              # Configuracion TypeScript compartida
|   |-- config-eslint/          # Configuracion ESLint compartida
|-- turbo.json
|-- package.json
|-- docker-compose.yml          # PostgreSQL + Redis para desarrollo local
```

---

## 3. Modelo de Datos

### 3.1 Diagrama Entidad-Relacion

```
+------------------+       +--------------------+       +------------------+
|     TENANT       |       |    DOCTOR_PROFILE   |      |      PLAN        |
|------------------|       |--------------------|       |------------------|
| id (PK, UUID)   |<---+  | id (PK, UUID)      |      | id (PK, UUID)    |
| name             |    |  | tenant_id (FK)     |----->| name             |
| slug (unique)    |    |  | specialty          |      | price_monthly    |
| status           |    |  | license_number     |      | price_yearly     |
| created_at       |    |  | bio                |      | max_appointments |
| updated_at       |    |  | photo_url          |      | features (JSONB) |
+------------------+    |  | consultation_fee   |      | is_active        |
        |               |  | phone              |      +------------------+
        |               |  | address            |             |
        |               |  | latitude           |             |
        |               |  | longitude          |             |
        |               |  | rating_avg         |             |
        |               |  | total_reviews      |             |
        |               |  +--------------------+             |
        |               |                                     |
+------------------+    |  +--------------------+    +------------------+
|   SUBSCRIPTION   |    |  |      USER          |    |   OFFICE_CONFIG  |
|------------------|    |  |--------------------|    |------------------|
| id (PK, UUID)   |    |  | id (PK, UUID)      |    | id (PK, UUID)    |
| tenant_id (FK)  |----+  | tenant_id (FK)     |--->| tenant_id (FK)   |
| plan_id (FK)    |-------+| email              |    | display_name     |
| status           |       | password_hash      |    | welcome_message  |
| stripe_sub_id    |       | role (enum)        |    | logo_url         |
| current_period_start |   | name               |    | theme (enum)     |
| current_period_end   |   | phone              |    | announcements    |
| created_at       |       | is_active          |    |   (JSONB)        |
+------------------+       +--------------------+    | display_mode_url |
                                    |                +------------------+
                                    |
        +---------------------------+---------------------------+
        |                           |                           |
+------------------+    +--------------------+    +------------------+
|    SCHEDULE      |    |   APPOINTMENT      |    |    PATIENT       |
|------------------|    |--------------------|    |------------------|
| id (PK, UUID)   |    | id (PK, UUID)      |    | id (PK, UUID)    |
| tenant_id (FK)  |    | tenant_id (FK)     |    | phone (unique)   |
| day_of_week (0-6)|   | patient_id (FK)    |    | name             |
| start_time (TIME)|   | doctor_id (FK)     |    | email            |
| end_time (TIME)  |   | date (DATE)        |    | cedula           |
| slot_duration_min|   | start_time (TIME)  |    | date_of_birth    |
| is_active        |   | end_time (TIME)    |    | gender           |
| break_start      |   | status (enum)      |    | notes            |
| break_end        |   | queue_position     |    | created_at       |
+------------------+   | type (enum)        |    +------------------+
                        | notes              |           |
+------------------+    | arrived_at         |           |
| SCHEDULE_OVERRIDE|    | started_at         |    +------------------+
|------------------|    | completed_at       |    |     REVIEW       |
| id (PK, UUID)   |    | created_at         |    |------------------|
| tenant_id (FK)  |    +--------------------+    | id (PK, UUID)    |
| date (DATE)     |                               | tenant_id (FK)  |
| is_blocked       |    +--------------------+    | patient_id (FK)  |
| reason           |    |   NOTIFICATION     |    | appointment_id   |
| start_time       |    |--------------------|    | rating (1-5)     |
| end_time         |    | id (PK, UUID)      |    | comment          |
| created_at       |    | tenant_id (FK)     |    | is_visible       |
+------------------+    | appointment_id(FK) |    | created_at       |
                        | patient_id (FK)    |    +------------------+
                        | type (enum)        |
                        | channel (enum)     |    +------------------+
                        | status (enum)      |    |    INVOICE       |
                        | scheduled_at       |    |------------------|
                        | sent_at            |    | id (PK, UUID)    |
                        | content            |    | subscription_id  |
                        | external_id        |    | amount           |
                        +--------------------+    | currency (DOP)   |
                                                  | status (enum)    |
                                                  | stripe_invoice_id|
                                                  | pdf_url          |
                                                  | period_start     |
                                                  | period_end       |
                                                  | created_at       |
                                                  +------------------+
```

### 3.2 Schema Prisma Completo

```prisma
// packages/db/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================
// ENUMS
// ============================================================

enum UserRole {
  PLATFORM_ADMIN    // Admin de la plataforma TurnoMedico
  DOCTOR            // Medico titular (owner del tenant)
  SECRETARY         // Secretaria del consultorio
}

enum AppointmentStatus {
  PENDING           // Creada, esperando confirmacion
  CONFIRMED         // Confirmada por el consultorio
  ARRIVED           // Paciente llego a la sala de espera
  IN_PROGRESS       // En consulta
  COMPLETED         // Atendido
  CANCELLED_PATIENT // Cancelada por el paciente
  CANCELLED_DOCTOR  // Cancelada por el medico
  NO_SHOW           // El paciente no se presento
}

enum AppointmentType {
  FIRST_VISIT       // Primera consulta
  FOLLOW_UP         // Seguimiento
  EMERGENCY         // Emergencia
}

enum SubscriptionStatus {
  TRIAL             // Periodo de prueba
  ACTIVE            // Activa y al dia
  PAST_DUE          // Pago pendiente
  CANCELLED         // Cancelada
  SUSPENDED         // Suspendida por falta de pago
}

enum NotificationType {
  CONFIRMATION      // Confirmacion de cita
  REMINDER_24H      // Recordatorio 24 horas antes
  REMINDER_1H       // Recordatorio 1 hora antes
  CANCELLATION      // Notificacion de cancelacion
  RESCHEDULE        // Notificacion de reprogramacion
  YOUR_TURN         // Aviso de que es su turno
}

enum NotificationChannel {
  SMS
  WHATSAPP
  EMAIL
  PUSH
}

enum NotificationStatus {
  PENDING
  QUEUED
  SENT
  DELIVERED
  FAILED
}

enum ThemeMode {
  LIGHT
  DARK
  AUTO
}

enum InvoiceStatus {
  DRAFT
  PENDING
  PAID
  FAILED
  REFUNDED
}

// ============================================================
// MODELOS PRINCIPALES
// ============================================================

/// Tenant: representa un consultorio/medico como unidad de negocio
model Tenant {
  id        String   @id @default(uuid()) @db.Uuid
  name      String   @db.VarChar(200)
  slug      String   @unique @db.VarChar(100)    // para URLs: turnomedico.com/dr-juan-perez
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relaciones
  doctorProfile   DoctorProfile?
  users           User[]
  schedules       Schedule[]
  scheduleOverrides ScheduleOverride[]
  appointments    Appointment[]
  patients        TenantPatient[]
  notifications   Notification[]
  reviews         Review[]
  officeConfig    OfficeConfig?
  subscription    Subscription?

  @@map("tenants")
}

/// Perfil publico del medico
model DoctorProfile {
  id               String  @id @default(uuid()) @db.Uuid
  tenantId         String  @unique @map("tenant_id") @db.Uuid
  specialty        String  @db.VarChar(100)          // Cardiologia, Pediatria, etc.
  subspecialty     String? @db.VarChar(100)
  licenseNumber    String  @map("license_number") @db.VarChar(50) // Exequatur
  bio              String? @db.Text
  photoUrl         String? @map("photo_url")
  consultationFee  Decimal? @map("consultation_fee") @db.Decimal(10, 2)
  currency         String  @default("DOP") @db.VarChar(3)
  phone            String  @db.VarChar(20)
  alternatePhone   String? @map("alternate_phone") @db.VarChar(20)
  address          String  @db.Text
  city             String  @db.VarChar(100)
  sector           String? @db.VarChar(100)          // Sector/barrio en RD
  latitude         Decimal? @db.Decimal(10, 8)
  longitude        Decimal? @db.Decimal(11, 8)
  insurances       String[] @default([])             // ARS aceptadas: Humano, APS, Senasa, etc.
  languages        String[] @default(["es"])
  ratingAvg        Decimal @default(0) @map("rating_avg") @db.Decimal(2, 1)
  totalReviews     Int     @default(0) @map("total_reviews")
  isPublicVisible  Boolean @default(true) @map("is_public_visible")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  // Relaciones
  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([specialty])
  @@index([city])
  @@index([latitude, longitude])
  @@map("doctor_profiles")
}

/// Usuarios del sistema (medicos, secretarias, admins)
model User {
  id           String   @id @default(uuid()) @db.Uuid
  tenantId     String?  @map("tenant_id") @db.Uuid    // null para PLATFORM_ADMIN
  email        String   @unique @db.VarChar(255)
  passwordHash String   @map("password_hash")
  role         UserRole
  name         String   @db.VarChar(200)
  phone        String?  @db.VarChar(20)
  isActive     Boolean  @default(true) @map("is_active")
  lastLoginAt  DateTime? @map("last_login_at")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  // Relaciones
  tenant Tenant? @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@map("users")
}

/// Pacientes globales (identificados por telefono)
model Patient {
  id          String   @id @default(uuid()) @db.Uuid
  phone       String   @unique @db.VarChar(20)       // +1-809-555-1234
  name        String   @db.VarChar(200)
  email       String?  @db.VarChar(255)
  cedula      String?  @db.VarChar(20)               // Cedula dominicana
  dateOfBirth DateTime? @map("date_of_birth") @db.Date
  gender      String?  @db.VarChar(1)                // M, F, O
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relaciones
  appointments    Appointment[]
  notifications   Notification[]
  reviews         Review[]
  tenantPatients  TenantPatient[]

  @@map("patients")
}

/// Relacion paciente-tenant (ficha del paciente por consultorio)
model TenantPatient {
  id        String  @id @default(uuid()) @db.Uuid
  tenantId  String  @map("tenant_id") @db.Uuid
  patientId String  @map("patient_id") @db.Uuid
  notes     String? @db.Text                         // Notas internas del medico
  insurance String? @db.VarChar(100)                 // ARS del paciente en este consultorio
  isVip     Boolean @default(false) @map("is_vip")
  createdAt DateTime @default(now()) @map("created_at")

  // Relaciones
  tenant  Tenant  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  patient Patient @relation(fields: [patientId], references: [id], onDelete: Cascade)

  @@unique([tenantId, patientId])
  @@map("tenant_patients")
}

/// Horario semanal del medico
model Schedule {
  id              String   @id @default(uuid()) @db.Uuid
  tenantId        String   @map("tenant_id") @db.Uuid
  dayOfWeek       Int      @map("day_of_week")       // 0=Domingo, 1=Lunes, ..., 6=Sabado
  startTime       String   @map("start_time") @db.VarChar(5)  // "08:00"
  endTime         String   @map("end_time") @db.VarChar(5)    // "12:00"
  slotDurationMin Int      @default(30) @map("slot_duration_min")
  breakStart      String?  @map("break_start") @db.VarChar(5) // "12:00"
  breakEnd        String?  @map("break_end") @db.VarChar(5)   // "13:00"
  isActive        Boolean  @default(true) @map("is_active")
  createdAt       DateTime @default(now()) @map("created_at")

  // Relaciones
  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, dayOfWeek])
  @@map("schedules")
}

/// Excepciones al horario (bloqueos, vacaciones, dias especiales)
model ScheduleOverride {
  id        String   @id @default(uuid()) @db.Uuid
  tenantId  String   @map("tenant_id") @db.Uuid
  date      DateTime @db.Date
  isBlocked Boolean  @default(true) @map("is_blocked")  // true=no atiende ese dia
  reason    String?  @db.VarChar(200)                   // "Vacaciones", "Congreso"
  startTime String?  @map("start_time") @db.VarChar(5)  // Horario especial si no esta bloqueado
  endTime   String?  @map("end_time") @db.VarChar(5)
  createdAt DateTime @default(now()) @map("created_at")

  // Relaciones
  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, date])
  @@map("schedule_overrides")
}

/// Citas / Turnos
model Appointment {
  id            String            @id @default(uuid()) @db.Uuid
  tenantId      String            @map("tenant_id") @db.Uuid
  patientId     String            @map("patient_id") @db.Uuid
  date          DateTime          @db.Date
  startTime     String            @map("start_time") @db.VarChar(5) // "09:00"
  endTime       String            @map("end_time") @db.VarChar(5)   // "09:30"
  status        AppointmentStatus @default(PENDING)
  type          AppointmentType   @default(FIRST_VISIT)
  queuePosition Int?              @map("queue_position")            // Posicion en la fila del dia
  notes         String?           @db.Text
  cancelReason  String?           @map("cancel_reason") @db.VarChar(500)
  arrivedAt     DateTime?         @map("arrived_at")
  startedAt     DateTime?         @map("started_at")                // Inicio de consulta
  completedAt   DateTime?         @map("completed_at")
  createdAt     DateTime          @default(now()) @map("created_at")
  updatedAt     DateTime          @updatedAt @map("updated_at")

  // Relaciones
  tenant        Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  patient       Patient        @relation(fields: [patientId], references: [id], onDelete: Cascade)
  notifications Notification[]
  review        Review?

  // Indices para consultas frecuentes
  @@index([tenantId, date])                           // Agenda del dia
  @@index([tenantId, date, status])                   // Filtro por estado
  @@index([patientId])                                // Historial del paciente
  @@index([tenantId, date, startTime])                // Verificacion de conflictos
  @@map("appointments")
}

/// Notificaciones enviadas
model Notification {
  id            String             @id @default(uuid()) @db.Uuid
  tenantId      String             @map("tenant_id") @db.Uuid
  appointmentId String?            @map("appointment_id") @db.Uuid
  patientId     String             @map("patient_id") @db.Uuid
  type          NotificationType
  channel       NotificationChannel
  status        NotificationStatus @default(PENDING)
  scheduledAt   DateTime           @map("scheduled_at")
  sentAt        DateTime?          @map("sent_at")
  content       String             @db.Text
  externalId    String?            @map("external_id") @db.VarChar(200) // ID de Twilio, etc.
  errorMessage  String?            @map("error_message") @db.Text
  createdAt     DateTime           @default(now()) @map("created_at")

  // Relaciones
  tenant      Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  appointment Appointment? @relation(fields: [appointmentId], references: [id], onDelete: SetNull)
  patient     Patient      @relation(fields: [patientId], references: [id], onDelete: Cascade)

  @@index([scheduledAt, status])                      // Para el job de envio
  @@index([tenantId, patientId])
  @@map("notifications")
}

/// Resenas de pacientes
model Review {
  id            String   @id @default(uuid()) @db.Uuid
  tenantId      String   @map("tenant_id") @db.Uuid
  patientId     String   @map("patient_id") @db.Uuid
  appointmentId String   @unique @map("appointment_id") @db.Uuid
  rating        Int                                    // 1-5 estrellas
  comment       String?  @db.Text
  isVisible     Boolean  @default(true) @map("is_visible")
  createdAt     DateTime @default(now()) @map("created_at")

  // Relaciones
  tenant      Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  patient     Patient     @relation(fields: [patientId], references: [id], onDelete: Cascade)
  appointment Appointment @relation(fields: [appointmentId], references: [id])

  @@index([tenantId, isVisible])
  @@map("reviews")
}

/// Configuracion visual del consultorio (pantalla sala de espera)
model OfficeConfig {
  id             String    @id @default(uuid()) @db.Uuid
  tenantId       String    @unique @map("tenant_id") @db.Uuid
  displayName    String    @map("display_name") @db.VarChar(200)
  welcomeMessage String?   @map("welcome_message") @db.VarChar(500)
  logoUrl        String?   @map("logo_url")
  theme          ThemeMode @default(LIGHT)
  primaryColor   String    @default("#0066CC") @map("primary_color") @db.VarChar(7)
  announcements  Json?     @db.JsonB        // [{title, body, imageUrl}]
  showEstimatedWait Boolean @default(true) @map("show_estimated_wait")
  showQueuePosition Boolean @default(true) @map("show_queue_position")
  displayToken   String    @unique @map("display_token") @db.VarChar(64) // Token para URL de pantalla
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  // Relaciones
  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@map("office_configs")
}

/// Planes de suscripcion
model Plan {
  id               String   @id @default(uuid()) @db.Uuid
  name             String   @db.VarChar(100)           // "Basico", "Profesional", "Premium"
  slug             String   @unique @db.VarChar(50)
  priceMonthly     Decimal  @map("price_monthly") @db.Decimal(10, 2)
  priceYearly      Decimal  @map("price_yearly") @db.Decimal(10, 2)
  currency         String   @default("USD") @db.VarChar(3)
  maxAppointments  Int?     @map("max_appointments")   // null = ilimitado
  maxSecretaries   Int      @default(1) @map("max_secretaries")
  features         Json     @db.JsonB                  // Feature flags
  hasWhatsApp      Boolean  @default(false) @map("has_whatsapp")
  hasDisplayMode   Boolean  @default(false) @map("has_display_mode")
  hasAnalytics     Boolean  @default(false) @map("has_analytics")
  stripePriceIdMo  String?  @map("stripe_price_id_monthly")
  stripePriceIdYr  String?  @map("stripe_price_id_yearly")
  isActive         Boolean  @default(true) @map("is_active")
  sortOrder        Int      @default(0) @map("sort_order")
  createdAt        DateTime @default(now()) @map("created_at")

  // Relaciones
  subscriptions Subscription[]

  @@map("plans")
}

/// Suscripciones
model Subscription {
  id                 String             @id @default(uuid()) @db.Uuid
  tenantId           String             @unique @map("tenant_id") @db.Uuid
  planId             String             @map("plan_id") @db.Uuid
  status             SubscriptionStatus @default(TRIAL)
  stripeCustomerId   String?            @map("stripe_customer_id")
  stripeSubscriptionId String?          @map("stripe_subscription_id")
  currentPeriodStart DateTime           @map("current_period_start")
  currentPeriodEnd   DateTime           @map("current_period_end")
  trialEndsAt        DateTime?          @map("trial_ends_at")
  cancelledAt        DateTime?          @map("cancelled_at")
  createdAt          DateTime           @default(now()) @map("created_at")
  updatedAt          DateTime           @updatedAt @map("updated_at")

  // Relaciones
  tenant   Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  plan     Plan      @relation(fields: [planId], references: [id])
  invoices Invoice[]

  @@map("subscriptions")
}

/// Facturas
model Invoice {
  id               String        @id @default(uuid()) @db.Uuid
  subscriptionId   String        @map("subscription_id") @db.Uuid
  amount           Decimal       @db.Decimal(10, 2)
  currency         String        @default("USD") @db.VarChar(3)
  status           InvoiceStatus @default(PENDING)
  stripeInvoiceId  String?       @map("stripe_invoice_id")
  pdfUrl           String?       @map("pdf_url")
  periodStart      DateTime      @map("period_start")
  periodEnd        DateTime      @map("period_end")
  paidAt           DateTime?     @map("paid_at")
  createdAt        DateTime      @default(now()) @map("created_at")

  // Relaciones
  subscription Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)

  @@index([subscriptionId])
  @@map("invoices")
}
```

### 3.3 Indices de PostgreSQL Adicionales (Fuera de Prisma)

```sql
-- Full-text search para busqueda de medicos
CREATE INDEX idx_doctor_search ON doctor_profiles
  USING gin(to_tsvector('spanish', name || ' ' || specialty || ' ' || COALESCE(bio, '')));

-- Indice parcial para citas activas del dia (las mas consultadas)
CREATE INDEX idx_active_appointments ON appointments (tenant_id, date)
  WHERE status NOT IN ('CANCELLED_PATIENT', 'CANCELLED_DOCTOR', 'NO_SHOW');

-- Indice para notificaciones pendientes de envio
CREATE INDEX idx_pending_notifications ON notifications (scheduled_at)
  WHERE status = 'PENDING';

-- Indice geografico para busqueda por cercania
CREATE INDEX idx_doctor_location ON doctor_profiles
  USING gist(ll_to_earth(latitude, longitude))
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
```

---

## 4. APIs Principales

### 4.1 Endpoints REST

#### 4.1.1 Autenticacion y Registro

```
POST   /api/v1/auth/register              # Registro de medico (crea tenant)
POST   /api/v1/auth/login                 # Login medico/secretaria
POST   /api/v1/auth/refresh               # Refresh token
POST   /api/v1/auth/forgot-password       # Olvidar contrasena
POST   /api/v1/auth/reset-password        # Resetear contrasena
POST   /api/v1/auth/patient/otp           # Enviar OTP al paciente
POST   /api/v1/auth/patient/verify        # Verificar OTP del paciente
```

#### 4.1.2 Portal Publico (sin autenticacion o autenticacion de paciente)

```
GET    /api/v1/public/doctors              # Buscar medicos (filtros: specialty, city, name)
GET    /api/v1/public/doctors/:slug        # Perfil publico del medico
GET    /api/v1/public/doctors/:slug/slots  # Slots disponibles (query: date, from, to)
GET    /api/v1/public/doctors/:slug/reviews # Resenas del medico
GET    /api/v1/public/specialties          # Lista de especialidades con conteo

POST   /api/v1/appointments/book           # Agendar cita (paciente)
PUT    /api/v1/appointments/:id/cancel     # Cancelar cita (paciente, con token)
PUT    /api/v1/appointments/:id/reschedule # Reprogramar cita (paciente, con token)
GET    /api/v1/patient/appointments        # Historial de citas del paciente
POST   /api/v1/patient/reviews             # Dejar resena
```

#### 4.1.3 Dashboard Medico/Secretaria (requiere auth + tenant)

```
# Agenda
GET    /api/v1/dashboard/appointments           # Lista de citas (query: date, status, page)
GET    /api/v1/dashboard/appointments/:id        # Detalle de cita
PUT    /api/v1/dashboard/appointments/:id/status # Cambiar estado (confirm, arrive, start, complete, no-show)
PUT    /api/v1/dashboard/appointments/:id        # Editar cita
DELETE /api/v1/dashboard/appointments/:id        # Cancelar cita (como medico)
GET    /api/v1/dashboard/appointments/today      # Agenda de hoy con cola activa
POST   /api/v1/dashboard/appointments/walk-in    # Crear cita sin turno previo (walk-in)

# Horarios
GET    /api/v1/dashboard/schedules               # Obtener horario semanal
PUT    /api/v1/dashboard/schedules               # Actualizar horario semanal
GET    /api/v1/dashboard/schedule-overrides       # Lista de excepciones
POST   /api/v1/dashboard/schedule-overrides       # Crear excepcion (bloqueo/dia especial)
DELETE /api/v1/dashboard/schedule-overrides/:id   # Eliminar excepcion

# Pacientes
GET    /api/v1/dashboard/patients                # Lista de pacientes del tenant
GET    /api/v1/dashboard/patients/:id            # Ficha del paciente
PUT    /api/v1/dashboard/patients/:id            # Actualizar ficha
GET    /api/v1/dashboard/patients/:id/history    # Historial de citas del paciente

# Perfil y Configuracion
GET    /api/v1/dashboard/profile                 # Perfil del medico
PUT    /api/v1/dashboard/profile                 # Actualizar perfil
GET    /api/v1/dashboard/office-config           # Configuracion del consultorio
PUT    /api/v1/dashboard/office-config           # Actualizar configuracion
POST   /api/v1/dashboard/office-config/regenerate-token  # Regenerar token de pantalla

# Equipo
GET    /api/v1/dashboard/team                    # Lista de usuarios (secretarias)
POST   /api/v1/dashboard/team                    # Invitar secretaria
DELETE /api/v1/dashboard/team/:id                # Remover secretaria

# Estadisticas
GET    /api/v1/dashboard/analytics/summary       # Resumen general
GET    /api/v1/dashboard/analytics/appointments  # Estadisticas de citas (query: period)
GET    /api/v1/dashboard/analytics/patients      # Estadisticas de pacientes
GET    /api/v1/dashboard/analytics/no-shows      # Tasa de no-shows

# Resenas
GET    /api/v1/dashboard/reviews                 # Resenas recibidas
PUT    /api/v1/dashboard/reviews/:id/visibility  # Mostrar/ocultar resena
```

#### 4.1.4 Pantalla Sala de Espera

```
GET    /api/v1/display/:token                    # Info de la pantalla (config + cola actual)
```

*(El resto se maneja via WebSocket, ver seccion 4.2)*

#### 4.1.5 Panel Admin de Plataforma

```
# Tenants
GET    /api/v1/admin/tenants                     # Lista de medicos/tenants
GET    /api/v1/admin/tenants/:id                 # Detalle de tenant
PUT    /api/v1/admin/tenants/:id/status          # Activar/desactivar tenant

# Planes y Suscripciones
GET    /api/v1/admin/plans                       # Lista de planes
POST   /api/v1/admin/plans                       # Crear plan
PUT    /api/v1/admin/plans/:id                   # Editar plan
GET    /api/v1/admin/subscriptions               # Lista de suscripciones
GET    /api/v1/admin/subscriptions/:id           # Detalle de suscripcion

# Facturacion
GET    /api/v1/admin/invoices                    # Lista de facturas
GET    /api/v1/admin/invoices/:id                # Detalle de factura

# Metricas
GET    /api/v1/admin/metrics/overview            # Dashboard general
GET    /api/v1/admin/metrics/revenue             # Ingresos
GET    /api/v1/admin/metrics/growth              # Crecimiento de usuarios
GET    /api/v1/admin/metrics/engagement          # Engagement (citas/medico)
```

#### 4.1.6 Webhooks

```
POST   /api/v1/webhooks/stripe                  # Webhooks de Stripe (pagos, suscripciones)
POST   /api/v1/webhooks/twilio                  # Status callbacks de Twilio (SMS/WhatsApp)
```

### 4.2 WebSocket Events (Pantalla Sala de Espera)

#### Conexion

```typescript
// Cliente (pantalla de sala de espera)
const socket = io('wss://api.turnomedico.com', {
  auth: {
    token: 'display-token-abc123'  // Token unico de la pantalla
  },
  transports: ['websocket']
});
```

#### Eventos del Servidor al Cliente (pantalla)

```typescript
// Evento: Estado completo de la cola (al conectar o reconectar)
socket.on('queue:state', (data: {
  currentPatient: {
    queuePosition: number;
    patientInitials: string;   // "JP" (privacidad)
    status: 'IN_PROGRESS';
    startedAt: string;
  } | null;
  waitingQueue: Array<{
    queuePosition: number;
    patientInitials: string;
    status: 'ARRIVED' | 'CONFIRMED';
    estimatedWaitMinutes: number;
  }>;
  stats: {
    totalToday: number;
    attended: number;
    remaining: number;
    avgWaitMinutes: number;
  };
  officeConfig: {
    displayName: string;
    welcomeMessage: string;
    logoUrl: string;
    theme: 'LIGHT' | 'DARK';
    primaryColor: string;
    announcements: Array<{title: string; body: string; imageUrl?: string}>;
  };
}) => void);

// Evento: Actualizacion de un turno especifico
socket.on('queue:update', (data: {
  action: 'PATIENT_ARRIVED' | 'CONSULTATION_STARTED' | 'CONSULTATION_COMPLETED' | 'APPOINTMENT_CANCELLED';
  appointment: {
    queuePosition: number;
    patientInitials: string;
    status: AppointmentStatus;
  };
  stats: { /* misma estructura que arriba */ };
}) => void);

// Evento: Llamada a un paciente (animacion/sonido en la pantalla)
socket.on('queue:call', (data: {
  queuePosition: number;
  patientInitials: string;
  message: string;            // "Turno #5 - JP, pase al consultorio"
}) => void);

// Evento: Configuracion actualizada
socket.on('config:updated', (data: OfficeConfig) => void);
```

#### Eventos del Cliente al Servidor

```typescript
// Heartbeat (mantener conexion activa)
socket.emit('ping');

// Solicitar estado completo (refresh manual)
socket.emit('queue:refresh');
```

### 4.3 Flujo de Reserva de Cita (Detallado)

```
Paciente                    API                         Base de Datos
   |                         |                              |
   |  GET /doctors/:slug/slots?date=2026-03-01              |
   |------------------------>|                              |
   |                         |  1. Obtener Schedule del dia |
   |                         |  2. Obtener ScheduleOverride |
   |                         |  3. Obtener Appointments     |
   |                         |     existentes del dia       |
   |                         |  4. Calcular slots libres    |
   |                         |----------------------------->|
   |                         |                              |
   |  slots: [09:00, 09:30, |                              |
   |   10:00, 10:30, ...]   |                              |
   |<------------------------|                              |
   |                         |                              |
   |  POST /appointments/book                               |
   |  {doctor_slug, date,    |                              |
   |   start_time, name,     |                              |
   |   phone}                |                              |
   |------------------------>|                              |
   |                         |  BEGIN TRANSACTION           |
   |                         |  SELECT ... FOR UPDATE       |
   |                         |  (lock del slot)             |
   |                         |----------------------------->|
   |                         |                              |
   |                         |  Verificar slot disponible   |
   |                         |  Crear/obtener Patient       |
   |                         |  Crear Appointment           |
   |                         |  COMMIT                      |
   |                         |----------------------------->|
   |                         |                              |
   |                         |  Encolar notificaciones:     |
   |                         |  - Confirmacion inmediata    |
   |                         |  - Recordatorio 24h antes    |
   |                         |  - Recordatorio 1h antes     |
   |                         |                              |
   |  {appointment_id,       |                              |
   |   confirmation_token,   |                              |
   |   cancel_url}           |                              |
   |<------------------------|                              |
   |                         |                              |
   |  SMS/WhatsApp:          |                              |
   |  "Su cita con Dr. X    |                              |
   |   el 1 de marzo a las  |                              |
   |   9:00 AM ha sido      |                              |
   |   confirmada. Para     |                              |
   |   cancelar: [link]"    |                              |
   |<-----------------------------------------             |
```

---

## 5. Integraciones

### 5.1 Pasarela de Pago: Stripe

**Justificacion:** Stripe soporta suscripciones recurrentes out-of-the-box con Stripe Billing. Funciona en RD para tarjetas Visa/Mastercard internacionales. Para tarjetas locales dominicanas (Azul/CardNet), se puede integrar como metodo de pago adicional en Fase 2.

```typescript
// Flujo de suscripcion con Stripe
// apps/api/src/modules/billing/billing.service.ts

@Injectable()
export class BillingService {
  constructor(
    private readonly stripe: Stripe,
    private readonly prisma: PrismaService,
  ) {}

  async createSubscription(tenantId: string, planSlug: string, paymentMethodId: string) {
    const plan = await this.prisma.plan.findUnique({ where: { slug: planSlug } });
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { subscription: true },
    });

    // Crear o recuperar cliente en Stripe
    let customerId = tenant.subscription?.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: tenant.users[0].email,
        metadata: { tenantId },
      });
      customerId = customer.id;
    }

    // Adjuntar metodo de pago
    await this.stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Crear suscripcion
    const subscription = await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: plan.stripePriceIdMo }],
      default_payment_method: paymentMethodId,
      trial_period_days: 14,  // 14 dias de trial
    });

    // Guardar en BD
    await this.prisma.subscription.upsert({
      where: { tenantId },
      create: {
        tenantId,
        planId: plan.id,
        status: 'TRIAL',
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        trialEndsAt: new Date(subscription.trial_end * 1000),
      },
      update: {
        planId: plan.id,
        stripeSubscriptionId: subscription.id,
      },
    });

    return subscription;
  }
}
```

#### Planes Propuestos

| Plan | Precio/mes (USD) | Precio/ano (USD) | Citas/mes | Secretarias | WhatsApp | Pantalla | Analytics |
|---|---|---|---|---|---|---|---|
| **Basico** | $29 | $290 | 200 | 1 | No (solo SMS) | No | Basico |
| **Profesional** | $49 | $490 | Ilimitado | 2 | Si | Si | Completo |
| **Premium** | $79 | $790 | Ilimitado | 5 | Si | Si + Branding | Avanzado |

*Precios ajustados para el mercado dominicano. $29 USD ~ 1,700 DOP/mes, competitivo para el mercado.*

### 5.2 SMS: Twilio

```typescript
// apps/api/src/modules/notifications/channels/sms.service.ts

@Injectable()
export class SmsService {
  private client: Twilio;

  constructor(private readonly configService: ConfigService) {
    this.client = new Twilio(
      this.configService.get('TWILIO_ACCOUNT_SID'),
      this.configService.get('TWILIO_AUTH_TOKEN'),
    );
  }

  async send(to: string, body: string): Promise<string> {
    const message = await this.client.messages.create({
      body,
      from: this.configService.get('TWILIO_PHONE_NUMBER'), // Numero dominicano
      to, // +1809XXXXXXX
      statusCallback: `${this.configService.get('API_URL')}/api/v1/webhooks/twilio`,
    });
    return message.sid;
  }
}
```

**Numeros de telefono dominicanos soportados:**
- +1-809-XXX-XXXX
- +1-829-XXX-XXXX
- +1-849-XXX-XXXX

**Costo estimado:** ~$0.05 USD por SMS a RD.

### 5.3 WhatsApp Business API (via Twilio)

```typescript
// apps/api/src/modules/notifications/channels/whatsapp.service.ts

@Injectable()
export class WhatsAppService {
  private client: Twilio;

  constructor(private readonly configService: ConfigService) {
    this.client = new Twilio(
      this.configService.get('TWILIO_ACCOUNT_SID'),
      this.configService.get('TWILIO_AUTH_TOKEN'),
    );
  }

  async sendTemplate(to: string, templateSid: string, variables: Record<string, string>) {
    const message = await this.client.messages.create({
      from: `whatsapp:${this.configService.get('TWILIO_WHATSAPP_NUMBER')}`,
      to: `whatsapp:${to}`,
      contentSid: templateSid,
      contentVariables: JSON.stringify(variables),
      statusCallback: `${this.configService.get('API_URL')}/api/v1/webhooks/twilio`,
    });
    return message.sid;
  }
}
```

**Templates de WhatsApp necesarios (requieren aprobacion de Meta):**

| Template | Variables | Ejemplo |
|---|---|---|
| `appointment_confirmation` | `{doctor_name}`, `{date}`, `{time}` | "Su cita con Dr. Juan Perez el 1 de marzo a las 9:00 AM ha sido confirmada." |
| `appointment_reminder_24h` | `{doctor_name}`, `{date}`, `{time}`, `{cancel_url}` | "Recordatorio: su cita con Dr. Juan Perez es manana 1 de marzo a las 9:00 AM." |
| `appointment_reminder_1h` | `{doctor_name}`, `{time}`, `{address}` | "Su cita con Dr. Juan Perez es en 1 hora (9:00 AM). Direccion: Ave. 27 de Febrero..." |
| `appointment_cancelled` | `{doctor_name}`, `{date}`, `{reschedule_url}` | "Su cita con Dr. Juan Perez el 1 de marzo ha sido cancelada. Reprogramar: [link]" |

### 5.4 Email: Resend

```typescript
// apps/api/src/modules/notifications/channels/email.service.ts

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(this.configService.get('RESEND_API_KEY'));
  }

  async send(to: string, subject: string, reactTemplate: React.ReactElement) {
    const { data, error } = await this.resend.emails.send({
      from: 'TurnoMedico <noreply@turnomedico.com>',
      to,
      subject,
      react: reactTemplate,
    });

    if (error) throw new Error(error.message);
    return data.id;
  }
}
```

### 5.5 Google Maps

```typescript
// Busqueda de medicos por cercania
// apps/api/src/modules/doctors/doctors.service.ts

async findNearby(lat: number, lng: number, radiusKm: number = 10) {
  // Usando earth_distance extension de PostgreSQL
  return this.prisma.$queryRaw`
    SELECT dp.*, t.slug, t.name as tenant_name,
      earth_distance(
        ll_to_earth(${lat}, ${lng}),
        ll_to_earth(dp.latitude, dp.longitude)
      ) / 1000 as distance_km
    FROM doctor_profiles dp
    JOIN tenants t ON t.id = dp.tenant_id
    WHERE dp.is_public_visible = true
      AND dp.latitude IS NOT NULL
      AND earth_distance(
        ll_to_earth(${lat}, ${lng}),
        ll_to_earth(dp.latitude, dp.longitude)
      ) < ${radiusKm * 1000}
    ORDER BY distance_km ASC
    LIMIT 50;
  `;
}
```

### 5.6 Cola de Trabajos Asincronica (Bull + Redis)

```typescript
// apps/api/src/modules/notifications/notification.processor.ts

@Processor('notifications')
export class NotificationProcessor {
  constructor(
    private readonly smsService: SmsService,
    private readonly whatsAppService: WhatsAppService,
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
  ) {}

  @Process('send-notification')
  async handleSend(job: Job<{ notificationId: string }>) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: job.data.notificationId },
      include: { patient: true, appointment: true },
    });

    if (!notification || notification.status !== 'PENDING') return;

    try {
      let externalId: string;

      switch (notification.channel) {
        case 'SMS':
          externalId = await this.smsService.send(
            notification.patient.phone,
            notification.content,
          );
          break;
        case 'WHATSAPP':
          externalId = await this.whatsAppService.sendTemplate(
            notification.patient.phone,
            this.getTemplateSid(notification.type),
            this.getTemplateVars(notification),
          );
          break;
        case 'EMAIL':
          externalId = await this.emailService.send(
            notification.patient.email,
            this.getEmailSubject(notification.type),
            this.getEmailTemplate(notification),
          );
          break;
      }

      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          externalId,
        },
      });
    } catch (error) {
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
        },
      });
      throw error; // Bull reintentara automaticamente
    }
  }
}
```

### 5.7 Job Scheduler (Recordatorios Automaticos)

```typescript
// apps/api/src/modules/notifications/reminder.scheduler.ts

@Injectable()
export class ReminderScheduler {
  constructor(
    @InjectQueue('notifications') private readonly notifQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  // Ejecutar cada 5 minutos
  @Cron(CronExpression.EVERY_5_MINUTES)
  async processReminders() {
    const now = new Date();

    // Buscar notificaciones programadas que ya deben enviarse
    const pendingNotifications = await this.prisma.notification.findMany({
      where: {
        status: 'PENDING',
        scheduledAt: { lte: now },
      },
      take: 100,
    });

    for (const notif of pendingNotifications) {
      await this.prisma.notification.update({
        where: { id: notif.id },
        data: { status: 'QUEUED' },
      });

      await this.notifQueue.add('send-notification', {
        notificationId: notif.id,
      }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 60000 },
      });
    }
  }
}
```

### 5.8 Mapa Completo de Integraciones

```
+-------------------------------------------------------------------+
|                     TURNOMEDICO - INTEGRACIONES                    |
+-------------------------------------------------------------------+
|                                                                   |
|  PAGOS                   COMUNICACIONES           INFRAESTRUCTURA |
|  +---------------+       +---------------+        +-------------+ |
|  | Stripe        |       | Twilio SMS    |        | Vercel      | |
|  | - Suscripcion |       | - Confirm.    |        | - Frontend  | |
|  | - Cobro auto  |       | - Recordat.   |        | - CDN       | |
|  | - Portal cli. |       | - Cancelac.   |        | - Edge Fn   | |
|  | - Webhooks    |       +---------------+        +-------------+ |
|  +---------------+       | Twilio WA     |        | Railway     | |
|  | Azul (Fase 2) |       | - Templates   |        | - API       | |
|  | - Tarj. local |       | - Richtext    |        | - PostgreSQL| |
|  +---------------+       +---------------+        | - Redis     | |
|                          | Resend Email  |        +-------------+ |
|  MAPAS                   | - Transacc.   |        | Cloudflare  | |
|  +---------------+       | - React Email |        | R2          | |
|  | Google Maps   |       +---------------+        | - Imagenes  | |
|  | - Geocoding   |                                +-------------+ |
|  | - Embed map   |       MONITOREO                | Upstash     | |
|  | - Directions  |       +---------------+        | - Redis     | |
|  +---------------+       | Sentry        |        | - Serverless| |
|                          | - Errors FE   |        +-------------+ |
|  OPCIONALES (Fase 3)    | - Errors BE   |                        |
|  +---------------+       | - Performance |        CI/CD           |
|  | Google Calendar|      +---------------+        +-------------+ |
|  | - Sync 2-way  |       | Vercel Anal.  |        | GitHub Act. | |
|  +---------------+       | - Web Vitals  |        | - Auto deploy|
|  | OneSignal      |      +---------------+        +-------------+ |
|  | - Push notif.  |                                               |
|  +---------------+                                                |
+-------------------------------------------------------------------+
```

---

## 6. Fases de Implementacion

### 6.1 Vision General del Timeline

```
|  FASE 1: MVP          |  FASE 2: EXPANSION     |  FASE 3: OPTIMIZACION  |
|  3.5 meses            |  2.5 meses             |  2 meses               |
|  (14 semanas)         |  (10 semanas)           |  (8 semanas)           |
|                       |                         |                        |
|  Sem 1-2: Setup       |  Sem 15-17: WhatsApp   |  Sem 25-27: App nativa |
|  Sem 3-5: Backend     |  Sem 18-19: Analytics  |  Sem 28-30: Google Cal |
|  Sem 6-8: Dashboard   |  Sem 20-21: Pantalla   |  Sem 31-32: Perf.     |
|  Sem 9-11: Paciente   |  Sem 22-23: Admin      |                        |
|  Sem 12-14: Deploy    |  Sem 24: Pagos local   |                        |
|                       |                         |                        |
|  GO LIVE!             |  ESCALA                 |  LATAM                 |
```

### 6.2 Fase 1: MVP (3.5 meses / 14 semanas)

**Objetivo:** Lanzar la plataforma con las funcionalidades esenciales para que un medico pueda recibir citas online y gestionar su agenda.

#### Semanas 1-2: Setup de Infraestructura

| Tarea | Duracion | Detalle |
|---|---|---|
| Monorepo con Turborepo | 2 dias | Estructura del proyecto, configs compartidas |
| PostgreSQL + Prisma schema | 2 dias | Modelo de datos completo, migraciones iniciales |
| NestJS boilerplate | 2 dias | Modulos base, guards, middleware de tenant, Swagger |
| Next.js boilerplate | 1 dia | App Router, shadcn/ui, Tailwind, layout base |
| CI/CD con GitHub Actions | 1 dia | Deploy auto a Vercel + Railway |
| Docker Compose local | 1 dia | PostgreSQL + Redis para desarrollo |
| Seed data | 1 dia | Datos de prueba: medicos, especialidades, horarios |

**Entregable:** Proyecto funcionando en local con deploy automatico.

#### Semanas 3-5: Backend Core

| Tarea | Duracion | Detalle |
|---|---|---|
| Modulo Auth | 3 dias | JWT, refresh tokens, guards por rol |
| Modulo Tenants | 2 dias | CRUD de tenants, middleware RLS |
| Modulo Schedules | 3 dias | Horarios semanales, overrides, calculo de slots |
| Modulo Appointments | 5 dias | CRUD completo, validaciones, locking, estados |
| Modulo Patients | 2 dias | CRUD, busqueda, registro minimo por telefono |
| Auth Paciente (OTP) | 2 dias | Login con telefono + codigo OTP via SMS |
| Modulo Notifications | 3 dias | Servicio SMS (Twilio), cola con Bull, recordatorios |

**Entregable:** API REST funcional con todos los endpoints core.

#### Semanas 6-8: Dashboard Medico/Secretaria

| Tarea | Duracion | Detalle |
|---|---|---|
| Login/Register medico | 2 dias | Formulario, validacion, flujo de onboarding |
| Vista agenda (dia/semana/mes) | 4 dias | Calendario interactivo, drag & drop opcional |
| Gestion de citas | 3 dias | Cambio de estados, detalles, cancelacion |
| Configuracion de horarios | 3 dias | Editor visual de horario semanal + excepciones |
| Perfil del medico | 2 dias | Editor del perfil publico, foto, especialidad |
| Lista de pacientes | 2 dias | Tabla con busqueda, ficha del paciente |
| Responsive design | 2 dias | Dashboard funcional en tablet y movil |

**Entregable:** Dashboard completo para gestion diaria.

#### Semanas 9-11: Portal Paciente + Landing

| Tarea | Duracion | Detalle |
|---|---|---|
| Landing page | 3 dias | Hero, features, pricing, SEO, CTA |
| Busqueda de medicos | 3 dias | Filtros, resultados, mapa |
| Perfil publico del medico | 2 dias | Info, horarios, resenas, mapa |
| Flujo de reserva | 3 dias | Seleccion de fecha/hora, datos paciente, confirmacion |
| Historial de citas | 2 dias | Lista de citas pasadas y futuras del paciente |
| Cancelar/reprogramar | 2 dias | Via link en SMS/email, validaciones |
| PWA setup | 1 dia | Manifest, service worker, instalacion |

**Entregable:** Portal publico donde pacientes pueden buscar medicos y agendar.

#### Semanas 12-14: Deploy, QA y Lanzamiento

| Tarea | Duracion | Detalle |
|---|---|---|
| Deploy a produccion | 2 dias | Railway (API + DB + Redis), Vercel (frontend) |
| Dominio y SSL | 1 dia | turnomedico.com, DNS, certificados |
| Testing E2E | 3 dias | Flujos criticos: reserva, cancelacion, estados |
| Testing de carga | 1 dia | Simular 50 medicos concurrentes |
| Fix bugs y polish | 3 dias | Bugs criticos, UX refinement |
| Documentacion basica | 1 dia | Guia rapida para medicos, FAQ |
| Onboarding 5-10 medicos beta | 2 dias | Invitacion personalizada, soporte directo |
| Monitoreo (Sentry) | 1 dia | Setup de alertas, error tracking |

**Entregable:** Plataforma en produccion con primeros usuarios beta.

### 6.3 Fase 2: Expansion (2.5 meses / 10 semanas)

**Objetivo:** Anadir funcionalidades de valor que diferencien la plataforma y generen ingresos.

#### Semanas 15-17: Comunicaciones Avanzadas

| Tarea | Duracion | Detalle |
|---|---|---|
| WhatsApp Business API | 4 dias | Integracion Twilio WhatsApp, templates |
| Aprobacion de templates | 3 dias | Envio a Meta para aprobacion (puede tardar) |
| Email transaccional | 2 dias | Templates con React Email, confirmaciones |
| Preferencias de notificacion | 2 dias | Paciente elige canal: SMS, WhatsApp, email |
| Historial de notificaciones | 1 dia | Dashboard: ver que se envio, status |

#### Semanas 18-19: Analytics y Resenas

| Tarea | Duracion | Detalle |
|---|---|---|
| Dashboard de estadisticas | 4 dias | Graficos con Recharts: citas/dia, no-shows, tendencias |
| Sistema de resenas | 3 dias | Solicitud post-cita, estrellas, comentarios |
| Perfil publico mejorado | 2 dias | Resenas visibles, score, fotos del consultorio |
| Exportar reportes | 1 dia | CSV de citas, pacientes, ingresos |

#### Semanas 20-21: Pantalla Sala de Espera

| Tarea | Duracion | Detalle |
|---|---|---|
| WebSocket Gateway | 3 dias | NestJS Gateway, rooms, eventos, Redis Pub/Sub |
| UI de pantalla display | 4 dias | Diseno para TV, turnos, animaciones, tema claro/oscuro |
| Configuracion de pantalla | 2 dias | Anuncios, logo, colores, mensaje de bienvenida |
| Token de acceso | 1 dia | URL dedicada, regeneracion de token |

#### Semanas 22-23: Panel Admin de Plataforma

| Tarea | Duracion | Detalle |
|---|---|---|
| Dashboard admin | 3 dias | Metricas generales, tenants activos, revenue |
| Gestion de tenants | 2 dias | Lista, activar/desactivar, detalle |
| Gestion de planes | 2 dias | CRUD de planes, feature flags |
| Facturacion | 3 dias | Lista de facturas, cobros, portal de Stripe |

#### Semana 24: Pagos Locales

| Tarea | Duracion | Detalle |
|---|---|---|
| Investigar Azul/CardNet | 2 dias | API, requisitos, certificacion |
| Integracion basica | 3 dias | Pago con tarjeta dominicana como alternativa |

**Entregable Fase 2:** Plataforma completa con todas las features principales.

### 6.4 Fase 3: Optimizacion y Escala (2 meses / 8 semanas)

**Objetivo:** Optimizar la plataforma para escala regional y mejorar la experiencia.

#### Semanas 25-27: Mejoras de UX

| Tarea | Duracion | Detalle |
|---|---|---|
| App nativa (React Native) | 8 dias | Solo si las metricas muestran necesidad |
| O: Mejoras PWA avanzadas | 5 dias | Push notifications, offline mode, UX nativa |
| Busqueda avanzada | 3 dias | Full-text search, filtros por ARS, horarios |
| Multi-idioma (i18n) | 2 dias | Espanol + Ingles (para expansion) |

#### Semanas 28-30: Integraciones Avanzadas

| Tarea | Duracion | Detalle |
|---|---|---|
| Google Calendar sync | 4 dias | Sync bidireccional de citas |
| Telemedicina basica | 5 dias | Link de videollamada (integracion con Daily.co o similar) |
| API publica | 3 dias | Para que medicos integren con sus sistemas |
| Webhooks outbound | 2 dias | Notificar sistemas externos de eventos |

#### Semanas 31-32: Performance y Escala

| Tarea | Duracion | Detalle |
|---|---|---|
| Cache agresivo con Redis | 3 dias | Slots disponibles, perfiles, busquedas |
| Optimizacion de queries | 2 dias | Analisis con EXPLAIN, indices faltantes |
| CDN para imagenes | 1 dia | Cloudflare R2 + transformaciones |
| Preparacion multi-pais | 3 dias | Zonas horarias, monedas, numeros de telefono |
| Load testing | 1 dia | Simular 500+ medicos concurrentes |

**Entregable Fase 3:** Plataforma optimizada, lista para expansion a LATAM.

---

## 7. Estimacion de Costos

### 7.1 Costos de Desarrollo

| Concepto | Fase 1 (3.5 meses) | Fase 2 (2.5 meses) | Fase 3 (2 meses) | Total |
|---|---|---|---|---|
| 1 Senior Developer ($2,000/mes) | $7,000 | $5,000 | $4,000 | **$16,000** |
| Claude AI (asistente de desarrollo) | ~$100/mes = $350 | $250 | $200 | **$800** |
| **Subtotal Desarrollo** | **$7,350** | **$5,250** | **$4,200** | **$16,800** |

### 7.2 Costos de Infraestructura (mensuales)

| Servicio | Free/Starter | Crecimiento (50 medicos) | Escala (200+ medicos) |
|---|---|---|---|
| **Railway** (API + DB + Redis) | $5/mes (Hobby) | $20-40/mes (Pro) | $50-100/mes |
| **Vercel** (Frontend) | $0 (Free tier) | $20/mes (Pro) | $20/mes |
| **Upstash Redis** | $0 (Free: 10K cmd/dia) | $10/mes | $20/mes |
| **Cloudflare R2** (Storage) | $0 (10 GB free) | $5/mes | $10/mes |
| **Dominio** (.com) | $12/ano = $1/mes | $1/mes | $1/mes |
| **Subtotal Infra** | **~$6/mes** | **~$56/mes** | **~$151/mes** |

### 7.3 Costos de Servicios Externos (mensuales)

| Servicio | Free/Starter | 50 Medicos | 200+ Medicos |
|---|---|---|---|
| **Twilio SMS** ($0.05/SMS a RD) | ~$10 (200 SMS) | ~$150 (3,000 SMS) | ~$500 (10,000 SMS) |
| **Twilio WhatsApp** ($0.05/msg) | $0 (no en MVP) | ~$100 (2,000 msg) | ~$350 (7,000 msg) |
| **Resend Email** | $0 (3,000/mes free) | $20/mes (50K) | $20/mes |
| **Stripe** (2.9% + $0.30/tx) | $0 (sin cobro en trial) | ~$50 (comisiones) | ~$170 (comisiones) |
| **Google Maps API** | $200 credito gratis/mes | $0 (dentro del credito) | ~$20/mes |
| **Sentry** | $0 (Free tier) | $0 | $26/mes (Team) |
| **Subtotal Servicios** | **~$10/mes** | **~$320/mes** | **~$1,086/mes** |

### 7.4 Resumen de Costos Totales

```
+----------------------------------------------------------------------+
|                    RESUMEN DE COSTOS POR FASE                        |
+----------------------------------------------------------------------+
|                                                                      |
|  FASE 1 (3.5 meses) - MVP                                          |
|  +----------------------------------+                                |
|  | Desarrollo:    $7,350            |                                |
|  | Infraestructura: $21 (3.5 x $6) |                                |
|  | Servicios:     $35 (3.5 x $10)  |                                |
|  | TOTAL FASE 1:  ~$7,400          |                                |
|  +----------------------------------+                                |
|                                                                      |
|  FASE 2 (2.5 meses) - Expansion                                    |
|  +----------------------------------+                                |
|  | Desarrollo:    $5,250            |                                |
|  | Infraestructura: $140 (crec.)    |                                |
|  | Servicios:     $800 (crec.)      |                                |
|  | TOTAL FASE 2:  ~$6,190          |                                |
|  +----------------------------------+                                |
|                                                                      |
|  FASE 3 (2 meses) - Optimizacion                                   |
|  +----------------------------------+                                |
|  | Desarrollo:    $4,200            |                                |
|  | Infraestructura: $302 (escala)   |                                |
|  | Servicios:     $2,172 (escala)   |                                |
|  | TOTAL FASE 3:  ~$6,674          |                                |
|  +----------------------------------+                                |
|                                                                      |
|  INVERSION TOTAL (8 meses):  ~$20,264                               |
|                                                                      |
+----------------------------------------------------------------------+
```

### 7.5 Proyeccion de Break-Even

```
Ingreso por medico (promedio): $39/mes (mix de planes)
Costo variable por medico:     ~$7/mes (SMS, WhatsApp, infra)
Margen por medico:             ~$32/mes

Costos fijos mensuales (post-lanzamiento):
  - Developer:       $2,000
  - Infra base:      $50
  - Servicios base:  $50
  Total fijo:        $2,100/mes

Break-even: $2,100 / $32 = ~66 medicos activos

Con 100 medicos: $3,200 margen - $2,100 fijos = $1,100 ganancia/mes
Con 200 medicos: $6,400 margen - $2,100 fijos = $4,300 ganancia/mes
Con 500 medicos: $16,000 margen - $2,500 fijos = $13,500 ganancia/mes
```

---

## 8. Consideraciones Tecnicas Especiales

### 8.1 Zona Horaria: Republica Dominicana (AST, UTC-4)

Republica Dominicana usa la zona horaria **Atlantic Standard Time (AST)** que es **UTC-4 fijo**. No hay cambio de horario de verano, lo que simplifica considerablemente el manejo de tiempos.

**Estrategia:**

```typescript
// Constante global
const RD_TIMEZONE = 'America/Santo_Domingo'; // UTC-4, sin daylight saving

// Todas las fechas en la BD se almacenan en UTC
// La conversion se hace en la capa de presentacion

// apps/api/src/common/utils/timezone.util.ts
import { zonedTimeToUtc, utcToZonedTime, format } from 'date-fns-tz';

export class TimezoneUtil {
  private static readonly TZ = 'America/Santo_Domingo';

  /**
   * Convierte hora local RD a UTC para almacenar en BD
   */
  static toUTC(localDate: Date): Date {
    return zonedTimeToUtc(localDate, this.TZ);
  }

  /**
   * Convierte UTC de la BD a hora local RD para mostrar
   */
  static toLocal(utcDate: Date): Date {
    return utcToZonedTime(utcDate, this.TZ);
  }

  /**
   * Formatea una fecha UTC a string legible en hora RD
   */
  static formatLocal(utcDate: Date, fmt: string = 'dd/MM/yyyy hh:mm a'): string {
    return format(utcToZonedTime(utcDate, this.TZ), fmt, { timeZone: this.TZ });
  }

  /**
   * Obtiene la fecha actual en RD (para comparaciones de "hoy")
   */
  static nowInRD(): Date {
    return utcToZonedTime(new Date(), this.TZ);
  }

  /**
   * Para expansion futura: obtener TZ del tenant
   */
  static getTenantTimezone(tenantId: string): string {
    // Fase 1: siempre RD
    // Fase 3: buscar en config del tenant para multi-pais
    return this.TZ;
  }
}
```

**Regla critica:** Las columnas `date` y `start_time`/`end_time` en citas y horarios se almacenan como DATE y VARCHAR(5) respectivamente (ej: "2026-03-01" y "09:00"), NO como timestamps con timezone. Esto evita confusiones ya que toda la operacion de horarios es local.

Solo los campos `created_at`, `arrived_at`, `started_at`, `completed_at` se almacenan como `timestamptz` (UTC) para trazabilidad exacta.

### 8.2 Prevencion de Conflictos de Reserva (Race Conditions)

El escenario mas critico: dos pacientes intentan reservar el mismo slot al mismo tiempo.

**Solucion: Bloqueo pesimista con SELECT FOR UPDATE**

```typescript
// apps/api/src/modules/appointments/appointments.service.ts

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly wsGateway: QueueGateway,
  ) {}

  async bookAppointment(dto: BookAppointmentDto): Promise<Appointment> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Bloqueo pesimista: intentar obtener un advisory lock basado en
      //    tenant + fecha + hora. Esto serializa las reservas del mismo slot.
      const lockKey = this.generateLockKey(dto.tenantId, dto.date, dto.startTime);

      await tx.$queryRaw`SELECT pg_advisory_xact_lock(${lockKey})`;

      // 2. Verificar que el slot siga disponible
      const existingAppointment = await tx.appointment.findFirst({
        where: {
          tenantId: dto.tenantId,
          date: dto.date,
          startTime: dto.startTime,
          status: {
            notIn: ['CANCELLED_PATIENT', 'CANCELLED_DOCTOR'],
          },
        },
      });

      if (existingAppointment) {
        throw new ConflictException(
          'Este horario ya no esta disponible. Por favor seleccione otro.',
        );
      }

      // 3. Verificar que la fecha no este bloqueada
      const override = await tx.scheduleOverride.findUnique({
        where: {
          tenantId_date: {
            tenantId: dto.tenantId,
            date: dto.date,
          },
        },
      });

      if (override?.isBlocked) {
        throw new BadRequestException(
          'El medico no atiende en esta fecha.',
        );
      }

      // 4. Crear o recuperar paciente
      const patient = await this.findOrCreatePatient(tx, dto);

      // 5. Crear la cita
      const appointment = await tx.appointment.create({
        data: {
          tenantId: dto.tenantId,
          patientId: patient.id,
          date: dto.date,
          startTime: dto.startTime,
          endTime: dto.endTime,
          status: 'CONFIRMED', // Auto-confirmar (o PENDING si el medico quiere aprobar)
          type: dto.type || 'FIRST_VISIT',
          notes: dto.notes,
        },
        include: { patient: true },
      });

      // 6. Crear relacion tenant-paciente si no existe
      await tx.tenantPatient.upsert({
        where: {
          tenantId_patientId: {
            tenantId: dto.tenantId,
            patientId: patient.id,
          },
        },
        create: {
          tenantId: dto.tenantId,
          patientId: patient.id,
        },
        update: {},
      });

      return appointment;
    }, {
      isolationLevel: 'Serializable', // Maximo nivel de aislamiento
      timeout: 10000, // 10 segundos max
    });
  }

  /**
   * Genera una clave numerica unica para el advisory lock
   * basada en tenant + fecha + hora
   */
  private generateLockKey(tenantId: string, date: Date, startTime: string): number {
    const str = `${tenantId}-${date.toISOString().split('T')[0]}-${startTime}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private async findOrCreatePatient(
    tx: PrismaTransactionClient,
    dto: BookAppointmentDto,
  ): Promise<Patient> {
    return tx.patient.upsert({
      where: { phone: dto.patientPhone },
      create: {
        phone: dto.patientPhone,
        name: dto.patientName,
        email: dto.patientEmail,
      },
      update: {
        name: dto.patientName, // Actualizar nombre si cambio
        email: dto.patientEmail || undefined,
      },
    });
  }
}
```

**Diagrama de secuencia del bloqueo:**

```
Paciente A                 Paciente B               PostgreSQL
    |                          |                         |
    | book(slot 9:00)         |                         |
    |------------------------->|                         |
    |                          | book(slot 9:00)         |
    |                          |------------------------>|
    |    BEGIN TX               |                         |
    |    pg_advisory_xact_lock  |    BEGIN TX              |
    |    (obtiene lock)         |    pg_advisory_xact_lock |
    |-------------------------->|    (ESPERA...)           |
    |                           |                         |
    |    SELECT (slot libre)    |                         |
    |    INSERT appointment     |                         |
    |    COMMIT                 |                         |
    |<--------------------------|                         |
    |                           |    (lock liberado)      |
    |    OK: cita creada        |    SELECT (slot OCUPADO)|
    |                           |    ROLLBACK             |
    |                           |<------------------------|
    |                           |    ERROR: slot no disponible
```

### 8.3 Notificaciones sin Spam

**Reglas de negocio para evitar spam:**

```typescript
// apps/api/src/modules/notifications/notification.rules.ts

export class NotificationRules {
  /**
   * Maximo de notificaciones por paciente por dia por canal
   */
  static readonly MAX_PER_DAY = {
    SMS: 3,
    WHATSAPP: 3,
    EMAIL: 5,
    PUSH: 5,
  };

  /**
   * Horario permitido para enviar notificaciones en RD
   * No enviar entre 9 PM y 7 AM
   */
  static readonly QUIET_HOURS = {
    start: 21, // 9:00 PM
    end: 7,    // 7:00 AM
  };

  /**
   * Tiempo minimo entre notificaciones al mismo paciente
   */
  static readonly MIN_INTERVAL_MINUTES = 30;

  /**
   * No enviar recordatorio si la cita es en menos de 30 minutos
   * (el paciente probablemente ya esta en camino)
   */
  static readonly MIN_REMINDER_BEFORE_MINUTES = 30;

  /**
   * No enviar recordatorio 24h si la cita fue agendada
   * hace menos de 2 horas (ya recibio la confirmacion)
   */
  static readonly SKIP_24H_IF_BOOKED_WITHIN_HOURS = 2;
}

@Injectable()
export class NotificationGuard {
  constructor(private readonly prisma: PrismaService) {}

  async canSend(patientId: string, channel: NotificationChannel): Promise<boolean> {
    const now = TimezoneUtil.nowInRD();
    const hour = now.getHours();

    // 1. Respetar horario silencioso
    if (hour >= NotificationRules.QUIET_HOURS.start ||
        hour < NotificationRules.QUIET_HOURS.end) {
      return false;
    }

    // 2. Verificar limite diario
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const countToday = await this.prisma.notification.count({
      where: {
        patientId,
        channel,
        sentAt: { gte: todayStart, lte: todayEnd },
        status: { in: ['SENT', 'DELIVERED'] },
      },
    });

    if (countToday >= NotificationRules.MAX_PER_DAY[channel]) {
      return false;
    }

    // 3. Verificar intervalo minimo
    const lastNotif = await this.prisma.notification.findFirst({
      where: {
        patientId,
        channel,
        status: { in: ['SENT', 'DELIVERED'] },
      },
      orderBy: { sentAt: 'desc' },
    });

    if (lastNotif?.sentAt) {
      const minutesSinceLast = differenceInMinutes(now, lastNotif.sentAt);
      if (minutesSinceLast < NotificationRules.MIN_INTERVAL_MINUTES) {
        return false;
      }
    }

    return true;
  }
}
```

### 8.4 Escalabilidad Multi-Tenant

#### Estrategia de Cache con Redis

```typescript
// apps/api/src/modules/cache/cache.service.ts

@Injectable()
export class CacheService {
  constructor(private readonly redis: Redis) {}

  /**
   * Cache de slots disponibles por medico/fecha
   * TTL corto: 60 segundos (los slots cambian frecuentemente)
   */
  async getAvailableSlots(tenantId: string, date: string): Promise<string[] | null> {
    const key = `slots:${tenantId}:${date}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async setAvailableSlots(tenantId: string, date: string, slots: string[]): Promise<void> {
    const key = `slots:${tenantId}:${date}`;
    await this.redis.set(key, JSON.stringify(slots), 'EX', 60);
  }

  /**
   * Invalidar cache cuando se crea/cancela una cita
   */
  async invalidateSlots(tenantId: string, date: string): Promise<void> {
    const key = `slots:${tenantId}:${date}`;
    await this.redis.del(key);
  }

  /**
   * Cache de perfil publico del medico
   * TTL largo: 1 hora (cambia raramente)
   */
  async getDoctorProfile(slug: string): Promise<DoctorPublicProfile | null> {
    const key = `doctor:${slug}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async setDoctorProfile(slug: string, profile: DoctorPublicProfile): Promise<void> {
    const key = `doctor:${slug}`;
    await this.redis.set(key, JSON.stringify(profile), 'EX', 3600);
  }
}
```

#### Connection Pooling

```typescript
// apps/api/src/common/database/prisma.service.ts

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      // Connection pool optimizado para multi-tenant
      // Railway PostgreSQL permite hasta 97 conexiones
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}

// En DATABASE_URL agregar parametros de pool:
// postgresql://...?connection_limit=20&pool_timeout=10
```

#### Rate Limiting por Tenant

```typescript
// apps/api/src/common/guards/rate-limit.guard.ts

@Injectable()
export class TenantRateLimitGuard implements CanActivate {
  constructor(private readonly redis: Redis) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request['tenantId'] || request.ip;

    const key = `ratelimit:${tenantId}:${Math.floor(Date.now() / 60000)}`;
    const count = await this.redis.incr(key);

    if (count === 1) {
      await this.redis.expire(key, 60);
    }

    // 100 requests por minuto por tenant
    if (count > 100) {
      throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }
}
```

### 8.5 Performance con Muchos Medicos

#### Busqueda Optimizada de Medicos

```typescript
// apps/api/src/modules/doctors/doctors.service.ts

async searchDoctors(params: SearchDoctorsDto) {
  const { query, specialty, city, lat, lng, radius, page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;

  // Busqueda combinada: full-text + filtros + geo
  const doctors = await this.prisma.$queryRaw`
    WITH filtered_doctors AS (
      SELECT
        dp.*,
        t.slug,
        t.name as tenant_name,
        t.is_active,
        ${lat && lng ? Prisma.sql`
          earth_distance(
            ll_to_earth(${lat}, ${lng}),
            ll_to_earth(dp.latitude, dp.longitude)
          ) / 1000 as distance_km,
        ` : Prisma.sql`NULL as distance_km,`}
        ${query ? Prisma.sql`
          ts_rank(
            to_tsvector('spanish', dp.specialty || ' ' || COALESCE(dp.bio, '')),
            plainto_tsquery('spanish', ${query})
          ) as search_rank
        ` : Prisma.sql`0 as search_rank`}
      FROM doctor_profiles dp
      JOIN tenants t ON t.id = dp.tenant_id
      WHERE t.is_active = true
        AND dp.is_public_visible = true
        ${specialty ? Prisma.sql`AND dp.specialty = ${specialty}` : Prisma.empty}
        ${city ? Prisma.sql`AND dp.city = ${city}` : Prisma.empty}
        ${query ? Prisma.sql`
          AND to_tsvector('spanish', dp.specialty || ' ' || COALESCE(dp.bio, ''))
              @@ plainto_tsquery('spanish', ${query})
        ` : Prisma.empty}
        ${lat && lng && radius ? Prisma.sql`
          AND earth_distance(
            ll_to_earth(${lat}, ${lng}),
            ll_to_earth(dp.latitude, dp.longitude)
          ) < ${radius * 1000}
        ` : Prisma.empty}
    )
    SELECT *
    FROM filtered_doctors
    ORDER BY
      ${lat && lng ? Prisma.sql`distance_km ASC,` : Prisma.empty}
      ${query ? Prisma.sql`search_rank DESC,` : Prisma.empty}
      rating_avg DESC,
      total_reviews DESC
    LIMIT ${limit}
    OFFSET ${offset};
  `;

  return doctors;
}
```

#### Paginacion Eficiente

```typescript
// Usar cursor-based pagination para listas largas
async getAppointments(tenantId: string, params: PaginationDto) {
  const { cursor, limit = 20, date, status } = params;

  const appointments = await this.prisma.appointment.findMany({
    where: {
      tenantId,
      ...(date && { date }),
      ...(status && { status }),
      ...(cursor && { id: { lt: cursor } }),
    },
    orderBy: [
      { date: 'desc' },
      { startTime: 'asc' },
    ],
    take: limit + 1, // +1 para saber si hay mas
    include: {
      patient: {
        select: { id: true, name: true, phone: true },
      },
    },
  });

  const hasMore = appointments.length > limit;
  const items = hasMore ? appointments.slice(0, limit) : appointments;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return { items, hasMore, nextCursor };
}
```

### 8.6 Seguridad

```typescript
// Medidas de seguridad implementadas en cada capa

// 1. CORS estricto
// apps/api/src/main.ts
app.enableCors({
  origin: [
    'https://turnomedico.com',
    'https://www.turnomedico.com',
    /\.turnomedico\.com$/,
  ],
  credentials: true,
});

// 2. Helmet para headers de seguridad
app.use(helmet());

// 3. Rate limiting global
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000, // 1000 requests por IP
  }),
);

// 4. Validacion de entrada con class-validator
// Todos los DTOs se validan automaticamente con el ValidationPipe global
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,          // Strip propiedades no declaradas
  forbidNonWhitelisted: true, // Error si hay propiedades extra
  transform: true,          // Transformar tipos automaticamente
}));

// 5. Sanitizacion de SQL (Prisma lo maneja automaticamente con parametros)
// 6. XSS prevention (Next.js lo maneja con escape automatico en JSX)
// 7. CSRF tokens para formularios

// 8. Encriptacion de datos sensibles
// apps/api/src/common/utils/encryption.util.ts
import * as bcrypt from 'bcrypt';

export class EncryptionUtil {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
```

### 8.7 Manejo de Errores Centralizado

```typescript
// apps/api/src/common/filters/http-exception.filter.ts

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      message = typeof exResponse === 'string'
        ? exResponse
        : (exResponse as any).message || message;
      code = (exResponse as any).code || this.getCodeFromStatus(status);
    }

    // Log del error (Sentry captura automaticamente los 5xx)
    if (status >= 500) {
      this.logger.error(`[${request.method}] ${request.url}`, exception);
    }

    response.status(status).json({
      success: false,
      data: null,
      error: {
        code,
        message,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }
}
```

### 8.8 Estrategia de Backups

```
PostgreSQL (Railway):
  - Backups automaticos diarios (incluido en Railway Pro)
  - Point-in-time recovery hasta 7 dias
  - Backup manual antes de migraciones criticas

Redis (Upstash):
  - Datos efimeros (cache, sesiones) - no requiere backup
  - Si se pierde, se reconstruye automaticamente

Archivos (Cloudflare R2):
  - Redundancia multi-region incluida
  - Versionado de objetos habilitado

Codigo:
  - Git (GitHub) con proteccion de rama main
  - Tags de version para cada release
```

### 8.9 Monitoreo y Alertas

```
+-------------------------------------------------------------------+
|                    STACK DE MONITOREO                               |
+-------------------------------------------------------------------+
|                                                                    |
|  ERRORES             PERFORMANCE           NEGOCIO                 |
|  +----------------+  +----------------+    +-------------------+   |
|  | Sentry         |  | Vercel         |    | Metricas custom   |   |
|  | - Errors FE    |  | Analytics      |    | - Citas/dia       |   |
|  | - Errors BE    |  | - Web Vitals   |    | - No-shows rate   |   |
|  | - Source maps  |  | - TTFB, LCP    |    | - Conversion rate |   |
|  | - Alertas      |  | - CLS, FID     |    | - Revenue MRR     |   |
|  | - Slack notif  |  +----------------+    +-------------------+   |
|  +----------------+  | Railway        |                            |
|                      | Metrics        |    ALERTAS                 |
|  UPTIME              | - CPU, Memory  |    +-------------------+   |
|  +----------------+  | - Disk, Network|    | Condiciones:      |   |
|  | UptimeRobot    |  +----------------+    | - API down > 1min |   |
|  | - Ping cada    |                        | - Error rate > 5% |   |
|  |   1 minuto     |                        | - CPU > 80%       |   |
|  | - Alertas SMS  |                        | - DB connections  |   |
|  | - Status page  |                        |   > 80%           |   |
|  +----------------+                        | Canal: Slack +    |   |
|                                            |   Email           |   |
|                                            +-------------------+   |
+-------------------------------------------------------------------+
```

### 8.10 Estructura de Carpetas Detallada del Backend

```
apps/api/
|-- src/
|   |-- main.ts                          # Bootstrap de la aplicacion
|   |-- app.module.ts                    # Modulo raiz
|   |
|   |-- common/
|   |   |-- decorators/
|   |   |   |-- tenant.decorator.ts      # @CurrentTenant()
|   |   |   |-- user.decorator.ts        # @CurrentUser()
|   |   |   |-- roles.decorator.ts       # @Roles('DOCTOR', 'SECRETARY')
|   |   |-- filters/
|   |   |   |-- http-exception.filter.ts
|   |   |-- guards/
|   |   |   |-- jwt-auth.guard.ts
|   |   |   |-- roles.guard.ts
|   |   |   |-- tenant.guard.ts
|   |   |   |-- rate-limit.guard.ts
|   |   |   |-- subscription.guard.ts   # Verifica plan activo
|   |   |-- interceptors/
|   |   |   |-- response.interceptor.ts  # Formato estandar de respuesta
|   |   |   |-- logging.interceptor.ts
|   |   |-- middleware/
|   |   |   |-- tenant.middleware.ts
|   |   |-- pipes/
|   |   |   |-- parse-date.pipe.ts
|   |   |-- utils/
|   |       |-- timezone.util.ts
|   |       |-- encryption.util.ts
|   |       |-- phone.util.ts           # Formateo de telefonos RD
|   |
|   |-- modules/
|   |   |-- auth/
|   |   |   |-- auth.module.ts
|   |   |   |-- auth.controller.ts
|   |   |   |-- auth.service.ts
|   |   |   |-- strategies/
|   |   |   |   |-- jwt.strategy.ts
|   |   |   |   |-- otp.strategy.ts     # Login paciente con OTP
|   |   |   |-- dto/
|   |   |       |-- login.dto.ts
|   |   |       |-- register.dto.ts
|   |   |       |-- otp-request.dto.ts
|   |   |
|   |   |-- tenants/
|   |   |   |-- tenants.module.ts
|   |   |   |-- tenants.controller.ts
|   |   |   |-- tenants.service.ts
|   |   |
|   |   |-- appointments/
|   |   |   |-- appointments.module.ts
|   |   |   |-- appointments.controller.ts      # Dashboard endpoints
|   |   |   |-- appointments.service.ts
|   |   |   |-- appointments-public.controller.ts # Portal paciente
|   |   |   |-- dto/
|   |   |   |   |-- book-appointment.dto.ts
|   |   |   |   |-- update-status.dto.ts
|   |   |   |-- validators/
|   |   |       |-- slot-available.validator.ts
|   |   |
|   |   |-- schedules/
|   |   |   |-- schedules.module.ts
|   |   |   |-- schedules.controller.ts
|   |   |   |-- schedules.service.ts
|   |   |   |-- slot-calculator.service.ts   # Logica de calculo de slots
|   |   |
|   |   |-- patients/
|   |   |   |-- patients.module.ts
|   |   |   |-- patients.controller.ts
|   |   |   |-- patients.service.ts
|   |   |
|   |   |-- doctors/
|   |   |   |-- doctors.module.ts
|   |   |   |-- doctors.controller.ts        # Perfil publico
|   |   |   |-- doctors.service.ts
|   |   |
|   |   |-- notifications/
|   |   |   |-- notifications.module.ts
|   |   |   |-- notification.service.ts      # Orquestador
|   |   |   |-- notification.processor.ts    # Bull worker
|   |   |   |-- notification.guard.ts        # Anti-spam
|   |   |   |-- reminder.scheduler.ts        # Cron jobs
|   |   |   |-- channels/
|   |   |   |   |-- sms.service.ts
|   |   |   |   |-- whatsapp.service.ts
|   |   |   |   |-- email.service.ts
|   |   |   |-- templates/
|   |   |       |-- sms.templates.ts
|   |   |       |-- whatsapp.templates.ts
|   |   |
|   |   |-- billing/
|   |   |   |-- billing.module.ts
|   |   |   |-- billing.controller.ts
|   |   |   |-- billing.service.ts
|   |   |   |-- stripe-webhook.controller.ts
|   |   |
|   |   |-- reviews/
|   |   |   |-- reviews.module.ts
|   |   |   |-- reviews.controller.ts
|   |   |   |-- reviews.service.ts
|   |   |
|   |   |-- analytics/
|   |   |   |-- analytics.module.ts
|   |   |   |-- analytics.controller.ts
|   |   |   |-- analytics.service.ts
|   |   |
|   |   |-- admin/
|   |   |   |-- admin.module.ts
|   |   |   |-- admin.controller.ts
|   |   |   |-- admin.service.ts
|   |   |
|   |   |-- display/                         # Pantalla sala de espera
|   |   |   |-- display.module.ts
|   |   |   |-- display.controller.ts        # REST: config inicial
|   |   |   |-- queue.gateway.ts             # WebSocket gateway
|   |   |   |-- queue.service.ts             # Logica de cola
|   |   |
|   |   |-- cache/
|   |       |-- cache.module.ts
|   |       |-- cache.service.ts
|   |
|   |-- database/
|       |-- prisma.module.ts
|       |-- prisma.service.ts
|
|-- test/
|   |-- e2e/
|   |   |-- appointments.e2e-spec.ts
|   |   |-- auth.e2e-spec.ts
|   |-- unit/
|       |-- slot-calculator.spec.ts
|       |-- notification-guard.spec.ts
|
|-- nest-cli.json
|-- tsconfig.json
```

---

## Apendice A: Checklist Pre-Lanzamiento

```
[ ] SSL/TLS configurado en todos los dominios
[ ] Variables de entorno en Railway/Vercel (no en codigo)
[ ] Backups de BD verificados y restauracion probada
[ ] Rate limiting activo en API publica
[ ] Sentry configurado con alertas a Slack
[ ] UptimeRobot monitoreando endpoints criticos
[ ] Templates de WhatsApp aprobados por Meta
[ ] Numero de Twilio activo para RD
[ ] Stripe en modo produccion (salir de test mode)
[ ] Google Maps API key restringida por dominio
[ ] robots.txt y sitemap.xml configurados
[ ] Meta tags y Open Graph para SEO
[ ] Politica de privacidad y terminos de servicio
[ ] Flujo de onboarding probado end-to-end
[ ] Performance: LCP < 2.5s, FID < 100ms, CLS < 0.1
[ ] Responsive testing en dispositivos moviles (Android/iOS)
[ ] Prueba en Smart TV (pantalla sala de espera)
[ ] Pruebas con 3-5 medicos reales (beta testers)
```

## Apendice B: Variables de Entorno

```env
# ============================================================
# API (Railway)
# ============================================================
NODE_ENV=production
PORT=3000
API_URL=https://api.turnomedico.com

# Base de datos
DATABASE_URL=postgresql://user:pass@host:5432/turnomedico?schema=public

# Redis
REDIS_URL=redis://default:pass@host:6379

# JWT
JWT_SECRET=<random-64-char-string>
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=<random-64-char-string>
JWT_REFRESH_EXPIRATION=7d

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+18095551234
TWILIO_WHATSAPP_NUMBER=+14155238886

# Resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Stripe
STRIPE_SECRET_KEY=<tu_stripe_secret_key>
STRIPE_WEBHOOK_SECRET=<tu_stripe_webhook_secret>

# Cloudflare R2
R2_ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_BUCKET=turnomedico-uploads

# Sentry
SENTRY_DSN=https://xxxx@sentry.io/xxxx

# Google Maps
GOOGLE_MAPS_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ============================================================
# Frontend (Vercel)
# ============================================================
NEXT_PUBLIC_API_URL=https://api.turnomedico.com
NEXT_PUBLIC_WS_URL=wss://api.turnomedico.com
NEXT_PUBLIC_GOOGLE_MAPS_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_SENTRY_DSN=https://xxxx@sentry.io/xxxx
```

---

*Documento generado para el proyecto TurnoMedico RD.*
*Ultima actualizacion: 2026-02-26*
