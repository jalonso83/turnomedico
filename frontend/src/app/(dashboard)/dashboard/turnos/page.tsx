"use client";

import { useCallback, useEffect, useState } from "react";
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
      setCitas(res.appointments.filter((a) => !MUERTOS.includes(a.status)));
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

  const mover = (idx: number, dir: -1 | 1) => moverA(idx, idx + dir);

  /**
   * Lleva la cita de `idx` a la posición `destino` y recorre las demás.
   * Es lo que usan tanto las flechas como la casilla editable.
   */
  const moverA = (idx: number, destino: number) => {
    if (destino < 0 || destino >= citas.length || destino === idx) return;
    if (EN_CURSO.includes(citas[idx].status)) {
      setError("No se puede mover a un paciente que ya llegó");
      return;
    }
    // Tampoco se puede saltar por encima de alguien que ya está siendo
    // atendido: su turno está en curso.
    const rango = citas.slice(Math.min(idx, destino), Math.max(idx, destino) + 1);
    if (rango.some((c, i) => (i !== (idx < destino ? 0 : rango.length - 1)) && EN_CURSO.includes(c.status))) {
      setError("Hay un paciente que ya llegó en el medio: no se puede reordenar por encima de él");
      return;
    }
    const copia = [...citas];
    const [movida] = copia.splice(idx, 1);
    copia.splice(destino, 0, movida);
    setCitas(copia);
    setError("");
  };

  /** Lo que la secretaria está escribiendo en la casilla de una fila. */
  const [editandoPos, setEditandoPos] = useState<{ id: string; valor: string } | null>(null);

  const confirmarPosicion = (idx: number) => {
    if (!editandoPos) return;
    const n = parseInt(editandoPos.valor, 10);
    setEditandoPos(null);
    if (Number.isNaN(n)) return;
    moverA(idx, Math.min(Math.max(1, n), citas.length) - 1);
  };

  const guardarOrden = async () => {
    const token = getToken();
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      const res = await dashboard.reorderQueue(date, citas.map((c) => c.id), token);
      setCitas(res.appointments.filter((a) => !MUERTOS.includes(a.status)));
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
      await dashboard.reorderQueue(date, citas.map((c) => c.id), token);
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

  const avisar = async (c: AgendaAppointment) => {
    const token = getToken();
    if (!token) return;
    const texto = mensajePara(c);
    // Pestaña con nombre fijo: cada clic REUTILIZA la misma en vez de abrir
    // una nueva. Con 20 pacientes, "_blank" dejaba 20 pestañas abiertas.
    // El destino es un host fijo nuestro (wa.me), así que prescindir de
    // noopener aquí no expone nada: hace falta el handle para enfocarla.
    const wa = window.open(
      `https://wa.me/${telefonoWa(c.patient.phone)}?text=${encodeURIComponent(texto)}`,
      "turnomedico_whatsapp",
    );
    wa?.focus();
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
            El orden que ves es solo una sugerencia, por hora de reserva. Escribe la posición en
            la casilla del número, o usa las flechas, y luego confirma.
          </p>

          <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden mb-4">
            {citas.map((c, idx) => {
              const bloqueada = EN_CURSO.includes(c.status);
              return (
                <div
                  key={c.id}
                  className={`px-3 py-2.5 flex items-center gap-3 ${bloqueada ? "bg-gray-50" : ""}`}
                >
                  {/* Número: se puede escribir directo para mover la cita ahí */}
                  {bloqueada ? (
                    <span
                      className="w-11 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 bg-gray-100 text-gray-400"
                      title="Ya llegó: su turno no se puede cambiar"
                    >
                      {c.queuePosition ?? "—"}
                    </span>
                  ) : (
                    <input
                      type="number"
                      min={1}
                      max={citas.length}
                      value={
                        editandoPos?.id === c.id
                          ? editandoPos.valor
                          : c.queuePosition != null
                            ? String(c.queuePosition)
                            : String(idx + 1)
                      }
                      onChange={(e) => setEditandoPos({ id: c.id, valor: e.target.value })}
                      onBlur={() => confirmarPosicion(idx)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                        if (e.key === "Escape") setEditandoPos(null);
                      }}
                      title="Escribe la posición y presiona Enter"
                      className={`w-11 h-9 rounded-lg text-center text-sm font-bold shrink-0 border outline-none focus:ring-2 focus:ring-teal ${
                        c.queuePosition != null
                          ? "bg-teal/10 text-teal border-teal/30"
                          : "bg-white text-gray-500 border-gray-300"
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
                      {bloqueada && <span className="text-gray-500">Ya llegó</span>}
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
