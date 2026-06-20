# TurnoMedico - Resumen Ejecutivo

## Plataforma SaaS de Gestion de Turnos Medicos para Republica Dominicana

**Version:** 1.0
**Fecha:** Febrero 2026
**Documentos de respaldo:** 01_analisis_mercado_rd.md | 02_modelo_negocio.md | 03_arquitectura_tecnica.md | 04_analisis_ux_producto.md

---

## 1. Vision del Proyecto

**TurnoMedico** es una plataforma SaaS que digitaliza la gestion de citas y turnos medicos en Republica Dominicana. Los medicos pagan una suscripcion mensual; los pacientes usan el sistema gratis.

**Problema que resuelve:** En RD, la mayoria de los consultorios privados (~5,000-8,000) manejan citas de forma manual: libreta, llamadas telefonicas y "turno por orden de llegada". Esto genera:

- Tiempos de espera de 1-3 horas para el paciente
- Tasa de no-show del 15-20% sin posibilidad de reemplazo
- Secretarias abrumadas con llamadas y conflictos
- Medicos sin visibilidad sobre su agenda ni metricas

**Solucion:** Agenda online 24/7 + gestion de turnos en tiempo real + pantalla de sala de espera + recordatorios por WhatsApp.

---

## 2. Oportunidad de Mercado

### El mercado esta sub-atendido

| Factor | Dato |
|--------|------|
| Medicos registrados en CMD | ~33,772 |
| Medicos con practica privada activa | ~12,000-15,000 |
| Consultorios privados estimados | ~5,000-8,000 |
| Doctoralia opera en RD | **No** |
| Competidor local dominante | **No existe** |
| Penetracion internet en RD | 88.6% |
| Hogares con celular | 94.7% |

### TAM / SAM / SOM

| Metrica | Valor |
|---------|-------|
| **TAM** (mercado total) | $5.7M - $7.2M USD/ano |
| **SAM** (mercado accesible) | ~$3.3M USD/ano (~6,800 medicos) |
| **SOM Ano 1** | $48K - $96K USD (100-200 medicos) |
| **SOM Ano 3** | $384K - $720K USD (800-1,500 medicos) |

### Ventana de oportunidad: 2-3 anos

- Doctoralia no opera en RD (aun)
- La Estrategia Nacional de Salud Digital 2024-2028 impulsa la digitalizacion
- Post-COVID: 150% de aumento en adopcion de telemedicina
- RD esta donde Mexico y Argentina estaban hace 5-7 anos en salud digital

---

## 3. Modelo de Negocio

### Planes de suscripcion (B2B: el medico paga, el paciente usa gratis)

| Plan | Precio/mes (RD$) | Precio/mes (USD) | Target |
|------|------------------|------------------|--------|
| **Freemium** | RD$0 | $0 | Prueba: 30 citas/mes maximo |
| **Basico** | RD$1,500 | ~$25 | Medico individual, agenda + pantalla |
| **Profesional** | RD$2,900 | ~$48 | Multi-consultorio, reportes, pagos online |
| **Clinica** | RD$7,500 | ~$125 | Hasta 5 medicos, gestion centralizada |

### El argumento de venta mas poderoso

> "Si el sistema te evita perder **UNA sola consulta al mes** (RD$2,500), ya se pago solo. Con el Plan Basico (RD$1,500), tienes **ganancia neta de RD$1,000.**"

### Unit Economics

| Metrica | Valor |
|---------|-------|
| ARPU blended | ~$39 USD/mes |
| CAC promedio | ~$40 USD |
| LTV Plan Basico | ~$625 USD |
| LTV Plan Profesional | ~$1,595 USD |
| **LTV/CAC ratio** | **15-40x** (benchmark saludable: 3x) |
| Payback period | 1-2 meses |
| **Break-even** | **~110 medicos pagantes** |

---

## 4. Proyeccion Financiera (3 Anos - Escenario Moderado)

| Metrica | Ano 1 | Ano 2 | Ano 3 |
|---------|-------|-------|-------|
| Medicos pagantes | 120 | 480 | 1,350 |
| MRR (fin de ano) | $4,680 | $20,160 | $60,750 |
| **ARR** | **$56,160** | **$241,920** | **$729,000** |
| Ingresos totales | $28,080 | $148,800 | $486,000 |
| Gastos totales | $40,920 | $77,880 | $146,520 |
| **Resultado** | **-$12,840** | **+$70,920** | **+$339,480** |
| Resultado acumulado | -$12,840 | +$58,080 | +$397,560 |

### Escenarios de inversion

| Escenario | ARR Ano 3 | Resultado acumulado Ano 3 |
|-----------|-----------|---------------------------|
| Conservador | $336,000 | +$61,080 |
| **Moderado** | **$729,000** | **+$397,560** |
| Optimista | $1,500,000 | +$1,016,880 |

---

## 5. Arquitectura y Stack Tecnologico

### Modelo de desarrollo: 1 Senior Developer ($2,000/mes) + Claude AI

| Componente | Tecnologia | Hosting |
|-----------|-----------|---------|
| Frontend Web | Next.js 15 + shadcn/ui + Tailwind CSS | Vercel |
| App Paciente | PWA (no app nativa en MVP) | Vercel |
| Backend API | NestJS 11 + TypeScript + Prisma | Railway |
| Base de Datos | PostgreSQL 16 con Row-Level Security | Railway |
| Cache/Queue | Redis (Upstash) + Bull Queue | Upstash |
| Real-Time | Socket.io (pantalla sala de espera) | Railway |
| SMS | Twilio | Cloud |
| WhatsApp | Twilio WhatsApp Business API | Cloud |
| Pagos | Stripe (+ Azul como alternativa local) | Cloud |

### Multi-tenancy: Row-Level Security (RLS)

Base de datos compartida con aislamiento por Row-Level Security de PostgreSQL. Cada medico/consultorio es un "tenant" con datos completamente aislados. Escala a miles de medicos sin complejidad operativa.

### Modelo de datos: 13 entidades principales

Tenant, DoctorProfile, User, Patient, TenantPatient, Schedule, ScheduleOverride, Appointment, Notification, Review, OfficeConfig, Plan, Subscription, Invoice.

---

## 6. Funcionalidades Clave del MVP

### Para el paciente (gratis)
- Busqueda de medicos por especialidad/zona
- Agenda online 24/7 sin crear cuenta (solo nombre + telefono)
- Confirmacion y recordatorios por WhatsApp (24h y 1h antes)
- Notificacion "tu turno se acerca" cuando esta en sala de espera
- Tiempo total para agendar: **45-60 segundos**

### Para la secretaria
- Dashboard del dia: quien viene, quien llego, quien falta
- Gestion de turnos con **un solo clic**: [LLEGO] → [LLAMAR] → [SIGUIENTE]
- Agregar walk-ins en 15 segundos
- Pantalla de sala de espera en tiempo real (TV/monitor)
- Resumen automatico al final del dia

### Para el medico
- Perfil publico profesional con evaluaciones
- Dashboard con metricas: pacientes/dia, no-shows, tiempos
- App movil para consulta rapida entre pacientes
- Reportes de rendimiento mensual

### Diferenciador clave: Pantalla de Sala de Espera
TV/monitor en la sala que muestra el turno actual y la cola de espera en tiempo real via WebSocket. Actualización automatica cuando la secretaria avanza turnos. Profesionaliza el consultorio y elimina el "cuantos faltan?".

---

## 7. Go-to-Market

### Estrategia: Venta directa consultorio por consultorio

En RD, la venta de tecnologia a medicos requiere visita presencial, demostracion en vivo y relacion de confianza. No se vende por ads online.

| Fase | Periodo | Meta | Estrategia principal |
|------|---------|------|---------------------|
| **Pre-lanzamiento** | Meses -2 a 0 | 15 medicos beta | Red personal, grupo WhatsApp |
| **Fase 1** | Meses 1-6 | 50 medicos | Visitas puerta a puerta en SD |
| **Fase 2** | Meses 7-18 | 500 medicos | Vendedor + ads + alianzas gremios |
| **Fase 3** | Meses 19-36 | 1,500+ medicos | Clinicas + ARS + expansion LATAM |

### Concentracion geografica
- **Ano 1:** Santo Domingo + Santiago (70% de los especialistas)
- **Ano 2:** La Romana, Puerto Plata, San Francisco de Macoris
- **Ano 3:** Cobertura nacional + piloto LATAM (Panama o Costa Rica)

### Alianzas estrategicas clave
- **Colegio Medico Dominicano (CMD):** Acceso a 33,000+ medicos, credibilidad institucional
- **ARS (Humano, Palic, SeNaSa):** Directorio de medicos afiliados, distribucion masiva
- **Sociedades medicas por especialidad:** Endorsement profesional
- **Congresos medicos:** Demo en vivo + registro con descuento

---

## 8. Estrategia de Retencion

### Las 4 capas que evitan cancelaciones

| Capa | Periodo | Mecanismo |
|------|---------|-----------|
| **Valor inmediato** | Dia 1-30 | Menos llamadas, menos caos, pacientes contentos |
| **Habito** | Meses 2-6 | Secretaria usa el sistema diariamente, pacientes se acostumbran |
| **Lock-in positivo** | Meses 6+ | Historial de pacientes, estadisticas, link de reserva compartido |
| **Ecosistema** | Ano 2+ | Directorio publico, integraciones, red de referidos |

### Churn esperado

| Periodo | Churn mensual |
|---------|---------------|
| Meses 1-6 | 6-8% |
| Meses 7-12 | 4-5% |
| Ano 2 | 3-4% |
| Ano 3 | 2-3% |

---

## 9. Fases de Desarrollo

### Modelo: 1 Senior Developer ($2,000/mes) + Claude AI

| Fase | Duracion | Entregables |
|------|----------|-------------|
| **Fase 1 - MVP** | 3.5 meses | Agenda online, gestion de turnos, pantalla sala espera, WhatsApp, registro medico, PWA paciente |
| **Fase 2 - Crecimiento** | 2.5 meses | Directorio publico, evaluaciones, reportes avanzados, pagos online (Stripe/Azul), plan Clinica |
| **Fase 3 - Escalamiento** | 2 meses | API publica, historial clinico basico, multi-moneda, optimizaciones de performance |

**Total: ~8 meses de desarrollo | ~$20,264 USD**

### Costos mensuales de operacion (Ano 1)

| Concepto | USD/mes |
|----------|---------|
| Desarrollador senior | $2,000 |
| Hosting (Railway + Vercel) | $150 |
| WhatsApp Business API | $100 |
| SMS (Twilio) | $50 |
| Herramientas (GitHub, Sentry) | $100 |
| Marketing digital | $500 |
| Legal/Contabilidad | $200 |
| Imprevistos (10%) | $310 |
| **Total mensual** | **$3,410** |
| **Total Ano 1** | **$40,920** |

---

## 10. Riesgos y Mitigacion

| Riesgo | Probabilidad | Mitigacion |
|--------|-------------|-----------|
| Medicos no quieren pagar | Alta | Freemium + "se paga con 1 consulta" + trial 30 dias sin tarjeta |
| Secretarias boicotean el sistema | Media | UX ultra-simple (1 clic), onboarding presencial, posicionar como "herramienta, no amenaza" |
| Entrada de Doctoralia a RD | Media | Ventaja de first-mover, precios 50-70% mas bajos, soporte local personalizado |
| Churn alto (>8% mensual) | Media | Onboarding asistido, reportes de ROI mensual, soporte por WhatsApp |
| Adopcion lenta | Alta | Expectativas conservadoras, runway de 18-24 meses, pivotear si es necesario |

---

## 11. Regulaciones

| Aspecto | Estado | Impacto |
|---------|--------|---------|
| Licencia de software medico | **No requerida** | Un sistema de turnos no es dispositivo medico regulado |
| Registro en SISALRIL | **No requerido** | SISALRIL regula ARS/seguros, no software de gestion |
| Ley 172-13 (Proteccion de datos) | **Cumplir** | Consentimiento, politica de privacidad, seguridad basica |
| Registro mercantil | **Si** | Operacion estandar como empresa SaaS |

**Conclusion regulatoria:** Entorno favorable y de baja complejidad. No hay barreras regulatorias significativas.

---

## 12. Expansion LATAM

### Mercados prioritarios (despues de consolidar RD)

| Prioridad | Pais | Razon principal | Complejidad |
|-----------|------|----------------|-------------|
| 1 | Panama | USD como moneda, cercano culturalmente, mercado pequeno | Baja |
| 2 | Costa Rica | Alta adopcion tecnologica, sistema de salud organizado | Media |
| 3 | Ecuador | USD como moneda, mercado grande, cultura similar | Media |
| 4 | Colombia | Mercado enorme, pero Doctoralia ya opera | Alta |

**Costo de expansion por pais:** ~$3,000-5,000 USD (primeros 3 meses)
**Cuando saltar:** Cuando RD tenga 200+ medicos activos y producto estable

---

## 13. Factores Criticos de Exito

| # | Factor | Importancia |
|---|--------|-------------|
| 1 | **Simplicidad extrema del producto** | Critica - Si la secretaria no lo entiende en 15 min, fracasa |
| 2 | **Ventas presenciales consultorio por consultorio** | Critica - En RD la venta de tech a medicos es presencial |
| 3 | **WhatsApp como canal principal** | Alta - El paciente NO descarga apps, recibe todo por WhatsApp |
| 4 | **Primeros 50 medicos "champions"** | Alta - El boca a boca medico-a-medico es el motor de crecimiento |
| 5 | **Precio accesible con ROI claro** | Alta - "Se paga con una consulta extra al mes" |
| 6 | **Pantalla de sala de espera** | Media-Alta - Diferenciador tangible y visible |
| 7 | **Soporte rapido y humano por WhatsApp** | Alta - En RD se valora el trato personalizado |

---

## 14. Resumen de la Inversion

| Concepto | Monto |
|----------|-------|
| Desarrollo MVP (8 meses) | ~$20,264 |
| Operacion Ano 1 completo | ~$40,920 |
| **Break-even** | **~110 medicos pagantes (mes 10-12)** |
| ARR Ano 3 (moderado) | $729,000 |
| Margen operativo Ano 3 | >50% |
| LTV/CAC ratio | 15-40x |

### Por que invertir ahora

1. **Mercado desatendido:** No hay competidor local dominante. Doctoralia no opera en RD.
2. **Timing perfecto:** Estrategia Nacional de Salud Digital 2024-2028, post-COVID, alta conectividad.
3. **Modelo probado:** Doctoralia demostro que funciona en LATAM. No hay riesgo de modelo; hay riesgo de ejecucion.
4. **Economia favorable:** Se paga solo con 1 consulta extra/mes. Break-even con solo 110 medicos.
5. **Escalable regionalmente:** El mismo sistema sirve para toda LATAM sin cambios mayores.
6. **Ventana de 2-3 anos:** Despues, es probable que lleguen jugadores internacionales.

---

## Indice de Documentos de Soporte

| # | Documento | Contenido |
|---|-----------|-----------|
| 01 | `01_analisis_mercado_rd.md` | Mercado de salud RD, competencia, FODA, TAM/SAM/SOM, regulaciones, tendencias |
| 02 | `02_modelo_negocio.md` | Planes de suscripcion, unit economics, proyecciones 3 anos, go-to-market, retencion |
| 03 | `03_arquitectura_tecnica.md` | Stack tecnologico, modelo de datos (Prisma), APIs (50+ endpoints), WebSockets, fases de desarrollo |
| 04 | `04_analisis_ux_producto.md` | 5 personas, 7 user flows, 9 wireframes, sistema de notificaciones, pantalla sala de espera |

---

*Documento consolidado de los analisis de 4 agentes expertos especializados. Febrero 2026.*
