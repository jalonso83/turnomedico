# Actualización de Arquitectura — Sistema de Notificaciones

## Cambio: De WhatsApp API a Push Notifications + SMS Fallback

**Fecha:** Abril 2026
**Motivo:** Reducción de costos operativos. WhatsApp Business API vía Twilio representa un gasto de ~$1,760 USD/mes con 100 médicos activos. La nueva estrategia reduce ese costo a ~$100-150 USD/mes.

---

## 1. Arquitectura de Notificaciones Actualizada

### Diagrama del flujo

```
                    PACIENTE AGENDA CITA
                           |
                    [Cita confirmada]
                           |
              +------------+------------+
              |                         |
        [¿PWA instalada?]        [¿PWA NO instalada?]
              |                         |
        [Push Notification]       [SMS vía Twilio]
         (GRATIS)                  (~$0.008 USD)
              |                         |
              +------------+------------+
                           |
                  [24h antes de la cita]
                           |
              +------------+------------+
              |                         |
        [¿Abrió el push?]        [¿No abrió / No tiene push?]
              |                         |
        [OK - Confirmado]         [SMS fallback]
                                   (~$0.008 USD)
                                        |
                                  [1h antes de la cita]
                                        |
                                  [Push + SMS final]
```

### Stack de notificaciones

| Canal | Tecnología | Costo | Cuándo se usa |
|-------|-----------|-------|---------------|
| **Push Notification** | Firebase Cloud Messaging (FCM) + Apple APNs via OneSignal | **Gratis** (hasta 10K suscriptores) | Canal principal. Confirmación + recordatorio 24h + 1h |
| **SMS** | Twilio | ~$0.008 USD por SMS a RD | Fallback cuando push no llega o PWA no instalada |
| **Email** | AWS SES o Resend | ~$0.001 USD por email | Confirmación + resumen (complementario) |
| **In-App** | WebSocket (Socket.io) | Incluido en hosting | Pantalla sala de espera + "tu turno se acerca" |

### Comparativa de costos (100 médicos activos)

| Escenario | WhatsApp API (anterior) | Push + SMS fallback (nuevo) |
|-----------|------------------------|----------------------------|
| Mensajes/mes (44,000 citas x 2 recordatorios) | 88,000 mensajes | 88,000 notificaciones |
| Costo push | N/A | **$0** |
| Costo SMS (30% fallback) | N/A | ~$105 USD/mes |
| Costo WhatsApp | ~$1,760 USD/mes | $0 |
| Costo email | ~$10 USD/mes | ~$10 USD/mes |
| OneSignal | N/A | $0 (plan gratis) |
| **Total mensual** | **~$1,770 USD** | **~$115 USD** |
| **Ahorro mensual** | — | **$1,655 USD (93%)** |
| **Ahorro anual** | — | **$19,860 USD** |

---

## 2. Estrategia de Inducción de Instalación del PWA

La efectividad de push notifications depende de que el paciente instale la PWA. Sin instalación, en iOS no hay push. La estrategia tiene 5 puntos de contacto para maximizar la tasa de instalación.

### 2.1 Momento post-cita (el más efectivo)

Inmediatamente después de que el paciente agenda su cita, mostrar:

```
+--------------------------------------------------+
|  ✅ ¡Cita confirmada!                             |
|                                                    |
|  Dr. García Pérez — Cardiología                   |
|  Martes 15 de abril, 3:00 PM                      |
|                                                    |
|  📲 Para recibir tu recordatorio automático        |
|  y saber en tiempo real cuándo te toca,            |
|  agrega TurnoMedico a tu pantalla de inicio.       |
|                                                    |
|  [Instalar ahora - Solo toma 10 segundos]          |
|                                                    |
|  (Ahora no, recordarme después)                    |
+--------------------------------------------------+
```

**Tasa esperada de conversión:** 25-35%

### 2.2 Gate de notificaciones

Si el paciente NO instala, en su página de "Mi cita" mostrar un aviso permanente:

```
+--------------------------------------------------+
|  ⚠️ No recibirás recordatorio automático           |
|                                                    |
|  Instala la app para que te avisemos 24h y 1h      |
|  antes de tu cita. Sin instalar, solo recibirás    |
|  un SMS el día de la cita.                         |
|                                                    |
|  [Instalar app]                                    |
+--------------------------------------------------+
```

**Tasa esperada de conversión acumulada:** +10-15%

### 2.3 Tutorial visual por dispositivo

Al tocar "Instalar", detectar el dispositivo y mostrar instrucciones con capturas:

**Android (Chrome):**
```
1. Toca los tres puntos ⋮ arriba a la derecha
2. Selecciona "Instalar aplicación"
3. Confirma tocando "Instalar"
¡Listo! TurnoMedico aparecerá en tu pantalla de inicio.
```

**iPhone (Safari):**
```
1. Toca el ícono de compartir ↑ abajo en el centro
2. Desliza hacia abajo y toca "Agregar a inicio"
3. Toca "Agregar" arriba a la derecha
¡Listo! TurnoMedico aparecerá como app en tu teléfono.
```

### 2.4 Pantalla de sala de espera como gancho

Cuando el paciente llega al consultorio y escanea el QR de llegada:

```
+--------------------------------------------------+
|  ✅ ¡Registraste tu llegada!                       |
|  Posición en la cola: #4                           |
|                                                    |
|  ¿Quieres saber en tiempo real cuándo te toca?     |
|  Instala la app y te avisamos cuando sea tu turno. |
|                                                    |
|  [Instalar y recibir aviso]                        |
+--------------------------------------------------+
```

### 2.5 El médico/secretaria como promotor

Script sugerido para la secretaria al confirmar cita por teléfono:

> "Le voy a enviar un link por SMS para que agregue nuestra app de turnos a su teléfono. Así recibe recordatorio automático y sabe cuándo le toca sin tener que llamar."

### Tasas esperadas de instalación

| Escenario | Sin inducción | Con estrategia completa |
|-----------|--------------|------------------------|
| Instalación PWA | 5-10% | **35-50%** |
| Aceptación de push (de instalados) | 40-60% | **70-85%** |
| **Cobertura push efectiva** | **3-6%** | **25-40%** |
| Resto cubierto por SMS fallback | 94-97% | 60-75% |

**Meta realista:** Que el **35-40% de los pacientes** reciban notificaciones por push (gratis) y el **60-65% restante** reciba SMS fallback (muy barato).

---

## 3. Implementación Técnica

### 3.1 Service Worker (PWA)

```typescript
// public/sw.js
self.addEventListener('push', (event) => {
  const data = event.data?.json();

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
    actions: [
      { action: 'confirm', title: 'Confirmar asistencia' },
      { action: 'cancel', title: 'Cancelar cita' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'confirm') {
    // Llamar API para confirmar asistencia
    event.waitUntil(
      fetch(`/api/appointments/${event.notification.data.appointmentId}/confirm`, {
        method: 'POST',
      })
    );
  }

  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
```

### 3.2 Manifest (PWA)

```json
{
  "name": "TurnoMedico",
  "short_name": "TurnoMedico",
  "description": "Tu turno médico, sin esperas",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0066CC",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### 3.3 Servicio de Notificaciones (Backend)

```typescript
// notification-strategy.service.ts

interface NotificationResult {
  channel: 'push' | 'sms' | 'email';
  sent: boolean;
  cost: number;
}

async function sendAppointmentReminder(
  appointment: Appointment,
  type: '24h' | '1h' | 'confirmation'
): Promise<NotificationResult> {

  const patient = appointment.patient;

  // 1. Intentar push primero (gratis)
  if (patient.pushSubscription) {
    const pushSent = await sendPushNotification(patient.pushSubscription, {
      title: getReminderTitle(type),
      body: getReminderBody(appointment, type),
      url: `/cita/${appointment.id}`,
    });

    if (pushSent) {
      return { channel: 'push', sent: true, cost: 0 };
    }
  }

  // 2. Fallback a SMS
  if (patient.phone) {
    await sendSMS(patient.phone, getReminderSMSText(appointment, type));
    return { channel: 'sms', sent: true, cost: 0.008 };
  }

  // 3. Email como último recurso
  if (patient.email) {
    await sendEmail(patient.email, getReminderEmail(appointment, type));
    return { channel: 'email', sent: true, cost: 0.001 };
  }

  return { channel: 'push', sent: false, cost: 0 };
}
```

### 3.4 Modelo de datos actualizado

Agregar al modelo Patient:

```prisma
model Patient {
  // ... campos existentes

  // Push notification subscription
  pushSubscription    Json?      @map("push_subscription")
  pushEnabled         Boolean    @default(false) @map("push_enabled")
  pwaInstalled        Boolean    @default(false) @map("pwa_installed")

  // Preferencia de notificación
  notificationPreference  String  @default("push") @map("notification_preference")
  // "push" | "sms" | "email"
}
```

Actualizar modelo Notification:

```prisma
model Notification {
  // ... campos existentes

  channel       String    // "push" | "sms" | "email" | "in_app"
  cost          Float     @default(0)  // Costo real del envío
  delivered     Boolean   @default(false)
  opened        Boolean   @default(false)
  fallbackUsed  Boolean   @default(false) @map("fallback_used")
}
```

---

## 4. Secuencia de Notificaciones por Cita

| Momento | Canal primario | Fallback | Contenido |
|---------|---------------|----------|-----------|
| **Cita agendada** | Push + Email | SMS si no tiene push | "Cita confirmada: Dr. García, martes 15 abril 3:00 PM" |
| **24h antes** | Push | SMS si no abrió push en 2h | "Mañana tienes cita con Dr. García a las 3:00 PM. ¿Confirmas?" |
| **1h antes** | Push + SMS | — | "Tu cita con Dr. García es en 1 hora. Dirección: Av. Lincoln #45" |
| **Llegada (QR)** | In-App (WebSocket) | — | "Registraste tu llegada. Posición: #4" |
| **Tu turno** | Push + In-App | SMS | "¡Es tu turno! Pasa al consultorio del Dr. García" |

---

## 5. Métricas a Monitorear

| Métrica | Meta | Herramienta |
|---------|------|-------------|
| Tasa instalación PWA | >35% | Analytics propio |
| Tasa aceptación push | >70% (de instalados) | OneSignal/Firebase |
| Tasa apertura push | >60% | OneSignal/Firebase |
| Tasa de SMS enviados (fallback) | <65% del total | Dashboard interno |
| Costo por notificación promedio | <$0.005 | Dashboard interno |
| Tasa de no-show con notificaciones | <10% (vs 15-20% actual) | Dashboard interno |
| Tasa de confirmación por push | >40% | Analytics propio |

---

## 6. Costos Actualizados de Operación Mensual (Año 1)

| Concepto | Anterior | Actualizado |
|----------|----------|-------------|
| Desarrollador senior | $2,000 | $2,000 |
| Hosting (Railway + Vercel) | $150 | $150 |
| ~~WhatsApp Business API~~ | ~~$100~~ | **$0** |
| Push Notifications (OneSignal) | $0 | **$0** |
| SMS fallback (Twilio) | $50 | **$105** |
| Email (Resend/SES) | $0 | **$10** |
| Herramientas (GitHub, Sentry) | $100 | $100 |
| Marketing digital | $500 | $500 |
| Legal/Contabilidad | $200 | $200 |
| Imprevistos (10%) | $310 | $307 |
| **Total mensual** | **$3,410** | **$3,372** |

**Ahorro en escala (con 100+ médicos):** El ahorro real se nota al escalar. Con el modelo anterior el costo de WhatsApp crecía linealmente con cada médico. Con el nuevo modelo, push es gratis y SMS solo se paga como fallback.

---

## 7. Resumen del Cambio

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| Canal principal | WhatsApp API | Push Notifications (PWA) |
| Canal fallback | SMS | SMS |
| Canal complementario | Email | Email |
| Costo con 100 médicos | ~$1,770/mes | ~$115/mes |
| Dependencia de terceros | Alta (Twilio WhatsApp) | Baja (FCM es gratis) |
| Tasa de entrega | ~98% (WhatsApp) | ~90-95% (push + SMS fallback) |
| Requiere instalación | No | Sí (se induce con estrategia) |
| Interactividad | Baja (solo texto) | Alta (botones: confirmar/cancelar) |

**Trade-off aceptado:** Perdemos ~3-5% de tasa de entrega vs WhatsApp, pero ahorramos ~$19,000 USD/año con 100 médicos. El SMS fallback cubre la brecha.

---

*Documento de actualización arquitectónica. Abril 2026.*
