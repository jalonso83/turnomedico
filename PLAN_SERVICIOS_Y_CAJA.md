# Plan: catálogo de servicios, seguimiento, facturación por líneas y cierre de caja

Fecha: 2026-08-09
Estado: decisiones tomadas, listo para implementar

---

## 1. Qué pide el negocio

1. Un **catálogo propio de servicios con precios** (curación, sutura, retiro de puntos, electrocardiograma, papanicolau, etc.).
2. Que al **facturar** se puedan añadir servicios del catálogo a la consulta, con cantidades.
3. Un **motivo de cita "Seguimiento"**, y que el doctor pueda **agendar el seguimiento durante la consulta** ("te veo el día tal").
4. Un **cierre de caja diario** y ver la **facturación por días**.

---

## 2. Estado actual (verificado en código, 2026-08-09)

| Pieza | Dónde | Situación |
|---|---|---|
| Modelo de cobro | `schema.prisma:649` `ConsultationPayment` | Plano: `fee`, `cashAmount`, `insuranceId`, `insuranceAmount`, `isCourtesy`. 1:1 con Appointment (`appointmentId @unique`). Un solo concepto por cita. |
| API de cobro | `payments.controller.ts` | `GET/POST /dashboard/appointments/:id/payment` y `GET /dashboard/cash/today`. |
| Resumen de caja | `payments.service.ts:134` | Solo un día. No persiste nada, recalcula en cada request. |
| Modal de cobro | `frontend/src/components/PaymentModal.tsx` (305 líneas) | Un solo monto. **Propone siempre la tarifa completa, sin mirar el motivo de la cita.** |
| Página de caja | `dashboard/caja/page.tsx` (208 líneas) | KPIs de un día con selector de fecha. Sin histórico. |
| Catálogo de servicios | — | **No existe.** Cero referencias en el esquema. |
| Motivo de cita | `AppointmentReason` = `CONSULTATION` \| `RESULTS_DELIVERY` | Cableado de punta a punta: reserva pública, agenda, KPIs, badges, historial. |
| Tipo de cita | `AppointmentType` = `FIRST_VISIT` \| `FOLLOW_UP` \| `EMERGENCY` | **Código muerto.** Tiene columna en la base, pero se escribe siempre `'FIRST_VISIT'` (`appointments.service.ts:267` y `:403`) y no se lee nunca. Cero usos en el frontend. |
| Crear cita futura desde el dashboard | — | **No existe.** El controller solo tiene `GET today`, `PUT :id/status`, `POST walk-in` (hoy y a la hora actual) y los de entrada/salida del consultorio. Lo único que crea citas futuras es `POST /appointments/book/:slug`, que es **público, sin autenticación** y resuelve al paciente por nombre y teléfono en vez de por `patientId`. |

**Migraciones:** el proyecto usa `prisma db push`. Solo existe la migración `20260414172243_init`. Correr `migrate dev` arriesga un reset de la base en Railway.

---

## 3. Decisiones tomadas

| # | Decisión | Resuelto |
|---|---|---|
| ~~D1~~ | ~~Los servicios los paga 100 % el paciente.~~ **Anulada el 2026-08-09.** Los doctores piden tarifa por ARS también en los servicios, igual que ya existe para la consulta. Ver D1b | Reemplazada |
| D1b | Cada servicio puede tener **tarifa pactada por ARS** (`ServiceInsurance`), con la misma forma que `DoctorInsurance`: cuánto pone el paciente y cuánto aporta la ARS. En la pantalla del servicio solo se listan las ARS que el doctor ya aceptó en su configuración. Dejar en blanco significa que esa ARS no cubre ese servicio, así que lo paga completo el paciente | Sí |
| D2 | `FOLLOW_UP` entra como tercer valor de `AppointmentReason` (una sola etiqueta con tres opciones), **no** se revive `AppointmentType`. | Sí |
| D2b | El seguimiento **no se cobra si ocurre dentro de los 30 días** de su consulta de origen. | Sí |
| D3 | Cerrar la caja **bloquea la edición** de los cobros de ese día. El doctor puede reabrir. | Sí |
| D4 | Orden de fases. | Pendiente (propuesta abajo) |
| D5 | ¿La entrega de resultados debe proponer RD$0 por defecto? | Pendiente |

---

## 4. Modelo de datos

### 4.1. `Service` (catálogo por doctor)

```prisma
model Service {
  id          String   @id @default(cuid())
  tenantId    String   @map("tenant_id")
  tenant      Tenant   @relation(fields: [tenantId], references: [id])

  name        String   @db.VarChar(150)
  description String?  @db.Text
  price       Float
  currency    String   @default("DOP") @db.VarChar(3)
  category    String?  @db.VarChar(80)
  isActive    Boolean  @default(true) @map("is_active")
  sortOrder   Int      @default(0) @map("sort_order")

  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  items       PaymentItem[]
  insurances  ServiceInsurance[]

  @@index([tenantId, isActive, sortOrder])
  @@map("services")
}
```

`price` es el precio de lista, o sea lo que paga quien viene sin seguro.

Va por `tenantId` y no por `doctorProfileId`, para ser consistente con `ConsultationPayment`.

### 4.1b. `ServiceInsurance` (tarifa pactada por servicio y ARS)

Espejo exacto de `DoctorInsurance`, que es como ya se maneja la tarifa de la consulta:

```prisma
model ServiceInsurance {
  serviceId   String    @map("service_id")
  insuranceId String    @map("insurance_id")
  service     Service   @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  insurance   Insurance @relation(fields: [insuranceId], references: [id], onDelete: Cascade)

  patientCopay      Float? @map("patient_copay")      // efectivo que pone el paciente
  insuranceCoverage Float? @map("insurance_coverage") // aporte de la ARS

  createdAt DateTime @default(now()) @map("created_at")

  @@id([serviceId, insuranceId])
  @@index([insuranceId])
  @@map("service_insurances")
}
```

`Insurance` gana la relación inversa `services ServiceInsurance[]`.

Ejemplo: "Electrocardiograma" con precio de lista RD$1,500. Con Humano el paciente pone RD$300 y la ARS RD$1,200. Con Senasa el paciente RD$500 y la ARS RD$800. Sin seguro, RD$1,500 completos.

**Si un servicio no tiene fila para la ARS de la cita**, se cobra el precio de lista al paciente y la ARS aporta cero. Es el mismo comportamiento que hoy tiene el modal cuando la ARS no tiene tarifa de consulta configurada: avisa y deja ajustar a mano.

**Sobre la carga de datos:** un doctor con 12 servicios y 8 ARS tendría 96 combinaciones. Para que sea usable, la pantalla del servicio lista **solo las ARS que el doctor ya aceptó** en `/dashboard/perfil` (las de `DoctorInsurance`), no el catálogo global, y ofrece un atajo para llenar por porcentaje del precio de lista.

### 4.2. `PaymentItem` (líneas de la factura)

```prisma
enum PaymentItemKind { CONSULTATION SERVICE OTHER }

model PaymentItem {
  id          String  @id @default(cuid())
  paymentId   String  @map("payment_id")
  payment     ConsultationPayment @relation(fields: [paymentId], references: [id], onDelete: Cascade)

  kind        PaymentItemKind @default(SERVICE)
  serviceId   String?  @map("service_id")
  service     Service? @relation(fields: [serviceId], references: [id])

  // SNAPSHOT: nombre y precio congelados al facturar.
  description String   @db.VarChar(200)
  unitPrice   Float    @map("unit_price")
  quantity    Int      @default(1)

  cashAmount      Float @default(0) @map("cash_amount")
  insuranceAmount Float @default(0) @map("insurance_amount")

  sortOrder   Int      @default(0) @map("sort_order")
  createdAt   DateTime @default(now()) @map("created_at")

  @@index([paymentId])
  @@index([serviceId])
  @@map("payment_items")
}
```

**El snapshot no es opcional.** Si el doctor sube el electrocardiograma de RD$800 a RD$1,200, las facturas de ayer deben seguir diciendo RD$800. Por eso el nombre y el precio se copian en la línea y `serviceId` queda solo como referencia de origen. Además permite desactivar un servicio sin romper el histórico.

### 4.3. Cambios en `ConsultationPayment`

Los tres campos actuales se conservan y pasan a ser **totales derivados** de las líneas (`fee`, `cashAmount`, `insuranceAmount`). Se recalculan **en el servidor**, dentro de la transacción del upsert. El cliente nunca los envía como verdad.

Mantenerlos evita tocar `getCashSummary()` y el desglose `byInsurance[]`: siguen leyendo la cabecera. El radio de impacto queda contenido.

Campos nuevos:

```prisma
  paymentMethod PaymentMethod @default(CASH) @map("payment_method")
  closingId     String?       @map("closing_id")

enum PaymentMethod { CASH TRANSFER CARD MIXED }
```

### 4.4. Cambios en `Appointment`

```prisma
enum AppointmentReason { CONSULTATION RESULTS_DELIVERY FOLLOW_UP }   // + FOLLOW_UP

model Appointment {
  // ...
  parentAppointmentId String?       @map("parent_appointment_id")
  parentAppointment   Appointment?  @relation("FollowUps", fields: [parentAppointmentId], references: [id])
  followUps           Appointment[] @relation("FollowUps")

  @@index([parentAppointmentId])
}
```

Se **elimina** el enum `AppointmentType` y la columna `type`. Es seguro: la columna vale `'FIRST_VISIT'` en el 100 % de las filas porque está hardcodeada en las dos rutas de creación, así que no se pierde información.

### 4.5. Cambios en `DoctorProfile`

```prisma
  followUpFreeDays Int    @default(30) @map("follow_up_free_days")
  followUpFee      Float? @map("follow_up_fee")   // se cobra solo si excede la ventana
```

### 4.6. `CashClosing`

```prisma
model CashClosing {
  id        String   @id @default(cuid())
  tenantId  String   @map("tenant_id")
  date      DateTime @db.Date

  consultationsTotal Float @default(0) @map("consultations_total")
  servicesTotal      Float @default(0) @map("services_total")
  cashExpected       Float @default(0) @map("cash_expected")
  cashCounted        Float @default(0) @map("cash_counted")
  difference         Float @default(0)
  insuranceTotal     Float @default(0) @map("insurance_total")

  closedById String?  @map("closed_by_id")
  closedAt   DateTime @default(now()) @map("closed_at")
  notes      String?  @db.Text

  payments   ConsultationPayment[]

  @@unique([tenantId, date])
  @@map("cash_closings")
}
```

---

## 5. Fases

El orden pone el seguimiento **antes** de la facturación a propósito: así el `PaymentModal` se reescribe **una sola vez**, incorporando de golpe las líneas de servicio y el precio según motivo.

### Fase 1 — Catálogo de servicios

**Backend**
- Modelos `Service` y `ServiceInsurance`, aplicar con `npx prisma db push`.
- Módulo nuevo `backend/src/modules/services/`, registrado en `app.module.ts`.
- `GET /dashboard/services` para DOCTOR y SECRETARY (ella necesita verlos para facturar). Devuelve cada servicio con sus tarifas por ARS.
- `POST`, `PATCH :id`, `DELETE :id` **solo DOCTOR** (`RolesGuard` + `@Roles('DOCTOR')`): los precios son configuración del negocio, en línea con el modelo de permisos ya acordado.
- `PUT /dashboard/services/:id/insurances` **solo DOCTOR**: reemplaza el conjunto de tarifas del servicio. Valida que cada `insuranceId` esté entre las ARS que el doctor aceptó; si no, 400.
- `DELETE` desactiva (`isActive = false`), no borra: hay líneas históricas apuntando al servicio.
- Validaciones: nombre no vacío, precio ≥ 0, montos ≥ 0, nombre único por tenant entre los activos.

**Frontend**
- Página nueva `/dashboard/servicios`: tabla, alta, edición, activar/desactivar, orden.
- Al abrir un servicio, panel de tarifas con una fila por ARS aceptada: copago del paciente y aporte de la ARS, más el atajo por porcentaje.
- Entrada en el sidebar, oculta para la secretaria.
- Helpers en `lib/api.ts`.

**Verificable:** el doctor da de alta 5 servicios, le pone tarifa a 2 ARS en uno de ellos y lo ve reflejado al reabrir; la secretaria recibe 403 al crear uno.

### Fase 2 — Motivo "Seguimiento" y agendar desde la consulta

**Backend**
- `AppointmentReason` += `FOLLOW_UP`. Eliminar `AppointmentType` y la columna `type`. `db push`.
- `Appointment.parentAppointmentId` con autorrelación.
- Extraer la lógica de disponibilidad que hoy vive dentro del cálculo de slots públicos, para reutilizarla. Hoy está acoplada al flujo público por slug.
- `GET /dashboard/appointments/slots?date=` (autenticado, resuelve el tenant desde el token).
- `POST /dashboard/appointments` (autenticado, DOCTOR y SECRETARY, porque la secretaria gestiona la agenda). Body: `{ patientId, date, startTime, reason, parentAppointmentId?, notes? }`. Valida disponibilidad, día no bloqueado por `ScheduleOverride`, dentro del horario y sin choque de turno.
- **La reserva pública NO ofrece `FOLLOW_UP`.** `BookAppointmentDto` mantiene la validación a `CONSULTATION | RESULTS_DELIVERY`. Si el seguimiento es gratis, permitir que el paciente se autoasigne ese motivo es un hueco que se explota solo.

**Frontend**
- En `dashboard/agenda/[id]/page.tsx` (la consulta): botón **"Agendar seguimiento"** → modal con calendario y slots disponibles → crea la cita con `reason=FOLLOW_UP` y `parentAppointmentId` = la consulta actual.
- Tercer badge y tercer contador en la agenda: `dashboard/page.tsx` (`REASON_CONFIG` en la línea 35, el filtro de la 323 y el KPI de la 420).
- Etiqueta en el historial del paciente: `pacientes/[id]/page.tsx:74`.

**Verificable:** durante una consulta el doctor agenda el seguimiento a 15 días, aparece en la agenda de ese día con su badge, y desde la cita se puede ver de qué consulta salió.

### Fase 3 — Facturación por líneas y precio según motivo

**Backend**
- `PaymentItem` + enum, `db push`.
- `DoctorProfile.followUpFreeDays` (default 30) y `followUpFee`.
- **Script de backfill** `backend/scripts/backfill-payment-items.ts`: por cada `ConsultationPayment` sin líneas, crear una línea `CONSULTATION` con `description: 'Consulta'`, `unitPrice = fee`, `quantity: 1` y el reparto actual. Idempotente.
- `upsertPayment()` recibe `items[]` y corre en `prisma.$transaction`: borra líneas previas, inserta las nuevas, recalcula los tres totales, actualiza la cabecera.
- Reparto: la línea `CONSULTATION` conserva la lógica actual (copago y aporte según `DoctorInsurance`). Cada línea `SERVICE` se reparte según la fila de `ServiceInsurance` que corresponda a la ARS de la cita; si no existe esa fila, va 100 % a `cashAmount` por el precio de lista. Al multiplicar por `quantity`, ambos montos escalan.
- **Precio propuesto según el motivo de la cita** (esto hoy no existe: se propone siempre la tarifa completa):
  - `FOLLOW_UP` con `parentAppointmentId` y diferencia ≤ `followUpFreeDays` → propuesto **0**, y también aporte ARS 0. Editable.
  - `FOLLOW_UP` fuera de la ventana, o sin consulta de origen → `followUpFee ?? consultationFee`.
  - `RESULTS_DELIVERY` → pendiente de D5.
  - `CONSULTATION` → como hoy.
- `getPaymentContext()` devuelve además el catálogo activo, las líneas guardadas y el motivo con su precio propuesto.

**Frontend**
- `PaymentModal.tsx`: sección "Servicios" con selector del catálogo, cantidad, subtotal por línea y quitar. Línea libre para lo que no esté en el catálogo.
- Totales: Consulta + Servicios + Aporte ARS = Total.
- Cuando el seguimiento cae dentro de la ventana, mostrar el motivo: *"Seguimiento dentro de los 30 días, no se cobra la consulta"*.
- Extraer la sección de líneas a `PaymentItemsEditor.tsx`: el modal ya tiene 305 líneas y va a crecer bastante.
- El modal deja de llamarse "Cobrar consulta".

**Verificable:** cobrar una consulta con 2 servicios y reabrir el modal viendo las líneas; cambiar el precio en el catálogo y comprobar que la factura vieja no cambia; cobrar un seguimiento a 15 días y que proponga RD$0; uno a 45 días y que proponga tarifa.

### Fase 4 — Caja por días

**Backend**
- `GET /dashboard/cash/range?from=&to=` → un elemento por día con `{ date, cashTotal, insuranceTotal, consultationsTotal, servicesTotal, total, paidCount, courtesyCount }` más los totales del período.
- Refactor de `getCashSummary()` para que reciba un rango; un día pasa a ser el rango degenerado. Evita duplicar la agregación.
- `consultationsTotal` y `servicesTotal` salen de agrupar `PaymentItem` por `kind`.

**Frontend**
- `caja/page.tsx`: pestañas "Hoy" e "Historial", selector de rango (por defecto 30 días), tabla por día, totales del período y un gráfico de barras.
- Los KPIs del día se abren para distinguir consultas de servicios.

**Verificable:** ver la facturación de un mes por días y que cuadre con la suma de los cobros individuales.

### Fase 5 — Cierre formal

**Backend**
- `CashClosing`, `db push`.
- `POST /dashboard/cash/closing` con `{ date, cashCounted, notes }`: calcula lo esperado, guarda la diferencia, marca los pagos del día con `closingId`. Solo DOCTOR.
- `GET /dashboard/cash/closing?date=`.
- `DELETE /dashboard/cash/closing/:id` para reabrir. Solo DOCTOR, queda registrado.
- **Bloqueo:** `upsertPayment()` lanza 409 si la cita cae en un día ya cerrado.

**Frontend**
- Botón "Cerrar caja" con modal que pide el efectivo contado y muestra la diferencia antes de confirmar.
- Días cerrados marcados; el botón "Cobrar" de la agenda deshabilitado para esas fechas.

**Verificable:** cerrar un día, intentar editar un cobro de ese día y recibir 409.

---

## 6. Riesgos

| Riesgo | Mitigación |
|---|---|
| El backfill corre sobre datos de producción en Railway | Script idempotente (solo toca pagos sin líneas), respaldo previo, probar antes contra una copia |
| Eliminar la columna `type` con `db push` | Verificar antes con un `SELECT DISTINCT type FROM appointments` que solo existe `FIRST_VISIT` |
| Divergencia entre los totales de cabecera y la suma de líneas | Los totales solo se escriben desde el servidor, dentro de la transacción |
| Extraer la disponibilidad del flujo público puede romper la reserva de pacientes | Es el camino de ingreso de citas: probar la reserva pública de punta a punta después del refactor |
| `PaymentModal` va a crecer mucho | Extraer `PaymentItemsEditor.tsx` en la Fase 3 |
| Next.js de este repo tiene breaking changes | Leer `frontend/node_modules/next/dist/docs/` antes de escribir frontend (ver `frontend/AGENTS.md`) |

---

## 7. Fuera de alcance

- Duración por servicio para usarla en la agenda.
- Recibos y comprobantes fiscales (NCF). Es tema de la DGII y merece su propio análisis.
- Devoluciones y anulaciones.
- Inventario o insumos por servicio.
- Reportes por doctor en consultorios multi-médico. El modelo actual es de un doctor por tenant.
