import Link from "next/link";
import Image from "next/image";
import {
  Calendar, Monitor, Bell, MousePointerClick, BarChart3, UserSearch,
  Frown, Clock, HelpCircle, Phone, Ghost, BookOpen,
  Stethoscope, Building2, HeartCrack,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex-1">
      {/* ============================================ */}
      {/* HEADER                                       */}
      {/* ============================================ */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="TurnoMedico" width={240} height={240} className="h-24 w-auto" />
          </Link>
          <nav className="flex gap-6 items-center">
            <Link href="#como-funciona" className="text-sm text-gray-600 hover:text-teal hidden md:inline">
              Cómo funciona
            </Link>
            <Link href="#para-medicos" className="text-sm text-gray-600 hover:text-teal hidden md:inline">
              Para médicos
            </Link>
            <Link href="#precios" className="text-sm text-gray-600 hover:text-teal hidden md:inline">
              Precios
            </Link>
            <Link href="/buscar" className="text-sm text-gray-600 hover:text-teal">
              Buscar médico
            </Link>
            <Link
              href="/login"
              className="text-sm bg-navy text-white px-4 py-2 rounded-lg hover:bg-navy-dark transition-colors"
            >
              Iniciar sesión
            </Link>
          </nav>
        </div>
      </header>

      {/* ============================================ */}
      {/* HERO                                         */}
      {/* ============================================ */}
      <section className="bg-brand-gradient text-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl">
            <p className="text-teal-light text-sm font-medium uppercase tracking-wider mb-4">
              Gestión de turnos médicos con tecnología
            </p>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
              Tu turno médico,
              <br />
              <span className="text-teal-light">sin esperas</span>
            </h1>
            <p className="text-lg text-white/80 max-w-xl mb-3">
              La plataforma que conecta médicos y pacientes en República Dominicana.
              Agenda online 24/7, recordatorios automáticos y sala de espera en tiempo real.
            </p>
            <p className="text-white/60 mb-6 text-sm">
              El paciente agenda en 60 segundos. El médico digitaliza su consultorio.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/buscar"
                className="inline-block bg-white text-navy font-semibold px-8 py-4 rounded-xl text-lg hover:bg-teal-light/10 transition-colors shadow-lg text-center"
              >
                Buscar médico — Agendar cita
              </Link>
              <Link
                href="/registro"
                className="inline-block border-2 border-white/50 text-white font-semibold px-8 py-4 rounded-xl text-lg hover:bg-white/10 transition-colors text-center"
              >
                Soy médico — Registrarme gratis
              </Link>
            </div>

            {/* Mini stats */}
            <div className="flex gap-8 mt-8">
              <div>
                <p className="text-3xl font-bold">60s</p>
                <p className="text-sm text-white/60">Para agendar una cita</p>
              </div>
              <div>
                <p className="text-3xl font-bold">24/7</p>
                <p className="text-sm text-white/60">Agenda siempre abierta</p>
              </div>
              <div>
                <p className="text-3xl font-bold">-60%</p>
                <p className="text-sm text-white/60">Menos pacientes que no llegan</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* PROBLEMA — "Seamos honestos..."              */}
      {/* ============================================ */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-2">Seamos honestos...</h2>
          <p className="text-gray-500 mb-10">Si alguna de estas situaciones te suena, no estás solo.</p>

          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {/* Problemas del paciente */}
            <div className="bg-white rounded-xl border border-navy/20 p-6">
              <p className="text-sm font-medium text-red-600 uppercase tracking-wider mb-4">Si eres paciente</p>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <Frown className="w-5 h-5 text-red-400 shrink-0 mt-0.5" strokeWidth={1.5} />
                  <p className="text-gray-700">Llamas para agendar y nadie contesta, o te ponen en espera 15 minutos.</p>
                </li>
                <li className="flex gap-3">
                  <Clock className="w-5 h-5 text-red-400 shrink-0 mt-0.5" strokeWidth={1.5} />
                  <p className="text-gray-700">Llegas a tu cita de las 2:00 PM y te atienden a las 4:30 PM. Dos horas y media esperando sin saber cuándo te toca.</p>
                </li>
                <li className="flex gap-3">
                  <HelpCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" strokeWidth={1.5} />
                  <p className="text-gray-700">Preguntas "¿cuántos faltan?" y la secretaria dice "ya casi", pero pasan 45 minutos más.</p>
                </li>
              </ul>
            </div>

            {/* Problemas del médico */}
            <div className="bg-white rounded-xl border border-navy/20 p-6">
              <p className="text-sm font-medium text-red-600 uppercase tracking-wider mb-4">Si eres médico</p>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <Phone className="w-5 h-5 text-red-400 shrink-0 mt-0.5" strokeWidth={1.5} />
                  <p className="text-gray-700">Tu secretaria pasa el día al teléfono agendando, cancelando y confirmando citas en una libreta.</p>
                </li>
                <li className="flex gap-3">
                  <Ghost className="w-5 h-5 text-red-400 shrink-0 mt-0.5" strokeWidth={1.5} />
                  <p className="text-gray-700">Entre el 15% y 20% de tus pacientes no llegan a su cita. Esos turnos vacíos son dinero perdido.</p>
                </li>
                <li className="flex gap-3">
                  <BookOpen className="w-5 h-5 text-red-400 shrink-0 mt-0.5" strokeWidth={1.5} />
                  <p className="text-gray-700">No tienes visibilidad sobre tu agenda: cuántos vinieron, cuántos faltaron, cuánto tiempo esperan.</p>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-brand-gradient-subtle rounded-xl p-6 border border-teal/20">
            <p className="text-gray-700">
              <strong className="text-gray-900">No es culpa de nadie.</strong> El sistema de citas médicas en República Dominicana funciona igual desde hace décadas: libreta, llamada telefónica y "turno por orden de llegada". Simplemente nadie lo había resuelto con tecnología.{" "}
              <strong className="text-teal">Hasta ahora.</strong>
            </p>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SOLUCIÓN                                     */}
      {/* ============================================ */}
      <section className="bg-white py-20" id="como-funciona">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              TurnoMedico: tu consultorio, <span className="text-teal">digitalizado</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Una plataforma que se adapta a cómo ya trabajas, no al revés.
              El paciente agenda fácil. La secretaria gestiona con un clic.
              El médico ve todo desde su celular.
            </p>
          </div>

          {/* 6 Features */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Calendar className="w-8 h-8 text-teal" strokeWidth={1.5} />,
                title: "Agenda online 24/7",
                desc: "Tus pacientes reservan a cualquier hora desde su celular. Sin llamar, sin esperar. Solo nombre, teléfono y listo.",
                highlight: "El paciente agenda en 60 segundos",
              },
              {
                icon: <Monitor className="w-8 h-8 text-teal" strokeWidth={1.5} />,
                title: "Pantalla de sala de espera",
                desc: "Un monitor en tu sala muestra el turno actual y la cola en tiempo real. Se actualiza automáticamente. Se acabó el '¿cuántos faltan?'",
                highlight: "Tu consultorio se ve profesional",
              },
              {
                icon: <Bell className="w-8 h-8 text-teal" strokeWidth={1.5} />,
                title: "Recordatorios automáticos",
                desc: "Notificaciones 24h y 1h antes de la cita. El paciente confirma o cancela con un toque, liberando el espacio para otro.",
                highlight: "Reduce no-shows hasta un 60%",
              },
              {
                icon: <MousePointerClick className="w-8 h-8 text-teal" strokeWidth={1.5} />,
                title: "Gestión con un solo clic",
                desc: "La secretaria toca [LLEGÓ] → [EN CONSULTA] → [SIGUIENTE]. Sin formularios. Sin complicaciones. 3 botones, eso es todo.",
                highlight: "Walk-in en 15 segundos",
              },
              {
                icon: <BarChart3 className="w-8 h-8 text-teal" strokeWidth={1.5} />,
                title: "Métricas de tu consulta",
                desc: "Pacientes por día, tasa de no-show, tiempo promedio de espera, horas pico. Datos que antes no tenías para tomar mejores decisiones.",
                highlight: "Dashboard en tiempo real",
              },
              {
                icon: <UserSearch className="w-8 h-8 text-teal" strokeWidth={1.5} />,
                title: "Perfil público profesional",
                desc: "Apareces en el directorio de TurnoMedico. Pacientes te encuentran por especialidad y ubicación. Con evaluaciones y horarios visibles.",
                highlight: "Nuevos pacientes te encuentran",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="border border-gray-200 rounded-xl p-6 hover:border-teal hover:shadow-md transition-all"
              >
                <div className="w-14 h-14 bg-teal/10 rounded-xl flex items-center justify-center">{feature.icon}</div>
                <h3 className="text-lg font-semibold mt-4 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{feature.desc}</p>
                <p className="text-sm font-medium text-teal">{feature.highlight}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SIMULACIÓN DE AGENDA                         */}
      {/* ============================================ */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Así se ve tu agenda</h2>
            <p className="text-gray-600">La secretaria gestiona todo el día con esta vista. Simple, clara, en tiempo real.</p>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            {/* Simulated header */}
            <div className="bg-navy text-white px-6 py-4 flex justify-between items-center">
              <div>
                <p className="font-bold">Dr. García Pérez — Cardiología</p>
                <p className="text-white/60 text-sm">Martes 15 de abril, 2026</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-white/60">Total hoy: <strong className="text-white">12 citas</strong></p>
              </div>
            </div>

            {/* Simulated appointment list */}
            <div className="divide-y">
              {[
                { time: "9:00 AM", name: "María Santos", status: "Completada", color: "bg-gray-100 text-gray-600", action: "" },
                { time: "9:30 AM", name: "Juan Reyes", status: "Completada", color: "bg-gray-100 text-gray-600", action: "" },
                { time: "10:00 AM", name: "Ana Méndez", status: "En consulta", color: "bg-green-100 text-green-700", action: "🟢" },
                { time: "10:30 AM", name: "Pedro Díaz", status: "En sala", color: "bg-purple-100 text-purple-700", action: "Turno #4" },
                { time: "11:00 AM", name: "Laura Vásquez", status: "En sala", color: "bg-purple-100 text-purple-700", action: "Turno #5" },
                { time: "11:30 AM", name: "Carlos Jiménez", status: "Confirmada", color: "bg-teal/10 text-teal", action: "" },
                { time: "2:00 PM", name: "Rosa Almánzar", status: "Confirmada", color: "bg-teal/10 text-teal", action: "" },
                { time: "2:30 PM", name: "—", status: "Disponible", color: "bg-white text-gray-400 border border-dashed border-gray-300", action: "" },
              ].map((apt, i) => (
                <div key={i} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-mono text-gray-500 w-20">{apt.time}</span>
                    <span className="text-sm font-medium text-gray-900">{apt.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {apt.action && (
                      <span className="text-xs text-gray-500">{apt.action}</span>
                    )}
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${apt.color}`}>
                      {apt.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            La secretaria toca un botón para avanzar el turno. La pantalla de la sala de espera se actualiza automáticamente.
          </p>
        </div>
      </section>

      {/* ============================================ */}
      {/* PASOS PARA CADA PÚBLICO                      */}
      {/* ============================================ */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Empieza en minutos</h2>
            <p className="text-gray-600">Sin complicaciones. Sin contratos. Sin instalaciones.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Paciente */}
            <div className="flex flex-col">
              <p className="text-sm font-medium text-teal-dark uppercase tracking-wider mb-6">Si eres paciente</p>
              <div className="space-y-6 flex-1">
                {[
                  { step: "1", title: "Busca tu médico", desc: "Por especialidad, nombre o ciudad. Ve su perfil, horarios y evaluaciones." },
                  { step: "2", title: "Elige tu horario", desc: "Selecciona fecha y hora. Solo necesitas tu nombre y número de teléfono." },
                  { step: "3", title: "Listo — Te avisamos", desc: "Recibe recordatorio 24h y 1h antes. El día de la cita, ve tu turno en tiempo real." },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="w-10 h-10 bg-teal/10 text-teal rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link
                  href="/buscar"
                  className="inline-block bg-navy text-white font-semibold px-6 py-3 rounded-lg hover:bg-navy-dark transition-colors text-sm"
                >
                  Buscar médico ahora
                </Link>
              </div>
            </div>

            {/* Médico */}
            <div className="flex flex-col">
              <p className="text-sm font-medium text-green-600 uppercase tracking-wider mb-6">Si eres médico</p>
              <div className="space-y-6 flex-1">
                {[
                  { step: "1", title: "Regístrate gratis", desc: "Email, nombre, especialidad y ciudad. En 2 minutos tienes tu perfil activo." },
                  { step: "2", title: "Configura tu horario", desc: "Define tus días, horas, duración de cita y descansos. Si un día no trabajas, lo bloqueas." },
                  { step: "3", title: "Comparte tu link", desc: "Tus pacientes agendan desde tu link personalizado. Tu secretaria gestiona desde el dashboard." },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="w-10 h-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link
                  href="/registro"
                  className="inline-block bg-green-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Registrar mi consultorio — Gratis 30 días
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* PRICING                                      */}
      {/* ============================================ */}
      <section className="bg-gray-50 py-20" id="precios">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-4">
            <h2 className="text-3xl font-bold mb-4">Planes que crecen contigo</h2>
            <p className="text-gray-600 mb-2">Empieza gratis. Actualiza cuando quieras. Sin sorpresas.</p>
            <p className="text-sm text-teal font-medium">
              Si el sistema te evita perder UNA sola consulta al mes (RD$2,500), ya se pagó solo.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
            {[
              {
                name: "Freemium",
                price: "RD$0",
                period: "Siempre gratis",
                desc: "Para probar sin compromiso",
                features: ["30 citas/mes máximo", "Agenda básica", "1 secretaria", "Recordatorios por email"],
                cta: "Empezar gratis",
                ctaStyle: "border-2 border-gray-300 text-gray-700 hover:bg-gray-50",
                highlight: false,
              },
              {
                name: "Básico",
                price: "RD$0",
                period: "/mes",
                desc: "Médico individual",
                features: ["200 citas/mes", "Agenda + pantalla sala espera", "1 secretaria", "Push + SMS", "Perfil público"],
                cta: "Prueba 30 días gratis",
                ctaStyle: "bg-navy text-white hover:bg-navy-dark",
                highlight: false,
              },
              {
                name: "Profesional",
                price: "RD$0",
                period: "/mes",
                desc: "Consultorio completo",
                features: ["Citas ilimitadas", "Todo del Básico", "3 secretarias", "Reportes avanzados", "Métricas de rendimiento", "Soporte prioritario"],
                cta: "Prueba 30 días gratis",
                ctaStyle: "bg-navy text-white hover:bg-navy-dark",
                highlight: true,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl p-6 flex flex-col ${
                  plan.highlight
                    ? "bg-brand-gradient text-white border-2 border-teal shadow-xl scale-105"
                    : "bg-white border border-gray-200"
                }`}
              >
                {plan.highlight && (
                  <p className="text-xs font-semibold bg-white text-navy px-3 py-1 rounded-full self-start mb-3">
                    Más popular
                  </p>
                )}
                <h3 className="text-lg font-bold">{plan.name}</h3>
                <div className="mt-2 mb-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className={`text-sm ${plan.highlight ? "text-white/60" : "text-gray-500"}`}>
                    {plan.period}
                  </span>
                </div>
                <p className={`text-sm mb-4 ${plan.highlight ? "text-white/60" : "text-gray-500"}`}>
                  {plan.desc}
                </p>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <span className={plan.highlight ? "text-white/60" : "text-green-500"}>✓</span>
                      <span className={plan.highlight ? "text-white/80" : ""}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/registro"
                  className={`block text-center py-3 rounded-lg font-semibold text-sm transition-colors ${plan.ctaStyle}`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-gray-500 mt-8">
            30 días gratis en planes pagos. Sin tarjeta de crédito. Cancela cuando quieras.
          </p>
        </div>
      </section>

      {/* ============================================ */}
      {/* PERSONAS — ¿Te identificas?                  */}
      {/* ============================================ */}
      <section className="bg-white py-20" id="para-medicos">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">¿Te identificas?</h2>
            <p className="text-gray-600">Así es como TurnoMedico te ayuda según tu situación.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Stethoscope className="w-8 h-8 text-teal" strokeWidth={1.5} />,
                persona: "Médico con consultorio privado",
                problem: "Tu secretaria pasa todo el día al teléfono. Los pacientes llegan sin hora fija. No sabes cuántos no vinieron este mes.",
                solution: "Con TurnoMedico, los pacientes agendan solos. La secretaria gestiona con 3 botones. Y tú ves tus métricas en tiempo real.",
                highlight: "Menos caos, más consultas productivas",
              },
              {
                icon: <Building2 className="w-8 h-8 text-teal" strokeWidth={1.5} />,
                persona: "Clínica con varios especialistas",
                problem: "Cada médico maneja su agenda diferente. No hay visibilidad centralizada. Coordinar horarios es un dolor de cabeza.",
                solution: "Un solo sistema para todos tus médicos. Cada uno con su agenda, sus pacientes y sus métricas. Tú ves todo desde el panel de clínica.",
                highlight: "Gestión centralizada sin complejidad",
              },
              {
                icon: <HeartCrack className="w-8 h-8 text-teal" strokeWidth={1.5} />,
                persona: "Paciente cansado de esperar",
                problem: "Llegaste a tu cita hace una hora y no sabes cuántos faltan. La sala está llena. Nadie te dice nada.",
                solution: "Con TurnoMedico, agendas desde tu celular, recibes recordatorio y el día de la cita ves tu posición en la cola en tiempo real.",
                highlight: "Sabe cuándo te toca, sin preguntar",
              },
            ].map((persona) => (
              <div key={persona.persona} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-teal/10 rounded-xl flex items-center justify-center">{persona.icon}</div>
                <h3 className="font-bold mt-3 mb-2">{persona.persona}</h3>
                <p className="text-sm text-gray-500 mb-3">{persona.problem}</p>
                <p className="text-sm text-gray-700 mb-4">{persona.solution}</p>
                <p className="text-sm font-semibold text-teal">{persona.highlight}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FAQ                                          */}
      {/* ============================================ */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Preguntas frecuentes</h2>

          <div className="space-y-4">
            {[
              {
                q: "¿El paciente necesita crear una cuenta?",
                a: "No. El paciente agenda solo con su nombre y número de teléfono. En 60 segundos tiene su cita confirmada. Sin registro, sin contraseña, sin descargar nada.",
              },
              {
                q: "¿Cuánto cuesta para el paciente?",
                a: "Nada. El paciente usa TurnoMedico completamente gratis. Siempre. El médico es quien paga la suscripción.",
              },
              {
                q: "¿Se puede probar antes de pagar?",
                a: "Sí. Ofrecemos un plan Freemium permanente (30 citas/mes) y 30 días gratis en todos los planes pagos. Sin tarjeta de crédito. Sin compromiso.",
              },
              {
                q: "¿Cómo recibe el paciente los recordatorios?",
                a: "Por notificación push (si instala la app) o por SMS. También por email. El sistema envía recordatorios 24 horas y 1 hora antes de cada cita.",
              },
              {
                q: "¿Qué pasa con los pacientes que ya tengo en mi libreta?",
                a: "Puedes agregarlos como walk-in directamente desde el dashboard. También puedes compartirles tu link de TurnoMedico para que agenden ellos mismos la próxima vez.",
              },
              {
                q: "¿La secretaria necesita capacitación?",
                a: "Mínima. El sistema tiene 3 botones principales: LLEGÓ, EN CONSULTA y COMPLETADO. Si tu secretaria usa WhatsApp, puede usar TurnoMedico. Además, ofrecemos onboarding asistido.",
              },
              {
                q: "¿Qué es la pantalla de sala de espera?",
                a: "Es un monitor o TV en tu sala de espera que muestra el turno actual y la cola en tiempo real. Se actualiza automáticamente cuando la secretaria avanza el turno. Profesionaliza tu consultorio y elimina la pregunta '¿cuántos faltan?'.",
              },
              {
                q: "¿Puedo cancelar mi suscripción?",
                a: "En cualquier momento, desde tu panel. Sin penalidades, sin preguntas. Si cancelas, tu cuenta pasa al plan Freemium automáticamente.",
              },
            ].map((faq) => (
              <details key={faq.q} className="bg-white border border-gray-200 rounded-xl">
                <summary className="px-6 py-4 cursor-pointer font-semibold text-gray-900 hover:text-teal">
                  {faq.q}
                </summary>
                <p className="px-6 pb-4 text-sm text-gray-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* CTA FINAL                                    */}
      {/* ============================================ */}
      <section className="bg-brand-gradient text-white py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Tu consultorio merece estar en el siglo XXI
          </h2>
          <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto">
            Empieza gratis hoy. En 5 minutos tienes tu agenda online, tu perfil público
            y tu pantalla de sala de espera lista.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/registro"
              className="inline-block bg-white text-navy font-semibold px-8 py-4 rounded-xl text-lg hover:bg-teal-light/10 transition-colors shadow-lg"
            >
              Registrar mi consultorio — Gratis
            </Link>
            <Link
              href="/buscar"
              className="inline-block border-2 border-white/50 text-white font-semibold px-8 py-4 rounded-xl text-lg hover:bg-white/10 transition-colors"
            >
              Buscar médico — Agendar cita
            </Link>
          </div>
          <p className="text-sm text-white/50 mt-6">
            Sin tarjeta de crédito. Sin contratos. Sin instalaciones.
          </p>
        </div>
      </section>

      {/* ============================================ */}
      {/* FOOTER                                       */}
      {/* ============================================ */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <p className="font-bold text-white text-lg mb-3">TurnoMedico</p>
              <p className="text-sm">Tu turno médico, sin esperas.</p>
              <p className="text-sm mt-1">República Dominicana</p>
            </div>
            <div>
              <p className="font-semibold text-white text-sm mb-3">Producto</p>
              <ul className="space-y-2 text-sm">
                <li><Link href="#como-funciona" className="hover:text-white">Cómo funciona</Link></li>
                <li><Link href="#precios" className="hover:text-white">Precios</Link></li>
                <li><Link href="#para-medicos" className="hover:text-white">Para médicos</Link></li>
                <li><Link href="/buscar" className="hover:text-white">Buscar médico</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white text-sm mb-3">Legal</p>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacidad" className="hover:text-white">Política de privacidad</Link></li>
                <li><Link href="/terminos" className="hover:text-white">Términos de uso</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white text-sm mb-3">Contacto</p>
              <ul className="space-y-2 text-sm">
                <li>info@turnomedico.do</li>
                <li>Instagram: @turnomedico</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between text-sm">
            <p>© 2026 TurnoMedico. Todos los derechos reservados.</p>
            <p>TurnoMedico no es un centro médico ni ofrece servicios de salud. Es una plataforma tecnológica de gestión de turnos.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
