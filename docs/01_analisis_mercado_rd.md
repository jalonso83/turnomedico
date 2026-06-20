# Analisis de Mercado: Sistema SaaS de Gestion de Turnos Medicos en Republica Dominicana

**Fecha:** Febrero 2026
**Tipo de documento:** Estudio de viabilidad de mercado
**Alcance:** Republica Dominicana con perspectiva LATAM

---

## Tabla de Contenidos

1. [Mercado de Salud en Republica Dominicana](#1-mercado-de-salud-en-republica-dominicana)
2. [Competencia Directa e Indirecta](#2-competencia-directa-e-indirecta)
3. [Analisis FODA](#3-analisis-foda)
4. [TAM, SAM, SOM](#4-tam-sam-som)
5. [Barreras de Entrada y Adopcion](#5-barreras-de-entrada-y-adopcion)
6. [Regulaciones de Salud Digital en RD](#6-regulaciones-de-salud-digital-en-rd)
7. [Tendencias del Mercado](#7-tendencias-del-mercado)
8. [Viabilidad General](#8-viabilidad-general)

---

## 1. Mercado de Salud en Republica Dominicana

### 1.1 Numero de Medicos en RD

La Republica Dominicana cuenta con una fuerza medica significativa:

| Indicador | Dato | Fuente |
|-----------|------|--------|
| Medicos totales estimados | ~25,500 capacitados | [Banco Mundial](https://datos.bancomundial.org/indicador/SH.MED.PHYS.ZS?locations=DO) |
| Medicos por cada 1,000 hab. | 2.24 | Banco Mundial |
| Profesionales afiliados al CMD | ~33,772 | [Colegio Medico Dominicano](https://cmd.org.do/) |
| Medicos especialistas | ~17,000 | [Hoy Digital](https://hoy.com.do/el-70-medicos-especialistas-esta-en-la-capital-y-las-grandes-ciudades/) |
| Medicos en el SNS (publico) | 21,845 | [El Dinero](https://eldinero.com.do/102189/el-servicio-nacional-de-salud-cuenta-con-21845-medicos-incluyendo-especialistas-y-ejecutivos/) |
| Medicos en sector Estado | ~18,000 | Fuentes periodisticas |
| Poblacion total RD (2025) | ~11 millones | [ONE / Worldometers](https://www.worldometers.info/es/poblacion-mundial/poblacion-republica-dominicana/) |

**Nota importante:** Muchos medicos del sector publico tambien tienen consultorios privados. Un medico puede trabajar medio tiempo en un hospital publico y el resto en su consultorio privado. Esto es una practica comun en RD y amplifica el mercado objetivo.

### 1.2 Distribucion Geografica de Medicos

La concentracion geografica es un factor critico:

- **70% de los medicos especialistas** estan concentrados en el Gran Santo Domingo, Santiago, La Vega y San Francisco de Macoris.
- El restante 30% esta distribuido en el resto del pais, dejando regiones enteras sin cobertura especializada.
- El Gobierno ha intentado incentivar la distribucion con concursos de plazas: de 500 posiciones, solo 17 fueron designadas para Santo Domingo, con las 483 restantes para provincias.

**Fuente:** [Hoy Digital - Distribucion de especialistas](https://hoy.com.do/el-70-medicos-especialistas-esta-en-la-capital-y-las-grandes-ciudades/) | [Diario Libre - Demanda por provincia](https://www.diariolibre.com/actualidad/salud/2023/04/05/conoce-las-provincias-con-mas-alta-demanda-de-medicos/2276096)

**Implicacion para el proyecto:** El mercado inicial mas fuerte esta en Santo Domingo y Santiago, donde hay mayor concentracion de consultorios privados y pacientes con capacidad de pago.

### 1.3 Estructura del Sistema de Salud

El sistema de salud dominicano tiene dos grandes pilares:

#### Sector Publico
- **Ministerio de Salud Publica (MSP):** Rector del sistema.
- **Servicio Nacional de Salud (SNS):** Presta servicios a traves de 9 Servicios Regionales de Salud (SRS).
- **Infraestructura publica:** Mas de 86 hospitales inaugurados/remodelados y 680 centros de atencion primaria (dato 2025).
- **Linea *753:** Sistema de agendamiento telefonico en hospitales publicos seleccionados.

**Fuente:** [SNS - Quienes Somos](https://sns.gob.do/sobre-nosotros/quienes-somos/) | [Diario Salud - Avances 2025](https://www.diariosalud.do/noticias/gabinete-de-salud-presenta-avances-y-resultados-durante-el-2025/)

#### Sector Privado
- **Clinicas principales:** Cedimat, Hospiten, Clinica Corazones Unidos, Clinica Abel Gonzalez, Clinica Abreu, Hospital General de la Plaza de la Salud.
- **425 clinicas privadas** registradas en la base de datos del MSP (de las cuales 188 habilitadas, un 44%).
- **~3,675 consultorios medicos privados** (censo 2001, cifra probablemente mucho mayor actualmente).
- **~2,346 centros de atencion primaria privados.**

**Fuente:** [Scielo - Sistema de salud RD](https://www.scielo.org.mx/scielo.php?script=sci_arttext&pid=S0036-36342011000800020) | [Hoy Digital - Clinicas habilitadas](https://hoy.com.do/el-pais/de-425-clinicas-que-tiene-republica-dominicana-188-fueron-habilitadas_920575.html)

**Estimacion actualizada de consultorios privados:** Considerando el crecimiento de la poblacion medica desde 2001 (cuando se conto 3,675), y que RD gradua miles de medicos cada ano, una estimacion conservadora actual situa los consultorios medicos privados activos entre **5,000 y 8,000**.

### 1.4 Como Funcionan Actualmente los Turnos Medicos en RD

El sistema actual es predominantemente manual y funciona asi:

#### El modelo tipico "por orden de llegada":
1. El paciente llega al consultorio (no tiene hora asignada).
2. Una secretaria/recepcionista lo recibe y anota su nombre en una libreta o cuaderno.
3. Se le asigna un numero de turno secuencial.
4. El paciente espera en la sala hasta que lo llamen por nombre o numero.
5. Los tiempos de espera son impredecibles: pueden ser de 30 minutos a 3+ horas.
6. No hay forma de saber cuantos pacientes hay antes sin estar fisicamente en el consultorio.

#### Variantes del sistema manual:
- **Consultorio con cita por telefono:** La secretaria agenda llamadas, pero sigue siendo manual (cuaderno o Excel basico). Aun asi, se acumulan pacientes y hay esperas.
- **Clinicas grandes:** Algunas usan sistemas internos basicos, pero los consultorios individuales dentro de la clinica siguen manejando turnos de forma independiente.
- **WhatsApp:** Creciente uso informal de WhatsApp para "apartar turno", pero sin estructura ni confirmacion real.

#### Problemas del sistema actual:
- **Tiempo de espera excesivo** para el paciente (comun esperar 1-3 horas).
- **No-shows** (pacientes que no llegan) sin posibilidad de reemplazo rapido.
- **Overbooking manual:** La secretaria a veces agenda mas pacientes de los que el medico puede ver.
- **Falta de datos:** El medico no sabe cuantos pacientes vera hasta que llegan.
- **Pacientes frustrados:** La experiencia de espera es un punto de dolor significativo.
- **Ineficiencia operativa:** La secretaria dedica mucho tiempo a contestar llamadas y manejar la agenda.

### 1.5 Cultura de Pago por Consulta

#### Precios por Especialidad

| Especialidad | Con seguro (ARS) | Sin seguro (privado) |
|-------------|-----------------|---------------------|
| Medicina General | RD$800 - RD$2,000 | RD$1,500 - RD$3,000 |
| Ginecologia/Obstetricia | RD$2,000 - RD$5,000 | RD$3,500 - RD$7,500 |
| Cardiologia/Neurologia | RD$2,500 - RD$5,000 | RD$3,500 - RD$7,500 |
| Dermatologia | RD$2,000 - RD$4,000 | RD$3,000 - RD$5,000 |
| Endocrinologia | RD$2,500 - RD$5,000 | RD$3,500 - RD$7,000 |
| Clinicas premium (Hospiten, Cendoe) | Solo complementario | RD$5,000 - RD$10,000 |

**Fuente:** [La Consulta Medica - Costos RD](https://laconsultamedica.com.do/el-costo-de-una-consulta-medica-privada-y-sus-diferencias-en-rd/) | [El Dinero - Costo consultas](https://eldinero.com.do/29634/cuanto-puede-costar-una-consulta-medica-con-un-especialista-en-rd/)

**Analisis:** El precio de RD$2,500 (~$42 USD) mencionado en el contexto del proyecto es un promedio razonable para consultas con seguro en especialidades medias. Las consultas sin seguro tienden a ser mas caras. No existe un estandar de precios fijo; cada medico y centro establece sus propias tarifas.

### 1.6 ARS (Administradoras de Riesgos de Salud)

Las ARS son un componente fundamental del ecosistema de salud dominicano:

| Dato | Cifra |
|------|-------|
| ARS reguladas por SISALRIL | 17 |
| Afiliados al Seguro Familiar de Salud (SFS) | ~10.5 millones |
| Regimen Contributivo | ~4.7 millones |
| Regimen Subsidiado | ~5.8 millones |
| Cobertura de poblacion | ~97.5% |

**Fuente:** [SISALRIL](https://www.sisalril.gob.do/) | [CNSS - Beneficiarios](https://cnss.gob.do/sdss/beneficiarios-sdss) | [ADARS - Logros Ley 87-01](https://adars.org.do/logros-de-la-ley-87-01/)

#### Como afectan las ARS al modelo de negocio:

1. **Positivo - Base de pacientes asegurados:** Con 97.5% de cobertura, la mayoria de pacientes tiene un seguro, lo que estabiliza el flujo de consultas.
2. **Positivo - Volumen de consultas:** Los asegurados tienden a consultar mas frecuentemente porque su copago es menor.
3. **Neutro - El sistema de turnos es independiente de las ARS:** La plataforma de agendamiento no necesita integrarse con las ARS para funcionar. La ARS cubre el pago de la consulta; el sistema de turnos solo gestiona el tiempo.
4. **Oportunidad futura:** Una integracion con las ARS para preautorizacion o verificacion de cobertura seria un diferenciador premium, pero no es necesaria para el MVP.

### 1.7 Penetracion de Tecnologia, Internet y Smartphones en RD

Los datos de conectividad en RD son altamente favorables:

| Indicador | Dato (2024-2025) | Fuente |
|-----------|-------------------|--------|
| Usuarios de internet | 10.2 millones (88.6%) | [Tenarenses](https://www.tenarenses.com/brecha-digital-rd-2025/) |
| Hogares con celular | 94.7% | [Diario Libre - Enhogar 2024](https://www.diariolibre.com/planeta/tecnologia/2025/07/13/enhogar-2024-revela-que-el-94--de-los-dominicanos-posee-celulares/3181350) |
| Poblacion con celular propio (5+ anos) | 78.6% | [ONE](https://www.one.gob.do/noticias/2025/conectados-el-celular-forma-parte-de-la-vida-diaria-del-91-de-la-poblacion-dominicana/) |
| Conexiones moviles | 90% penetracion | Datareportal |
| Usuarios redes sociales | 7.24M (63.1%) | Datareportal |
| Zona urbana con celular | 95.3% | ONE - Enhogar 2024 |
| Zona rural con celular | 91.4% | ONE - Enhogar 2024 |
| Crecimiento internet 2017-2025 | 56.5% a 88.6% (+32.1 pp) | [El Dinero - Conectividad](https://eldinero.com.do/316954/la-conectividad-de-rd/) |

**Analisis para el proyecto:**
- La infraestructura digital del pais es solida y en crecimiento acelerado.
- Los medicos (profesionales de alto ingreso) tienen penetracion de smartphones/internet cercana al 100%.
- Los pacientes en zonas urbanas (donde estan los consultorios) tienen alta conectividad (95%+).
- WhatsApp es la app de mensajeria dominante, lo que facilita integraciones de notificaciones.
- La brecha urbano-rural existe pero es menor en el segmento objetivo (consultorios urbanos).

### 1.8 Gasto Promedio de un Consultorio Medico

No existen datos publicos especificos sobre el gasto en herramientas tecnologicas de consultorios en RD. Sin embargo, se puede estimar basandose en la estructura de costos tipica:

| Concepto | Costo estimado mensual (RD$) | Costo estimado (USD) |
|----------|------------------------------|---------------------|
| Alquiler de local | RD$15,000 - RD$50,000 | $250 - $830 |
| Secretaria/recepcionista | RD$18,000 - RD$30,000 | $300 - $500 |
| Servicios basicos (luz, agua, internet) | RD$5,000 - RD$15,000 | $83 - $250 |
| Insumos medicos | RD$5,000 - RD$20,000 | $83 - $330 |
| **Total gastos operativos** | **RD$43,000 - RD$115,000** | **$716 - $1,910** |

**Gasto en tecnologia:** La mayoria de consultorios no tienen partida dedicada a software. Usan herramientas gratuitas (Excel, WhatsApp). Un sistema SaaS de RD$1,500-3,000/mes (~$25-50 USD) representaria un 2-5% de sus gastos operativos, lo cual es altamente manejable.

---

## 2. Competencia Directa e Indirecta

### 2.1 Competencia en Republica Dominicana

#### Competidores Directos (Plataformas de agendamiento medico en RD)

| Plataforma | Tipo | Presencia en RD | Descripcion |
|-----------|------|-----------------|-------------|
| **Doctoralia** | Marketplace + SaaS | **No opera directamente en RD** | Opera en Mexico, Colombia, Espana, Brasil, Argentina. No tiene operacion activa en RD. |
| **Qanty** | Sistema de turnos generico | Si, presencia en RD | Sistema de gestion de filas basado en la nube, con quioscos y pantallas. No es especifico para consultorios medicos. |
| **Ofimedic** | Software de gestion medica | Configuracion disponible para RD | Software de escritorio/nube para gestion completa de consultorios. Incluye agenda pero no esta enfocado en la experiencia del paciente para agendar online. |
| **SNS - Linea *753** | Sistema publico | Solo hospitales publicos selectos | Agendamiento telefonico para hospitales publicos. No aplica a consultorios privados. |

**Fuente:** [Qanty RD](https://blog.qanty.com/do/sistema-de-turnos-en-republica-dominicana/) | [Ofimedic](https://www.ofimedic.com/videos-ofimedic/configuracion-para-la-republica-dominicana.html) | [SNS Citas](https://sns.gob.do/servicios/gestion-de-citas-medicas/)

#### Competidores Indirectos Presentes o Accesibles desde RD

| Plataforma | Modelo | Precio aproximado | Notas |
|-----------|--------|-------------------|-------|
| **MediCloud** | SaaS gestion clinica | No publicado | Software para clinicas, enfoque LATAM. |
| **Nimbo-X** | SaaS gestion clinica | No publicado | Agenda, expediente clinico, ERP. |
| **DriCloud** | SaaS gestion medica | Planes desde ~$29 USD/mes | Espanol, enfoque gestion clinica completa. |
| **AgendaPro** | SaaS agendamiento general | $400-$1,200 MXN/mes (~$20-60 USD) | Multi-industria (salud, belleza, fitness). Opera en RD. |
| **Medesk** | SaaS gestion medica | Plan gratuito disponible | Argentina, Mexico, Chile, Colombia. |

**Fuente:** [AgendaPro](https://agendapro.com/blog/mejores-apps-para-agendar-citas-medicas/) | [Nimbo-X](https://www.nimbo-x.com/) | [MediCloud](https://medicloud.me/) | [Medesk](https://www.medesk.net/es/blog/app-para-agendar-citas-gratis/)

### 2.2 Competencia en LATAM (Referencia)

#### Doctoralia (Lider Regional)

Doctoralia es el referente principal en agendamiento medico en LATAM:

**Precios Mexico (2025):**
| Plan | Precio mensual (MXN + IVA) | Precio aprox. USD |
|------|---------------------------|-------------------|
| Starter | $1,665 | ~$83 |
| Plus (mas popular) | $2,249 | ~$112 |
| VIP | $2,749 | ~$137 |

**Add-ons:** Noa Notes (IA) $950 MXN/mes, Website $449 MXN/mes.
**Compromiso minimo:** 12 meses.

**Precios Colombia (2025):**
| Plan | Precio mensual (COP) | Precio aprox. USD |
|------|----------------------|-------------------|
| Starter | COP 229,000 | ~$52 |
| Plus | COP 279,000 | ~$64 |
| VIP | COP 379,000 | ~$87 |

**Fuente:** [Doctoralia Mexico Precios](https://pro.doctoralia.com.mx/precios/medicos-y-especialistas) | [Doctoralia Colombia Precios](https://pro.doctoralia.co/precios/para-especialistas)

**Funcionalidades clave de Doctoralia:**
- Perfil publico del medico con opiniones de pacientes
- Agenda online con reserva 24/7
- Recordatorios automaticos (email, SMS, WhatsApp, push)
- Expediente clinico digital (planes Plus/VIP)
- Integracion con Google Reservas
- Dashboard de analitica
- Teleconsulta (videollamada)
- Campanas de SMS/email a pacientes

#### Otras Plataformas Relevantes en LATAM

| Plataforma | Pais principal | Modelo | Caracteristica diferenciadora |
|-----------|---------------|--------|------------------------------|
| **Docturno** | Argentina | Marketplace | Busqueda de turnos online por especialidad |
| **Todoc** | LATAM | SaaS | Automatiza 90% confirmaciones/cancelaciones |
| **DinDoc** | Mexico | SaaS | Integracion con seguros medicos |
| **CitaMed** | Colombia | Marketplace | Conexion paciente-medico sencilla |
| **MiAgenda** | LATAM hispanohablante | SaaS | Solucion practica y asequible |
| **DrApp** | Mexico, Peru, Chile | SaaS | Agenda medica simple |
| **Encuadrado** | Chile | SaaS | Agendamiento + cobro online |
| **Manosimple** | Argentina | SaaS | Gestion de turnos + portal pacientes |

**Fuente:** [Docturno](https://www.docturno.com/) | [DrApp](https://www.drapp.la/) | [Manosimple](https://www.manosimple.com/) | [AgendaPro Blog](https://agendapro.com/blog/mejores-apps-para-agendar-citas-medicas/)

### 2.3 Conclusion del Analisis Competitivo

**El mercado de RD esta notablemente sub-atendido en este nicho.** A diferencia de Mexico, Colombia o Argentina, donde hay multiples plataformas compitiendo, en Republica Dominicana:

1. **No hay un lider claro** en agendamiento de turnos medicos online.
2. **Doctoralia no opera en RD**, lo que deja un vacio significativo.
3. Las soluciones existentes son **genericas** (Qanty para filas en general) o **complejas/caras** (Ofimedic como ERP medico completo).
4. **No existe una solucion local, simple y enfocada** exclusivamente en el problema de turnos de consultorios medicos.
5. La mayoria de los consultorios siguen con el **sistema manual de libreta y secretaria**.

**Ventana de oportunidad:** Existe una clara oportunidad para ser el "Doctoralia dominicano", pero con un enfoque mas simple, local y asequible.

---

## 3. Analisis FODA

### 3.1 Fortalezas

| # | Fortaleza | Detalle |
|---|-----------|---------|
| F1 | **Resuelve un dolor real y tangible** | El tiempo de espera excesivo es un problema universalmente reconocido por pacientes y medicos en RD. |
| F2 | **Mercado desatendido** | No existe competidor directo fuerte en RD para este nicho especifico. |
| F3 | **Modelo de negocio simple** | Suscripcion mensual/anual del medico. No depende de publicidad ni de cobrar al paciente. |
| F4 | **Pantalla en sala de espera como diferenciador** | La TV mostrando el turno actual da visibilidad fisica al servicio y profesionaliza el consultorio. |
| F5 | **Bajo costo de entrada para el medico** | Un precio de $30-50 USD/mes es accesible para medicos que cobran $42+ por consulta (se paga con 1 consulta extra al mes). |
| F6 | **Alta conectividad del mercado objetivo** | 88.6% de penetracion internet, 94.7% hogares con celular en zonas urbanas. |
| F7 | **Reduccion de no-shows** | Los recordatorios automaticos pueden reducir inasistencias en un 30-40%, generando ROI directo para el medico. |
| F8 | **Escalable regionalmente** | El mismo sistema puede expandirse a otros mercados caribenos y LATAM sin grandes cambios. |

### 3.2 Oportunidades

| # | Oportunidad | Detalle |
|---|-------------|---------|
| O1 | **Estrategia Nacional de Salud Digital 2024-2028** | El gobierno esta impulsando activamente la digitalizacion del sector salud. |
| O2 | **Aceleracion post-COVID** | El uso de telemedicina aumento 150% durante la pandemia, generando apertura al cambio tecnologico. |
| O3 | **97.5% de cobertura ARS** | La alta cobertura de seguros garantiza flujo constante de pacientes a consultorios. |
| O4 | **Mercado de salud digital LATAM en crecimiento** | USD 5,755M en 2024, proyectado a USD 13,025M en 2034 (CAGR 9.5%). |
| O5 | **Expansion a clinicas como segunda fase** | Despues de consultorios individuales, escalar a clinicas con multiples medicos. |
| O6 | **Integracion futura con ARS/seguros** | Preautorizacion digital, verificacion de cobertura, facturacion automatica. |
| O7 | **Datos anonimizados de valor** | Patrones de consulta, especialidades mas demandadas, horarios pico. Informacion valiosa para ARS y farmaceuticas. |
| O8 | **WhatsApp como canal de adopcion** | Integracion con WhatsApp (ya usado informalmente) facilita la transicion del paciente. |

### 3.3 Debilidades

| # | Debilidad | Detalle |
|---|-----------|---------|
| D1 | **Sin marca reconocida** | Entrando como desconocido a un mercado donde la confianza personal es clave. |
| D2 | **Requiere cambio de comportamiento** | Tanto medicos como pacientes deben cambiar habitos arraigados (turno por llegada). |
| D3 | **Dependencia de la secretaria** | La secretaria es gatekeeper; si no adopta el sistema, este fracasa. |
| D4 | **Necesidad de masa critica de medicos** | Para que los pacientes vean valor, necesitan encontrar a SU medico en la plataforma. |
| D5 | **Ingresos iniciales bajos** | El modelo de suscripcion requiere tiempo para alcanzar volumen. |
| D6 | **Soporte tecnico presencial necesario** | Instalar TVs, configurar cuentas, entrenar secretarias requiere presencia fisica en RD. |
| D7 | **Margen limitado si el precio es bajo** | Un precio muy accesible ($30-50 USD) reduce margenes y requiere alto volumen. |

### 3.4 Amenazas

| # | Amenaza | Detalle |
|---|---------|---------|
| A1 | **Entrada de Doctoralia a RD** | Si Doctoralia decide expandirse a RD, trae marca, capital y tecnologia madura. |
| A2 | **Solucion "suficientemente buena" con WhatsApp** | Medicos que ya manejan turnos por WhatsApp pueden no ver necesidad de un sistema formal. |
| A3 | **Resistencia al cambio** | RD no ha logrado la digitalizacion al 100%, con resistencia significativa de medicos, prestadores y pacientes. |
| A4 | **Competidores genericos** | AgendaPro, Calendly u otras herramientas genericas podrian ser "suficientes" para algunos medicos. |
| A5 | **Crisis economica** | Una recesion podria hacer que medicos recorten gastos en herramientas "no esenciales". |
| A6 | **Regulacion imprevista** | Cambios regulatorios en proteccion de datos o salud digital podrian imponer requisitos costosos. |
| A7 | **Copia local rapida** | Un desarrollador local podria copiar el concepto rapidamente. Barrera tecnica baja. |

---

## 4. TAM, SAM, SOM

### 4.1 Definiciones y Calculo

#### TAM (Total Addressable Market)
**Todos los medicos/consultorios en RD que podrian usar el sistema.**

| Componente | Estimacion |
|-----------|-----------|
| Medicos con consultorio privado activo | ~12,000 - 15,000 |
| Consultorios/clinicas como unidades | ~6,000 - 10,000 |
| Precio promedio mensual estimado | $40 USD/mes |

**Justificacion:** De los ~33,772 profesionales registrados en el CMD, estimamos que 12,000-15,000 tienen practica privada activa (ya sea consultorio propio o espacio alquilado en clinica). Muchos medicos del sector publico tambien atienden en privado.

| Metrica TAM | Calculo | Resultado |
|-------------|---------|-----------|
| Por medicos | 15,000 medicos x $40/mes x 12 meses | **$7,200,000 USD/ano** |
| Por medicos (conservador) | 12,000 medicos x $40/mes x 12 meses | **$5,760,000 USD/ano** |

**TAM = ~$5.7M - $7.2M USD anuales**

#### SAM (Serviceable Available Market)
**Medicos que realistamente podrian adoptar tecnologia.**

Filtros aplicados:
- Ubicados en zonas urbanas con buena conectividad (70% del TAM)
- Con volumen de pacientes suficiente para justificar el sistema (min. 15 pacientes/dia)
- Abiertos a tecnologia / generacion digital-friendly (medicos < 55 anos)
- Con consultorio propio o espacio dedicado (no itinerantes)

| Metrica SAM | Calculo | Resultado |
|-------------|---------|-----------|
| Medicos elegibles | 15,000 x 0.70 (urbanos) x 0.65 (vol. + tech-friendly) | ~6,825 medicos |
| Revenue potencial | 6,825 x $40/mes x 12 | **$3,276,000 USD/ano** |

**SAM = ~$3.3M USD anuales (~6,800 medicos)**

#### SOM (Serviceable Obtainable Market)
**Lo que realistamente se puede captar en los primeros 1-3 anos.**

| Periodo | Medicos suscritos | Tasa de penetracion (sobre SAM) | Revenue mensual | Revenue anual |
|---------|-------------------|-------------------------------|----------------|--------------|
| Ano 1 | 100 - 200 | 1.5% - 3% | $4,000 - $8,000 | **$48,000 - $96,000** |
| Ano 2 | 400 - 700 | 6% - 10% | $16,000 - $28,000 | **$192,000 - $336,000** |
| Ano 3 | 800 - 1,500 | 12% - 22% | $32,000 - $60,000 | **$384,000 - $720,000** |

**SOM Ano 3 = $384K - $720K USD anuales (800 - 1,500 medicos)**

### 4.2 Escenarios de Precios

| Plan | Precio mensual (RD$) | Precio mensual (USD) | Pago anual (USD) | Target |
|------|----------------------|---------------------|------------------|--------|
| Basico | RD$1,500 | ~$25 | ~$250 | Medico individual, agenda simple |
| Profesional | RD$2,500 | ~$42 | ~$420 | Medico + TV sala espera + recordatorios |
| Clinica | RD$5,000+ | ~$83+ | ~$830+ | Multi-medico, multi-consultorio |

**Nota estrategica:** El Plan Profesional a RD$2,500/mes se paga literalmente con UNA consulta adicional al mes que el medico no hubiera tenido. Este es el argumento de venta mas poderoso.

### 4.3 Comparacion de Precios con Competidores

| Plataforma | Precio (USD/mes) | Mercado |
|-----------|-----------------|---------|
| Doctoralia Starter (Mexico) | ~$83 | Mexico |
| Doctoralia Starter (Colombia) | ~$52 | Colombia |
| AgendaPro | ~$20-60 | LATAM |
| DriCloud | ~$29+ | Espana/LATAM |
| **TurnoMedico (propuesto)** | **~$25-42** | **RD** |

**Posicionamiento de precio:** Mas barato que Doctoralia, competitivo con AgendaPro, pero con enfoque especifico en salud para RD.

---

## 5. Barreras de Entrada y Adopcion

### 5.1 Resistencia al Cambio de los Medicos

| Barrera | Severidad | Mitigacion |
|---------|-----------|-----------|
| "Asi lo he hecho siempre y funciona" | **Alta** | Demostrar ROI concreto: menos no-shows, mas pacientes/dia |
| Miedo a la tecnologia | **Media** | Interfaz ultra-simple, entrenamiento presencial gratuito |
| "No tengo tiempo para aprender" | **Media** | Setup en menos de 30 minutos, la secretaria maneja el dia a dia |
| "Es un gasto innecesario" | **Media-Alta** | Free trial 30 dias, se paga con 1 consulta extra |
| Desconfianza en datos digitales | **Media** | Garantias de privacidad, cumplimiento con Ley 172-13 |

### 5.2 Nivel Tecnologico de Secretarias/Asistentes

Este es **el factor critico de adopcion mas importante.** La secretaria es quien operaria el sistema diariamente.

- **Nivel tipico:** Manejo basico de smartphone, WhatsApp, redes sociales. Muchas manejan Excel basico.
- **Desafio:** Transicionar de cuaderno/libreta a pantalla digital.
- **Solucion:** El sistema debe ser tan simple como WhatsApp. Entrenamiento presencial obligatorio. Soporte por WhatsApp en tiempo real durante las primeras semanas.

### 5.3 Disposicion de los Pacientes para Agendar Online

| Factor | Estado en RD |
|--------|-------------|
| Uso de smartphone | 94.7% hogares con celular |
| Uso de internet | 88.6% de la poblacion |
| Uso de WhatsApp | Altisimo, es la app de comunicacion dominante |
| Experiencia previa con apps de servicio | En aumento (delivery, bancos, Uber) |
| Agendar medico online | Muy baja experiencia previa |
| Disposicion | Alta si es simple (click en WhatsApp > formulario complejo) |

**Conclusion:** Los pacientes ESTAN listos tecnologicamente, pero necesitan una experiencia extremadamente simple. Un link de WhatsApp o SMS con un solo click para confirmar es mas efectivo que una app completa.

### 5.4 Conectividad en Consultorios

- **Internet:** La mayoria de consultorios en zonas urbanas tienen internet (WiFi o datos moviles).
- **TV/Pantalla:** Requiere inversion adicional del medico (~$100-200 USD por un TV basico + dispositivo Chromecast/Fire Stick).
- **Mitigacion:** Ofrecer el sistema con o sin pantalla. La pantalla es un "nice to have", no un requisito.

### 5.5 Barreras Culturales Especificas de RD

| Barrera cultural | Descripcion | Estrategia |
|-----------------|-------------|-----------|
| **"Relacion personal" con el medico** | En RD la relacion medico-paciente es muy personal; agendar online puede percibirse como "frio". | Posicionar el sistema como "la secretaria digital" que complementa, no reemplaza, la relacion. |
| **"Yo conozco a la secretaria"** | Pacientes regulares llaman directo a la secretaria. | La secretaria sigue siendo el punto de contacto; el sistema es su herramienta. |
| **Cultura del "ya casi" y la impuntualidad** | Los horarios en RD son flexibles; una cita a las 3 puede ser a las 4. | Ventanas de tiempo en lugar de horas exactas. Notificaciones de "su turno se acerca". |
| **Desconfianza en pagos online** | Muchos prefieren efectivo o transferencia directa. | NO cobrar al paciente por la plataforma. Solo el medico paga suscripcion. |
| **"Mira, yo te consigo el turno"** | Cultura de "palanca"/intermediarios para conseguir turnos. | El sistema da transparencia y equidad, lo que beneficia a la mayoria de pacientes. |

---

## 6. Regulaciones de Salud Digital en RD

### 6.1 Marco Regulatorio Actual

#### Ley 172-13 de Proteccion de Datos Personales
- **Alcance:** Regula el tratamiento de datos personales en bases de datos publicas y privadas.
- **Limitacion para salud:** No contiene disposiciones especificas sobre datos de salud, consentimiento electronico ni portabilidad de expedientes clinicos.
- **Implicacion:** El sistema debe cumplir con esta ley (consentimiento, acceso, rectificacion), pero no hay requisitos especificos exigentes para un sistema de turnos.
- **Fuente:** [CEPAL - Proteccion de datos RD](https://rtc-cea.cepal.org/sites/default/files/2019-11/la%20protecci%C3%B3n%20de%20datos%20personales%20en%20rep%C3%BAblica%20dominicana.pdf) | [Ley 172-13 PDF](https://invi.gob.do/documents/Ley%20172%20-13%20Sobre%20protecci%C3%B3n%20de%20Datos%20personales.pdf)

#### Ley 87-01 de Seguridad Social
- **Alcance:** Crea el Sistema Dominicano de Seguridad Social (SDSS).
- **Implicacion:** Un sistema de agendamiento no necesita cumplir requisitos especificos de esta ley, pero debe ser compatible con el flujo ARS si se ofrece integracion futura.
- **Fuente:** [Ley 87-01 PDF](https://dgii.gov.do/legislacion/leyesTributarias/Documents/Leyes%20de%20Instituciones%20y%20Fondos%20de%20Terceros/87-01.pdf)

#### SISALRIL (Superintendencia de Salud y Riesgos Laborales)
- **Funcion:** Supervisa ARS y el sistema de seguros.
- **Implicacion para el proyecto:** SISALRIL NO regula software de gestion de consultorios. No se necesita autorizacion de SISALRIL para operar un sistema de turnos.
- **Fuente:** [SISALRIL](https://www.sisalril.gob.do/quienes-somos/)

### 6.2 Telemedicina y Salud Digital

- **Estado legal:** No existe una ley especifica de telemedicina en RD (a febrero 2026).
- **Estrategia Nacional de Salud Digital 2024-2028:** Presentada por el MSP en agosto 2024, busca:
  - Fortalecer infraestructura tecnologica
  - Capacitar personal medico
  - Implementar Expediente Unico Electronico de Salud (piloto en 20 hospitales publicos + 2 clinicas privadas)
  - Meta: plataforma operativa para diciembre 2028
- **Fuente:** [MSP - Estrategia Digital](https://msp.gob.do/web/?p=18569) | [El Nuevo Diario](https://elnuevodiario.com.do/ministerio-de-salud-traza-hoja-de-ruta-para-estrategia-nacional-de-salud-digital-2024-2028/) | [Diario Libre - Salud Digital](https://www.diariolibre.com/actualidad/salud/2024/08/07/salud-publica-lanza-la-estrategia-nacional-de-salud-digital/2812451)

### 6.3 Licencias y Certificaciones Necesarias

| Requisito | Necesario? | Detalle |
|-----------|-----------|---------|
| Licencia de software medico | **No** | Un sistema de turnos no es un dispositivo medico ni software clinico regulado. |
| Registro en SISALRIL | **No** | SISALRIL regula ARS y seguros, no software de gestion. |
| Cumplimiento Ley 172-13 | **Si** | Consentimiento para datos personales, politica de privacidad, medidas de seguridad basicas. |
| Registro como proveedor ante ARS | **No necesario para MVP** | Solo seria necesario si se ofrece integracion directa con facturacion ARS. |
| Registro mercantil standard | **Si** | Como cualquier empresa SaaS en RD. |

**Conclusion regulatoria:** El entorno regulatorio para un sistema de turnos medicos en RD es **favorable y de baja complejidad.** No se requieren licencias especiales de salud. Solo se necesita cumplir con la Ley 172-13 de proteccion de datos (requisitos generales) y operar como cualquier empresa de software. La Estrategia Nacional de Salud Digital 2024-2028 crea un contexto institucional favorable para la adopcion de tecnologia en salud.

---

## 7. Tendencias del Mercado

### 7.1 Digitalizacion Post-COVID en RD

- **Aumento de telemedicina:** 150% durante y despues de la pandemia (estudio MSP 2023).
- **Proyeccion 2025:** Se esperaba que ~70% de proveedores de salud adoptaran tecnologia.
- **Realidad:** La digitalizacion no ha alcanzado el 100% debido a resistencia al cambio de todos los actores (medicos, prestadores, pacientes).
- **Aceleracion de apps de servicio:** La pandemia normalizo el uso de delivery, banca movil y servicios online en RD, lo que facilita la adopcion de agendamiento medico.

**Fuente:** [Diario Libre - Telemedicina RD](https://www.diariolibre.com/actualidad/salud/2025/06/15/telemedicina-avances-de-la-salud-digital-en-republica-dominicana/3150306) | [Salud Digital](https://saluddigital.com/en/comunidades-conectadas/republica-dominica-presenta-su-primera-estrategia-nacional-de-salud-digital/)

### 7.2 Adopcion de Tecnologia en Consultorios LATAM

- **Brasil:** Lider regional en salud digital. Plataformas como Doctoralia y iClinic dominan.
- **Mexico:** Doctoralia es el lider claro. Mercado maduro con multiples competidores.
- **Argentina:** Fuerte ecosistema de startups de salud (Todoc, Docturno, Manosimple).
- **Colombia:** Crecimiento acelerado. Doctoralia y soluciones locales compitiendo.
- **Chile:** Encuadrado y AgendaPro con fuerte presencia.
- **RD:** **Etapa temprana.** Es donde estaban Mexico y Argentina hace 5-7 anos.

**Fuente:** [Informes de Expertos - Salud Digital LATAM](https://www.informesdeexpertos.com/informes/mercado-de-salud-digital-en-america-latina)

### 7.3 Tendencias Globales en Agendamiento Medico

| Tendencia | Descripcion | Relevancia para RD |
|-----------|-------------|-------------------|
| **Self-scheduling** | Pacientes reservan directamente sin llamar. | Alta - reduce carga de secretaria. |
| **Recordatorios multicanal** | SMS + WhatsApp + Email + Push. | Alta - WhatsApp es el canal dominante. |
| **IA en gestion de agenda** | Optimizacion automatica de horarios, prediccion de no-shows. | Media - diferenciador futuro. |
| **Integracion con wearables** | Datos de salud antes de la consulta. | Baja a corto plazo. |
| **Teleconsulta hibrida** | Opcion de video o presencial al agendar. | Media - complemento a futuro. |
| **Pagos integrados** | Pago o adelanto al momento de agendar. | Baja para RD (cultura de pago en persona). |
| **Expediente clinico en la nube** | Historial medico digital compartido. | Alta a mediano plazo - alineado con Estrategia Nacional. |

### 7.4 Proyeccion a 3-5 Anos

| Horizonte | Escenario probable |
|-----------|-------------------|
| 2026-2027 | Fase temprana de adopcion. Primeros 100-500 medicos adoptando herramientas digitales de agendamiento. El gobierno comienza pilotos de expediente clinico digital. |
| 2027-2028 | Crecimiento acelerado. La Estrategia Nacional impulsa la digitalizacion. Las ARS comienzan a exigir/incentivar herramientas digitales a sus prestadores. Posible entrada de jugadores internacionales al mercado RD. |
| 2029-2030 | Mercado maduro. Agendamiento online es norma en consultorios urbanos. Diferenciacion por features avanzados (IA, integracion ARS, expediente clinico). Posible consolidacion del mercado. |

**Ventana critica:** Los proximos 2-3 anos (2026-2028) son la ventana optima para posicionarse como lider de mercado antes de que el mercado madure y lleguen competidores internacionales.

---

## 8. Viabilidad General

### 8.1 Opinion Fundamentada: Es Viable Este Proyecto en RD?

**Si, el proyecto es viable.** Y no solo viable, sino que tiene condiciones particularmente favorables por las siguientes razones:

1. **Dolor real y cuantificable:** El sistema manual de turnos es un problema que afecta a millones de pacientes y miles de medicos diariamente. No es un problema inventado.

2. **Mercado sub-atendido:** A diferencia de Mexico, Colombia o Argentina, donde ya hay competencia establecida, RD es un "campo abierto" para una solucion local enfocada.

3. **Timing correcto:** La Estrategia Nacional de Salud Digital 2024-2028, la aceleracion post-COVID, y la alta penetracion de smartphones crean las condiciones ideales para la adopcion.

4. **Modelo de negocio probado:** Doctoralia ha demostrado que el modelo de suscripcion medica funciona en LATAM. No hay riesgo de modelo; hay riesgo de ejecucion.

5. **Economia unitaria favorable:** A $40 USD/mes por medico, con 500 medicos se genera $240,000 USD/ano. Los costos de operacion de un SaaS son relativamente bajos una vez construida la plataforma.

6. **Regulacion favorable:** No hay barreras regulatorias significativas. Los requisitos de proteccion de datos son generales y manejables.

### 8.2 Es Buen Momento? (Timing)

**Si, es un momento optimo por las siguientes razones:**

| Factor de timing | Evaluacion |
|-----------------|-----------|
| Post-COVID: mentalidad abierta a digital | Favorable |
| Estrategia Nacional Salud Digital 2024-2028 | Muy favorable |
| Doctoralia NO esta en RD (aun) | Ventana abierta |
| Penetracion de smartphones > 90% | Infraestructura lista |
| Medicos jovenes entrando al mercado | Generacion digital-native |
| WhatsApp como puente de adopcion | Canal de transicion perfecto |

**Riesgo de esperar:** Si se espera 2-3 anos, es probable que Doctoralia o un competidor LATAM entre al mercado RD, eliminando la ventaja de primer movimiento.

### 8.3 Factores Decisivos para el Exito

| # | Factor | Importancia | Detalle |
|---|--------|-------------|---------|
| 1 | **Simplicidad extrema del producto** | **Critica** | Debe ser mas facil que una libreta. Si la secretaria no lo entiende en 15 minutos, fracasa. |
| 2 | **Ventas presenciales consultorio por consultorio** | **Critica** | En RD, la venta de tecnologia a medicos requiere visita presencial, demostracion en vivo, y relacion de confianza. No se vende por ads online. |
| 3 | **Onboarding asistido** | **Alta** | Instalacion de pantalla, configuracion, entrenamiento de secretaria. Servicio de guante blanco. |
| 4 | **WhatsApp como canal principal** | **Alta** | El paciente recibe su confirmacion/recordatorio por WhatsApp. No forzar descarga de app. |
| 5 | **Primeros 50 medicos "champions"** | **Alta** | Los primeros adoptantes exitosos son el motor de boca a boca. Elegirlos cuidadosamente. |
| 6 | **Precio accesible con ROI claro** | **Alta** | "Se paga con una consulta extra al mes" debe ser el pitch central. |
| 7 | **Soporte rapido y humano** | **Alta** | En RD se valora el soporte personalizado. Linea directa de WhatsApp con respuesta rapida. |
| 8 | **Pantalla en sala de espera** | **Media-Alta** | Diferenciador tangible y visible para pacientes. Da prestigio al consultorio. |

### 8.4 Preocupaciones Serias

| Preocupacion | Nivel | Mitigacion |
|-------------|-------|-----------|
| **Velocidad de adopcion** | Alto | El cambio cultural es lento en RD. Planificar con expectativas conservadoras (Ano 1: 100-200 medicos, no 1,000). Asegurar runway financiero para 18-24 meses. |
| **Dependencia de la secretaria** | Alto | Si la secretaria no usa el sistema, el medico cancela. Invertir fuertemente en UX para la secretaria y en entrenamiento presencial. |
| **Entrada de Doctoralia** | Medio | Construir lealtad local rapido. Diferenciarse con servicio personalizado y precios mas bajos. Tener la ventaja de "ya estar aqui". |
| **Escalabilidad del modelo de ventas** | Medio | Las ventas consultorio-por-consultorio son efectivas pero lentas. Considerar programa de referidos medico-a-medico con incentivos. |
| **Churn (cancelaciones)** | Medio | Si el medico no ve resultados en los primeros 2-3 meses, cancela. El onboarding debe incluir seguimiento activo y metricas de uso. |
| **Costo de la pantalla/TV** | Bajo | El medico puede usar su propia TV o tablet. Ofrecer opciones baratas. No hacer la pantalla obligatoria. |

### 8.5 Recomendaciones Estrategicas

1. **Comenzar en Santo Domingo y Santiago** - 70% de los especialistas estan ahi. Concentrar ventas en estas dos ciudades los primeros 12-18 meses.

2. **Lanzar con MVP minimo** - Agenda online + recordatorio WhatsApp + pantalla sala espera. No intentar ser un ERP medico completo desde el dia 1.

3. **Precio de penetracion** - RD$1,500/mes (~$25 USD) para el plan basico, con opcion de RD$2,500/mes (~$42 USD) para plan con pantalla y funciones avanzadas.

4. **Free trial de 30 dias con instalacion gratuita** - Reducir la barrera de entrada a cero.

5. **Equipo de ventas de calle** - Minimo 2-3 vendedores visitando consultorios con demo en tablet. En RD la venta B2B en salud es presencial.

6. **Alianzas con sociedades medicas** - Sociedad Dominicana de Cardiologia, Ginecologia, etc. Un endorsement de una sociedad medica vale mas que cualquier campana de marketing.

7. **Caso de exito documentado en 90 dias** - Los primeros 10-20 medicos deben tener resultados medibles y estar dispuestos a testimoniar.

8. **No cobrar al paciente** - Jamas. El paciente agenda gratis. El medico paga. Esto elimina fricciones de adopcion.

---

## Anexo A: Fuentes Principales Consultadas

### Instituciones Oficiales
- [Ministerio de Salud Publica de RD (MSP)](https://msp.gob.do/)
- [Servicio Nacional de Salud (SNS)](https://sns.gob.do/)
- [SISALRIL - Superintendencia de Salud y Riesgos Laborales](https://www.sisalril.gob.do/)
- [Consejo Nacional de Seguridad Social (CNSS)](https://cnss.gob.do/)
- [Colegio Medico Dominicano (CMD)](https://cmd.org.do/)
- [Oficina Nacional de Estadistica (ONE)](https://www.one.gob.do/)
- [Banco Mundial - Indicadores RD](https://datos.bancomundial.org/indicador/SH.MED.PHYS.ZS?locations=DO)

### Medios y Analisis
- [Diario Libre](https://www.diariolibre.com/)
- [El Dinero](https://eldinero.com.do/)
- [Hoy Digital](https://hoy.com.do/)
- [La Consulta Medica](https://laconsultamedica.com.do/)
- [Revista Contacto](https://revistacontactord.com/)
- [Diario Salud](https://www.diariosalud.do/)

### Plataformas Analizadas
- [Doctoralia Mexico](https://pro.doctoralia.com.mx/precios/medicos-y-especialistas)
- [Doctoralia Colombia](https://pro.doctoralia.co/precios/para-especialistas)
- [AgendaPro](https://agendapro.com/)
- [Qanty](https://qanty.com/)
- [Ofimedic](https://www.ofimedic.com/)
- [MediCloud](https://medicloud.me/)
- [Nimbo-X](https://www.nimbo-x.com/)
- [Medesk](https://www.medesk.net/)
- [Docturno](https://www.docturno.com/)
- [DrApp](https://www.drapp.la/)
- [Manosimple](https://www.manosimple.com/)

### Reportes de Mercado
- [Informes de Expertos - Mercado Salud Digital LATAM](https://www.informesdeexpertos.com/informes/mercado-de-salud-digital-en-america-latina)
- [Capterra RD - Software Medico](https://www.capterra.do/directory/30027/medical-scheduling/pricing/free/software)

### Marco Legal
- [Ley 172-13 de Proteccion de Datos Personales](https://invi.gob.do/documents/Ley%20172%20-13%20Sobre%20protecci%C3%B3n%20de%20Datos%20personales.pdf)
- [Ley 87-01 de Seguridad Social](https://dgii.gov.do/legislacion/leyesTributarias/Documents/Leyes%20de%20Instituciones%20y%20Fondos%20de%20Terceros/87-01.pdf)
- [Estrategia Nacional de Salud Digital 2024-2028](https://msp.gob.do/web/?p=18569)

---

## Anexo B: Glosario

| Termino | Definicion |
|---------|-----------|
| **ARS** | Administradora de Riesgos de Salud. Entidad que administra el seguro de salud. |
| **CMD** | Colegio Medico Dominicano. Gremio que agrupa a los medicos del pais. |
| **MSP** | Ministerio de Salud Publica y Asistencia Social. |
| **SNS** | Servicio Nacional de Salud. Brazo ejecutor del sistema publico de salud. |
| **SISALRIL** | Superintendencia de Salud y Riesgos Laborales. Regulador del sistema de seguros de salud. |
| **SFS** | Seguro Familiar de Salud. Componente de salud de la seguridad social. |
| **SDSS** | Sistema Dominicano de Seguridad Social. |
| **TAM** | Total Addressable Market. Mercado total direccionable. |
| **SAM** | Serviceable Available Market. Mercado disponible servible. |
| **SOM** | Serviceable Obtainable Market. Mercado obtenible servible. |
| **CAGR** | Compound Annual Growth Rate. Tasa de crecimiento anual compuesta. |
| **MVP** | Minimum Viable Product. Producto minimo viable. |
| **SaaS** | Software as a Service. Software como servicio. |
| **No-show** | Paciente que no asiste a su cita agendada. |
| **Churn** | Tasa de cancelacion de suscripciones. |

---

*Documento preparado en febrero 2026. Los datos de mercado y precios estan sujetos a cambios. Se recomienda validar cifras clave con fuentes primarias antes de tomar decisiones de inversion.*
