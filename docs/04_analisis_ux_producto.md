# Analisis UX/Producto - Sistema de Turnos Medicos para Republica Dominicana

**Documento:** Analisis de Experiencia de Usuario, Flujos de Interaccion y Estrategia de Producto
**Version:** 1.0
**Fecha:** 2026-02-26
**Autor:** Equipo de Producto
**Estado:** Borrador inicial

---

## Indice

1. [Perfiles de Usuario (Personas)](#1-perfiles-de-usuario-personas)
2. [User Flows Principales](#2-user-flows-principales)
3. [Wireframes Conceptuales (Pantallas Clave)](#3-wireframes-conceptuales-pantallas-clave)
4. [Sistema de Notificaciones](#4-sistema-de-notificaciones)
5. [Diseno de la Pantalla de Sala de Espera](#5-diseno-de-la-pantalla-de-sala-de-espera)
6. [Estrategia de Adopcion UX](#6-estrategia-de-adopcion-ux)
7. [Diferenciadores UX vs Competencia](#7-diferenciadores-ux-vs-competencia)

---

## 1. Perfiles de Usuario (Personas)

### 1.1 Paciente Joven - "Maria"

| Atributo | Detalle |
|---|---|
| **Nombre arquetipo** | Maria, 32 anos, ejecutiva de marketing en Santo Domingo |
| **Rol en el sistema** | Paciente que agenda y gestiona sus citas |
| **Nivel tecnologico** | Alto. Usa smartphone para todo: banca, delivery, redes sociales |
| **Necesidades principales** | Agendar rapido sin llamar, saber exactamente a que hora la atienden, recibir recordatorios automaticos, no perder tiempo esperando |
| **Frustraciones actuales** | Llama al consultorio y no contestan, llega a la cita y espera 1.5 horas sin saber cuando le toca, no sabe si el medico esta atrasado |
| **Frecuencia de uso** | 1-3 veces por mes (entre ella y familiares que le piden ayuda) |
| **Patron de uso** | Busca medico en el celular, agenda en la noche o en la hora de almuerzo, quiere hacer todo en menos de 2 minutos |
| **Dispositivo principal** | iPhone o Android gama media-alta, siempre con datos moviles |
| **Apps de referencia** | PedidosYa, Uber, Instagram. Espera ese nivel de fluidez |
| **Canal preferido** | WhatsApp para confirmaciones, app/web para agendar |

**Jobs-to-be-done:**
- Encontrar un dermatologo cerca de Piantini con disponibilidad esta semana.
- Agendar en 3 toques, sin crear cuenta compleja.
- Saber si el medico esta atrasado ANTES de salir de la oficina.
- Recibir un mensaje cuando falten 2 pacientes para su turno.
- Poder cancelar o reagendar sin tener que llamar.

**Escenario tipico:**
> Maria tiene una alergia en la piel. Son las 10pm. Abre el sistema en el celular, busca "dermatologo", ve perfiles con fotos y precios, elige uno con buenas evaluaciones, selecciona manana a las 3pm, pone su nombre y telefono, recibe confirmacion por WhatsApp. Al dia siguiente a las 2:30pm recibe un mensaje: "Tu turno es el proximo, dirigete al consultorio". Llega, la secretaria la confirma con un toque. En la pantalla de la sala ve: "Maria R. - Turno 7 - Proximo". A los 5 minutos la llaman.

---

### 1.2 Paciente Mayor - "Don Rafael"

| Atributo | Detalle |
|---|---|
| **Nombre arquetipo** | Don Rafael, 67 anos, retirado, vive en Santiago de los Caballeros |
| **Rol en el sistema** | Paciente (a veces asistido por un familiar) |
| **Nivel tecnologico** | Bajo. Usa WhatsApp para mensajes y fotos. No instala apps nuevas facilmente |
| **Necesidades principales** | Que alguien le ayude a agendar, saber su turno de forma clara, letras grandes, no perderse en menus |
| **Frustraciones actuales** | Llega al consultorio a las 7am "por si acaso", espera 3 horas, no sabe cuantos pacientes hay antes que el |
| **Frecuencia de uso** | 2-4 veces al mes (seguimiento de condiciones cronicas) |
| **Patron de uso** | Su hija le agenda la cita. El recibe un WhatsApp con la confirmacion. El dia de la cita llega y espera |
| **Dispositivo principal** | Android gama baja, pantalla de 5.5", letras grandes configuradas |
| **Canal preferido** | WhatsApp (ya lo tiene, ya lo sabe usar) |

**Jobs-to-be-done:**
- Recibir un WhatsApp claro que diga: "Su cita es manana martes 15 a las 10:00am con Dr. Perez".
- Llegar al consultorio y que alguien sepa que tiene cita.
- Ver en una pantalla grande y clara cuando le toca.
- No tener que entender una app nueva.

**Escenario tipico:**
> La hija de Don Rafael entra al sistema desde su celular, busca el cardiologo de su papa, agenda para el jueves a las 9am. Don Rafael recibe un WhatsApp: "Don Rafael, su cita con Dr. Martinez es el jueves 20 de febrero a las 9:00am. Direccion: Av. 27 de Febrero #45, 2do piso. Responda SI para confirmar." El jueves llega, le dice a la secretaria "Tengo cita a las 9". La secretaria busca "Rafael", lo marca como llegado. Don Rafael se sienta y ve en la pantalla de la TV: "RAFAEL M. - Turno 3". Cuando le toca, la pantalla cambia a "RAFAEL M. - PASE AL CONSULTORIO" y suena una campanita.

---

### 1.3 Secretaria / Asistente del Medico - "Yolanda"

| Atributo | Detalle |
|---|---|
| **Nombre arquetipo** | Yolanda, 45 anos, secretaria del Dr. Martinez hace 12 anos |
| **Rol en el sistema** | Gestora principal de la agenda diaria, punto de contacto con pacientes |
| **Nivel tecnologico** | Bajo-medio. Usa WhatsApp, Facebook, y Excel basico. Aprendio a usar el sistema del seguro a la fuerza |
| **Necesidades principales** | Ver la agenda del dia de un vistazo, agregar pacientes rapidamente, saber quien llego y quien no, avanzar turnos con un solo toque |
| **Frustraciones actuales** | Maneja todo en una libreta, pierde tiempo llamando para confirmar, los pacientes preguntan "cuantos faltan" cada 5 minutos, el doctor le pregunta cuantos pacientes quedan |
| **Frecuencia de uso** | Todo el dia, 8-10 horas, es su herramienta principal de trabajo |
| **Patron de uso** | Abre la agenda al llegar (7:30am), confirma llegadas, avanza turnos, agrega walk-ins, cierra el dia |
| **Dispositivo principal** | Computadora de escritorio con monitor (consultorio), a veces tablet |
| **Tolerancia a complejidad** | MUY BAJA. Si el sistema tiene mas de 3 pasos para hacer algo basico, vuelve a la libreta |

**Jobs-to-be-done:**
- Abrir la computadora y ver INMEDIATAMENTE quien viene hoy, a que hora, y si confirmo.
- Cuando llega un paciente: un clic para marcarlo como "llego".
- Cuando el doctor termina con uno: un clic para llamar al siguiente.
- Cuando llega alguien sin cita: agregarlo en 15 segundos (nombre + telefono).
- Responder "cuantos faltan" mirando la pantalla, no contando en la libreta.
- Al final del dia: saber cuantos pacientes se atendieron (el doctor siempre pregunta).

**Metricas que le importan:**
- Cuantos pacientes confirmaron.
- Cuantos no vinieron (no-shows).
- Cuantos walk-ins hubo.
- A que hora termino el dia.

**Escenario tipico:**
> Yolanda llega a las 7:30am. Abre el sistema en la computadora. Ve: "Hoy: 18 pacientes programados, 12 confirmados, 6 pendientes". La lista muestra cada paciente con su hora. A las 8:00am llega el primer paciente. Yolanda hace clic en "Llego". La pantalla de la sala de espera se actualiza automaticamente. El doctor termina con el paciente. Yolanda hace clic en "Siguiente". La pantalla muestra el nuevo turno. A las 10:30am llega alguien sin cita. Yolanda toca "Agregar walk-in", escribe "Juan Perez", telefono, y listo -- se agrega al final de la cola. A las 5pm, cierra el dia: "Atendidos: 22, No vinieron: 3, Walk-ins: 7".

---

### 1.4 Medico - "Dr. Martinez"

| Atributo | Detalle |
|---|---|
| **Nombre arquetipo** | Dr. Carlos Martinez, 48 anos, cardiologo con consultorio privado en Santo Domingo |
| **Rol en el sistema** | Propietario del consultorio, usuario de consulta rapida, cara publica del perfil |
| **Nivel tecnologico** | Medio. Usa smartphone, revisa cosas rapido entre pacientes |
| **Necesidades principales** | Saber cuantos pacientes tiene hoy, ver si esta atrasado, tener un perfil profesional que lo haga ver bien, que los pacientes lleguen a tiempo |
| **Frustraciones actuales** | No sabe cuantos pacientes le quedan, los pacientes no llegan a tiempo, su secretaria maneja todo en una libreta que solo ella entiende |
| **Frecuencia de uso** | Revision rapida al inicio del dia (2 min), consultas rapidas entre pacientes (30 seg) |
| **Dispositivo principal** | iPhone, revisa entre consultas |

**Jobs-to-be-done:**
- En 10 segundos saber: cuantos pacientes tengo hoy, cuantos he visto, cuantos faltan.
- Ver si hay algun paciente "especial" (primera vez, caso complejo) con nota de la secretaria.
- Que su perfil publico se vea profesional: foto, especialidades, horarios, ubicacion con mapa.
- Al final del mes: ver un resumen de pacientes atendidos.

**Escenario tipico:**
> Dr. Martinez llega al consultorio a las 8:00am. Abre la app en su celular. Ve: "Hoy: 18 pacientes. Primero: Juan Perez, 8:15am (cardiopatia, primera consulta)". Entre pacientes, desliza para ver: "Atendidos: 6 de 18. Siguiente: Maria Lopez. Nota de Yolanda: viene por resultado de electrocardiograma". Al final del dia ve: "Total atendidos: 20. Walk-ins: 4. Tiempo promedio por paciente: 18 min".

---

### 1.5 Administrador de la Plataforma - "Equipo TurnoMedico"

| Atributo | Detalle |
|---|---|
| **Nombre arquetipo** | Equipo interno de TurnoMedico (2-3 personas inicialmente) |
| **Rol en el sistema** | Gestion de medicos registrados, planes de suscripcion, facturacion, soporte, metricas de uso |
| **Nivel tecnologico** | Alto |
| **Necesidades principales** | Onboarding de nuevos medicos, monitoreo de uso, gestion de pagos, soporte tecnico, metricas de crecimiento |
| **Frecuencia de uso** | Diaria, varias horas |
| **Dispositivo** | Desktop |

**Jobs-to-be-done:**
- Ver cuantos medicos hay activos y cuantos pacientes se agendan por dia/semana/mes.
- Activar/desactivar cuentas de medicos.
- Ver metricas de retencion: cuantos medicos siguen usando el sistema despues de 30/60/90 dias.
- Gestionar planes y facturacion.
- Responder tickets de soporte.
- Identificar medicos que no estan usando el sistema (para activacion proactiva).

**Metricas clave:**
- Medicos activos (usaron el sistema esta semana).
- Citas agendadas (total, por medico, por canal: web/WhatsApp/walk-in).
- Tasa de no-show.
- Tasa de adopcion de la pantalla de sala de espera.
- NPS de secretarias (indicador critico de retencion).
- Revenue por plan.

---

## 2. User Flows Principales

### 2.1 Flow 1: Paciente agenda una cita desde el celular

**Principio de diseno:** Cero friccion. Maxima velocidad. El paciente debe poder agendar en menos de 60 segundos sin crear una cuenta.

```
PASO 1: DESCUBRIMIENTO
El paciente accede al sistema por una de estas vias:
  a) Link directo del medico (en su tarjeta, WhatsApp, Instagram)
     → Ejemplo: turnomedico.do/dr-martinez
     → Va directo al perfil del medico (saltar al paso 3)
  b) Busqueda en Google: "cardiologo santo domingo"
     → Llega a la landing page del sistema
  c) Recomendacion por WhatsApp de otro paciente
     → Link directo al perfil

PASO 2: BUSQUEDA (solo si entro por landing page)
[Pantalla: Landing page]
  - Barra de busqueda prominente: "Busca tu medico o especialidad"
  - Filtros rapidos: Especialidad, Zona, Disponibilidad hoy
  - Resultados en tarjetas: Foto, Nombre, Especialidad, Zona,
    Proxima disponibilidad, Precio consulta (si el medico lo publica)
  - El paciente toca una tarjeta

PASO 3: PERFIL DEL MEDICO
[Pantalla: Perfil publico del medico]
  - Foto profesional, nombre, especialidades, seguros que acepta
  - Direccion con mapa integrado
  - Horarios de consulta
  - Precio de consulta (opcional)
  - Boton prominente: [AGENDAR CITA]
  - El paciente toca "Agendar Cita"

PASO 4: SELECCION DE FECHA Y HORA
[Pantalla: Calendario + horarios]
  - Calendario visual tipo semana (lunes a sabado)
  - Los dias con disponibilidad se ven en color
  - Los dias sin espacio se ven en gris
  - Al tocar un dia, aparecen los horarios disponibles como
    "chips" o botones:
    [8:00] [8:20] [8:40] [9:00] [9:20] ...
  - Los horarios ocupados no aparecen (no se muestran en gris,
    simplemente no estan -- menos ruido visual)
  - El paciente toca un horario

PASO 5: DATOS DEL PACIENTE (registro minimo)
[Pantalla: Tus datos]
  SIN CREAR CUENTA. Solo lo esencial:
  - Nombre completo [campo de texto]
  - Numero de celular [campo numerico con formato RD: 809/829/849]
  - Motivo de consulta [campo opcional, texto libre]
  - Seguro medico [selector desplegable: "Ninguno" + lista
    de seguros que acepta el medico]
  - Checkbox: "Acepto recibir confirmacion y recordatorios
    por WhatsApp"
  - Boton: [CONFIRMAR CITA]

  NOTA CRITICA: No pedimos email, no pedimos contrasena,
  no pedimos cedula, no pedimos fecha de nacimiento.
  La barrera de entrada debe ser CERO.
  La verificacion se hace por WhatsApp (OTP si es necesario
  en el futuro).

PASO 6: CONFIRMACION
[Pantalla: Cita confirmada]
  - Icono de check grande y verde
  - Resumen:
      Dr. Carlos Martinez - Cardiologia
      Martes 18 de febrero, 2026
      9:00 AM
      Av. 27 de Febrero #45, 2do piso
  - Botones:
      [AGREGAR AL CALENDARIO] (genera .ics)
      [VER EN MAPA]
      [COMPARTIR POR WHATSAPP]
  - Mensaje: "Recibiras una confirmacion por WhatsApp
    en los proximos minutos"

PASO 7: CONFIRMACION POR WHATSAPP (automatico)
  El paciente recibe un mensaje de WhatsApp:
  ┌─────────────────────────────────────────┐
  │ TurnoMedico                             │
  │                                         │
  │ Hola Maria! Tu cita ha sido confirmada: │
  │                                         │
  │ Dr. Carlos Martinez                     │
  │ Cardiologia                             │
  │ Martes 18 de febrero, 9:00 AM           │
  │ Av. 27 de Febrero #45, 2do piso         │
  │                                         │
  │ Responde:                               │
  │ 1 - Confirmar asistencia                │
  │ 2 - Cancelar cita                       │
  │ 3 - Reagendar                           │
  │                                         │
  │ Te enviaremos un recordatorio el dia    │
  │ anterior.                               │
  └─────────────────────────────────────────┘
```

**Tiempo total estimado: 45-60 segundos** (si va directo al perfil del medico).

**Decision de diseno clave:** No requerimos registro/cuenta. El numero de celular ES la identidad del paciente. Si el mismo numero agenda otra vez, el sistema lo reconoce y pre-llena sus datos. Esto es critico para el mercado dominicano: la friccion de crear cuenta mata la conversion.

---

### 2.2 Flow 2: Paciente llega al consultorio (dia de la cita)

**Principio de diseno:** El paciente debe sentir que el sistema lo reconoce y le da certeza. Nunca mas "cuantos faltan?".

```
CONTEXTO: El paciente recibio un recordatorio por WhatsApp 1 hora antes.
Llega al consultorio.

OPCION A: CHECK-IN ASISTIDO (recomendado para v1)
  1. Paciente llega y le dice a la secretaria: "Tengo cita a las 9"
  2. Secretaria busca por nombre o telefono en el sistema
     (campo de busqueda en la parte superior del dashboard)
  3. Encuentra al paciente y toca [MARCAR LLEGADA]
  4. El estado del paciente cambia a "En sala de espera"
  5. La pantalla de la sala de espera se actualiza en tiempo real:
     aparece el nombre del paciente con su numero de turno

OPCION B: CHECK-IN POR WHATSAPP (v2 - futuro)
  1. Al llegar, el paciente recibe un WhatsApp geolocalizacion:
     "Parece que llegaste al consultorio. Toca para confirmar tu llegada"
  2. El paciente toca "Llegue"
  3. Se marca automaticamente en el sistema de la secretaria
  4. Aparece en la pantalla de sala de espera

OPCION C: CHECK-IN POR QR (v2 - futuro)
  1. Hay un codigo QR en la recepcion
  2. El paciente lo escanea con su celular
  3. Se abre una pagina web: "Hola Maria, confirma tu llegada"
  4. Toca [YA LLEGUE]
  5. Se actualiza en el sistema

EN LA SALA DE ESPERA:
  - El paciente se sienta y ve la pantalla de TV/display
  - La pantalla muestra la lista de turnos:
      TURNO ACTUAL: #5 - JUAN P.
      EN ESPERA:
        #6 - MARIA R.
        #7 - PEDRO S.
        #8 - ANA M.
  - El paciente ubica su nombre y sabe exactamente cuantos
    hay antes que el
  - Cuando avanza un turno, la pantalla se actualiza con una
    animacion suave y un sonido sutil de campana

NOTIFICACION POR WHATSAPP (cuando faltan 2 turnos):
  ┌──────────────────────────────────────────┐
  │ TurnoMedico                              │
  │                                          │
  │ Maria, faltan 2 pacientes para tu turno  │
  │ con Dr. Martinez. Preparate!             │
  │                                          │
  │ Turno actual: #5                         │
  │ Tu turno: #7                             │
  └──────────────────────────────────────────┘

NOTIFICACION POR WHATSAPP (es tu turno):
  ┌──────────────────────────────────────────┐
  │ TurnoMedico                              │
  │                                          │
  │ Maria, es tu turno! Pasa al consultorio  │
  │ del Dr. Martinez.                        │
  └──────────────────────────────────────────┘
```

---

### 2.3 Flow 3: Walk-in (paciente sin cita previa)

**Principio de diseno:** Los walk-ins son NORMALES en RD, no una excepcion. El sistema debe manejarlos tan fluidamente como las citas agendadas.

```
ESCENARIO: Una persona llega al consultorio sin cita previa.

PASO 1: INTERACCION CON SECRETARIA
  - Paciente: "Buenos dias, vine a ver al doctor, no tengo cita"
  - Secretaria abre el sistema (ya esta en el dashboard)

PASO 2: AGREGAR WALK-IN (maximo 15 segundos)
  - Secretaria toca el boton prominente [+ WALK-IN] que esta
    siempre visible en la parte superior del dashboard
  - Se abre un formulario minimo:

    ┌─────────────────────────────────────┐
    │ AGREGAR PACIENTE SIN CITA           │
    │                                     │
    │ Nombre: [___________________]       │
    │ Telefono: [___________________]     │
    │ Motivo: [___________________]  (opt)│
    │                                     │
    │ [AGREGAR AL FINAL DE LA COLA]       │
    │ [AGREGAR COMO URGENCIA]             │
    └─────────────────────────────────────┘

  - Si el telefono ya existe en el sistema, se autocompleta
    el nombre (paciente recurrente)
  - Secretaria toca [AGREGAR AL FINAL DE LA COLA]

PASO 3: TURNO ASIGNADO
  - El sistema asigna automaticamente el siguiente turno disponible
  - El paciente aparece en la pantalla de sala de espera
  - Secretaria le dice al paciente: "Su turno es el #15,
    hay 4 pacientes antes que usted"
  - Opcionalmente, si el paciente da su numero, recibe WhatsApp:
    ┌──────────────────────────────────────────┐
    │ TurnoMedico                              │
    │                                          │
    │ Hola Juan! Se le ha asignado el turno    │
    │ #15 con Dr. Martinez.                    │
    │ Pacientes antes que usted: 4             │
    │ Tiempo estimado de espera: ~40 min       │
    │                                          │
    │ Le avisaremos cuando este proximo        │
    │ su turno.                                │
    └──────────────────────────────────────────┘

LOGICA DE PRIORIDAD:
  - Walk-ins van al final de la cola por defecto
  - Secretaria puede moverlos (drag-and-drop o flechas)
  - Opcion "URGENCIA" los coloca mas arriba (requiere
    confirmacion del medico si esta configurado asi)
  - El sistema distingue visualmente entre citas agendadas (azul)
    y walk-ins (naranja) para que la secretaria y el medico
    sepan la composicion del dia
```

---

### 2.4 Flow 4: Secretaria gestiona el dia

**Principio de diseno:** La secretaria es la REINA del sistema. Todo debe estar a un clic de distancia. Si necesita dos clics, es un clic de mas.

```
7:30 AM - INICIO DEL DIA

  Yolanda abre el sistema. Ve inmediatamente:

  ┌──────────────────────────────────────────────────────────────┐
  │  HOY: Miercoles 18 de febrero, 2026                         │
  │  Dr. Carlos Martinez - Cardiologia                          │
  │                                                              │
  │  Resumen:  18 pacientes | 12 confirmados | 6 pendientes     │
  │            Primer turno: 8:00 AM | Ultimo: 4:40 PM          │
  │                                                              │
  │  [+ WALK-IN]   [ENVIAR RECORDATORIOS]   [VER SEMANA]        │
  └──────────────────────────────────────────────────────────────┘

  Lista del dia (scroll vertical):

  ┌─────┬────────────┬──────────────────┬─────────┬─────────────┐
  │ #   │ Hora       │ Paciente         │ Estado  │ Accion      │
  ├─────┼────────────┼──────────────────┼─────────┼─────────────┤
  │ 1   │ 8:00 AM    │ Juan Perez       │ CONFIRM │ [LLEGO]     │
  │ 2   │ 8:20 AM    │ Ana Ramirez      │ CONFIRM │ [LLEGO]     │
  │ 3   │ 8:40 AM    │ Pedro Gonzalez   │ PENDIEN │ [LLEGO]     │
  │ 4   │ 9:00 AM    │ Maria Lopez      │ CONFIRM │ [LLEGO]     │
  │ 5   │ 9:20 AM    │ (disponible)     │    --   │ [AGENDAR]   │
  │ ... │ ...        │ ...              │ ...     │ ...         │
  └─────┴────────────┴──────────────────┴─────────┴─────────────┘

  Codigos de color de estado:
    CONFIRMADO = verde
    PENDIENTE = amarillo
    LLEGO = azul
    EN CONSULTA = morado
    ATENDIDO = gris
    NO VINO = rojo
    CANCELADO = gris tachado

8:00 AM - LLEGAN PACIENTES

  1. Juan Perez llega. Yolanda toca [LLEGO] en su fila.
     → Estado cambia a "LLEGO" (azul)
     → Pantalla de sala de espera se actualiza
     → Boton cambia a [LLAMAR] (para cuando el doctor este listo)

  2. El doctor esta listo. Yolanda toca [LLAMAR] en Juan Perez.
     → Estado cambia a "EN CONSULTA" (morado)
     → Pantalla de sala de espera muestra: "TURNO ACTUAL: #1 - JUAN P."
     → Si esta configurado: suena campana en la sala

  3. El doctor termina. Yolanda toca [SIGUIENTE] (boton flotante
     siempre visible en la parte inferior).
     → Juan Perez pasa a "ATENDIDO" (gris)
     → Se llama automaticamente al siguiente que tenga estado "LLEGO"
     → La pantalla de sala de espera avanza

10:30 AM - WALK-IN

  4. Llega alguien sin cita. Yolanda toca [+ WALK-IN].
     → Escribe nombre y telefono
     → Se agrega al final de la lista con etiqueta "WALK-IN" (naranja)

11:00 AM - NO-SHOW

  5. Pedro Gonzalez no llego a las 8:40 AM. El sistema
     automaticamente lo marca como "NO VINO" despues de
     15 minutos de espera (configurable).
     → Alternativamente, Yolanda puede marcarlo manualmente
     → El turno se salta automaticamente

12:00 PM - CANCELACION

  6. Maria Lopez llama para cancelar. Yolanda toca su fila
     → Toca [CANCELAR] → Confirma → Estado: "CANCELADO"
     → El horario queda libre y se muestra como disponible
       para otros pacientes

5:00 PM - CIERRE DEL DIA

  7. Yolanda ve el resumen automatico:
     ┌──────────────────────────────────────────────┐
     │  RESUMEN DEL DIA                             │
     │                                              │
     │  Agendados: 18                               │
     │  Walk-ins: 7                                 │
     │  Total atendidos: 22                         │
     │  No vinieron: 3                              │
     │  Cancelaron: 0                               │
     │  Hora de inicio real: 8:05 AM                │
     │  Hora de cierre: 4:52 PM                     │
     │  Tiempo promedio por paciente: 18 min        │
     └──────────────────────────────────────────────┘

ACCIONES RAPIDAS SIEMPRE DISPONIBLES (barra superior o flotante):
  [+ WALK-IN] - Agregar paciente sin cita
  [SIGUIENTE] - Avanzar al proximo turno
  [BUSCAR] - Buscar paciente por nombre o telefono
  [PAUSAR] - Pausar turnos (hora de almuerzo del doctor)
```

---

### 2.5 Flow 5: Medico se registra en la plataforma (Onboarding)

**Principio de diseno:** Maximo 5 minutos para estar operativo. El medico debe poder atender pacientes HOY. Todo lo demas se puede completar despues.

```
PASO 1: REGISTRO BASICO (30 segundos)
[Pantalla: Crea tu perfil medico]
  - Nombre completo: [___________________]
  - Especialidad: [selector desplegable con las mas comunes en RD]
  - Celular (WhatsApp): [___________________]
  - Email: [___________________]
  - Contrasena: [___________________]
  - [CREAR CUENTA]

  → Se envia codigo de verificacion por WhatsApp

PASO 2: PERFIL PROFESIONAL (2 minutos)
[Pantalla: Tu perfil publico]
  - Foto profesional [subir o tomar foto]
  - Exequatur (numero de licencia medica RD): [___________]
  - Sub-especialidades: [selector multiple]
  - Seguros que acepta: [checkbox list: ARS Humano, Senasa,
    Mapfre Salud, Universal, etc.]
  - Precio de consulta: [___] RD$ (opcional, puede ocultarse)
  - Descripcion breve: [textarea, maximo 200 caracteres]

  → Vista previa: "Asi veran tu perfil los pacientes"
  → [CONTINUAR] o [COMPLETAR DESPUES]

PASO 3: CONFIGURACION DEL CONSULTORIO (1 minuto)
[Pantalla: Tu consultorio]
  - Nombre del consultorio: [___________________]
  - Direccion: [___________________] + pin en mapa
  - Telefono del consultorio: [___________________]
  - Nombre de la secretaria: [___________] (opcional)
  - Email/celular de la secretaria: [___________]
    (se le enviara invitacion)

  → [CONTINUAR]

PASO 4: HORARIOS DE CONSULTA (1.5 minutos)
[Pantalla: Tus horarios]

  Plantilla visual tipo semana:
  ┌──────────┬──────────┬──────────┐
  │ Lunes    │ 8:00 AM  │ 12:00 PM │  [Editar]
  │ Martes   │ 2:00 PM  │ 6:00 PM  │  [Editar]
  │ Miercoles│ 8:00 AM  │ 12:00 PM │  [Editar]
  │ Jueves   │    CERRADO          │  [Editar]
  │ Viernes  │ 8:00 AM  │ 5:00 PM  │  [Editar]
  │ Sabado   │ 8:00 AM  │ 12:00 PM │  [Editar]
  │ Domingo  │    CERRADO          │  [Editar]
  └──────────┴──────────┴──────────┘

  - Duracion de consulta por defecto: [20 min ▼]
  - Tiempo entre consultas (buffer): [0 min ▼]
  - Maximo pacientes por dia: [25 ▼] o [Sin limite]
  - Permitir walk-ins: [Si ▼]

  → [CONTINUAR]

PASO 5: ELEGIR PLAN (30 segundos)
[Pantalla: Elige tu plan]

  ┌─────────────────┬─────────────────┬─────────────────┐
  │ BASICO          │ PROFESIONAL     │ PREMIUM         │
  │ GRATIS          │ RD$ 1,500/mes   │ RD$ 3,500/mes   │
  │                 │                 │                 │
  │ - Agenda basica │ - Todo Basico   │ - Todo Prof.    │
  │ - Hasta 50      │ - Walk-ins      │ - Multi-consult │
  │   citas/mes     │ - Pantalla sala │ - Reportes      │
  │ - WhatsApp      │ - Recordatorios │ - API/integraci │
  │   confirmacion  │   automaticos   │ - Soporte prior │
  │ - Perfil publico│ - Estadisticas  │ - Branding      │
  │                 │ - Sin limite    │   personalizado  │
  │                 │   citas         │                 │
  │ [EMPEZAR]       │ [EMPEZAR]       │ [EMPEZAR]       │
  │                 │ 30 dias gratis  │ 30 dias gratis  │
  └─────────────────┴─────────────────┴─────────────────┘

  → Pago: tarjeta de credito o transferencia bancaria

PASO 6: LISTO!
[Pantalla: Tu consultorio esta activo]
  - Link de tu perfil publico: turnomedico.do/dr-martinez
  - Compartir por: [WhatsApp] [Copiar link] [Instagram]
  - [AGREGAR PRIMER PACIENTE]
  - [INVITAR A MI SECRETARIA]
  - [EXPLORAR MI DASHBOARD]

  Checklist de completitud:
  ✓ Perfil creado
  ✓ Horarios configurados
  ✓ Plan seleccionado
  ○ Foto de perfil (completar despues)
  ○ Secretaria invitada (completar despues)
  ○ Primer paciente agendado

TOTAL DE ONBOARDING: ~5 minutos
Pasos obligatorios: 1, 3, 4, 5 (perfil profesional se puede saltar)
```

---

### 2.6 Flow 6: Pantalla de sala de espera

(Ver seccion 5 para diseno detallado)

```
CONFIGURACION INICIAL:
  1. La secretaria o el medico conecta una TV/monitor/tablet
     al sistema
  2. Abre en el navegador: turnomedico.do/sala/[codigo-consultorio]
  3. Activa modo pantalla completa (F11 o boton dedicado)
  4. La pantalla se actualiza automaticamente via WebSocket

COMPORTAMIENTO:
  - Actualización en tiempo real (sin recargar pagina)
  - Transiciones suaves cuando cambian los turnos
  - Campana/sonido opcional cuando se llama al siguiente paciente
  - Si se pierde la conexion: muestra el ultimo estado conocido
    + indicador "Reconectando..." (se reconecta automaticamente)
  - Modo dia/noche se ajusta automaticamente o por configuracion
```

---

### 2.7 Flow 7: Notificaciones y recordatorios

(Ver seccion 4 para tabla detallada)

```
CANAL PRINCIPAL: WhatsApp (via API de WhatsApp Business)
CANAL SECUNDARIO: SMS (si WhatsApp falla o paciente no tiene WhatsApp)
CANAL TERCIARIO: Email (solo para medicos y secretarias)

FILOSOFIA: Notificar lo justo. Nunca spamear. El paciente debe sentir
que cada mensaje le aporta valor, no que es una molestia.

TONO DE COMUNICACION:
  - Amigable pero profesional
  - Dominicano pero no coloquial
  - Claro y directo
  - Letras simples, sin emojis excesivos (maximo 1 por mensaje)
  - Siempre incluir el nombre del medico y la hora
```

---

## 3. Wireframes Conceptuales (Pantallas Clave)

### 3.1 Pantalla: Landing page / Busqueda de medicos

```
URL: turnomedico.do

┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  [Logo TurnoMedico]              [Soy Medico] [Iniciar Sesion]│
│                                                                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                                │
│        Encuentra tu medico y agenda en segundos                │
│                                                                │
│  ┌──────────────────────────────────────────────┐              │
│  │ 🔍 Busca por nombre, especialidad o centro   │  [BUSCAR]   │
│  └──────────────────────────────────────────────┘              │
│                                                                │
│  Especialidades populares:                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │ Medicina │ │ Gineco-  │ │ Pediatria│ │ Cardio-  │         │
│  │ General  │ │ logia    │ │          │ │ logia    │         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │ Dermato- │ │ Trauma-  │ │ Oftalmo- │ │ Todas    │         │
│  │ logia    │ │ tologia  │ │ logia    │ │ >>>      │         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
│                                                                │
│  Zonas:                                                        │
│  [Santo Domingo] [Santiago] [La Romana] [Punta Cana] [Todas]  │
│                                                                │
│  ─────────────────────────────────────────────────────         │
│  Medicos destacados:                                           │
│  ┌───────────────────────────────────────────────────┐         │
│  │ [Foto] Dr. Carlos Martinez                        │         │
│  │        Cardiologia | Piantini, Santo Domingo       │         │
│  │        Proxima disponibilidad: Hoy 3:00 PM        │         │
│  │        ★★★★★ (48 evaluaciones)                    │         │
│  │                              [AGENDAR CITA]       │         │
│  └───────────────────────────────────────────────────┘         │
│  ┌───────────────────────────────────────────────────┐         │
│  │ [Foto] Dra. Maria Feliz                           │         │
│  │        Dermatologia | Naco, Santo Domingo          │         │
│  │        Proxima disponibilidad: Manana 9:00 AM     │         │
│  │        ★★★★☆ (31 evaluaciones)                    │         │
│  │                              [AGENDAR CITA]       │         │
│  └───────────────────────────────────────────────────┘         │
│                                                                │
│  ─────────────────────────────────────────────────────         │
│  Footer: Sobre nosotros | Para medicos | FAQ | Contacto       │
│          © 2026 TurnoMedico. Hecho en Republica Dominicana    │
└────────────────────────────────────────────────────────────────┘

NOTAS DE DISENO:
- Mobile-first: en celular la busqueda ocupa toda la pantalla
- Las especialidades son botones grandes, faciles de tocar con el dedo
- La busqueda es en tiempo real: al escribir 3 letras aparecen sugerencias
- "Proxima disponibilidad" es el dato mas valioso para el paciente
- Las evaluaciones generan confianza (las estrellas se llenan con citas reales)
- No se muestra precio en la tarjeta (solo en el perfil) para no crear
  barrera psicologica antes de ver al medico
```

---

### 3.2 Pantalla: Perfil del medico (publico)

```
URL: turnomedico.do/dr-martinez

┌────────────────────────────────────────────────────────────────┐
│ [< Volver]                                  [Compartir]       │
│                                                                │
│  ┌─────────┐                                                   │
│  │         │  Dr. Carlos Martinez                              │
│  │  FOTO   │  Cardiologia | Electrofisiologia                  │
│  │         │  Exequatur: #12345                                │
│  └─────────┘  ★★★★★ (48 evaluaciones)                         │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐      │
│  │              [  AGENDAR CITA  ]                      │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                │
│  Sobre el Dr. Martinez                                         │
│  "Cardiologo con 20 anos de experiencia. Especialista en       │
│  arritmias y electrofisiologia cardiaca."                      │
│                                                                │
│  ──────────────────────────────────────                        │
│  Informacion de consulta                                       │
│                                                                │
│  Precio: RD$ 2,500                                             │
│  Duracion: 30 minutos                                          │
│  Seguros: ARS Humano, Senasa, Universal, Mapfre Salud          │
│                                                                │
│  ──────────────────────────────────────                        │
│  Ubicacion                                                     │
│                                                                │
│  Centro Medico Dominicano                                      │
│  Av. 27 de Febrero #45, 2do piso                               │
│  Piantini, Santo Domingo                                       │
│  ┌──────────────────────────────┐                              │
│  │                              │                              │
│  │    [MAPA DE GOOGLE MAPS]     │                              │
│  │                              │                              │
│  └──────────────────────────────┘                              │
│  [COMO LLEGAR]                                                 │
│                                                                │
│  ──────────────────────────────────────                        │
│  Horarios de consulta                                          │
│                                                                │
│  Lunes      8:00 AM - 12:00 PM                                │
│  Martes     2:00 PM - 6:00 PM                                 │
│  Miercoles  8:00 AM - 12:00 PM                                │
│  Jueves     CERRADO                                            │
│  Viernes    8:00 AM - 5:00 PM                                 │
│  Sabado     8:00 AM - 12:00 PM                                │
│                                                                │
│  ──────────────────────────────────────                        │
│  Evaluaciones de pacientes                                     │
│                                                                │
│  ★★★★★  Maria L. - hace 3 dias                                │
│  "Excelente medico, muy atento y profesional.                  │
│  Me explico todo con paciencia."                               │
│                                                                │
│  ★★★★☆  Pedro G. - hace 1 semana                              │
│  "Buen doctor, aunque la espera fue larga."                    │
│                                                                │
│  [VER TODAS LAS EVALUACIONES]                                  │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐      │
│  │              [  AGENDAR CITA  ]                      │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                │
└────────────────────────────────────────────────────────────────┘

NOTAS DE DISENO:
- El boton AGENDAR CITA aparece dos veces: arriba y abajo (siempre visible)
- En mobile: boton AGENDAR es sticky en la parte inferior de la pantalla
- La foto debe ser profesional; si no sube una, se muestra un avatar
  con las iniciales
- Los seguros son criticos en RD: muchos pacientes eligen medico segun
  su seguro. Este dato debe ser prominente
- Las evaluaciones solo se muestran si hay al menos 3 (para evitar
  sesgo de una sola evaluacion)
- El mapa es interactivo: se puede hacer zoom y obtener direcciones
- "COMO LLEGAR" abre Google Maps/Waze con la direccion
```

---

### 3.3 Pantalla: Seleccion de fecha y hora

```
┌────────────────────────────────────────────────────────────────┐
│ [< Volver]         Agendar cita                               │
│                                                                │
│  Dr. Carlos Martinez - Cardiologia                             │
│                                                                │
│  ──────────────────────────────────────                        │
│  Selecciona una fecha:                                         │
│                                                                │
│          Febrero 2026                                          │
│  [< ]  Lu  Ma  Mi  Ju  Vi  Sa  Do  [ >]                       │
│        16  17  18  19  20  21  22                              │
│        ██  --  ██  --  ██  ██  --                              │
│        23  24  25  26  27  28  01                              │
│        ██  --  ██  --  ██  ██  --                              │
│                                                                │
│  ██ = Disponible (color primario, tocable)                     │
│  -- = No disponible / cerrado (gris, no tocable)              │
│                                                                │
│  ──────────────────────────────────────                        │
│  Horarios disponibles para Lunes 16:                           │
│                                                                │
│  MANANA                                                        │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                 │
│  │ 8:00   │ │ 8:20   │ │ 8:40   │ │ 9:00   │                 │
│  └────────┘ └────────┘ └────────┘ └────────┘                 │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                 │
│  │ 9:20   │ │ 9:40   │ │ 10:00  │ │ 10:20  │                 │
│  └────────┘ └────────┘ └────────┘ └────────┘                 │
│  ┌────────┐ ┌────────┐ ┌────────┐                              │
│  │ 10:40  │ │ 11:00  │ │ 11:20  │                              │
│  └────────┘ └────────┘ └────────┘                              │
│                                                                │
│  * Solo se muestran horarios disponibles                       │
│  * Los horarios ocupados simplemente no aparecen               │
│                                                                │
│  Al tocar un horario (ej. 9:00):                               │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  Lunes 16 de febrero, 9:00 AM                        │      │
│  │  Dr. Carlos Martinez - Cardiologia                    │      │
│  │                                                       │      │
│  │           [  CONFIRMAR HORARIO  ]                     │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                │
└────────────────────────────────────────────────────────────────┘

NOTAS DE DISENO:
- En mobile: el calendario ocupa todo el ancho, los horarios se
  ven como una cuadricula de 3 columnas
- Los horarios son botones grandes (minimo 44x44px) para facilitar
  el toque en pantallas tactiles
- No se muestran los ocupados en gris. Simplemente no estan.
  Esto reduce ruido visual y la sensacion de "no hay espacio"
- Si un dia tiene muy pocos horarios, se indica: "Quedan 2 horarios"
  (genera sentido de urgencia ligero sin ser agresivo)
- Vista alternativa: "Proximos horarios disponibles" que muestra
  una lista cronologica de los 10 proximos slots libres
  (para el paciente que dice "lo antes posible")
```

---

### 3.4 Pantalla: Confirmacion de cita

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  ┌─────────────────────────────────────────────┐               │
│  │                                             │               │
│  │              ✓ CITA CONFIRMADA              │               │
│  │                                             │               │
│  └─────────────────────────────────────────────┘               │
│                                                                │
│  Dr. Carlos Martinez                                           │
│  Cardiologia                                                   │
│                                                                │
│  Fecha:    Lunes 16 de febrero, 2026                           │
│  Hora:     9:00 AM                                             │
│  Lugar:    Centro Medico Dominicano                            │
│            Av. 27 de Febrero #45, 2do piso                     │
│            Piantini, Santo Domingo                             │
│                                                                │
│  Paciente: Maria Rodriguez                                     │
│  Telefono: 809-555-1234                                        │
│                                                                │
│  ──────────────────────────────────────                        │
│                                                                │
│  ┌─────────────────────────────────────────────┐               │
│  │  Recibiras una confirmacion por WhatsApp    │               │
│  │  en los proximos minutos.                   │               │
│  └─────────────────────────────────────────────┘               │
│                                                                │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ AGREGAR AL       │  │ VER EN MAPA      │                    │
│  │ CALENDARIO       │  │                  │                    │
│  └──────────────────┘  └──────────────────┘                    │
│                                                                │
│  ┌──────────────────────────────────────────┐                  │
│  │ COMPARTIR POR WHATSAPP                   │                  │
│  └──────────────────────────────────────────┘                  │
│                                                                │
│  ──────────────────────────────────────                        │
│  Necesitas cambiar algo?                                       │
│  [Cancelar cita]  [Reagendar]                                  │
│                                                                │
└────────────────────────────────────────────────────────────────┘

NOTAS DE DISENO:
- El check verde es grande y satisfactorio (microinteraccion: animacion
  de check apareciendo)
- "Agregar al calendario" genera un archivo .ics que funciona con
  Google Calendar, Apple Calendar, Outlook
- "Compartir por WhatsApp" envia un mensaje preformateado:
  "Tengo cita con Dr. Martinez el lunes 16 a las 9am en
  Centro Medico Dominicano"
- "Cancelar" y "Reagendar" son links discretos, no botones prominentes
  (no queremos incentivar cancelaciones)
- En la version mobile, los botones son full-width para facil toque
```

---

### 3.5 Pantalla: Dashboard de la secretaria (agenda del dia)

```
URL: turnomedico.do/dashboard (requiere login)

┌────────────────────────────────────────────────────────────────────────┐
│ [Logo] TurnoMedico        Dr. Martinez | Yolanda (Secretaria) [Salir] │
│                                                                        │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │  HOY: Miercoles 18 de febrero                                      │ │
│ │  18 pacientes | 14 llegaron | 8 atendidos | 6 en espera | 3 pend. │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ [+ WALK-IN]  [PAUSAR TURNOS]  [BUSCAR PACIENTE]  [VER SEMANA]        │
│                                                                        │
│ ┌──────────────────────────────────────────────────────────────────┐   │
│ │ EN CONSULTA AHORA                                                │   │
│ │ ┌─────────────────────────────────────────────────────────────┐  │   │
│ │ │ #9  MARIA LOPEZ  |  9:00 AM  |  Seguimiento ECG  | 12 min │  │   │
│ │ │                                          [TERMINAR TURNO]  │  │   │
│ │ └─────────────────────────────────────────────────────────────┘  │   │
│ └──────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│ SIGUIENTE:                                                             │
│ ┌──────────────────────────────────────────────────────────────────┐   │
│ │ #10  Pedro Gomez  |  9:20 AM  |  LLEGO (hace 15 min)  [LLAMAR] │   │
│ └──────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│ EN ESPERA (5):                                                         │
│ ┌──────────────────────────────────────────────────────────────────┐   │
│ │ #11  Ana Ramirez      |  9:40 AM  |  LLEGO      | [LLAMAR]  [x]│   │
│ │ #12  Jose Hernandez   | 10:00 AM  |  LLEGO      | [LLAMAR]  [x]│   │
│ │ #13  Carmen Diaz      | 10:20 AM  |  LLEGO      | [LLAMAR]  [x]│   │
│ │ #14  Luis Torres      | 10:40 AM  |  PENDIENTE  | [LLEGO]   [x]│   │
│ │ W1   Roberto Pena     |  WALK-IN  |  LLEGO      | [LLAMAR]  [x]│   │
│ └──────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│ PROXIMOS (no han llegado):                                             │
│ ┌──────────────────────────────────────────────────────────────────┐   │
│ │ #15  Fernando Gil     | 11:00 AM  |  CONFIRMADO | [LLEGO]      │   │
│ │ #16  Diana Castillo   | 11:20 AM  |  CONFIRMADO | [LLEGO]      │   │
│ │ #17  Marco Antonio    | 11:40 AM  |  PENDIENTE  | [LLEGO]      │   │
│ │ #18  Sofia Reyes      | 12:00 PM  |  PENDIENTE  | [LLEGO]      │   │
│ └──────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│ COMPLETADOS HOY (8):  [Ver detalle]                                    │
│  #1 Juan Perez (8:00) ✓  #2 Ana Feliz (8:20) ✓  ...                  │
│                                                                        │
│ NO VINIERON (2):                                                       │
│  #5 Pedro Santos (8:40) ✗  #7 Laura Mejia (9:00) ✗                   │
│                                                                        │
│ ──────────────────────────────────────────────────────────────         │
│ ┌──────────────────────────────────────────────────────────────────┐   │
│ │          [ ◄◄ ANTERIOR ]     [ SIGUIENTE ►► ]                    │   │
│ │               Boton grande, siempre visible                      │   │
│ └──────────────────────────────────────────────────────────────────┘   │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘

NOTAS DE DISENO CRITICAS PARA LA SECRETARIA:

1. JERARQUIA VISUAL CLARA:
   - "En consulta ahora" = destacado con fondo morado/azul
   - "Siguiente" = destacado con borde verde
   - "En espera" = lista normal
   - "Proximos" = texto mas claro
   - "Completados" = colapsado por defecto (gris)

2. ACCIONES DE UN SOLO CLIC:
   - [LLEGO] = marca al paciente como presente (un toque)
   - [LLAMAR] = marca al paciente como "en consulta" (un toque)
   - [SIGUIENTE] = cierra turno actual y llama al siguiente (un toque)
   - [x] = menu contextual: cancelar, reagendar, no-show, notas

3. INFORMACION CONTEXTUAL:
   - Se muestra cuanto tiempo lleva esperando cada paciente
   - Se muestra el motivo de consulta (si lo puso al agendar)
   - Los walk-ins tienen etiqueta naranja "WALK-IN"
   - Los pacientes nuevos (primera vez) tienen etiqueta "NUEVO"

4. BUSQUEDA RAPIDA:
   - El campo de busqueda en la parte superior busca por nombre
     O por telefono. Escribir "809" ya empieza a filtrar.

5. RESPONSIVE:
   - En tablet: layout igual pero botones mas grandes
   - En celular: vista simplificada tipo lista con acciones swipe
```

---

### 3.6 Pantalla: Panel del medico (resumen)

```
URL: turnomedico.do/medico (requiere login)

┌────────────────────────────────────────────────────────────────┐
│ [Logo]                            Dr. Martinez [Menu] [Salir] │
│                                                                │
│  Buenos dias, Dr. Martinez                                     │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  HOY: Miercoles 18 de febrero                        │      │
│  │                                                       │      │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │      │
│  │  │   18    │  │    8    │  │   10    │              │      │
│  │  │ Total   │  │Atendidos│  │ Faltan  │              │      │
│  │  └─────────┘  └─────────┘  └─────────┘              │      │
│  │                                                       │      │
│  │  Hora inicio: 8:00 AM                                 │      │
│  │  Hora estimada fin: 4:40 PM                           │      │
│  │  Tiempo promedio/paciente: 18 min                     │      │
│  │  Atraso acumulado: +25 min                            │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                │
│  PACIENTE ACTUAL:                                              │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  #9 - Maria Lopez                                    │      │
│  │  Motivo: Seguimiento de electrocardiograma            │      │
│  │  Nota de Yolanda: "Viene por resultados de labs       │      │
│  │  del 10 de febrero. Paciente recurrente."             │      │
│  │  Seguro: ARS Humano                                   │      │
│  │  Historial: 3ra visita (ultima: 10/01/2026)           │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                │
│  PROXIMOS 3:                                                   │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  #10 Pedro Gomez     | Dolor toracico | NUEVO       │      │
│  │  #11 Ana Ramirez     | Control anual  | Recurrente  │      │
│  │  #12 Jose Hernandez  | Palpitaciones  | NUEVO       │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                │
│  ──────────────────────────────────────                        │
│  ESTA SEMANA:                                                  │
│  Lu: 18 pac | Ma: 12 pac | Mi: HOY | Ju: -- | Vi: 15 pac     │
│                                                                │
│  ──────────────────────────────────────                        │
│  ESTE MES:                                                     │
│  Pacientes atendidos: 187                                      │
│  Promedio diario: 16.2                                         │
│  Walk-ins: 34 (18%)                                            │
│  No-shows: 12 (6%)                                             │
│  Evaluacion promedio: 4.7/5                                    │
│                                                                │
│  ──────────────────────────────────────                        │
│  ACCESOS RAPIDOS:                                              │
│  [Mi perfil publico]  [Configurar horarios]  [Estadisticas]   │
│  [Compartir mi link]  [Mi secretaria]        [Facturacion]    │
│                                                                │
└────────────────────────────────────────────────────────────────┘

NOTAS DE DISENO:
- Esta pantalla esta optimizada para REVISION RAPIDA entre pacientes
- Los 3 numeros grandes (Total, Atendidos, Faltan) son lo primero
  que el medico ve -- responden su pregunta mas frecuente
- "Nota de Yolanda" es un campo libre donde la secretaria puede
  escribir contexto. Es MUY valioso para el medico y diferenciador.
- "NUEVO" como etiqueta le avisa al medico que necesita mas tiempo
  (primera consulta)
- El medico NO gestiona turnos desde aqui (eso es responsabilidad
  de la secretaria). Solo consulta.
- En mobile: los 3 numeros grandes ocupan todo el ancho. El resto
  se accede con scroll.
```

---

### 3.7 Pantalla: Sala de espera (TV/display)

(Ver seccion 5 para el diseno detallado con ASCII art)

---

### 3.8 Pantalla: Onboarding del medico

```
BARRA DE PROGRESO VISUAL:

  ● Cuenta ─── ● Perfil ─── ○ Consultorio ─── ○ Horarios ─── ○ Plan
  ━━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

[Cada paso se muestra en una pantalla limpia, sin distracciones]

PANTALLA PASO 2 (ejemplo - Perfil):

┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  Paso 2 de 5: Tu perfil profesional                            │
│  ━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░░░░ (40%)                │
│                                                                │
│  Asi te veran tus pacientes:                                   │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐      │
│  │                                                       │      │
│  │  [  SUBIR FOTO  ]   Dr. Carlos Martinez               │      │
│  │  [  o tomar foto]   Cardiologia                        │      │
│  │                     ★★★★★                              │      │
│  │                                                       │      │
│  └──────────────────────────────────────────────────────┘      │
│  (Vista previa en tiempo real)                                 │
│                                                                │
│  Exequatur (numero de licencia): [___________________]         │
│                                                                │
│  Sub-especialidades: (selecciona las que apliquen)             │
│  [x] Electrofisiologia cardiaca                                │
│  [ ] Cardiopatias congenitas                                   │
│  [ ] Ecocardiografia                                           │
│  [ ] Cardiologia intervencionista                              │
│  [+ Agregar otra]                                              │
│                                                                │
│  Seguros que aceptas:                                          │
│  [x] ARS Humano                                                │
│  [x] Senasa                                                    │
│  [x] Universal                                                 │
│  [ ] Mapfre Salud                                              │
│  [ ] ARS Reservas                                              │
│  [ ] SEMMA                                                     │
│  [+ Ver todos los seguros]                                     │
│                                                                │
│  Precio de consulta: RD$ [2,500]                               │
│  [ ] No mostrar precio en mi perfil                            │
│                                                                │
│  Descripcion breve (los pacientes leen esto):                  │
│  [                                                    ]        │
│  [                                                    ]        │
│  0/200 caracteres                                              │
│                                                                │
│                                                                │
│  [COMPLETAR DESPUES]                      [SIGUIENTE →]        │
│                                                                │
└────────────────────────────────────────────────────────────────┘

NOTAS DE DISENO:
- La vista previa del perfil se actualiza en tiempo real mientras
  el medico llena los campos (gratificacion visual inmediata)
- Cada paso tiene un boton "Completar despues" para no bloquear
  el onboarding (solo paso 1 y 4 son obligatorios)
- Los seguros estan pre-cargados con los mas comunes en RD
- El exequatur es importante para credibilidad (pero no se valida
  automaticamente en v1 -- validacion manual por admin)
- "Sub-especialidades" usa checkboxes, no texto libre (evita errores
  y facilita la busqueda por los pacientes)
```

---

### 3.9 Pantalla: Admin de la plataforma

```
URL: turnomedico.do/admin (acceso restringido)

┌────────────────────────────────────────────────────────────────────────┐
│ [Logo] TurnoMedico ADMIN              [Soporte] [Config] [Salir]      │
│                                                                        │
│ ┌──────────┐                                                           │
│ │ SIDEBAR  │  DASHBOARD GENERAL                                        │
│ │          │                                                           │
│ │ Dashboard│  ┌────────────┐ ┌────────────┐ ┌────────────┐            │
│ │ Medicos  │  │   47       │ │  1,238     │ │   89%      │            │
│ │ Pacientes│  │ Medicos    │ │ Citas este │ │ Tasa de    │            │
│ │ Planes   │  │ activos    │ │ mes        │ │ asistencia │            │
│ │ Facturas │  └────────────┘ └────────────┘ └────────────┘            │
│ │ Soporte  │                                                           │
│ │ Metricas │  ┌────────────┐ ┌────────────┐ ┌────────────┐            │
│ │ Config   │  │   12       │ │  RD$       │ │   4.6/5    │            │
│ │          │  │ Medicos    │ │  58,500    │ │ NPS        │            │
│ │          │  │ nuevos     │ │ Revenue    │ │ Secretarias│            │
│ │          │  │ este mes   │ │ este mes   │ │            │            │
│ │          │  └────────────┘ └────────────┘ └────────────┘            │
│ │          │                                                           │
│ │          │  ──────────────────────────────────────                   │
│ │          │  MEDICOS QUE NECESITAN ATENCION:                          │
│ │          │                                                           │
│ │          │  ⚠ Dr. Perez - No ha usado el sistema en 14 dias         │
│ │          │  ⚠ Dra. Familia - Secretaria reporto problemas           │
│ │          │  ⚠ Dr. Santos - Plan vence en 3 dias, no ha renovado     │
│ │          │                                                           │
│ │          │  ──────────────────────────────────────                   │
│ │          │  GRAFICO: Citas por dia (ultimos 30 dias)                 │
│ │          │                                                           │
│ │          │  █                                                        │
│ │          │  █ █     █                                                │
│ │          │  █ █   █ █ █                                              │
│ │          │  █ █ █ █ █ █ █   █ █                                      │
│ │          │  █ █ █ █ █ █ █ █ █ █ █ ...                                │
│ │          │  ─────────────────────────                                │
│ │          │  Feb 1                    Feb 18                          │
│ │          │                                                           │
│ │          │  ──────────────────────────────────────                   │
│ │          │  CANALES DE AGENDAMIENTO:                                 │
│ │          │  Web directa: 45%                                         │
│ │          │  Link del medico: 30%                                     │
│ │          │  Walk-in (secretaria): 20%                                │
│ │          │  WhatsApp bot: 5%                                         │
│ │          │                                                           │
│ └──────────┘                                                           │
│                                                                        │
│  ──────────────────────────────────────                                │
│  LISTA DE MEDICOS:                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Medico          │ Plan       │ Citas/mes │ Ultimo uso │ Estado │   │
│  ├─────────────────┼────────────┼───────────┼────────────┼────────┤   │
│  │ Dr. Martinez    │ Profesional│ 187       │ Hoy        │ Activo │   │
│  │ Dra. Feliz      │ Premium    │ 142       │ Hoy        │ Activo │   │
│  │ Dr. Perez       │ Basico     │ 23        │ 14 dias    │ ⚠ Inac│   │
│  │ Dra. Santos     │ Profesional│ 98        │ Ayer       │ Activo │   │
│  └─────────────────┴────────────┴───────────┴────────────┴────────┘   │
│  [Buscar medico] [Filtrar por plan] [Exportar CSV]                    │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘

NOTAS DE DISENO:
- KPIs principales arriba: medicos activos, citas, tasa de asistencia
- "NPS de secretarias" es una metrica critica: si la secretaria esta
  contenta, el medico se queda. Si no, se van ambos.
- "Medicos que necesitan atencion" es una lista proactiva para
  evitar churn. El admin debe contactar a estos medicos.
- Los graficos muestran tendencias de crecimiento (validacion del modelo).
- La tabla de medicos permite drill-down al detalle de cada uno.
```

---

## 4. Sistema de Notificaciones

### 4.1 Tabla completa de notificaciones

| # | Evento | Canal | Destinatario | Momento | Contenido |
|---|--------|-------|-------------|---------|-----------|
| 1 | Cita agendada | WhatsApp | Paciente | Inmediato (< 1 min) | "Hola [Nombre]! Tu cita con [Dr.] ha sido confirmada: [Fecha], [Hora], [Direccion]. Responde 1=Confirmar, 2=Cancelar, 3=Reagendar" |
| 2 | Cita agendada | Email | Secretaria | Inmediato | "Nueva cita: [Paciente], [Fecha], [Hora], [Motivo]" |
| 3 | Cita agendada | Push/Email | Medico | Resumen al final del dia o si es para hoy/manana | "[X] nuevas citas agendadas para [Fecha]" |
| 4 | Recordatorio 24h | WhatsApp | Paciente | 24 horas antes de la cita | "Hola [Nombre], te recordamos tu cita manana [Dia] a las [Hora] con [Dr.] en [Direccion]. Responde 1=Confirmar, 2=Cancelar" |
| 5 | Recordatorio 1h | WhatsApp | Paciente | 1 hora antes de la cita | "Hola [Nombre], tu cita con [Dr.] es en 1 hora ([Hora]). Direccion: [Direccion]. Te esperamos!" |
| 6 | Resumen de manana | WhatsApp | Secretaria | 7:00 PM del dia anterior | "Manana tienes [X] pacientes programados. [Y] confirmados, [Z] pendientes. Abre tu dashboard para ver el detalle." |
| 7 | Paciente llego | Dashboard (visual) | Secretaria | Tiempo real | El dashboard se actualiza: estado del paciente cambia a "LLEGO" |
| 8 | Faltan 2 turnos | WhatsApp | Paciente | Cuando faltan 2 pacientes antes | "[Nombre], faltan 2 pacientes para tu turno con [Dr.]. Preparate!" |
| 9 | Es tu turno | WhatsApp | Paciente | Cuando es su turno | "[Nombre], es tu turno! Pasa al consultorio del [Dr.]." |
| 10 | Cita cancelada por paciente | WhatsApp + Dashboard | Secretaria | Inmediato | "El paciente [Nombre] cancelo su cita de [Fecha] [Hora]. El horario queda disponible." |
| 11 | Cita cancelada por consultorio | WhatsApp | Paciente | Inmediato | "Hola [Nombre], lamentamos informarte que tu cita del [Fecha] a las [Hora] con [Dr.] ha sido cancelada. Responde 1 para reagendar." |
| 12 | No-show detectado | Dashboard | Secretaria | 15 min despues de la hora | El sistema marca automaticamente "NO VINO" y notifica en el dashboard |
| 13 | Walk-in registrado | WhatsApp (opcional) | Paciente walk-in | Si dio su numero | "Se le ha asignado el turno #[N] con [Dr.]. Pacientes antes: [X]. Tiempo estimado: ~[Y] min." |
| 14 | Evaluacion post-cita | WhatsApp | Paciente | 2 horas despues de la cita | "Hola [Nombre], como fue tu experiencia con [Dr.]? Califica del 1 al 5: [link]" |
| 15 | Resumen semanal | Email | Medico | Lunes 8:00 AM | "Dr. [Nombre], la semana pasada atendio [X] pacientes. Evaluacion promedio: [Y]. Tasa de no-show: [Z]%." |
| 16 | Factura/pago | Email | Medico | Dia 1 de cada mes | "Dr. [Nombre], su factura de TurnoMedico para [Mes]: RD$ [Monto]. [Link de pago]" |
| 17 | Plan por vencer | WhatsApp + Email | Medico | 7 dias y 3 dias antes | "Dr. [Nombre], su plan [Plan] vence el [Fecha]. Renueve para seguir usando TurnoMedico. [Link]" |

### 4.2 Reglas de notificacion

```
REGLAS GENERALES:
1. Nunca enviar mas de 5 WhatsApp al mismo paciente por una sola cita
   (confirmacion + recordatorio 24h + recordatorio 1h + turno proximo + evaluacion)
2. Horario de envio: solo entre 7:00 AM y 9:00 PM
3. Si el paciente responde "PARAR" o "STOP", se desactivan notificaciones
4. Los walk-ins reciben maximo 2 mensajes (turno asignado + evaluacion)
5. La secretaria puede silenciar notificaciones por email si prefiere
   solo ver el dashboard

PRIORIDAD DE CANALES:
1. WhatsApp (95% de penetracion en RD, gratis para el paciente)
2. SMS (fallback si WhatsApp no entrega en 5 minutos)
3. Email (solo para medicos, secretarias y documentos formales)

TONO Y ESTILO:
- Tutear al paciente joven ("tu cita", "te recordamos")
- Ustedear al paciente que se registro con titulo ("Don", "Dona")
  o al paciente mayor (por defecto para 50+)
- Maximo 160 caracteres en la primera linea (visible en la
  notificacion sin abrir el mensaje)
- Incluir siempre: nombre del medico + hora + direccion
```

---

## 5. Diseno de la Pantalla de Sala de Espera

### 5.1 Layout visual (ASCII mockup completo)

```
MODO DIA (fondo blanco/gris claro):

┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│                  ┌──────────────────────────────────┐                    │
│                  │  [LOGO CONSULTORIO / DR.]         │                    │
│                  │  Centro Medico Dominicano          │                    │
│                  │  Dr. Carlos Martinez - Cardiologia │                    │
│                  └──────────────────────────────────┘                    │
│                                                                          │
│  ═══════════════════════════════════════════════════════════════════════  │
│                                                                          │
│      TURNO ACTUAL                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │                                                                  │    │
│  │         #9                          MARIA L.                     │    │
│  │                                                                  │    │
│  │                  PASE AL CONSULTORIO                              │    │
│  │                                                                  │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                   (Fondo azul medico, letras blancas grandes)            │
│                                                                          │
│  ═══════════════════════════════════════════════════════════════════════  │
│                                                                          │
│      EN ESPERA                                                           │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐      │
│  │  SIGUIENTE →   #10     PEDRO G.              Llegó 9:05 AM    │      │
│  ├────────────────────────────────────────────────────────────────┤      │
│  │                 #11     ANA R.                Llegó 9:10 AM    │      │
│  ├────────────────────────────────────────────────────────────────┤      │
│  │                 #12     JOSE H.               Llegó 9:15 AM    │      │
│  ├────────────────────────────────────────────────────────────────┤      │
│  │                 #13     CARMEN D.             Llegó 9:22 AM    │      │
│  ├────────────────────────────────────────────────────────────────┤      │
│  │                 #14     LUIS T.               Llegó 9:30 AM    │      │
│  └────────────────────────────────────────────────────────────────┘      │
│                                                                          │
│  ═══════════════════════════════════════════════════════════════════════  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  ANUNCIO: Recuerde traer sus examenes de laboratorio a su       │    │
│  │  proxima consulta. Puede agendarla en turnomedico.do/dr-martinez│    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────   │
│  10:15 AM                      Miercoles 18 de febrero, 2026            │
│                                          Pacientes atendidos hoy: 8     │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘


MODO NOCHE (fondo oscuro #1a1a2e):

┌──────────────────────────────────────────────────────────────────────────┐
│  (Fondo: #1a1a2e / Azul muy oscuro)                                     │
│                                                                          │
│                  ┌──────────────────────────────────┐                    │
│                  │  [LOGO CONSULTORIO / DR.]         │                    │
│                  │  Centro Medico Dominicano          │                    │
│                  │  Dr. Carlos Martinez - Cardiologia │                    │
│                  └──────────────────────────────────┘                    │
│                  (Letras en blanco/gris claro)                           │
│                                                                          │
│      TURNO ACTUAL                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │                                                                  │    │
│  │  (Fondo: #16213e / Azul oscuro, borde lateral verde #00d4aa)     │    │
│  │         #9                          MARIA L.                     │    │
│  │                  PASE AL CONSULTORIO                              │    │
│  │                                                                  │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│      EN ESPERA (texto en gris claro #b0b0b0)                            │
│  ┌────────────────────────────────────────────────────────────────┐      │
│  │  SIGUIENTE →   #10     PEDRO G.             (texto #e0e0e0)   │      │
│  ├────────────────────────────────────────────────────────────────┤      │
│  │                 #11     ANA R.              (lineas en #2a2a3e)│      │
│  ├────────────────────────────────────────────────────────────────┤      │
│  │                 #12     JOSE H.                                │      │
│  └────────────────────────────────────────────────────────────────┘      │
│                                                                          │
│  (Anuncios con fondo #16213e, texto blanco)                             │
│  (Reloj y fecha en gris claro)                                          │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Informacion que muestra

```
ZONA SUPERIOR (Header):
  - Logo del consultorio (personalizable) o logo de TurnoMedico
  - Nombre del centro medico / consultorio
  - Nombre del medico y especialidad

ZONA PRINCIPAL (Turno actual):
  - Numero de turno (grande, visible desde 5+ metros)
  - Nombre del paciente (solo primer nombre + inicial del apellido
    por privacidad: "MARIA L.", no "MARIA LOPEZ HERNANDEZ")
  - Mensaje: "PASE AL CONSULTORIO" (con animacion de pulso suave)

ZONA MEDIA (Cola de espera):
  - Lista de los proximos 5-8 pacientes en espera
  - Para cada uno: numero de turno + nombre (formato privado)
  - El siguiente paciente esta destacado con "SIGUIENTE →"
  - Hora de llegada (opcional, configurable por el medico)

ZONA DE ANUNCIOS (configurable):
  - Area para mensajes personalizados del consultorio
  - Ejemplos: "Traer examenes", "Nuevos horarios", "Pagos por tarjeta"
  - Rotacion automatica si hay multiples anuncios (cada 15 segundos)
  - El medico/secretaria configura los anuncios desde el dashboard

ZONA INFERIOR (Footer):
  - Hora actual (reloj en tiempo real)
  - Fecha
  - "Pacientes atendidos hoy: [X]" (genera sensacion de progreso)
  - Logo discreto de TurnoMedico (branding de la plataforma)
```

### 5.3 Paleta de colores y estilo visual

```
MODO DIA:
  - Fondo principal: #F5F7FA (gris muy claro, no blanco puro)
  - Turno actual (fondo): #1565C0 (azul medico profesional)
  - Turno actual (texto): #FFFFFF
  - Cola de espera (fondo): #FFFFFF
  - Cola de espera (texto): #333333
  - "Siguiente" (destacado): #E8F5E9 (verde claro)
  - Anuncios (fondo): #FFF3E0 (naranja claro, destaca sin gritar)
  - Anuncios (texto): #E65100
  - Footer: #90A4AE (gris medio)

MODO NOCHE:
  - Fondo principal: #1A1A2E (azul muy oscuro)
  - Turno actual (fondo): #16213E (azul oscuro, borde verde #00D4AA)
  - Turno actual (texto): #FFFFFF
  - Cola de espera (fondo): #1A1A2E
  - Cola de espera (texto): #E0E0E0
  - Separadores: #2A2A3E
  - Anuncios (fondo): #16213E
  - Anuncios (texto): #FFD54F (amarillo suave)
  - Footer: #666666

TIPOGRAFIA:
  - Numeros de turno: Sans-serif bold, 120px+ (legible a distancia)
  - Nombres: Sans-serif medium, 48px+
  - "Pase al consultorio": Sans-serif bold, 36px
  - Cola de espera: Sans-serif regular, 28px
  - Anuncios: Sans-serif regular, 24px
  - Reloj: Sans-serif light, 20px

FUENTES RECOMENDADAS:
  - Inter (moderna, legible, open source)
  - Alternativa: Roboto, Nunito
  - Evitar fuentes serif (no transmiten lo "digital/moderno")
```

### 5.4 Actualizacion en tiempo real

```
TECNOLOGIA:
  - WebSocket (conexion persistente bidireccional)
  - Fallback: Server-Sent Events (SSE) si WebSocket no es soportado
  - Fallback final: Polling cada 5 segundos (para navegadores viejos)

EVENTOS QUE ACTUALIZAN LA PANTALLA:
  1. Nuevo turno llamado → animacion de transicion (slide up)
  2. Paciente llega → aparece en la cola (fade in)
  3. Paciente se va (no-show/cancelacion) → desaparece (fade out)
  4. Anuncio cambia → cross-fade suave
  5. Reloj → se actualiza cada segundo

ANIMACIONES:
  - Cambio de turno: el turno actual hace slide hacia arriba y desaparece.
    El siguiente sube y se expande en la zona principal. Duracion: 800ms.
    Easing: ease-in-out.
  - Nuevo paciente en cola: fade-in desde abajo. Duracion: 500ms.
  - Parpadeo suave en "PASE AL CONSULTORIO": pulso CSS (opacidad
    100% → 80% → 100%) cada 2 segundos. Sutil, no agresivo.

RECONEXION:
  - Si se pierde la conexion a internet:
    → Barra superior roja: "Sin conexion. Reconectando..."
    → Se muestra el ultimo estado conocido (no pantalla en blanco)
    → Reintento automatico cada 3 segundos
    → Al reconectar: sincroniza estado completo inmediatamente
  - Si la conexion se pierde por mas de 5 minutos:
    → Muestra: "Conexion perdida. Consulte con la recepcion."
    → Sigue mostrando el ultimo turno conocido
```

### 5.5 Anuncios del consultorio

```
CONFIGURACION (desde el dashboard de la secretaria o medico):

  Seccion: "Pantalla de sala de espera" > "Anuncios"

  ┌──────────────────────────────────────────────────────────┐
  │ ANUNCIOS PARA LA PANTALLA DE SALA DE ESPERA              │
  │                                                          │
  │ Anuncio 1: [Traiga sus examenes de laboratorio a su     ]│
  │            [proxima consulta.                            ]│
  │            Activo: [Si]  Prioridad: [Alta]               │
  │                                                          │
  │ Anuncio 2: [Ahora aceptamos pagos con tarjeta de        ]│
  │            [credito y transferencia.                     ]│
  │            Activo: [Si]  Prioridad: [Normal]             │
  │                                                          │
  │ Anuncio 3: [Agenda tu proxima cita en                   ]│
  │            [turnomedico.do/dr-martinez                   ]│
  │            Activo: [Si]  Prioridad: [Baja]               │
  │                                                          │
  │ [+ AGREGAR ANUNCIO]                                      │
  │                                                          │
  │ Rotacion: Cada [15] segundos                             │
  │ Mostrar anuncios: [Si]                                   │
  └──────────────────────────────────────────────────────────┘

TIPOS DE ANUNCIO:
  - Texto libre (el mas comun)
  - Promocion: "20% de descuento en chequeo cardiaco completo"
  - Informativo: "Nuevos horarios a partir de marzo"
  - Salud: "Recuerde tomar su medicina a la hora indicada"
  - Link QR: se genera un QR en pantalla que el paciente puede escanear
    (util para: "Agenda tu proxima cita" + QR al perfil del medico)
```

### 5.6 Sonido/campana al cambiar turno

```
CONFIGURACION:
  - Activar sonido: [Si/No] (desactivado por defecto)
  - Tipo de sonido:
    a) Campana suave (tipo recepcion de hotel) - RECOMENDADO
    b) Tono digital (tipo notificacion moderna)
    c) Melodia corta (3 notas ascendentes)
    d) Personalizado (subir MP3, max 3 segundos)
  - Volumen: [Bajo / Medio / Alto]
  - Repetir: [1 vez / 2 veces]

COMPORTAMIENTO:
  - El sonido suena SOLO cuando se llama a un nuevo paciente
    (no cuando alguien se agrega a la cola)
  - Si la pantalla esta en una tablet sin bocinas, no se activa
  - El sonido debe ser profesional y calmante, nunca estridente
  - Duracion maxima: 3 segundos

NOTA TECNICA:
  - El navegador puede bloquear el autoplay de audio
  - Solucion: la secretaria hace un clic inicial en "Activar sonido"
    cuando abre la pantalla por primera vez en el dia
  - Alternativa: usar la Web Audio API para generar el tono
    programaticamente (evita restricciones de autoplay en algunos casos)
```

---

## 6. Estrategia de Adopcion UX

### 6.1 Como hacer que la secretaria adopte el sistema

```
LA SECRETARIA ES EL USUARIO MAS CRITICO DEL SISTEMA.
Si ella no lo usa, el medico tampoco. Si ella vuelve a su libreta,
el sistema fracasa. Toda la estrategia de UX gira alrededor de ella.

PRINCIPIO #1: Ser mas facil que la libreta, no igual, MAS FACIL.

ESTRATEGIAS CONCRETAS:

1. ONBOARDING PERSONALIZADO (no solo un tutorial)
   - Una persona del equipo TurnoMedico visita el consultorio
   - Se sienta con la secretaria 30 minutos
   - Migra la agenda de la libreta al sistema JUNTOS
   - Le muestra las 3 acciones principales: LLEGO, SIGUIENTE, WALK-IN
   - Le deja un "cheat sheet" impreso pegado al lado de la pantalla:
     ┌──────────────────────────────────────┐
     │  TU GUIA RAPIDA                      │
     │                                      │
     │  Paciente llego → toca [LLEGO]       │
     │  Doctor listo   → toca [SIGUIENTE]   │
     │  Sin cita       → toca [+ WALK-IN]   │
     │  Buscar alguien → escribe el nombre  │
     │                                      │
     │  Problemas? Llama a soporte:         │
     │  809-XXX-XXXX (WhatsApp)             │
     └──────────────────────────────────────┘

2. REDUCCION GRADUAL (Libreta → Sistema)
   Semana 1: La secretaria usa AMBOS (libreta + sistema).
             El sistema es "el respaldo".
   Semana 2: La secretaria usa el sistema como principal.
             La libreta es "el respaldo".
   Semana 3+: La secretaria deja la libreta porque el sistema
              le ahorra tiempo.

3. GRATIFICACION INMEDIATA
   - El primer dia: la pantalla de la sala de espera FUNCIONA.
     Los pacientes la ven. El consultorio se ve "moderno".
     La secretaria siente orgullo de que su consultorio tiene
     "tecnologia".
   - Ya no le preguntan "cuantos faltan" -- miran la pantalla.
     Eso SOLO ya es una victoria enorme.

4. SOPORTE POR WHATSAPP
   - La secretaria tiene acceso a soporte DIRECTO por WhatsApp
   - No un chatbot: una persona real que responde en < 5 minutos
   - Esto es critico en las primeras 2 semanas

5. CELEBRAR LOGROS
   - "Felicidades Yolanda! Hoy gestionaste 22 pacientes con
     TurnoMedico. Ya no necesitas la libreta."
   - Resumen semanal con sus estadisticas (hacerla sentir valorada)

6. DISENAR PARA SUS LIMITACIONES
   - Botones grandes (minimo 48px)
   - Texto legible (minimo 16px)
   - Colores de alto contraste
   - No mas de 3 niveles de navegacion
   - No usar iconos sin texto (siempre icono + texto)
   - Confirmacion antes de acciones destructivas (cancelar, eliminar)
   - UNDO disponible para errores (marque "llego" por error → deshacer)
```

### 6.2 Como hacer que los pacientes mayores puedan usarlo

```
PRINCIPIO: El paciente mayor NO necesita usar la app directamente.
El sistema debe funcionar para el SIN que el interactue con tecnologia.

CANALES DE ACCESO PARA PACIENTES MAYORES:

1. UN FAMILIAR AGENDA POR EL
   - La hija/nieta/sobrino entra al sistema y agenda
   - El paciente mayor recibe un WhatsApp simple de confirmacion
   - No necesita tocar nada mas

2. WHATSAPP COMO INTERFAZ UNIVERSAL
   - El paciente mayor ya sabe usar WhatsApp
   - Recibe mensajes claros, con letras normales (no links raros)
   - Puede responder con numeros simples: "1" para confirmar
   - No necesita descargar nada, no necesita crear cuenta

3. LA SECRETARIA LO GESTIONA
   - Muchos pacientes mayores simplemente llaman al consultorio
   - La secretaria usa el sistema para agendar POR ELLOS
   - Es exactamente como funciona hoy con la libreta, pero digital

4. LA PANTALLA DE SALA DE ESPERA
   - Letras GRANDES en la pantalla (120px para numeros, 48px para nombres)
   - Alto contraste (blanco sobre azul, negro sobre blanco)
   - Sin informacion confusa -- solo: turno, nombre, "pase"
   - El paciente mayor ve su nombre en la TV y sabe que le toca

5. TARJETA DE TURNO FISICA (feature futuro v2)
   - La secretaria imprime un ticket termico:
     "TURNO #12 - DON RAFAEL M. - Dr. Martinez"
   - El paciente tiene algo fisico en la mano
   - Cuando suena la campana y ve su numero en la TV, sabe que es el

REGLAS DE COMUNICACION PARA PACIENTES MAYORES:
  - Usar "usted" siempre
  - Mensajes cortos (maximo 3 lineas)
  - No usar abreviaturas
  - No usar links (salvo que sea absolutamente necesario)
  - Incluir la direccion completa (no dan por sentado que saben donde es)
  - Incluir el nombre del doctor siempre (ellos recuerdan al doctor,
    no al "centro medico")
```

### 6.3 Manejo de caida de internet

```
PROBLEMA: En RD, el internet en consultorios puede ser inestable.
Una solucion que depende 100% de internet no es confiable.

ESTRATEGIA: Modo offline basico para la secretaria.

ARQUITECTURA:
  - La app web usa Service Workers + IndexedDB para cache local
  - Al cargar la agenda del dia, se guarda en el dispositivo
  - Las acciones criticas funcionan offline y se sincronizan al volver

FUNCIONALIDADES OFFLINE:

  ┌─────────────────────────────────────────────────────────┐
  │ FUNCIONA OFFLINE                                        │
  │                                                         │
  │ ✓ Ver la agenda del dia (cargada previamente)           │
  │ ✓ Marcar paciente como "llego"                          │
  │ ✓ Avanzar al siguiente turno                            │
  │ ✓ Agregar walk-in (nombre + telefono)                   │
  │ ✓ Marcar no-show / cancelacion                          │
  │ ✓ Ver resumen del dia                                   │
  │                                                         │
  │ NO FUNCIONA OFFLINE                                     │
  │                                                         │
  │ ✗ Recibir nuevas citas agendadas por pacientes          │
  │ ✗ Enviar notificaciones WhatsApp                        │
  │ ✗ Actualizar pantalla de sala de espera en tiempo real  │
  │ ✗ Sincronizar con otros dispositivos                    │
  │                                                         │
  └─────────────────────────────────────────────────────────┘

INDICADORES VISUALES:
  - Cuando hay internet: icono verde de WiFi en la barra superior
  - Cuando NO hay internet:
    → Barra amarilla: "Sin conexion. Trabajando en modo offline.
       Los cambios se sincronizaran cuando vuelva el internet."
    → Todas las acciones que se hagan se guardan localmente
    → Cuando el internet regresa: sincronizacion automatica
    → Barra verde temporal: "Conexion restaurada. Todo sincronizado."

PANTALLA DE SALA DE ESPERA EN MODO OFFLINE:
  - Si la TV esta en el mismo WiFi local que la computadora
    de la secretaria: puede funcionar via red local (sin internet)
  - Si no: muestra el ultimo estado conocido + "Consulte con recepcion"
  - Alternativa v2: la secretaria puede cambiar el turno manualmente
    desde la tablet de la sala de espera

ESCENARIO CRITICO: La secretaria esta a mitad de la manana y se
cae el internet.
  1. La agenda del dia ya esta en su computadora (cache)
  2. Sigue marcando "llego", "siguiente", agregando walk-ins
  3. La pantalla de la sala de espera deja de actualizarse
     → La secretaria vuelve a anunciar verbalmente: "Don Rafael, pase"
     → La pantalla muestra el ultimo turno conocido
  4. Cuando vuelve el internet (5, 10, 30 minutos despues):
     → Todo se sincroniza automaticamente
     → Las notificaciones pendientes se envian
     → La pantalla de sala se actualiza
  5. El dia no se pierde. El trabajo no se pierde.
```

### 6.4 Estrategia de migracion desde la libreta

```
DIA 0 (Instalacion):
  - Se carga en el sistema la agenda de las proximas 2 semanas
    (la secretaria dicta, el equipo TurnoMedico ingresa)
  - Se configura la pantalla de sala de espera
  - Se imprime la guia rapida

SEMANA 1 (Paralelo):
  - La secretaria usa la libreta Y el sistema
  - Todas las citas nuevas se crean en el sistema
  - La secretaria va ganando confianza

SEMANA 2 (Transicion):
  - El sistema es la fuente principal
  - La libreta solo para "por si acaso"
  - La secretaria ya no busca en la libreta, busca en el sistema

SEMANA 3+ (Adopcion):
  - La libreta queda de respaldo emergencia
  - El sistema es la herramienta del dia a dia
  - Los pacientes ya reconocen la pantalla de sala de espera
  - Ya nadie pregunta "cuantos faltan"
```

---

## 7. Diferenciadores UX vs Competencia

### 7.1 Comparativa con Doctoralia y similares

```
┌─────────────────────┬────────────────────┬────────────────────┐
│ Feature             │ Doctoralia /       │ TurnoMedico        │
│                     │ Similares          │ (nuestra propuesta)│
├─────────────────────┼────────────────────┼────────────────────┤
│ Agendar cita online │ Si                 │ Si                 │
│                     │                    │                    │
│ Requiere cuenta     │ Si (email +        │ NO. Solo nombre    │
│ del paciente        │ contrasena)        │ + telefono         │
│                     │                    │                    │
│ Confirmacion por    │ Email + SMS        │ WhatsApp (nativo   │
│ WhatsApp            │ (WhatsApp limitado)│ y principal)       │
│                     │                    │                    │
│ Pantalla de sala    │ NO                 │ SI (diferenciador  │
│ de espera           │                    │ clave)             │
│                     │                    │                    │
│ Gestion de walk-ins │ NO o muy basica    │ SI (feature        │
│                     │                    │ central, 1 toque)  │
│                     │                    │                    │
│ Notificacion "tu    │ NO                 │ SI (por WhatsApp)  │
│ turno es proximo"   │                    │                    │
│                     │                    │                    │
│ Dashboard para      │ Complejo, muchos   │ Simplicidad        │
│ secretaria          │ menus              │ extrema. 3 botones │
│                     │                    │ principales.       │
│                     │                    │                    │
│ Modo offline        │ NO                 │ SI (basico)        │
│                     │                    │                    │
│ Diseno para RD      │ NO (diseno global  │ SI (seguros RD,    │
│                     │ generico)          │ zonas RD, tono     │
│                     │                    │ dominicano)        │
│                     │                    │                    │
│ Onboarding          │ Self-service       │ Asistido (visita   │
│                     │ (el medico solo)   │ al consultorio)    │
│                     │                    │                    │
│ Precio              │ $50-150 USD/mes    │ Desde GRATIS,      │
│                     │                    │ plan pro ~$25/mes  │
│                     │                    │                    │
│ Soporte             │ Ticket/email       │ WhatsApp directo   │
│                     │                    │ con persona real   │
│                     │                    │                    │
│ Evaluaciones post-  │ Si (por email)     │ Si (por WhatsApp,  │
│ consulta            │                    │ mayor tasa resp.)  │
│                     │                    │                    │
│ Reagendar por       │ NO (hay que entrar │ SI (responde "3"   │
│ WhatsApp            │ a la web/app)      │ al WhatsApp)       │
│                     │                    │                    │
│ Tiempo de espera    │ NO                 │ SI (estimacion en  │
│ estimado            │                    │ tiempo real)       │
└─────────────────────┴────────────────────┴────────────────────┘
```

### 7.2 Features unicos para el mercado dominicano

```
1. INTEGRACION PROFUNDA CON WHATSAPP
   - No es un "addon", es el CANAL PRINCIPAL
   - Agendar por WhatsApp (chatbot conversacional v2):
     Paciente: "Hola, quiero cita con Dr. Martinez"
     Bot: "Hola! Fechas disponibles: Lun 16, Mie 18, Vie 20.
           Responde con el dia."
     Paciente: "Miercoles"
     Bot: "Horarios: 8:00, 9:00, 10:00, 11:00. Cual prefieres?"
     Paciente: "9"
     Bot: "Listo! Tu cita es el Mie 18 a las 9:00 AM con
           Dr. Martinez. Nombre completo?"
     Paciente: "Maria Rodriguez"
     Bot: "Confirmado, Maria! Te enviaremos un recordatorio.
           Responde CANCELAR si necesitas cambiar."
   - Reagendar por WhatsApp (sin entrar a ningun sitio web)
   - Evaluacion por WhatsApp (responde 1-5, sin links)

2. SEGUROS MEDICOS DOMINICANOS PRE-CARGADOS
   - ARS Humano, Senasa, Universal, Mapfre Salud, ARS Reservas,
     SEMMA, ARS Futuro, ARS Palic, etc.
   - El paciente puede filtrar medicos por "acepta mi seguro"
   - Esto NO existe en las plataformas globales para RD

3. SOPORTE PARA WALK-INS COMO CIUDADANO DE PRIMERA CLASE
   - En RD, el walk-in es la norma, no la excepcion
   - Doctoralia no maneja walk-ins
   - Nuestro sistema los integra nativamente

4. PANTALLA DE SALA DE ESPERA
   - Ningun competidor en RD ofrece esto
   - Transforma el consultorio visualmente
   - Resuelve el problema #1 de los pacientes: "cuantos faltan?"
   - Es el feature que el medico presume con sus colegas
     (efecto viral organico)

5. LOCALIZACION REAL (no solo traduccion)
   - Formato de telefono dominicano (809/829/849)
   - Zonas y sectores de RD (Piantini, Naco, Gazcue, etc.)
   - Tono de comunicacion dominicano-profesional
   - Precios en RD$ (pesos dominicanos)
   - Horarios tipicos de consultorios en RD
     (incluyendo sabados medio dia)

6. PRECIO ACCESIBLE PARA EL MERCADO RD
   - Plan basico GRATIS (para capturar mercado)
   - Plan profesional a RD$1,500/mes (~$25 USD)
     (Doctoralia cobra $50-150 USD en LATAM)
   - Pago por transferencia bancaria local (no solo tarjeta
     de credito internacional)

7. EFECTO VIRAL POR WHATSAPP
   - Cada confirmacion de cita incluye el link del medico
   - "Compartir por WhatsApp" en la confirmacion
   - Los pacientes comparten el link con familiares naturalmente
   - El medico comparte su link en sus redes sociales y tarjeta
   - Crecimiento organico impulsado por WhatsApp

8. TIEMPO DE ESPERA ESTIMADO
   - Basado en el historial del medico: cuanto se tarda en promedio
   - Se muestra al paciente en la notificacion pre-consulta
   - "Tu turno es el #12. Tiempo estimado de espera: ~35 minutos."
   - Permite que el paciente planifique su dia en vez de sentarse
     a esperar indefinidamente
```

### 7.3 Resumen de la propuesta de valor por persona

```
PARA EL PACIENTE JOVEN:
  "Agenda con tu medico en 60 segundos desde el celular.
   Sin crear cuenta. Sin llamar. Con WhatsApp."

PARA EL PACIENTE MAYOR:
  "Tu familia agenda por ti. Tu solo llegas. La pantalla
   te dice cuando te toca. Asi de facil."

PARA LA SECRETARIA:
  "Deja la libreta. Un clic para marcar que llego. Un clic
   para el siguiente. Y los pacientes dejan de preguntarte
   cuantos faltan."

PARA EL MEDICO:
  "Sabes cuantos pacientes tienes hoy, quienes son, y
   tu consultorio se ve profesional. Todo en tu celular."

PARA EL ADMINISTRADOR:
  "Crece el negocio con metricas reales: medicos activos,
   citas agendadas, retencion, revenue."
```

---

## Apendice A: Glosario de terminos

| Termino | Definicion |
|---------|-----------|
| **Walk-in** | Paciente que llega al consultorio sin cita previa |
| **No-show** | Paciente que tenia cita pero no asistio ni cancelo |
| **Turno** | Numero de orden asignado a un paciente en la cola del dia |
| **Check-in** | Proceso de confirmar la llegada del paciente al consultorio |
| **Exequatur** | Licencia oficial del medico en Republica Dominicana |
| **ARS** | Administradora de Riesgos de Salud (seguro medico en RD) |
| **OTP** | One Time Password (codigo de verificacion enviado por WhatsApp/SMS) |
| **NPS** | Net Promoter Score (indice de satisfaccion del usuario) |
| **SLA** | Service Level Agreement (tiempo de respuesta prometido) |

---

## Apendice B: Metricas de exito UX

| Metrica | Objetivo v1 (3 meses) | Objetivo v2 (6 meses) |
|---------|----------------------|----------------------|
| Tiempo para agendar cita (paciente) | < 90 segundos | < 60 segundos |
| Tiempo para agregar walk-in (secretaria) | < 20 segundos | < 10 segundos |
| Tiempo para avanzar turno (secretaria) | 1 clic (< 2 seg) | 1 clic (< 2 seg) |
| Tasa de adopcion de secretarias (uso diario) | 70% | 90% |
| Tasa de no-show (con recordatorios) | < 15% | < 10% |
| Tasa de evaluacion post-consulta | 20% | 35% |
| NPS de secretarias | > 40 | > 60 |
| NPS de pacientes | > 50 | > 65 |
| Citas agendadas por WhatsApp | 30% | 50% |
| Uso de pantalla de sala de espera | 60% de consultorios | 85% de consultorios |

---

*Documento generado el 26 de febrero de 2026. Version 1.0.*
*Este documento es un borrador vivo que debe actualizarse conforme se validen hipotesis con usuarios reales en Republica Dominicana.*
