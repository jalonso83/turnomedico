"use client";

import { useEffect, useState } from "react";
import { X, Loader2, CalendarPlus, AlertCircle, Check } from "lucide-react";
import { getToken, dashboard } from "@/lib/api";

/** Atajos típicos para citar un seguimiento. */
const ATAJOS = [
  { label: "1 semana", dias: 7 },
  { label: "2 semanas", dias: 14 },
  { label: "1 mes", dias: 30 },
  { label: "3 meses", dias: 90 },
];

function sumarDias(dias: number) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
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

export default function FollowUpModal({
  patientId,
  patientName,
  parentAppointmentId,
  onClose,
  onCreated,
}: {
  patientId: string;
  patientName: string;
  parentAppointmentId: string;
  onClose: () => void;
  onCreated: (fecha: string) => void;
}) {
  const [date, setDate] = useState(sumarDias(14));
  const [notes, setNotes] = useState("");
  const [dispo, setDispo] = useState<{
    dayOpen: boolean;
    availableCount: number | null;
    reason?: string;
  } | null>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Consulta la disponibilidad cada vez que cambia la fecha, para no dejar
  // agendar en un día bloqueado o sin cupos.
  useEffect(() => {
    const token = getToken();
    if (!token || !date) return;
    let vivo = true;
    setChecking(true);
    dashboard
      .getSlots(date, token)
      .then((d) => {
        if (vivo) setDispo(d);
      })
      .catch(() => {
        if (vivo) setDispo(null);
      })
      .finally(() => {
        if (vivo) setChecking(false);
      });
    return () => {
      vivo = false;
    };
  }, [date]);

  const cerrado = dispo != null && !dispo.dayOpen;
  const lleno = dispo?.availableCount != null && dispo.availableCount <= 0;
  const bloqueado = cerrado || lleno || checking;

  const guardar = async () => {
    const token = getToken();
    if (!token) return;
    setSaving(true);
    setError("");
    try {
      await dashboard.createAppointment(
        {
          patientId,
          date,
          reason: "FOLLOW_UP",
          parentAppointmentId,
          notes: notes.trim() || undefined,
        },
        token,
      );
      onCreated(date);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo agendar el seguimiento");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-semibold text-navy flex items-center gap-2">
            <CalendarPlus className="w-5 h-5 text-teal" strokeWidth={1.5} />
            Agendar seguimiento
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">{patientName}</p>

        <div className="space-y-4">
          {/* Atajos */}
          <div className="flex flex-wrap gap-2">
            {ATAJOS.map((a) => (
              <button
                key={a.dias}
                type="button"
                onClick={() => setDate(sumarDias(a.dias))}
                className={`text-xs px-2.5 py-1.5 rounded-lg border ${
                  date === sumarDias(a.dias)
                    ? "border-teal bg-teal/10 text-teal"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input
              type="date"
              value={date}
              min={sumarDias(1)}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal focus:border-teal"
            />
            <p className="mt-1 text-xs text-gray-500 capitalize">{fechaLarga(date)}</p>
          </div>

          {/* Disponibilidad */}
          {checking ? (
            <p className="text-xs text-gray-400 flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" /> Revisando disponibilidad…
            </p>
          ) : cerrado ? (
            <p className="text-sm text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {dispo?.reason === "blocked"
                ? "Ese día está bloqueado en la agenda."
                : "Ese día no se atiende."}
            </p>
          ) : lleno ? (
            <p className="text-sm text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Ese día ya no tiene cupos.
            </p>
          ) : (
            <p className="text-xs text-green-700 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              Día disponible
              {dispo?.availableCount != null && ` · quedan ${dispo.availableCount} cupos`}
            </p>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nota (opcional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. traer resultados de laboratorio"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal focus:border-teal"
            />
          </div>

          <p className="text-xs text-gray-500">
            La cita queda confirmada pero sin número de turno. La secretaria lo asigna y le avisa
            al paciente desde Turnos.
          </p>

          {error && (
            <div className="p-2.5 rounded-lg border border-red-300 bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={saving || bloqueado}
              className="flex-1 bg-navy text-white py-2.5 rounded-lg text-sm font-medium hover:bg-navy-dark disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Agendando…" : "Agendar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
