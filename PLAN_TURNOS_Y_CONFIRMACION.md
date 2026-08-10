# Plan: el turno lo asigna y notifica la secretaria, no la web

Fecha: 2026-08-09
Estado: decisiones tomadas, listo para implementar

---

## 1. Qué piden los doctores

Cuando un paciente reserva por la web:

1. **No mostrarle el número de turno.** El paciente reserva y queda a la espera.
2. La **secretaria ve las citas del día y asigna el orden** ella misma.
3. La secretaria **confirma y le avisa por WhatsApp**: *"tu cita quedó confirmada, eres el 3ro"*.

El límite de cupos por día (por ejemplo, 15) no cambia: sigue siendo `Schedule.maxAppointments` y las citas pendientes siguen ocupando cupo.

---

## 2. Decisiones tomadas

| # | Decisión |
|---|---|
| Canal | **WhatsApp con enlace `wa.me`**: la secretaria pulsa un botón por paciente y se le abre WhatsApp con el mensaje ya escrito. Uno por uno, sin problema |
| Momento | **Asignar el orden y avisar son un solo acto.** No hace falta ningún campo extra: "sin número" ya significa "todavía no se le avisó" |
| Estado | La reserva web crea la cita como `PENDING`. La secretaria la pasa a `CONFIRMED` |

---

## 3. Cómo funciona hoy (verificado en código, 2026-08-09)

### 3.1. La reserva web se autoconfirma y se autoasigna el turno

En `appointments.service.ts:301` `bookAppointment()`:

- Calcula `queuePosition = max + 1` (línea 366).
- Crea la cita con **`status: 'CONFIRMED'`** (línea 402).
- Devuelve `queuePosition` al paciente (línea 415), con el mensaje `'Turno reservado exitosamente'`.

Hoy **nadie confirma nada**: el sistema confirma solo. El estado `PENDING` existe en el enum y hasta es el default del modelo, pero la reserva pública nunca lo usa. O sea, la pieza que hace falta ya está, sin usar.

### 3.2. El número que ve el paciente hoy ya es incorrecto

Este es el hallazgo importante. En `updateStatus()`, cuando la cita pasa a `ARRIVED` (líneas 157-169), **el turno se reasigna**:

```ts
case AppointmentStatusEnum.ARRIVED: {
  updateData.arrivedAt = now;
  const maxQueue = await this.prisma.appointment.aggregate({ ... });
  updateData.queuePosition = (maxQueue._max.queuePosition ?? 0) + 1;
  break;
}
```

El número que se le dio al reservar **no es el número con el que se le atiende**. Quien reservó como #3 y llega de último termina con el número más alto del día.

Mostrarlo hoy no es solo inconveniente: es información falsa. Esta petición corrige un defecto, no solo cambia un flujo.

### 3.3. Dónde se le muestra el turno al paciente

| Lugar | Archivo |
|---|---|
| Confirmación tras reservar | `frontend/src/app/(public)/doctor/[slug]/page.tsx:351-356` ("Tu turno #N") |
| Página de la cita | `frontend/src/app/(public)/cita/[id]/page.tsx:210-215` y `:282-283` |
| API pública | `GET /api/v1/appointments/:id` → `getAppointmentPublic()` devuelve `queuePosition` (`appointments.service.ts:555`) |

### 3.4. La secretaria no tiene con qué ordenar

- **No existe endpoint para cambiar `queuePosition`.** Se asigna solo, en la reserva y al llegar.
- **No existe endpoint para ver la agenda de un día futuro.** El controller del dashboard solo tiene `GET today`, así que no puede preparar mañana.
- El orden de la agenda (`appointments.service.ts:51-74`) usa `queuePosition ?? 999`, con `startTime` de respaldo.

### 3.5. Las notificaciones no existen

| Archivo | Estado |
|---|---|
| `notifications.service.ts` (74 líneas) | Todo TODO |
| `channels/sms.service.ts` | `send()` hace `logger.warn('SMS not implemented yet')` y devuelve `false` |
| `channels/push.service.ts` | `send()` devuelve `false`. OneSignal sin integrar |
| `templates/` | Carpeta vacía |
| Modelo `Notification` | Existe y está completo. **Nadie escribe en él** |

La buena noticia: el modelo `Notification` sirve tal cual para registrar los avisos de WhatsApp. Tiene `type`, `channel`, `status`, `sentAt`, `content` y relación con `appointment` y `patient`. Solo falta agregar `WHATSAPP` al enum `NotificationChannel` (hoy tiene `SMS`, `EMAIL`, `PUSH`, `IN_APP`). El tipo `CONFIRMATION` ya existe.

### 3.6. Datos de contacto

La reserva pide **solo nombre y teléfono** (`book-appointment.dto.ts`). `Patient.email` existe pero el formulario público no lo captura. El teléfono es el único dato confiable, que es justo lo que necesita WhatsApp.

---

## 4. Qué hay que cambiar

### 4.1. La reserva deja de asignar turno y deja de confirmar

En `bookAppointment()`:
- No setear `queuePosition`: queda `null`.
- Crear con `status: 'PENDING'`.
- Quitar `queuePosition` de la respuesta y cambiar el mensaje.

**No rompe el límite de cupos:** el tope se valida con `activeAppointments.length >= schedule.maxAppointments` (línea 357), que cuenta filas, no números. Y `getAvailableSlots()` cuenta por `status notIn [CANCELLED_*, NO_SHOW]`, así que una cita `PENDING` sigue ocupando cupo. El "hoy atiendo 15" se comporta igual que antes.

**Sí hay que ajustar el orden de la agenda:** con `queuePosition ?? 999`, todas las citas sin turno quedan empatadas al final. Cambiar el respaldo a `createdAt`, para que la secretaria las vea en el orden en que entraron las reservas.

**Y hay que arreglar la reasignación en `ARRIVED`** (el defecto de 3.2): asignar turno al llegar **solo si `queuePosition` es null**. Si la secretaria ya ordenó y avisó, que el paciente llegue no puede cambiarle el número.

### 4.2. No hace falta ningún campo nuevo

Como asignar y avisar son un solo acto:

- `queuePosition == null` → todavía no se le avisó. El público muestra "Pendiente de confirmación".
- `queuePosition != null` → ya tiene número y ya se le avisó.

`getAppointmentPublic()` no necesita lógica extra: devuelve `queuePosition` y será `null` mientras esté pendiente. El cambio es solo en el frontend, que debe manejar ese caso.

### 4.3. Regla crítica: un número ya avisado no se cambia

Durante el día entran reservas nuevas para hoy. Si la secretaria vuelve a pulsar "Confirmar y notificar", **los pacientes que ya tienen número deben conservarlo**. A quien ya le dijeron por WhatsApp "eres el 3ro" no se le puede mover.

Por eso la acción de asignar:
- Respeta las posiciones ya asignadas.
- Numera solo las citas con `queuePosition == null`, continuando desde el máximo existente.
- Si la secretaria quiere alterar un orden ya avisado, lo hace explícitamente arrastrando, y la interfaz le advierte a quién habría que volver a avisar.

### 4.4. Endpoints nuevos

Todos con `JwtAuthGuard` + `TenantGuard`, para **DOCTOR y SECRETARY** (ella gestiona la agenda, según el modelo de permisos ya acordado).

| Endpoint | Qué hace |
|---|---|
| `GET /dashboard/appointments/by-date?date=` | Agenda de cualquier día. Hoy solo existe `GET today` |
| `PUT /dashboard/appointments/reorder` | Body `{ date, orderedIds: string[] }`. Asigna `queuePosition` 1..N en transacción, validando que los ids sean del tenant y de esa fecha |
| `POST /dashboard/appointments/confirm-day` | Body `{ date }`. Pasa las `PENDING` a `CONFIRMED`, numera las que no tengan número (respetando las ya asignadas) y devuelve la lista con el mensaje de WhatsApp ya armado y el `wa.me` de cada paciente |
| `POST /dashboard/appointments/:id/notified` | Registra el aviso: crea un `Notification` con `type: CONFIRMATION`, `channel: WHATSAPP`, `status: SENT`, `sentAt` y el `content` enviado |

El último es el que permite que la interfaz muestre a quién ya se le avisó. Con 20 pacientes y clics uno por uno, la secretaria necesita ver dónde se quedó si la interrumpen.

### 4.5. Esquema

Único cambio:

```prisma
enum NotificationChannel { SMS EMAIL PUSH IN_APP WHATSAPP }
```

Aplicar con `npx prisma db push`.

### 4.6. Frontend

**Público**
- `doctor/[slug]/page.tsx`: la confirmación deja de decir "Tu turno #N". Pasa a *"Recibimos tu solicitud. El consultorio la confirmará y te enviará tu número de turno por WhatsApp."* Ojo con la línea 664, que hoy promete *"Al confirmar, te asignaremos un número"*.
- `cita/[id]/page.tsx`: estado "Pendiente de confirmación" cuando no hay número. Cuando lo tiene, lo muestra como hoy. Así la misma página sirve de destino del enlace que reciba por WhatsApp.

**Dashboard**
- Vista de preparación del día: selector de fecha, lista arrastrable, marca de cuáles están pendientes de confirmar.
- Botón **"Confirmar y notificar"**: asigna los números y despliega la lista con un botón de WhatsApp por paciente.
- Cada botón abre `https://wa.me/<telefono>?text=<mensaje>` y marca al paciente como avisado.
- Tratamiento visual de `PENDING` en la agenda de hoy, que nunca se usó.

### 4.7. El mensaje

```
Hola María, tu cita con el Dr. Pérez para el 12 de agosto quedó confirmada.
Tu turno es el #3.
Detalles: https://turnomedico.vercel.app/cita/abc123
```

El enlace lleva a `/cita/[id]`, que ya muestra dirección, piso, referencia y hora de inicio del doctor. Así el mensaje queda corto y la página hace el resto.

---

## 5. Fases

**Fase A — Quitar el turno de la vista pública** (se puede soltar sola)
- `bookAppointment`: sin turno, `status: 'PENDING'`.
- Arreglar la reasignación en `ARRIVED`.
- Ajustar el orden de la agenda con respaldo por `createdAt`.
- Textos del frontend público y estado "pendiente" en `cita/[id]`.

**Fase B — La secretaria ordena y confirma**
- `GET by-date`, `PUT reorder`, `POST confirm-day`.
- Vista de preparación del día con lista arrastrable.
- Tratamiento visual de `PENDING`.

**Fase C — Aviso por WhatsApp**
- `WHATSAPP` en el enum, `db push`.
- `POST :id/notified` escribiendo en `Notification`.
- Botones de WhatsApp con el mensaje armado y marca de avisados.

---

## 6. Riesgos

| Riesgo | Mitigación |
|---|---|
| `PENDING` nunca se usó: puede haber filtros que lo ignoren en silencio | Revisar todos los `where` por `status` en backend y frontend antes de soltar la Fase A |
| Renumerar a alguien que ya recibió su WhatsApp | La asignación respeta los números ya puestos y solo numera los nulos (4.3) |
| Citas viejas ya creadas como `CONFIRMED` con número | El cambio solo afecta reservas nuevas. Las existentes quedan como están |
| El paciente pierde la certeza que tenía al reservar | El texto debe ser explícito sobre qué sigue. Es un cambio de promesa, no solo de copy |
| Si la secretaria no confirma, el paciente se queda sin información | Indicador en el dashboard de días con citas pendientes por confirmar |
| Reordenar con el día ya en curso | Bloquear el reordenamiento de citas ya `ARRIVED` o posteriores |
| El formato del teléfono debe servir para `wa.me` | Normalizar a formato internacional sin símbolos (RD: `1809…`). Validar al guardar el paciente |

---

## 7. Fuera de alcance

- WhatsApp Business API (envío automático y masivo). Cuando haya volumen, sustituye al enlace manual sin tocar endpoints ni modelo: solo cambia el canal.
- Recordatorios automáticos 24h y 2h antes. Eso es la Fase 3 del `PLAN_PWA_RECORDATORIOS.md`.
- Que el paciente confirme de vuelta.
- Lista de espera y reasignación automática de cancelaciones.
