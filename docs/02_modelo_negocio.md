# TurnoMedico - Modelo de Negocio Completo

## Sistema de Gestion de Turnos Medicos - Republica Dominicana

**Fecha:** Febrero 2026
**Tipo:** SaaS B2B (medicos pagan, pacientes usan gratis)
**Mercado inicial:** Republica Dominicana
**Expansion:** LATAM

---

## 1. Modelo de Negocio

### 1.1 Propuesta de Valor

#### Para el Medico
- **Eliminacion de perdidas por no-show:** Los recordatorios automaticos (WhatsApp/SMS) reducen ausencias entre 25-35%, lo que equivale a recuperar 3-5 consultas semanales perdidas (RD$7,500 - RD$12,500/semana).
- **Mas pacientes por dia:** La agenda optimizada elimina huecos muertos y permite atender 2-4 pacientes adicionales por dia.
- **Imagen profesional:** Pasar de "llame a la secretaria" a un sistema de reserva online 24/7 posiciona al medico como moderno y confiable.
- **Liberacion de tiempo:** Menos llamadas de confirmacion, menos caos de sala de espera, menos quejas de pacientes por esperas largas.
- **Control total:** Dashboard con estadisticas de consultas, ingresos estimados, horarios pico y rendimiento mensual.
- **Reduccion de conflictos:** El sistema de turnos elimina discusiones de "yo llegue primero" en sala de espera.

#### Para el Paciente
- **Reserva 24/7 desde el celular:** Sin depender del horario de la secretaria ni de que conteste el telefono.
- **Transparencia total:** Sabe exactamente a que hora le toca, cuantas personas hay antes, tiempo estimado de espera.
- **Pantalla de sala de espera:** Ve su turno en tiempo real, puede salir a hacer una diligencia y regresar cuando se acerque su turno.
- **Recordatorios automaticos:** WhatsApp/SMS le recuerda su cita 24h y 1h antes.
- **Historial de citas:** Acceso a su historial de visitas, proximas citas programadas.
- **Sin costo:** El paciente nunca paga. Cero friccion.

#### Para la Secretaria/Asistente
- **Fin del caos telefonico:** El 60-70% de las llamadas son para agendar/confirmar citas. El sistema absorbe esa carga.
- **Gestion visual de la agenda:** Ve todo el dia en una pantalla, arrastra y suelta turnos, maneja cancelaciones en un clic.
- **Menos conflictos con pacientes:** El sistema de pantalla en sala de espera elimina las quejas y la presion sobre la secretaria.
- **Control de pagos:** Registro de cobros por consulta, reportes para el medico.
- **Herramienta, no amenaza:** La secretaria sigue siendo indispensable para la atencion presencial. El sistema elimina las tareas repetitivas, no su puesto.

### 1.2 Revenue Streams

| Flujo de Ingreso | Tipo | Prioridad | Timeline |
|---|---|---|---|
| **Suscripcion mensual/anual** | Recurrente | Principal (95% revenue) | Desde Dia 1 |
| **SMS/WhatsApp transaccionales** | Por consumo | Secundario | Desde Dia 1 |
| **Directorio de medicos** | Freemium/Publicidad | Complementario | Mes 6+ |
| **Integraciones premium** | Add-on | Complementario | Ano 2 |
| **Comision por pagos online** | Transaccional | Futuro | Ano 2 |
| **Marketplace de servicios** | Plataforma | Futuro | Ano 3 |
| **White-label para clinicas** | Licencia | Futuro | Ano 3 |

**Detalle de cada flujo:**

1. **Suscripcion mensual/anual:** El core del negocio. El medico paga una cuota fija por acceso a la plataforma.

2. **SMS/WhatsApp transaccionales:** Los recordatorios por WhatsApp Business API y SMS tienen costo por mensaje. Se incluye un paquete base en cada plan y se cobra el excedente (~RD$1.50-2.00 por SMS, ~RD$0.80 por WhatsApp).

3. **Directorio de medicos:** Un directorio publico tipo "Doctoralia lite" donde pacientes buscan medicos por especialidad/zona. Los medicos con plan pago aparecen destacados. Los medicos gratuitos tienen perfil basico.

4. **Integraciones premium:** Conexion con laboratorios, farmacias, ARS (seguros). Cobro por modulo adicional.

5. **Comision por pagos online:** Si el paciente paga la consulta online (tarjeta/transferencia), se cobra 2-3% de comision al medico.

6. **Marketplace:** Laboratorios y farmacias pagan por aparecer como "recomendados" en el sistema del medico.

---

## 2. Planes de Suscripcion para Medicos

### Contexto de Precios (Unit Economics del Medico)

Antes de definir precios, analicemos la capacidad de pago del medico dominicano:

```
Consulta promedio:           RD$2,500 (~USD $42)
Pacientes/dia promedio:      15-20
Dias laborables/mes:         22
Ingreso bruto mensual:       RD$825,000 - RD$1,100,000 (~USD $13,750 - $18,333)

Gastos tipicos del consultorio:
  - Alquiler:                RD$25,000 - RD$60,000
  - Secretaria:              RD$20,000 - RD$30,000
  - Servicios (luz, agua):   RD$5,000 - RD$10,000
  - Insumos:                 RD$10,000 - RD$20,000
  - Total gastos:            RD$60,000 - RD$120,000

Ingreso neto estimado:       RD$700,000 - RD$980,000/mes (~USD $11,600 - $16,300)
```

**Regla de oro:** Una herramienta de gestion debe costar <1% del ingreso bruto del profesional. Para un medico dominicano esto significa **RD$8,000 - RD$11,000/mes maximo.**

**Benchmarks LATAM:**
- Doctoralia Mexico: MXN$1,665-2,749/mes (~USD $83-137/mes)
- Doctoralia Colombia: COP$229,000-379,000/mes (~USD $53-88/mes)
- DrApp Argentina: ARS$16,499/profesional/mes (~USD $16/mes)
- Nimbo: USD$35-75/mes por medico

**Conclusion:** Para RD, los precios deben estar entre USD$15-60/mes dependiendo del plan, equivalente a RD$900-3,600/mes. Esto es entre el 0.08% y 0.43% del ingreso bruto mensual del medico: extremadamente razonable.

---

### Plan Gratuito (Freemium)
**"Para probar sin compromiso"**

| Caracteristica | Incluido |
|---|---|
| Perfil en directorio publico | Si |
| Agenda basica (vista diaria) | Si |
| Hasta 30 citas/mes | Si |
| Recordatorios por email | Si |
| Pantalla sala de espera | No |
| Reportes | No |
| Soporte | Solo email |

- **Precio:** RD$0 / USD$0
- **Ideal para:** Medicos que quieren probar la plataforma, medicos con pocos pacientes, residentes.
- **Proposito estrategico:** Funnel de adquisicion. El medico prueba gratis, se acostumbra, y necesita mas funcionalidades.
- **Limitacion clave:** 30 citas/mes (un medico activo las agota en 2 dias).

---

### Plan Basico
**"Todo lo esencial para digitalizar tu consulta"**

| Caracteristica | Incluido |
|---|---|
| Agenda completa (diaria, semanal, mensual) | Si |
| Citas ilimitadas | Si |
| Reserva online 24/7 (link personalizado) | Si |
| Recordatorios WhatsApp (100/mes incluidos) | Si |
| Pantalla de sala de espera (1 pantalla) | Si |
| Gestion de turnos en tiempo real | Si |
| Perfil destacado en directorio | Si |
| App movil para el medico | Si |
| Soporte por WhatsApp (horario laboral) | Si |
| 1 usuario (secretaria) incluido | Si |
| Reportes basicos (citas por dia/semana) | Si |

- **Precio mensual:** RD$1,500/mes (~USD $25)
- **Precio anual:** RD$14,400/ano (~USD $240) = RD$1,200/mes (20% descuento)
- **Ideal para:** Medico general o especialista independiente con un solo consultorio y una secretaria.
- **Argumento de venta:** "Si el sistema te evita perder UNA sola consulta al mes, ya se pago solo. Con RD$2,500 de una consulta recuperada, tienes ganancia neta de RD$1,000."

---

### Plan Profesional
**"Para el medico que quiere crecer"**

| Caracteristica | Todo del Plan Basico + |
|---|---|
| Recordatorios WhatsApp (300/mes incluidos) | Si |
| Hasta 3 usuarios (secretarias/asistentes) | Si |
| Reportes avanzados (ingresos, no-show rate, horas pico) | Si |
| Historial clinico basico por paciente | Si |
| Agenda para multiples consultorios (hasta 2) | Si |
| Pagos online (paciente paga con tarjeta) | Si |
| Lista de espera inteligente | Si |
| Personalizacion de marca (logo, colores) | Si |
| SMS recordatorios (50/mes incluidos) | Si |
| Soporte prioritario (respuesta <4 horas) | Si |
| Exportar datos (CSV/PDF) | Si |

- **Precio mensual:** RD$2,900/mes (~USD $48)
- **Precio anual:** RD$27,840/ano (~USD $464) = RD$2,320/mes (20% descuento)
- **Ideal para:** Especialista establecido con alto volumen de pacientes, medico con 2 consultorios, medico que quiere cobros online.
- **Argumento de venta:** "Con los reportes avanzados identificas tus horas muertas. Con la lista de espera inteligente, llenas esos huecos automaticamente. Resultado: 3-5 pacientes mas por semana = RD$7,500-12,500 adicionales."

---

### Plan Clinica
**"Para clinicas y centros con multiples medicos"**

| Caracteristica | Todo del Plan Profesional + |
|---|---|
| Hasta 5 medicos en una sola cuenta | Si |
| Usuarios ilimitados (secretarias, admin) | Si |
| Multiples consultorios ilimitados | Si |
| Pantallas de sala de espera ilimitadas | Si |
| Panel administrativo centralizado | Si |
| Reportes consolidados por medico/clinica | Si |
| Recordatorios WhatsApp (1,000/mes) | Si |
| SMS recordatorios (200/mes) | Si |
| API para integraciones | Si |
| Soporte dedicado (gerente de cuenta) | Si |
| Onboarding personalizado (capacitacion presencial) | Si |
| Facturacion centralizada | Si |

- **Precio mensual:** RD$7,500/mes (~USD $125) por los primeros 5 medicos
- **Medico adicional:** RD$1,200/mes (~USD $20) cada uno
- **Precio anual:** RD$72,000/ano (~USD $1,200) = RD$6,000/mes (20% descuento)
- **Ideal para:** Clinicas privadas con 3-10 medicos, centros de especialidades, policlinicas.
- **Argumento de venta:** "Gestion centralizada de todos tus medicos. Un solo panel, una sola factura. Tu administrador ve todo. Cada medico solo ve lo suyo."

---

### Plan Enterprise
**"Para hospitales y redes de salud"**

| Caracteristica | Incluido |
|---|---|
| Medicos ilimitados | Si |
| White-label (tu marca, tu dominio) | Si |
| Integracion con sistemas existentes (HIS/EMR) | Si |
| SLA garantizado (99.9% uptime) | Si |
| Servidor dedicado (opcional) | Si |
| Soporte 24/7 con gerente de cuenta | Si |
| Capacitacion in-situ para todo el personal | Si |
| Personalizacion de flujos y formularios | Si |
| API completa | Si |
| Reportes ejecutivos automatizados | Si |
| Facturacion y contabilidad integrada | Si |

- **Precio:** Cotizacion personalizada (estimado RD$25,000-75,000/mes dependiendo del volumen)
- **Ideal para:** Hospitales privados (HOMS, CEDIMAT, Clinica Abreu), redes de clinicas, ARS con red propia.
- **Nota:** Este plan se desarrolla bajo demanda. No es prioridad en Ano 1.

---

### Tabla Resumen de Planes

| | Freemium | Basico | Profesional | Clinica | Enterprise |
|---|---|---|---|---|---|
| **Precio/mes** | RD$0 | RD$1,500 | RD$2,900 | RD$7,500 | Personalizado |
| **Precio/mes (USD)** | $0 | $25 | $48 | $125 | Personalizado |
| **Precio anual** | $0 | RD$14,400 | RD$27,840 | RD$72,000 | Personalizado |
| **Ahorro anual** | - | RD$3,600 | RD$6,960 | RD$18,000 | - |
| **Citas/mes** | 30 | Ilimitadas | Ilimitadas | Ilimitadas | Ilimitadas |
| **Medicos** | 1 | 1 | 1 | 5 | Ilimitados |
| **Secretarias** | 0 | 1 | 3 | Ilimitadas | Ilimitadas |
| **WhatsApp/mes** | 0 | 100 | 300 | 1,000 | Ilimitados |
| **Pantalla sala espera** | No | 1 | 1 | Ilimitadas | Ilimitadas |
| **Reportes** | No | Basicos | Avanzados | Consolidados | Ejecutivos |

---

## 3. Analisis de Precios

### 3.1 Benchmark de Competidores en LATAM

| Plataforma | Pais | Plan Basico | Plan Medio | Plan Premium | Modelo |
|---|---|---|---|---|---|
| **Doctoralia** | Mexico | USD$83/mes | USD$112/mes | USD$137/mes | Anual obligatorio |
| **Doctoralia** | Colombia | USD$53/mes | USD$65/mes | USD$88/mes | Anual obligatorio |
| **DrApp** | Argentina/LATAM | USD$16/mes | - | Personalizado | Mensual/Anual |
| **Nimbo** | LATAM | USD$35/mes | USD$75/mes | Personalizado | Mensual |
| **Doctoranytime** | Grecia/Expansion | USD$30/mes | USD$60/mes | USD$100/mes | Mensual/Anual |
| **Meducar** | Argentina | USD$20/mes | USD$40/mes | Personalizado | Mensual |
| **TurnoMedico (nuestro)** | RD | **USD$25/mes** | **USD$48/mes** | **USD$125/mes** | Mensual/Anual |

**Posicionamiento:** Nuestros precios estan en el rango medio-bajo de LATAM, deliberadamente. Razones:
1. Republica Dominicana es un mercado mas pequeno que Mexico o Colombia.
2. No existe cultura establecida de pagar por software medico en RD.
3. Precio bajo = menor barrera de entrada = mayor adopcion = mas data = mas valor.
4. Siempre es mas facil subir precios que bajarlos.

### 3.2 El Argumento "Se Paga Solo"

```
Escenario: Medico con Plan Basico (RD$1,500/mes)

Consulta promedio:                    RD$2,500
No-shows sin sistema:                 ~3-4 por semana (15-20%)
Reduccion de no-show con sistema:     25-35%
Consultas recuperadas/semana:         ~1
Consultas recuperadas/mes:            ~4

Ingreso adicional mensual:            4 x RD$2,500 = RD$10,000
Costo del sistema:                    RD$1,500/mes
ROI mensual:                          RD$8,500 (567% de retorno)

El sistema se paga con MENOS DE UNA consulta recuperada al mes.
```

```
Escenario: Medico con Plan Profesional (RD$2,900/mes)

Mismo calculo base:                   RD$10,000 recuperados por no-shows
+ Pacientes adicionales por agenda optimizada: 2/semana x RD$2,500 = RD$5,000/semana = RD$20,000/mes
+ Cobros online (reduce impagos):     ~RD$5,000/mes

Ingreso adicional total:              ~RD$35,000/mes
Costo del sistema:                    RD$2,900/mes
ROI mensual:                          RD$32,100 (1,107% de retorno)
```

### 3.3 Estrategia de Descuentos

| Tipo de Descuento | Porcentaje | Condicion |
|---|---|---|
| **Pago anual** | 20% | Pago completo por adelantado |
| **Early adopter** (primeros 100 medicos) | 30% | Precio de por vida mientras mantenga suscripcion |
| **Referido** | 1 mes gratis | Por cada medico referido que se suscriba |
| **Gremio medico** | 15% | Miembros activos de sociedad medica con convenio |
| **Multi-consultorio** | 10% | Medico con 2+ consultorios en Plan Profesional |

### 3.4 Estrategia de Pricing para Penetracion

**Fase 1 - Lanzamiento (Meses 1-6): "Precio Fundador"**
- Plan Basico: RD$990/mes (34% descuento) = ~USD$16.50
- Plan Profesional: RD$1,900/mes (34% descuento) = ~USD$31.67
- Este precio se mantiene DE POR VIDA para los primeros 100 medicos.
- Objetivo: crear una base de usuarios leales que generen testimonios y referidos.

**Fase 2 - Crecimiento (Meses 7-18): "Precio Regular"**
- Precios estandar de la tabla de planes.
- Descuento del 20% por pago anual.
- Programa de referidos activo.

**Fase 3 - Madurez (Meses 19+): "Precio Premium"**
- Se evalua un aumento del 10-15% en precios para nuevos clientes.
- Los clientes existentes mantienen su tarifa original por 12 meses mas.
- Se introducen add-ons (modulos premium, integraciones).

---

## 4. Unit Economics

### 4.1 CAC (Customer Acquisition Cost)

| Canal | Costo por Lead | Tasa de Conversion | CAC Estimado |
|---|---|---|---|
| **Visita presencial (vendedor)** | RD$500/visita | 20% | RD$2,500 (~USD$42) |
| **Google Ads** | RD$150/clic | 5% | RD$3,000 (~USD$50) |
| **Facebook/Instagram Ads** | RD$80/clic | 3% | RD$2,667 (~USD$44) |
| **Referidos** | RD$1,500 (1 mes gratis) | 40% | RD$1,500 (~USD$25) |
| **Contenido organico (SEO/redes)** | RD$200/lead | 8% | RD$2,500 (~USD$42) |
| **Gremios medicos/sociedades** | RD$300/lead | 15% | RD$2,000 (~USD$33) |

**CAC promedio ponderado estimado: RD$2,400 (~USD$40)**

En LATAM, el CAC para SaaS B2B de bajo ticket suele estar entre USD$30-80. Nuestro estimado de USD$40 es conservador y realista, considerando que en RD la venta presencial (visitar consultorios) sera un canal principal al inicio.

### 4.2 LTV (Lifetime Value)

| Plan | ARPU Mensual | Churn Mensual | Vida Promedio | LTV |
|---|---|---|---|---|
| **Basico** | RD$1,500 | 4% | 25 meses | RD$37,500 (~USD$625) |
| **Profesional** | RD$2,900 | 3% | 33 meses | RD$95,700 (~USD$1,595) |
| **Clinica** | RD$7,500 | 2% | 50 meses | RD$375,000 (~USD$6,250) |

**Notas:**
- El churn mensual de 3-4% es tipico para SaaS B2B en LATAM con ticket bajo.
- El benchmark global para SaaS B2B saludable es <5% mensual en etapa temprana.
- La vida promedio se calcula como 1/churn rate.
- A medida que el producto mejore y el lock-in aumente, el churn deberia bajar a 2-3% mensual.

### 4.3 LTV/CAC Ratio

| Plan | LTV | CAC | LTV/CAC | Evaluacion |
|---|---|---|---|---|
| **Basico** | USD$625 | USD$40 | **15.6x** | Excelente |
| **Profesional** | USD$1,595 | USD$40 | **39.9x** | Excelente |
| **Clinica** | USD$6,250 | USD$60* | **104.2x** | Excepcional |

*El CAC de clinicas es mayor porque requiere venta consultiva.

**Benchmark:** Un ratio LTV/CAC de 3:1 es el minimo saludable. Nuestros numeros son extremadamente favorables porque:
1. El ticket es bajo pero recurrente por anos.
2. El CAC en RD es bajo (mercado pequeno, venta directa posible).
3. El lock-in natural (datos de pacientes, historial) reduce churn con el tiempo.

### 4.4 Payback Period (Tiempo de Recuperacion del CAC)

| Plan | CAC | ARPU Mensual | Margen Bruto (~80%) | Meses para Recuperar CAC |
|---|---|---|---|---|
| **Basico** | RD$2,400 | RD$1,500 | RD$1,200 | **2 meses** |
| **Profesional** | RD$2,400 | RD$2,900 | RD$2,320 | **1.03 meses** |
| **Clinica** | RD$3,600 | RD$7,500 | RD$6,000 | **0.6 meses** |

**Benchmark:** El payback period estandar para SaaS saludable es <12 meses. Recuperar el CAC en 1-2 meses es excepcional y permite reinvertir agresivamente en crecimiento.

### 4.5 Churn Rate Esperado

| Periodo | Churn Mensual | Churn Anual | Razon |
|---|---|---|---|
| **Meses 1-6** | 6-8% | ~55% | Normal en early stage. Muchos prueban y no se quedan. |
| **Meses 7-12** | 4-5% | ~42% | El producto mejora, los que quedan estan mas comprometidos. |
| **Ano 2** | 3-4% | ~35% | Lock-in por datos, mejoras en producto, mejor onboarding. |
| **Ano 3** | 2-3% | ~28% | Producto maduro, integraciones, dificil migrar. |

### 4.6 MRR y ARR Proyectados

**Supuestos de distribucion de planes:**
- 15% se quedan en Freemium (no generan ingreso directo)
- 50% eligen Plan Basico
- 30% eligen Plan Profesional
- 5% eligen Plan Clinica

**ARPU blended (promedio ponderado):**
= (0.50 x RD$1,500) + (0.30 x RD$2,900) + (0.05 x RD$7,500) / 0.85
= (RD$750 + RD$870 + RD$375) / 0.85
= RD$1,995 / 0.85
= **RD$2,347/mes (~USD$39) por medico activo pagante**

| Metrica | Ano 1 (Fin) | Ano 2 (Fin) | Ano 3 (Fin) |
|---|---|---|---|
| **Medicos registrados** | 200 | 700 | 1,800 |
| **Medicos pagantes** | 120 | 480 | 1,350 |
| **MRR** | RD$281,640 | RD$1,126,560 | RD$3,168,450 |
| **MRR (USD)** | $4,694 | $18,776 | $52,807 |
| **ARR** | RD$3,379,680 | RD$13,518,720 | RD$38,021,400 |
| **ARR (USD)** | $56,328 | $225,312 | $633,690 |

---

## 5. Proyeccion Financiera (3 Anos)

### 5.1 Estructura de Costos Mensuales

| Concepto | Ano 1 (Mensual) | Ano 2 (Mensual) | Ano 3 (Mensual) |
|---|---|---|---|
| **Desarrollo (1 senior dev + Claude AI)** | USD$2,000 | USD$2,000 | USD$3,500* |
| **Hosting/Infraestructura (AWS/DO)** | USD$150 | USD$400 | USD$800 |
| **WhatsApp Business API** | USD$100 | USD$350 | USD$800 |
| **SMS (Twilio/proveedor local)** | USD$50 | USD$200 | USD$500 |
| **Herramientas (GitHub, Sentry, etc.)** | USD$100 | USD$150 | USD$200 |
| **Marketing digital** | USD$500 | USD$1,500 | USD$3,000 |
| **Vendedor/Soporte (tiempo parcial)** | USD$0** | USD$800 | USD$1,500 |
| **Legal/Contabilidad** | USD$200 | USD$300 | USD$400 |
| **Oficina/Coworking** | USD$0** | USD$200 | USD$400 |
| **Imprevistos (10%)** | USD$310 | USD$590 | USD$1,110 |
| **TOTAL MENSUAL** | **USD$3,410** | **USD$6,490** | **USD$12,210** |
| **TOTAL ANUAL** | **USD$40,920** | **USD$77,880** | **USD$146,520** |

*Ano 3: Se contrata un segundo desarrollador junior o se aumenta la inversion en el dev senior.
**Ano 1: El fundador asume estas funciones.

### 5.2 Escenario Conservador

**Supuestos:** Crecimiento lento, alto churn inicial, mercado resistente al cambio.

| Metrica | Ano 1 | Ano 2 | Ano 3 |
|---|---|---|---|
| Medicos pagantes (fin de ano) | 80 | 280 | 700 |
| ARPU mensual | RD$2,100 (USD$35) | RD$2,200 (USD$37) | RD$2,400 (USD$40) |
| MRR (fin de ano) | USD$2,800 | USD$10,360 | USD$28,000 |
| ARR | USD$33,600 | USD$124,320 | USD$336,000 |
| Ingresos totales del ano* | USD$16,800 | USD$79,200 | USD$230,400 |
| Gastos totales del ano | USD$40,920 | USD$77,880 | USD$146,520 |
| **Resultado** | **-USD$24,120** | **+USD$1,320** | **+USD$83,880** |
| Resultado acumulado | -USD$24,120 | -USD$22,800 | +USD$61,080 |

*Los ingresos del ano son el promedio del MRR durante los 12 meses, no el MRR final x 12.

### 5.3 Escenario Moderado (Base Case)

**Supuestos:** Crecimiento sostenido, buen product-market fit, referidos funcionan.

| Metrica | Ano 1 | Ano 2 | Ano 3 |
|---|---|---|---|
| Medicos pagantes (fin de ano) | 120 | 480 | 1,350 |
| ARPU mensual | RD$2,347 (USD$39) | RD$2,500 (USD$42) | RD$2,700 (USD$45) |
| MRR (fin de ano) | USD$4,680 | USD$20,160 | USD$60,750 |
| ARR | USD$56,160 | USD$241,920 | USD$729,000 |
| Ingresos totales del ano* | USD$28,080 | USD$148,800 | USD$486,000 |
| Gastos totales del ano | USD$40,920 | USD$77,880 | USD$146,520 |
| **Resultado** | **-USD$12,840** | **+USD$70,920** | **+USD$339,480** |
| Resultado acumulado | -USD$12,840 | +USD$58,080 | +USD$397,560 |

### 5.4 Escenario Optimista

**Supuestos:** Viralidad alta, alianza con CMD o ARS, producto excepcional.

| Metrica | Ano 1 | Ano 2 | Ano 3 |
|---|---|---|---|
| Medicos pagantes (fin de ano) | 200 | 900 | 2,500 |
| ARPU mensual | RD$2,500 (USD$42) | RD$2,800 (USD$47) | RD$3,000 (USD$50) |
| MRR (fin de ano) | USD$8,400 | USD$42,300 | USD$125,000 |
| ARR | USD$100,800 | USD$507,600 | USD$1,500,000 |
| Ingresos totales del ano* | USD$50,400 | USD$302,400 | USD$1,000,000 |
| Gastos totales del ano | USD$40,920 | USD$95,000** | USD$200,000** |
| **Resultado** | **+USD$9,480** | **+USD$207,400** | **+USD$800,000** |
| Resultado acumulado | +USD$9,480 | +USD$216,880 | +USD$1,016,880 |

**Gastos mayores porque se invierte mas en equipo y marketing para sostener el crecimiento.

### 5.5 Break-Even Analysis

```
Costos fijos mensuales (Ano 1):         USD$3,410
ARPU blended mensual:                   USD$39
Margen bruto:                            ~80% (USD$31.20 por medico)
Costo variable por medico:              ~USD$7.80 (WhatsApp, SMS, hosting marginal)

Break-even mensual = Costos fijos / Margen por medico
                   = USD$3,410 / USD$31.20
                   = 110 medicos pagantes

Break-even con gastos Ano 2 = USD$6,490 / USD$33.60 = 194 medicos pagantes
```

**Conclusion:** Con ~110 medicos pagantes el negocio es rentable en Ano 1. En el escenario moderado, esto se logra hacia el mes 10-12. En el optimista, hacia el mes 6-7.

### 5.6 TAM, SAM, SOM

```
TAM (Total Addressable Market):
  - Medicos registrados en CMD: ~33,772
  - Medicos con practica privada activa (estimado): ~20,000
  - TAM = 20,000 x USD$39/mes x 12 = USD$9,360,000/ano

SAM (Serviceable Addressable Market):
  - Medicos en Santo Domingo + Santiago + ciudades principales: ~14,000 (70%)
  - Medicos con smartphone y disposicion digital: ~70% = 9,800
  - SAM = 9,800 x USD$39/mes x 12 = USD$4,586,400/ano

SOM (Serviceable Obtainable Market - 3 anos):
  - Meta realista: 7-15% del SAM en 3 anos
  - SOM conservador: 700 medicos = USD$327,600/ano
  - SOM moderado: 1,350 medicos = USD$631,800/ano
  - SOM optimista: 2,500 medicos = USD$1,170,000/ano
```

---

## 6. Estrategia de Go-to-Market

### 6.1 Fase 0: Pre-lanzamiento (Meses -2 a 0)

**Objetivo:** Validar el producto con 10-15 medicos beta.

| Accion | Detalle |
|---|---|
| **Reclutar beta testers** | Contactar 20 medicos conocidos (amigos, familia, red personal). Ofrecer acceso gratuito de por vida al Plan Basico a cambio de feedback semanal. |
| **Landing page** | Pagina simple con propuesta de valor, formulario de registro, video demo de 2 minutos. |
| **WhatsApp grupo beta** | Grupo con los medicos beta para feedback en tiempo real. |
| **Iterar rapido** | Cada semana: recoger feedback -> priorizar -> desarrollar -> entregar. |
| **Documentar testimonios** | Videos cortos de medicos beta usando el sistema. "Dr. Perez: antes perdia 4 pacientes por semana, ahora pierdo 1." |

### 6.2 Fase 1: Primeros 50 Medicos (Meses 1-6)

**Estrategia principal: Venta directa (puerta a puerta en consultorios)**

Este es el canal #1 en un mercado donde los medicos no buscan software activamente. Hay que ir a donde estan.

| Canal | Tactica | Meta | Presupuesto |
|---|---|---|---|
| **Visitas presenciales** | Visitar 10 consultorios/dia en zonas de alta concentracion medica (Gazcue, Naco, Piantini, ensanche Paraiso en SD; centro de Santiago). Llevar tablet con demo en vivo. Dejar flyer. | 30 medicos | USD$500/mes (transporte + materiales) |
| **WhatsApp marketing** | Lista de broadcast a numeros de consultorios obtenidos de directorios publicos y Google Maps. Mensaje personalizado: "Dr. [Nombre], le ayudo a que sus pacientes nunca mas esperen 2 horas." | 10 medicos | USD$100/mes |
| **Redes sociales** | Contenido educativo en Instagram/Facebook: "5 razones por las que tus pacientes no vuelven", "Cuanto dinero pierdes por no-shows". Videos cortos, reels, stories. | 5 medicos | USD$300/mes (ads + contenido) |
| **Red personal** | Cada medico beta refiere a 2-3 colegas. Incentivo: 1 mes gratis por cada referido. | 5 medicos | RD$0 (costo del mes gratis) |

**Oferta de lanzamiento:** "Precio Fundador" (34% de descuento de por vida) para los primeros 100 medicos.

**KPIs Fase 1:**
- 50 medicos registrados (pagantes + freemium)
- 30+ medicos pagantes
- NPS > 40
- Churn mensual < 8%

### 6.3 Fase 2: Primeros 500 Medicos (Meses 7-18)

**Estrategia: Escalar lo que funciona + nuevos canales**

| Canal | Tactica | Meta | Presupuesto |
|---|---|---|---|
| **Vendedor dedicado** | Contratar 1 vendedor a tiempo completo para visitas presenciales. Comision: RD$500 por cada medico que se suscriba y permanezca 3 meses. | 150 medicos | USD$800/mes + comisiones |
| **Google Ads** | Campanas de busqueda: "agenda medica online RD", "sistema de turnos medicos", "software para consultorio". | 80 medicos | USD$600/mes |
| **Facebook/Instagram Ads** | Retargeting de visitantes del sitio. Lookalike audiences basadas en medicos actuales. Testimonios en video. | 60 medicos | USD$500/mes |
| **Sociedades medicas** | Alianzas con Sociedad Dominicana de Cardiologia, Pediatria, Ginecologia, etc. Presentar en reuniones mensuales. Ofrecer 15% de descuento a miembros. | 50 medicos | USD$200/mes (patrocinio eventos) |
| **Colegio Medico Dominicano (CMD)** | Proponer alianza institucional: "TurnoMedico como herramienta oficial del CMD" con descuento exclusivo para agremiados. | 40 medicos | USD$500 unica vez (presentacion) |
| **Programa de referidos** | Formalizar: medico refiere colega -> ambos obtienen 1 mes gratis. Gamificar: "Top referidores del mes" con premios. | 70 medicos | ~USD$200/mes en meses gratis |
| **Congresos medicos** | Stand en congresos principales (Congreso CMD, congresos de especialidades). Demo en vivo, registro inmediato con descuento de congreso. | 50 medicos | USD$1,000-2,000/evento |
| **SEO y contenido** | Blog con articulos: "Como reducir no-shows en tu consultorio", "Guia para digitalizar tu consulta en RD". Posicionar en Google. | Trafico organico creciente | USD$200/mes |

**Expansion geografica:**
- Meses 7-12: Consolidar Santo Domingo + iniciar Santiago
- Meses 13-18: La Romana, Puerto Plata, San Francisco de Macoris, La Vega

**KPIs Fase 2:**
- 500 medicos registrados
- 350+ medicos pagantes
- MRR > USD$12,000
- Churn mensual < 5%
- NPS > 50

### 6.4 Fase 3: Escalamiento (Meses 19-36)

| Canal | Tactica | Meta |
|---|---|---|
| **Alianzas con ARS** | Las Administradoras de Riesgos de Salud (ARS Humano, ARS Palic, SeNaSa) tienen directorios de medicos afiliados. Proponer integracion: pacientes agendan citas con medicos de su ARS directamente. La ARS subsidia parte del costo. | 200+ medicos |
| **Farmacias y laboratorios** | Alianzas con cadenas (Farmacia Carol, GBC Labs, Referencia Laboratorio Clinico): el medico envia ordenes desde TurnoMedico, la farmacia/lab recibe digital. Ambos ganan eficiencia. | 100+ medicos |
| **Clinicas y centros medicos** | Venta B2B al administrador de la clinica. Un contrato de clinica puede traer 5-20 medicos de golpe. Enfocarse en Clinica Abreu, HOMS, Clinica Corominas, CEDIMAT, Union Medica. | 300+ medicos |
| **Expansion LATAM** | Iniciar operaciones en Panama o Costa Rica (mercados pequenos, similares a RD, cercanos culturalmente). | Piloto con 50 medicos |

### 6.5 Estrategia de Free Trial / Freemium

```
Embudo de conversion:

[Visitante web] --> [Registro gratuito (Freemium)] --> [Uso por 30 dias]
                                                            |
                                            [Llega al limite de 30 citas]
                                                            |
                                    [Upgrade a Plan Basico (14 dias trial)]
                                                            |
                                            [Conversion a pago o churn]
```

**Reglas del trial:**
1. El plan Freemium es permanente (no expira), pero limitado a 30 citas/mes.
2. Cuando el medico quiere subir de plan, recibe 14 dias gratis del Plan Basico.
3. Si no convierte despues del trial, baja automaticamente al Freemium.
4. No se pide tarjeta de credito para el trial (reducir friccion).
5. Al dia 10 del trial, la secretaria del medico recibe un WhatsApp: "Solo quedan 4 dias de tu periodo de prueba. Tu medico ha recuperado X consultas este mes."

### 6.6 Partnerships Estrategicos

| Partner | Beneficio para TurnoMedico | Beneficio para el Partner | Modelo |
|---|---|---|---|
| **ARS (Humano, Palic, SeNaSa)** | Acceso a directorio de medicos afiliados. Distribucion masiva. | Mejor experiencia para sus asegurados. Datos de utilizacion. | Revenue share o co-branding |
| **Colegio Medico Dominicano** | Credibilidad institucional. Acceso a 33,000+ medicos. Canal de comunicacion. | Herramienta moderna para sus agremiados. Ingreso por convenio. | Descuento exclusivo CMD. Fee por referido. |
| **Farmacias (Carol, La Economica)** | Canal de distribucion (flyers en farmacia). Integracion futura de recetas. | Trafico digital. Recetas digitales = menos errores. | Cross-promotion gratuita inicialmente |
| **Laboratorios (GBC, Referencia, Amadita)** | Integracion de ordenes de lab. Valor agregado al medico. | Ordenes digitales = mas eficiencia. Canal directo al medico. | Integracion gratuita. Comision por orden futura. |
| **Universidades (UNPHU, INTEC, UASD)** | Residentes como beta testers. Futuros clientes. | Herramienta educativa para estudiantes. | Acceso gratuito para residentes |

---

## 7. Estrategia de Retencion

### 7.1 Por Que un Medico NO Cancela

El churn es el enemigo #1 de un SaaS. Cada medico que cancela elimina todo el LTV futuro. La retencion se construye en estas capas:

**Capa 1: Valor Inmediato (Dia 1-30)**
- El medico ve resultados tangibles en la primera semana.
- Menos llamadas, menos caos, pacientes contentos.
- Si no ve valor en 30 dias, se va. Por eso el onboarding es critico.

**Capa 2: Habito (Meses 2-6)**
- La secretaria usa el sistema todos los dias.
- Los pacientes se acostumbran a reservar online.
- El medico revisa su dashboard semanal.
- Cambiar seria un retroceso visible.

**Capa 3: Lock-in Positivo (Meses 6+)**
- Historial de pacientes acumulado en la plataforma.
- Estadisticas de meses/anos de trabajo.
- Pacientes tienen el link de reserva guardado.
- Resenas y calificaciones en el directorio publico.
- Perder todo esto al cancelar es un costo real.

**Capa 4: Comunidad y Ecosistema (Ano 2+)**
- El medico es parte de un directorio publico que le trae pacientes nuevos.
- Integraciones con labs, farmacias, ARS que dependen de su cuenta.
- Red de referidos entre medicos.

### 7.2 Acciones Especificas de Retencion

| Accion | Detalle | Cuando |
|---|---|---|
| **Onboarding guiado** | Llamada de bienvenida de 15 min. Configurar agenda, cargar pacientes, instalar pantalla de sala de espera. Tutorial en video paso a paso. | Dia 1-3 |
| **Check-in proactivo** | WhatsApp al medico/secretaria: "Como va todo? Necesitas ayuda?" | Dia 7, 30, 60 |
| **Reporte mensual** | Email/WhatsApp automatico: "Este mes: 187 citas gestionadas, 12 no-shows evitados, RD$30,000 recuperados" | Mensual |
| **Feature highlights** | "Sabias que puedes activar la lista de espera inteligente? Asi nunca tienes huecos vacios." | Quincenal |
| **Rescue campaign** | Si el medico no usa el sistema por 5 dias, WhatsApp automatico a la secretaria. Si no usa por 15 dias, llamada del equipo de soporte. | Automatico |
| **Celebrar milestones** | "Felicidades! Has gestionado 1,000 citas con TurnoMedico. Tu tasa de no-show bajo un 28%." | Automatico |
| **Encuesta NPS trimestral** | "Del 1 al 10, nos recomendarias a un colega?" Detractores reciben llamada personal. | Trimestral |
| **Programa de lealtad** | 12 meses continuos = 1 mes gratis. 24 meses = upgrade gratuito por 3 meses. | Anual |

### 7.3 Onboarding Detallado

El onboarding es el momento mas critico. Un medico mal onboarded cancela en 30 dias.

```
Dia 0: Registro
  -> Email de bienvenida con video de 3 minutos
  -> WhatsApp a la secretaria con guia rapida (PDF de 1 pagina)

Dia 1: Llamada de configuracion (15-20 min)
  -> Configurar horarios del medico
  -> Cargar pacientes existentes (importar desde Excel/contactos)
  -> Generar link de reserva personalizado
  -> Configurar recordatorios de WhatsApp
  -> Activar pantalla de sala de espera (si tiene TV/tablet)

Dia 2-3: La secretaria practica sola
  -> Soporte por WhatsApp disponible
  -> Video tutoriales cortos (1-2 min cada uno)

Dia 7: Check-in
  -> "Como te fue esta semana? Alguna duda?"
  -> Resolver cualquier friccion

Dia 14: Revision de metricas
  -> "Esta semana gestionaste X citas. Tu tasa de no-show fue Y%."
  -> Sugerir optimizaciones

Dia 30: Evaluacion
  -> "Tu primer mes: X citas, Y pacientes nuevos, Z no-shows evitados"
  -> Si es trial: oferta para convertir
  -> Si es pagante: confirmar satisfaccion
```

### 7.4 Soporte al Cliente

| Nivel | Disponibilidad | Canal | Tiempo de Respuesta |
|---|---|---|---|
| **Basico** | L-V 8am-6pm | WhatsApp, Email | < 4 horas |
| **Profesional** | L-V 8am-8pm | WhatsApp, Email, Telefono | < 2 horas |
| **Clinica** | L-S 7am-9pm | WhatsApp, Email, Telefono, Gerente dedicado | < 1 hora |
| **Enterprise** | 24/7 | Todos + soporte en sitio | < 30 min |

**Herramientas de autoservicio:**
- Centro de ayuda con articulos y videos (base de conocimiento)
- Chat bot basico para preguntas frecuentes
- Grupo de WhatsApp de la comunidad TurnoMedico (medicos ayudan a medicos)

---

## 8. Estrategia de Expansion

### 8.1 Expansion Nacional (Republica Dominicana)

**Fase 1 - Distrito Nacional y Santo Domingo (Meses 1-12)**
- Concentracion: El 70% de los medicos especialistas estan en el Gran Santo Domingo.
- Zonas objetivo: Gazcue (zona medica historica), Naco, Piantini, Ensanche Paraiso, Los Prados, Bella Vista.
- Meta: 120-200 medicos pagantes.

**Fase 2 - Santiago de los Caballeros (Meses 6-15)**
- Segunda ciudad del pais, ~15% de los especialistas.
- Zonas: Centro, Reparto Universitario, zona del HOMS.
- Vendedor local a tiempo parcial.
- Meta: 50-80 medicos pagantes.

**Fase 3 - Ciudades secundarias (Meses 12-24)**
- La Romana, San Pedro de Macoris, Puerto Plata, San Francisco de Macoris, La Vega, Higuey.
- Expansion organica (medicos de estas ciudades se registran por referidos + ads).
- Visitas presenciales puntuales (viaje quincenal).
- Meta: 80-120 medicos pagantes.

**Fase 4 - Cobertura nacional (Meses 24-36)**
- Presencia en todas las provincias principales.
- Alianzas con ARS para penetracion en zonas rurales.
- Meta: cobertura en 15+ ciudades.

### 8.2 Expansion LATAM

**Cuando saltar:**
- Cuando el mercado dominicano este en Fase 3+ (200+ medicos pagantes activos)
- Cuando el producto este estable (uptime >99.5%, churn <4% mensual)
- Cuando haya capacidad operativa (equipo de al menos 3-4 personas)
- Estimado: mes 18-24

**Mercados prioritarios (en orden):**

| Prioridad | Pais | Razon | Tamano Estimado | Complejidad |
|---|---|---|---|---|
| **1** | Panama | Cercano culturalmente, alto PIB per capita, mercado pequeno para validar, USD como moneda. | ~8,000 medicos | Baja |
| **2** | Costa Rica | Sistema de salud mixto fuerte, adopcion tecnologica alta, mercado organizado. | ~12,000 medicos | Media |
| **3** | Ecuador | Mercado grande, USD como moneda, cultura similar. | ~35,000 medicos | Media |
| **4** | Colombia | Mercado enorme, competencia fuerte (Doctoralia), pero mucho espacio. | ~100,000 medicos | Alta |
| **5** | Mexico | Mercado mas grande de LATAM hispano, pero Doctoralia ya domina. Entrar con diferenciador. | ~250,000 medicos | Alta |

**Estrategia de entrada a nuevo pais:**
1. Adaptar la plataforma (moneda local, zona horaria, nomenclatura medica).
2. Conseguir 10-15 medicos beta en el pais (contactos, LinkedIn, cold outreach).
3. Validar product-market fit local en 3 meses.
4. Si funciona: contratar vendedor local, invertir en marketing.
5. Si no funciona: pivotar o pausar y probar otro mercado.

**Costo estimado de expansion por pais:** USD$3,000-5,000 en los primeros 3 meses (marketing + adaptacion + vendedor part-time).

### 8.3 Features Necesarios para Escalar

| Feature | Necesario Para | Prioridad | Estimado |
|---|---|---|---|
| **Multi-idioma** | Expansion a Brasil (portugues), USA (ingles para medicos hispanos) | Media | Ano 2 |
| **Multi-moneda** | Cada pais tiene su moneda | Alta | Ano 2 |
| **Multi-timezone** | Operacion en multiples paises | Alta | Ano 2 |
| **Telemedicina integrada** | Consultas virtuales (post-COVID la demanda persiste) | Media | Ano 2 |
| **Historial clinico completo (EMR)** | Convertirse en plataforma integral | Alta | Ano 2-3 |
| **Recetas electronicas** | Valor agregado significativo, regulacion por pais | Media | Ano 2 |
| **Integracion con pasarelas de pago locales** | Cobros en cada pais | Alta | Ano 2 |
| **API publica** | Integracion con sistemas de clinicas, ARS, labs | Alta | Ano 2 |
| **App nativa (iOS/Android)** | Experiencia movil premium para medicos y pacientes | Media | Ano 2 |
| **IA para optimizacion de agenda** | Diferenciador competitivo. Sugerir horarios optimos basados en patrones. | Baja | Ano 3 |
| **Business Intelligence** | Reportes avanzados para clinicas grandes | Media | Ano 3 |
| **Modulo de facturacion fiscal** | Cumplimiento tributario por pais (NCF en RD, CFDI en Mexico, etc.) | Alta | Por pais |

---

## 9. Metricas Clave (KPIs) por Etapa

### Ano 1: Validacion y Product-Market Fit

| KPI | Meta Q1 | Meta Q2 | Meta Q3 | Meta Q4 |
|---|---|---|---|---|
| Medicos registrados | 30 | 70 | 130 | 200 |
| Medicos pagantes | 15 | 40 | 80 | 120 |
| MRR | USD$500 | USD$1,400 | USD$2,800 | USD$4,700 |
| Churn mensual | <10% | <8% | <6% | <5% |
| NPS | >30 | >35 | >40 | >45 |
| Citas gestionadas/mes | 500 | 2,000 | 6,000 | 12,000 |
| No-show rate promedio | Medir baseline | -15% | -25% | -30% |

### Ano 2: Crecimiento y Escalamiento

| KPI | Meta |
|---|---|
| Medicos pagantes (fin de ano) | 480 |
| MRR (fin de ano) | USD$20,000 |
| Churn mensual | <4% |
| NPS | >50 |
| Revenue por empleado | >USD$50,000/ano |
| Expansion a 1 pais adicional | Piloto con 30+ medicos |

### Ano 3: Rentabilidad y Expansion

| KPI | Meta |
|---|---|
| Medicos pagantes (fin de ano) | 1,350+ |
| MRR (fin de ano) | USD$60,000 |
| Churn mensual | <3% |
| NPS | >55 |
| Paises con operacion | 2-3 |
| Margen operativo | >50% |

---

## 10. Riesgos y Mitigacion

| Riesgo | Probabilidad | Impacto | Mitigacion |
|---|---|---|---|
| **Medicos no quieren pagar por software** | Alta | Alto | Freemium agresivo + demostrar ROI inmediato. "Se paga con 1 consulta." Trial sin tarjeta. |
| **Secretarias boicotean el sistema** | Media | Alto | Posicionar como herramienta que les facilita la vida, no que las reemplaza. Onboarding especifico para secretarias. |
| **Competidor grande (Doctoralia) entra a RD** | Media | Alto | Ventaja de first-mover local, precios mas bajos, soporte local en espanol dominicano, features especificos para RD. |
| **Churn alto (>8% mensual sostenido)** | Media | Alto | Invertir en onboarding, soporte, y rapida iteracion de producto basada en feedback. |
| **Dificultad para cobrar (pagos)** | Media | Medio | Ofrecer multiples metodos: tarjeta, transferencia, pago en banco, hasta cobro en persona inicialmente. |
| **Problemas tecnicos / downtime** | Baja | Alto | Infraestructura redundante, monitoreo 24/7, plan de contingencia. El sistema no puede fallar un lunes a las 8am. |
| **Regulacion de datos de salud** | Baja | Medio | Cumplir con ley 172-13 de Proteccion de Datos de RD. Encriptacion, acceso controlado, consentimiento informado. |
| **WhatsApp cambia politicas/precios** | Baja | Medio | Mantener SMS como canal alternativo. No depender 100% de WhatsApp. |

---

## 11. Resumen Ejecutivo

### La Oportunidad
Republica Dominicana tiene ~20,000 medicos con practica privada que gestionan sus citas de forma manual (llamadas telefonicas, libreta de la secretaria, sistema de turno de llegada). No existe un lider local en software de gestion de turnos medicos. El mercado es de ~USD$9.3M/ano en su totalidad.

### La Solucion
TurnoMedico: plataforma SaaS de agendamiento online, gestion de turnos y pantalla de sala de espera. Los medicos pagan una suscripcion mensual desde RD$1,500/mes (~USD$25). Los pacientes usan gratis.

### Los Numeros
- **Inversion requerida Ano 1:** ~USD$41,000 (1 developer + Claude AI + marketing + operaciones)
- **Break-even:** ~110 medicos pagantes (mes 10-12 en escenario moderado)
- **ARR Ano 3 (moderado):** USD$729,000
- **Margen operativo Ano 3:** >50%
- **LTV/CAC ratio:** 15-40x (excepcional)

### Por Que Ahora
1. Penetracion de smartphones en RD: >80%
2. WhatsApp como canal universal de comunicacion
3. Post-COVID: pacientes esperan servicios digitales
4. No hay competidor local dominante
5. El medico dominicano ya paga RD$20,000-60,000/mes por su consultorio. RD$1,500 mas por un sistema que le genera dinero es una decision obvia.

### Siguiente Paso
Construir el MVP (agenda + turnos + pantalla de sala de espera), reclutar 15 medicos beta en Santo Domingo, validar en 90 dias, y lanzar comercialmente con precio fundador.

---

## Fuentes y Referencias

- [Doctoralia Precios Mexico](https://pro.doctoralia.com.mx/precios/medicos-y-especialistas) - Benchmark de precios Doctoralia Mexico
- [Doctoralia Precios Colombia](https://pro.doctoralia.co/precios/para-especialistas) - Benchmark de precios Doctoralia Colombia
- [DrApp Precios](https://www.drapp.la/precios) - Benchmark de precios DrApp LATAM
- [Nimbo Software Medico](https://www.nimbo-x.com/precios) - Benchmark de precios Nimbo
- [Cantidad de Medicos en RD - El Dinero](https://eldinero.com.do/102189/el-servicio-nacional-de-salud-cuenta-con-21845-medicos-incluyendo-especialistas-y-ejecutivos/) - Estadisticas del SNS
- [Concentracion de Medicos Especialistas - Hoy](https://hoy.com.do/el-70-medicos-especialistas-esta-en-la-capital-y-las-grandes-ciudades/) - Distribucion geografica
- [Cuanto Gana un Medico en RD - Diario Libre](https://www.diariolibre.com/actualidad/salud/2024/11/11/cuanto-gana-un-medico-en-republica-dominicana/2906390) - Ingresos medicos
- [Colegio Medico Dominicano](https://cmd.org.do/) - Gremio medico principal
- [SaaS Churn Benchmarks 2025](https://www.vitally.io/post/saas-churn-benchmarks) - Benchmarks de churn rate
- [B2B SaaS LTV Benchmarks](https://optif.ai/learn/questions/b2b-saas-ltv-benchmark/) - Benchmarks LTV/CAC
- [Medical Scheduling Software Market](https://www.grandviewresearch.com/industry-analysis/medical-scheduling-software-market-report) - Tamano del mercado global
