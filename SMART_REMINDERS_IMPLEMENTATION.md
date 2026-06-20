# Smart Reminders - Implementación Completa

## 📋 Resumen de lo Implementado

Sistema inteligente que **avisa al paciente cuándo salir de su casa** para llegar a tiempo a la consulta, basado en:
- Historial real de duración de consultas del doctor
- 25% colchón de seguridad
- Tiempo de viaje estimado (Google Maps API)

---

## 🗄️ Base de Datos - Cambios Realizados

### 1. **Appointment** (tabla existente - ACTUALIZADA)
```sql
ALTER TABLE appointments ADD COLUMN entered_consultory_at TIMESTAMP;
ALTER TABLE appointments ADD COLUMN left_consultory_at TIMESTAMP;
ALTER TABLE appointments ADD COLUMN doctor_id UUID;
```

**Propósito:** Rastrear exactamente cuándo el paciente entra y sale del consultorio.

### 2. **DoctorConsultationMetric** (tabla NUEVA)
```sql
CREATE TABLE doctor_consultation_metrics (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  doctor_id UUID NOT NULL,
  appointment_id UUID UNIQUE,
  consultory_duration_min INT,    -- duración real en consultorio
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Propósito:** Guardar el historial de duración de cada consulta por doctor.

### 3. **SmartReminder** (tabla NUEVA)
```sql
CREATE TABLE smart_reminders (
  id UUID PRIMARY KEY,
  appointment_id UUID UNIQUE,
  patient_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  
  clinic_lat FLOAT,
  clinic_lng FLOAT,
  patient_lat FLOAT,
  patient_lng FLOAT,
  
  average_doctor_consultory_min INT,
  buffer_min INT,
  travel_time_min INT,
  total_time_needed_min INT,
  
  suggested_departure_time TIMESTAMP,
  reminder_sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Propósito:** Almacenar el cálculo inteligente para cada cita y rastrear avisos.

---

## 🔧 Componentes del Backend

### **SmartRemindersService**

#### Método: `getAverageDoctorConsultoryTime()`
```typescript
// Obtiene el promedio de tiempo de consulta del DOCTOR
// basado en las últimas 20 consultas
const average = await service.getAverageDoctorConsultoryTime(doctorId, tenantId);
// Returns: 25 (minutos) - PROMEDIO, no del paciente
```

#### Método: `getTravelTime()`
```typescript
// Calcula tiempo de viaje usando Google Maps Distance Matrix API
const travelTime = await service.getTravelTime(
  originLat,  // ubicación actual paciente
  originLng,
  destLat,    // ubicación clínica
  destLng
);
// Returns: 35 (minutos) - tiempo real con tráfico
```

#### Método: `createSmartReminder()`
```typescript
// Se llama AUTOMÁTICAMENTE cuando se crea/confirma una cita
const reminder = await service.createSmartReminder(appointmentId, tenantId);
// Calcula: avgConsultation + buffer (25%) + travelTime
// Crea registro en BD
// Programa envío de aviso para 24h antes
```

#### Método: `recordConsultationDuration()`
```typescript
// Se llama automáticamente cuando paciente SALE del consultorio
await service.recordConsultationDuration(appointmentId, doctorId, tenantId);
// Calcula: leftConsultoryAt - enteredConsultoryAt
// Guarda en DoctorConsultationMetric
// Próxima cita usará este dato para mejorar el cálculo
```

---

## 🎯 Flujo Completo del Sistema

### **PARTE 1: Antes de la Cita**

#### 📅 Mañana de la cita (7:00 AM)
- Sistema envía aviso informativo
- "Tienes cita HOY a las 14:30"
- Paciente se prepara mentalmente

#### ⏰ 1 hora antes de salir (13:30 en este ejemplo)
- Sistema envía aviso **URGENTE**
- "DEBES SALIR AHORA A LAS 13:30"
- Incluye tiempo de viaje + colchón

### **PARTE 2: En la Clínica**

#### Paciente llega
```
Estado: PENDING → cambiar a ARRIVED
Doctor hace click: "Paciente llegó"
```

#### Paciente entra a consultorio
```
Endpoint: PUT /dashboard/appointments/{id}/entered-consultory
Sistema registra: enteredConsultoryAt = NOW
Estado: ARRIVED → IN_PROGRESS
```

#### Paciente sale de consultorio
```
Endpoint: PUT /dashboard/appointments/{id}/left-consultory
Sistema calcula: duración real = leftConsultoryAt - enteredConsultoryAt
Sistema guarda métrica en DoctorConsultationMetric
Estado: IN_PROGRESS → COMPLETED
```

### **PARTE 3: Después (Mejora Continua)**
- Métrica se guarda automáticamente
- Próxima cita usa promedio actualizado
- Sistema se vuelve **más preciso con el tiempo**

---

## 📱 Flujo de Uso - Cliente (Paciente)

### **AVISO 1: Mañana de la cita (7:00 AM)**
```
Informativo y relajado:

"Hola Juan,

📅 Tienes cita HOY con Dr(a). Rodríguez
🕐 Hora: 14:30

Recibirás un aviso más tarde cuando debas salir.

¡Nos vemos!"
```

### **AVISO 2: 1 hora ANTES de salir (URGENTE)**
```
Sistema calcula:
1. Promedio del doctor: 25 min
2. Suma 25% colchón: 6 min
3. Obtiene tiempo de viaje (Google Maps): 40 min
4. Total necesario: 71 minutos
5. Hora para salir: 13:30

AVISO SMS/PUSH (TÁCTICAL):
"⚠️ Juan,

¡ES HORA DE PREPARARSE!

Tu cita con Dr(a). Rodríguez es a las 14:30

🚗 DEBES SALIR AHORA A LAS 13:30
(En 1 hora)

Viaje estimado: 40 minutos
Atraso por si acaso: 6 minutos

¡Sin demoras! 🏥"
```

---

## 🌐 Endpoints Implementados

### **Dashboard (Doctor)**

#### Marcar entrada a consultorio
```
PUT /dashboard/appointments/{id}/entered-consultory
Headers: Authorization: Bearer {token}

Response:
{
  "data": {
    "id": "cita-123",
    "status": "IN_PROGRESS",
    "enteredConsultoryAt": "2026-04-20T14:30:15.000Z"
  },
  "message": "Paciente entra a consultorio"
}
```

#### Marcar salida de consultorio
```
PUT /dashboard/appointments/{id}/left-consultory
Headers: Authorization: Bearer {token}

Response:
{
  "data": {
    "id": "cita-123",
    "status": "COMPLETED",
    "leftConsultoryAt": "2026-04-20T14:55:30.000Z",
    "completedAt": "2026-04-20T14:55:30.000Z"
  },
  "message": "Consulta finalizada"
}
```

#### Obtener estadísticas del doctor
```
GET /smart-reminders/doctor/stats?doctorId={doctorId}
Headers: Authorization: Bearer {token}

Response:
{
  "data": {
    "averageConsultationTime": 25,
    "totalConsultations": 47,
    "minConsultationTime": 15,
    "maxConsultationTime": 45,
    "lastConsultationTime": 23
  },
  "message": "Doctor consultation statistics"
}
```

---

## 🎨 Componentes Frontend

### **AppointmentActions.tsx**
Botones en dashboard para marcar entrada/salida:
```tsx
<AppointmentActions
  appointmentId={appointment.id}
  status={appointment.status}
  onUpdate={refetch}
/>
```

Renderiza:
- Si status = `ARRIVED`: botón "Entra" (azul, LogIn icon)
- Si status = `IN_PROGRESS`: botón "Sale" (verde, LogOut icon)
- Si status = terminal: "Finalizado" (gris)

### **DoctorConsultationStats.tsx**
Panel con estadísticas del doctor:
```tsx
<DoctorConsultationStats doctorId={currentDoctor.id} />
```

Muestra:
- Promedio de consulta
- Total de consultas registradas
- Más rápida / Más lenta

---

## 🗺️ Geolocalización - PENDIENTE

### ¿Dónde obtenemos la ubicación?

**Ubicación CLÍNICA** ✅ LISTA
- Guardada en `DoctorProfile.latitude` y `.longitude`
- Se asigna cuando el doctor completa onboarding
- Se obtiene vía Google Places API (integrado)

**Ubicación PACIENTE** ❌ FALTA IMPLEMENTAR
- Necesita permiso `navigator.geolocation` en el navegador
- Se captura cuando paciente abre la app
- Se envía al backend vía API

### Cómo implementar geolocalización del paciente:

**Opción 1: Al abrir la app (recomendado)**
```typescript
// frontend/src/lib/geolocation.ts
export async function requestPatientLocation() {
  const position = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
  });
  
  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude
  };
}
```

**Opción 2: Cuando se crea la cita (más preciso)**
```typescript
// Pedir ubicación cuando paciente hace booking
const location = await requestPatientLocation();
const appointment = await api.post('/appointments/book', {
  ...data,
  patientLat: location.lat,
  patientLng: location.lng
});
```

**Opción 3: Actualizar ubicación cada X minutos**
```typescript
// Polling periódico para tener ubicación siempre fresca
setInterval(async () => {
  const location = await requestPatientLocation();
  await api.post('/patient/location', location);
}, 5 * 60 * 1000); // cada 5 minutos
```

---

## ⚙️ Variables de Entorno Necesarias

```bash
# .env (backend)
DATABASE_URL="postgresql://..."
GOOGLE_MAPS_API_KEY="AIzaSy..."  # ← NECESARIO para Google Maps Distance Matrix
JWT_SECRET="..."
```

---

## 📊 Cálculo Ejemplo

**Caso Real:**
```
Doctor: Dr. Rodríguez
Promedio histórico: 20 minutos (últimas 20 consultas)
Colchón 25%: 5 minutos
Tiempo de viaje (Google Maps): 40 minutos
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL: 65 minutos

Hora cita: 14:30
HORA PARA SALIR: 13:25 ← AVISO SMS/PUSH
```

---

## 🔐 Seguridad

- ✅ JWT authentication en todos los endpoints
- ✅ Tenant guard (doctor solo ve sus propias citas)
- ✅ Row-level security en Prisma
- ✅ No se envía ubicación del paciente sin consentimiento

---

## 📈 Métricas Disponibles

El sistema aprende con cada consulta:

```
Consulta 1: 25 min → promedio = 25
Consulta 2: 20 min → promedio = 22.5
Consulta 3: 30 min → promedio = 25
Consulta 4: 23 min → promedio = 24.5
...
Consulta 20: 22 min → promedio = 24
```

El promedio se recalcula con las **últimas 20 consultas**, por lo que:
- Se adapta a cambios en la velocidad del doctor
- No se queda obsoleto
- Mejora mes a mes

---

## 📊 Avisos - Timeline Ejemplo

```
CITA: Viernes 21 de abril a las 14:30

📅 VIERNES 7:00 AM (Aviso de Mañana)
   └─ SMS/Push: "Tienes cita HOY a las 14:30"
   
🚗 VIERNES 13:30 (Aviso Táctico) ← URGENTE
   └─ SMS/Push: "⚠️ DEBES SALIR AHORA A LAS 13:30"
   
🏥 VIERNES 14:00
   └─ Paciente llega a clínica
   └─ Doctor: Click "Paciente llegó"
   
🏥 VIERNES 14:05
   └─ Doctor: Click "Paciente entra a consultorio"
   └─ Sistema registra: enteredConsultoryAt
   
🏥 VIERNES 14:25
   └─ Doctor: Click "Paciente sale de consultorio"
   └─ Sistema calcula: 20 minutos de duración
   └─ Guarda métrica para próxima cita
```

---

## 🚀 Próximos Pasos

1. **Implementar geolocalización del paciente** (ver sección GEOLOCALIZACION_CLINICA.md)
2. **Integrar Google Maps API key**
3. **Testear ambos avisos** en flujo real
4. **Dashboard de paciente** con timeline de avisos
5. **Notificaciones push nativas** (PWA)
6. **Analytics** sobre eficiencia de avisos (% que llegan a tiempo)

---

## ✅ Testing

### Test manual del flujo:

```bash
# 1. Doctor crea cita
POST /appointments/book
{
  "patientName": "Juan",
  "patientPhone": "829-123-4567",
  "date": "2026-04-21",
  "startTime": "14:30"
}

# 2. Esperar a que paciente llegue → estado ARRIVED

# 3. Doctor marca ENTRADA
PUT /appointments/{id}/entered-consultory

# 4. Después de X minutos, doctor marca SALIDA
PUT /appointments/{id}/left-consultory

# 5. Verificar métrica grabada
GET /smart-reminders/doctor/stats?doctorId={doctorId}
```

---

## 📝 Notas

- El colchón del 25% es **configurable** - se puede ajustar en `SmartRemindersService.getAverageDoctorConsultoryTime()`
- El tiempo de poll/actualización es **24h antes** - se puede cambiar en `scheduleReminderNotification()`
- Google Maps API tiene **límite de 25,000 calls/día** en tier gratuito
- El sistema almacena **historial completo** para analytics futuro

