"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ListOrdered,
  Loader2,
  ChevronUp,
  ChevronDown,
  Check,
  AlertCircle,
  MessageCircle,
  CalendarDays,
  Clock,
} from "lucide-react";
import { getToken, dashboard, type AgendaAppointment } from "@/lib/api";

/** Estados en los que el paciente ya está en el consultorio: su turno no se mueve. */
const EN_CURSO = ["ARRIVED", "IN_PROGRESS", "COMPLETED"];
const MUERTOS = ["CANCELLED_PATIENT", "CANCELLED_DOCTOR", "NO_SHOW"];

/**
 * Un turno se congela cuando ya es una promesa: o se le avisó al paciente
 * ("eres el 3ro") o ya está en el consultorio. Lo demás se puede acomodar,
 * tenga número o no. Es la misma regla que aplica el backend en `reorderQueue`.
 */
function congelada(c: AgendaAppointment) {
  return c.notifiedAt != null || EN_CURSO.includes(c.status);
}

/**
 * Ordena la lista por número de turno; las que no tienen van al final.
 *
 * La agenda del backend ordena por ESTADO primero (quien ya llegó sube al tope),
 * que sirve para la pantalla de consulta pero no para la fila: aquí lo que manda
 * es el número. Sin esto, el paciente que llega salta al primer puesto de la
 * lista aunque tenga el turno 4, y lo que se ve deja de ser la fila real.
 */
function ordenarCola(lista: AgendaAppointment[]) {
  return [...lista].sort((a, b) => {
    const qa = a.queuePosition ?? Number.MAX_SAFE_INTEGER;
    const qb = b.queuePosition ?? Number.MAX_SAFE_INTEGER;
    if (qa !== qb) return qa - qb;
    return (a.startTime ?? "").localeCompare(b.startTime ?? "");
  });
}

/**
 * Calcula el número que le tocaría a cada cita, con la MISMA lógica del
 * servidor: los congelados conservan el suyo, los fijados a mano toman el que
 * la secretaria escribió, y el resto va tomando el más bajo que quede libre,
 * en el orden en que están en pantalla.
 *
 * Se replica en el cliente para que lo que se ve antes de guardar sea
 * exactamente lo que va a quedar guardado.
 */
function calcularNumeros(
  lista: AgendaAppointment[],
  fijados: Record<string, number>,
): Record<string, number> {
  const usados = new Set<number>();
  const salida: Record<string, number> = {};

  for (const c of lista) {
    if (congelada(c) && c.queuePosition != null) {
      usados.add(c.queuePosition);
      salida[c.id] = c.queuePosition;
    }
  }
  for (const c of lista) {
    if (salida[c.id] != null) continue;
    const pedido = fijados[c.id];
    if (pedido != null && !usados.has(pedido)) {
      usados.add(pedido);
      salida[c.id] = pedido;
    }
  }
  let cursor = 1;
  for (const c of lista) {
    if (salida[c.id] != null) continue;
    while (usados.has(cursor)) cursor++;
    usados.add(cursor);
    salida[c.id] = cursor;
  }
  return salida;
}

function hoyRD() {
  const ahora = new Date();
  const rd = new Date(ahora.getTime() - 4 * 60 * 60 * 1000);
  return rd.toISOString().slice(0, 10);
}

function fechaLarga(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("es-DO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

/** Deja el teléfono en el formato que espera wa.me: solo dígitos, con país. */
function telefonoWa(raw: string) {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.length === 10) return `1${digits}`; // 8091234567 -> 18091234567
  return digits;
}

export default function TurnosPage() {
  const router = useRouter();
  const [date, setDate] = useState(hoyRD());
  const [citas, setCitas] = useState<AgendaAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [doctorName, setDoctorName] = useState("");

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 3500);
  };

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await dashboard.getAgendaByDate(date, token);
      // Las canceladas y ausentes no se ordenan ni se avisan.
      setCitas(ordenarCola(res.appointments.filter((a) => !MUERTOS.includes(a.status))));
      setFijados({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar la agenda");
    } finally {
      setLoading(false);
    }
  }, [date, router]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    (dashboard.getTenant(token) as Promise<{ user?: { name?: string } | null }>)
      .then((t) => setDoctorName(t?.user?.name ?? ""))
      .catch(() => {});
  }, []);

  /** Números que la secretaria escribió a mano; el resto se calcula solo. */
  const [fijados, setFijados] = useState<Record<string, number>>({});

  const numeros = calcularNumeros(citas, fijados);

  const mover = (idx: number, dir: -1 | 1) => moverA(idx, idx + dir);

  /**
   * Sube o baja una cita en la lista. Solo cambia el ORDEN: los números los
   * recalcula `calcularNumeros`, respetando los congelados.
   */
  const moverA = (idx: number, destino: number) => {
    if (destino < 0 || destino >= citas.length || destino === idx) return;
    if (congelada(citas[idx])) {
      setError("Ese turno ya se le avisó al paciente o ya llegó: no se puede mover");
      return;
    }
    const copia = [...citas];
    const [movida] = copia.splice(idx, 1);
    copia.splice(destino, 0, movida);
    setCitas(copia);
    // Al moverla a mano, deja de valer el número que se le hubiera escrito:
    // manda la posición en la lista.
    setFijados((f) => {
      const { [movida.id]: _, ...resto } = f;
      return resto;
    });
    setError("");
  };

  /** Lo que la secretaria está escribiendo en la casilla de una fila. */
  const [editandoPos, setEditandoPos] = useState<{ id: string; valor: string } | null>(null);

  /**
   * Fija el número que la secretaria escribió. Si ese número ya es de alguien
   * a quien se le avisó, se rechaza en el acto y se dice de quién es — mejor
   * enterarse aquí que al guardar.
   */
  const confirmarPosicion = (idx: number) => {
    if (!editandoPos) return;
    const cita = citas[idx];
    const n = parseInt(editandoPos.valor, 10);
    setEditandoPos(null);
    if (Number.isNaN(n) || n < 1) return;

    const dueno = citas.find((c) => c.id !== cita.id && congelada(c) && c.queuePosition === n);
    if (dueno) {
      setError(`El turno ${n} ya es de ${dueno.patient.name} y no se puede reasignar`);
      return;
    }
    setFijados((f) => ({ ...f, [cita.id]: n }));
    setError("");
  };

  /**
   * Lo que se manda al servidor: cada cita en el orden de pantalla, con el
   * número que la secretaria escribió (si escribió alguno). Las congeladas van
   * también, para que el servidor las reconozca como ocupadas, pero sin número
   * pedido: él conserva el que ya tienen.
   */
  const itemsParaGuardar = () =>
    citas.map((c) => ({ id: c.id, queuePosition: fijados[c.id] ?? null }));

  const guardarOrden = async () => {
    const token = getToken();
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      const res = await dashboard.reorderQueue(date, itemsParaGuardar(), token);
      setCitas(ordenarCola(res.appointments.filter((a) => !MUERTOS.includes(a.status))));
      setFijados({});
      flash("Orden guardado");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el orden");
    } finally {
      setBusy(false);
    }
  };

  const confirmarYNumerar = async () => {
    const token = getToken();
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      // Primero se congela el orden que la secretaria dejó en pantalla,
      // y después se confirma. Al revés, confirmar numeraría por orden de
      // reserva y perdería lo que ella acomodó.
      await dashboard.reorderQueue(date, itemsParaGuardar(), token);
      const r = await dashboard.confirmDay(date, token);
      await load();
      flash(`Listo: ${r.confirmadas} confirmadas, ${r.numeradas} con turno nuevo`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo confirmar el día");
    } finally {
      setBusy(false);
    }
  };

  const mensajePara = (c: AgendaAppointment) =>
    `Hola ${c.patient.name}, tu cita ${doctorName ? `con ${doctorName} ` : ""}` +
    `para el ${fechaLarga(date)} quedó confirmada. ` +
    `Tu turno es el #${c.queuePosition}. ` +
    `Detalles: ${typeof window !== "undefined" ? window.location.origin : ""}/cita/${c.id}`;

  /**
   * Handle de la pestaña de WhatsApp, para reutilizarla en cada aviso.
   *
   * El intento anterior era `window.open(url, "turnomedico_whatsapp")`, confiando
   * en que el NOMBRE de la pestaña la identificara. No funciona: `wa.me` redirige
   * a `web.whatsapp.com`, y los navegadores **borran el nombre de la ventana en
   * toda navegación cross-origin** (lo hacen desde 2020, para que el nombre no
   * sirva de canal de rastreo entre sitios). Después del primer clic la pestaña
   * ya no se llama así, el siguiente `window.open` no la encuentra, y abre otra.
   *
   * Guardar el handle sí funciona: la referencia sobrevive a la redirección.
   * No se puede LEER su URL (cross-origin), pero sí ESCRIBIRLA, que es lo único
   * que hace falta.
   */
  const waRef = useRef<Window | null>(null);

  const avisar = async (c: AgendaAppointment) => {
    const token = getToken();
    if (!token) return;
    const texto = mensajePara(c);
    const url = `https://wa.me/${telefonoWa(c.patient.phone)}?text=${encodeURIComponent(texto)}`;

    // Con 20 pacientes, abrir una pestaña por cada uno era inusable.
    if (waRef.current && !waRef.current.closed) {
      waRef.current.location.href = url;
    } else {
      waRef.current = window.open(url, "turnomedico_whatsapp");
    }
    waRef.current?.focus();

    try {
      await dashboard.markNotified(c.id, texto, token);
      setCitas((prev) =>
        prev.map((x) => (x.id === c.id ? { ...x, notifiedAt: new Date().toISOString() } : x)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el aviso");
    }
  };

  const sinTurno = citas.filter((c) => c.queuePosition == null).length;
  const pendientes = citas.filter((c) => c.status === "PENDING").length;
  const porAvisar = citas.filter((c) => c.queuePosition != null && !c.notifiedAt).length;

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-navy flex items-center gap-2">
          <ListOrdered className="w-5 h-5 text-teal" strokeWidth={1.5} />
          Turnos del día
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Ordena las citas, confirma el día y avísale a cada paciente su número por WhatsApp.
        </p>
      </div>

      {/* Selector de fecha */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <CalendarDays className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal"
          />
        </div>
        <span className="text-sm text-gray-500 capitalize">{fechaLarga(date)}</span>
      </div>

      {toast && (
        <div className="mb-4 p-3 rounded-lg border border-green-300 bg-green-50 text-green-800 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" /> {toast}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 rounded-lg border border-red-300 bg-red-50 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-teal" />
        </div>
      ) : citas.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-xl p-10 text-center">
          <Clock className="w-8 h-8 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm text-gray-500">No hay citas para este día.</p>
        </div>
      ) : (
        <>
          {/* Resumen */}
          <div className="flex flex-wrap gap-2 mb-3 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
              {citas.length} citas
            </span>
            {pendientes > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                {pendientes} por confirmar
              </span>
            )}
            {sinTurno > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                {sinTurno} sin turno
              </span>
            )}
            {porAvisar > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                {porAvisar} sin avisar
              </span>
            )}
          </div>

          <p className="text-xs text-gray-500 mb-2">
            Escribe el número de turno en la casilla, o usa las flechas, y luego guarda. Los
            turnos que ya se le avisaron al paciente, y los de quien ya llegó, quedan fijos: no
            se pueden cambiar ni reutilizar. Los demás sí, incluso si llega alguien nuevo.
            <span className="text-amber-700"> En ámbar, lo que cambiará al guardar.</span>
          </p>

          <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden mb-4">
            {citas.map((c, idx) => {
              const bloqueada = congelada(c);
              const num = numeros[c.id];
              const porGuardar = c.queuePosition !== num;
              return (
                <div
                  key={c.id}
                  className={`px-3 py-2.5 flex items-center gap-3 ${bloqueada ? "bg-gray-50" : ""}`}
                >
                  {/* Número: se puede escribir directo para mover la cita ahí */}
                  {bloqueada ? (
                    <span
                      className="w-11 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 bg-gray-100 text-gray-500"
                      title={
                        c.notifiedAt
                          ? "Ya se le avisó este turno: no se puede cambiar"
                          : "Ya llegó: su turno no se puede cambiar"
                      }
                    >
                      {c.queuePosition ?? "—"}
                    </span>
                  ) : (
                    <input
                      type="number"
                      min={1}
                      value={
                        editandoPos?.id === c.id ? editandoPos.valor : String(num ?? "")
                      }
                      onChange={(e) => setEditandoPos({ id: c.id, valor: e.target.value })}
                      onBlur={() => confirmarPosicion(idx)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                        if (e.key === "Escape") setEditandoPos(null);
                      }}
                      title="Escribe el número de turno y presiona Enter"
                      className={`w-11 h-9 rounded-lg text-center text-sm font-bold shrink-0 border outline-none focus:ring-2 focus:ring-teal ${
                        porGuardar
                          ? "bg-amber-50 text-amber-800 border-amber-300"
                          : "bg-teal/10 text-teal border-teal/30"
                      }`}
                    />
                  )}

                  {/* Paciente */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy truncate">{c.patient.name}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1.5 flex-wrap">
                      {c.status === "PENDING" && (
                        <span className="text-amber-700">Por confirmar</span>
                      )}
                      {EN_CURSO.includes(c.status) && (
                        <span className="text-gray-500">Ya llegó</span>
                      )}
                      {c.notifiedAt && (
                        <span className="text-green-700 flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> avisado
                        </span>
                      )}
                      <span className="text-gray-400">{c.patient.phone}</span>
                    </p>
                  </div>

                  {/* Avisar */}
                  {c.queuePosition != null && (
                    <button
                      onClick={() => avisar(c)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 shrink-0 ${
                        c.notifiedAt
                          ? "border-gray-200 text-gray-400 hover:bg-gray-50"
                          : "border-green-600 text-green-700 hover:bg-green-50"
                      }`}
                      title={c.notifiedAt ? "Volver a avisar" : "Avisar por WhatsApp"}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      {c.notifiedAt ? "Reenviar" : "Avisar"}
                    </button>
                  )}

                  {/* Subir / bajar una posición */}
                  <div className="flex flex-col shrink-0 border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => mover(idx, -1)}
                      disabled={idx === 0 || bloqueada}
                      title="Subir"
                      className="px-2 py-1 text-gray-500 hover:bg-gray-100 hover:text-navy disabled:opacity-25 disabled:hover:bg-transparent"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => mover(idx, 1)}
                      disabled={idx === citas.length - 1 || bloqueada}
                      title="Bajar"
                      className="px-2 py-1 text-gray-500 hover:bg-gray-100 hover:text-navy disabled:opacity-25 disabled:hover:bg-transparent border-t border-gray-200"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={confirmarYNumerar}
              disabled={busy}
              className="bg-navy text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-navy-dark disabled:opacity-60 flex items-center gap-2"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirmar y numerar
            </button>
            <button
              onClick={guardarOrden}
              disabled={busy}
              className="border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-60"
            >
              Solo guardar el orden
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            A quien ya tiene turno no se le cambia el número: si vuelves a confirmar, solo se
            numeran las citas nuevas. Los avisos se abren siempre en la misma pestaña de
            WhatsApp.
          </p>
        </>
      )}
    </div>
  );
}
