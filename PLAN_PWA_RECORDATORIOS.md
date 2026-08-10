# Plan: "Instala la app" (PWA) + Recordatorios Push

> Estado: diagnóstico hecho el 2026-06-20. Funcionalidad disparada desde el card
> **"Instala la app — Para recibir recordatorios automáticos de tus citas"** que
> aparece en la pantalla de confirmación de cita del flujo público.

---

## Objetivo

Que el paciente pueda **instalar TurnoMédico como app** en su teléfono y **reciba
recordatorios automáticos** (24h / 1h antes, y el aviso inteligente de "hora de salir")
vía notificaciones push.

---

## Estado actual (qué hay vs qué falta)

| Pieza | Estado | Nota |
|------|--------|------|
| `manifest.json` + íconos PWA | ✅ Bien configurado | `frontend/public/manifest.json`, enlazado en `frontend/src/app/layout.tsx` |
| Service Worker (`sw.js`) | ✅ Escrito pero **inerte** | `frontend/public/sw.js` maneja `push` y `notificationclick`, pero **nunca se registra** |
| Card "Instala la app" | ❌ Solo visual | `frontend/src/app/(public)/doctor/[slug]/page.tsx` (~líneas 399-409), sin `onClick` |
| Registro del Service Worker | ❌ Falta | No hay `navigator.serviceWorker.register('/sw.js')` |
| Captura `beforeinstallprompt` | ❌ Falta | No hay lógica de instalación PWA |
| Pedir permiso + suscribir a push | ❌ Falta | No hay `Notification.requestPermission()` ni `pushManager.subscribe()` |
| Guardar suscripción (backend) | ❌ Falta endpoint | Campos `Patient.pushSubscription/pushEnabled/pwaInstalled` existen en schema pero sin uso |
| Envío real de push (backend) | ❌ Stub | `backend/src/modules/notifications/channels/push.service.ts` siempre devuelve `false` (TODO OneSignal) |
| Modelo `SmartReminder` | ✅ Bien modelado | `backend/prisma/schema.prisma` |
| Lógica de recordatorios | ⚠️ Existe pero no se invoca | `backend/src/modules/smart-reminders/smart-reminders.service.ts`; usa `setTimeout` efímero |
| Hook al agendar cita | ❌ No conectado | `bookAppointment()` no llama a `createSmartReminder()` |
| Scheduler / cron persistente | ❌ Falta | `@nestjs/schedule` instalado pero sin `ScheduleModule.forRoot()` ni `@Cron` |

**Resumen:** la base PWA está, pero nada está conectado todavía.

---

## Decisión técnica

- **Web Push nativo con VAPID** (no OneSignal): gratis, sin terceros, estándar (RFC 8030).
  El `sw.js` ya está escrito para Web Push. Se usará la librería `web-push` en el backend.
- **iOS:** el push web solo funciona si la PWA está **instalada en la pantalla de inicio**
  (iOS 16.4+). En iPhone no existe `beforeinstallprompt`: hay que mostrar instrucciones
  manuales ("Compartir → Agregar a inicio"). En Android/Chrome el prompt es nativo.
- **HTTPS:** requerido para SW y push → ya cubierto (Vercel).

---

## Fase 1 — "Instala la app" funcionando (literal: bajar la app)

Independiente y con valor inmediato. Testeable en producción enseguida.

**Frontend:**
1. Registrar el Service Worker (`navigator.serviceWorker.register('/sw.js')`) — en un
   componente cliente montado en el layout raíz o en un `useEffect` global.
2. Hook/componente de instalación que capture `beforeinstallprompt` (guardar el evento).
3. Hacer el card "Instala la app" interactivo:
   - Android/Chrome con prompt disponible → botón que dispara `prompt()` nativo.
   - iPhone/Safari (o sin prompt) → modal con instrucciones "Compartir → Agregar a inicio".
   - Si ya está instalada (`display-mode: standalone`) → ocultar el card.

**Resultado:** el paciente instala TurnoMédico como app en su teléfono.

---

## Fase 2 — Recordatorios push (suscripción + envío)

**Configuración:**
1. Generar claves **VAPID** (`npx web-push generate-vapid-keys`).
2. Variables de entorno: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
   (en Railway, backend) y `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (en Vercel, frontend).

**Frontend:**
3. Tras instalar / aceptar, pedir permiso (`Notification.requestPermission()`).
4. Suscribir con `pushManager.subscribe({ applicationServerKey: VAPID_PUBLIC_KEY })`.
5. Enviar la suscripción al backend (asociada al paciente de la cita).

**Backend:**
6. `npm install web-push`.
7. Endpoint para guardar la suscripción: `PATCH /api/v1/patients/:id/push-subscription`
   (guarda `pushSubscription` JSON, `pushEnabled=true` en `Patient`).
8. Implementar `PushService.send()` real con `web-push` usando las VAPID keys
   (reemplazar el stub de OneSignal). Mantener el fallback a SMS que ya existe.
9. Endpoint público `POST /api/v1/appointments/:id/confirm` (lo llama el `sw.js` al
   tocar "Confirmar" en la notificación — hoy no existe).

---

## Fase 3 — Programación automática de los recordatorios

**Backend:**
1. Conectar el booking: en `AppointmentsService.bookAppointment()` (o en el controller
   `appointments-public.controller.ts`) llamar a la creación del recordatorio al agendar.
2. Habilitar el scheduler: `ScheduleModule.forRoot()` en `app.module.ts`.
3. Reemplazar los `setTimeout` por un **cron** (`@Cron`) que cada minuto consulte qué
   recordatorios toca enviar (24h antes, 1h antes, "hora de salir") y los despache vía
   `NotificationsService` (push → SMS fallback). Marca `reminderSentAt` para no repetir.
   - Persistente: sobrevive reinicios (lee de BD, no de memoria).
   - Alternativa: cola Bull (ya instalada) + Redis, si se quiere robustez de reintentos.

---

## Notas / dependencias

- Las Fases 2 y 3 son las que hacen cierto el texto "recordatorios automáticos".
- Falta confirmar que existan los íconos reales en `frontend/public/icons/`
  (`icon-192x192.png`, `icon-512x512.png`) referenciados por el manifest.
- Redis solo es necesario si se opta por la cola Bull en la Fase 3 (el cron simple no lo necesita).

---

## Orden recomendado

**Fase 1 → Fase 2 → Fase 3.** Empezar por la Fase 1 (instalar la app), dejarla probada
en producción, y luego push (Fase 2) y la programación automática (Fase 3).
