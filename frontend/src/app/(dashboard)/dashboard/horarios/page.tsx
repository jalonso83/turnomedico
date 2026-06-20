"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { dashboard, getToken } from "@/lib/api";
import { DAYS_OF_WEEK } from "@/lib/constants";
import { Trash2, Plus, Info, Clock, AlertTriangle } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────

interface DaySchedule {
  dayOfWeek: number;
  enabled: boolean;
  startTime: string;
  endTime: string;
  slotDurationMin: number;
  breakStart: string;
  breakEnd: string;
  noBreak: boolean;
  maxAppointments: number | null;
}

interface ScheduleOverride {
  id: string;
  date: string;
  reason?: string;
}

interface OverrideGroup {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  reason?: string;
  ids: string[];
}

// ── Helpers ────────────────────────────────────────────────────

const ymd = (dateStr: string) => dateStr.slice(0, 10);

/** Agrupa días bloqueados consecutivos con el mismo motivo en rangos. */
function groupOverrides(list: ScheduleOverride[]): OverrideGroup[] {
  const sorted = [...list].sort((a, b) => ymd(a.date).localeCompare(ymd(b.date)));
  const groups: OverrideGroup[] = [];
  for (const o of sorted) {
    const d = ymd(o.date);
    const last = groups[groups.length - 1];
    const isConsecutive =
      last &&
      (last.reason ?? "") === (o.reason ?? "") &&
      Date.parse(d + "T00:00:00Z") === Date.parse(last.to + "T00:00:00Z") + 86400000;
    if (isConsecutive) {
      last.to = d;
      last.ids.push(o.id);
    } else {
      groups.push({ from: d, to: d, reason: o.reason, ids: [o.id] });
    }
  }
  return groups;
}

function formatDay(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("es-DO", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 7; h <= 21; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    if (h < 21) {
      slots.push(`${String(h).padStart(2, "0")}:30`);
    }
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

// Monday(1) through Sunday(0) display order
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

interface ConsultationStats {
  averageConsultationTime: number;
  totalConsultations: number;
  minConsultationTime: number;
  maxConsultationTime: number;
  lastConsultationTime: number | null;
}

function defaultSchedules(): DaySchedule[] {
  return DAY_ORDER.map((dayOfWeek) => ({
    dayOfWeek,
    enabled: dayOfWeek >= 1 && dayOfWeek <= 5, // Mon-Fri on by default
    startTime: "09:00",
    endTime: "17:00",
    slotDurationMin: 30,
    breakStart: "12:00",
    breakEnd: "13:00",
    noBreak: false,
    maxAppointments: null,
  }));
}

// ── Capacity helpers ───────────────────────────────────────────

function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function availableMinutes(day: DaySchedule): number {
  const total = timeToMin(day.endTime) - timeToMin(day.startTime);
  if (total <= 0) return 0;
  if (day.noBreak) return total;
  const breakMin = timeToMin(day.breakEnd) - timeToMin(day.breakStart);
  return Math.max(0, total - Math.max(0, breakMin));
}

interface CapacityAlert {
  level: "ok" | "warn" | "error";
  minutesPerPatient: number;
  threshold: number;
  message: string;
}

function evaluateCapacity(day: DaySchedule, thresholdMin: number): CapacityAlert | null {
  if (!day.enabled || day.maxAppointments == null || day.maxAppointments <= 0) return null;
  const mins = availableMinutes(day);
  if (mins <= 0) return null;
  const perPatient = Math.floor(mins / day.maxAppointments);
  const warnAt = thresholdMin;
  const errorAt = Math.floor(thresholdMin * 0.7);
  if (perPatient >= warnAt) {
    return {
      level: "ok",
      minutesPerPatient: perPatient,
      threshold: thresholdMin,
      message: `~${perPatient} min por paciente. Margen saludable.`,
    };
  }
  if (perPatient >= errorAt) {
    return {
      level: "warn",
      minutesPerPatient: perPatient,
      threshold: thresholdMin,
      message: `~${perPatient} min por paciente. Va apretado (mínimo recomendado ${thresholdMin} min).`,
    };
  }
  return {
    level: "error",
    minutesPerPatient: perPatient,
    threshold: thresholdMin,
    message: `~${perPatient} min por paciente. No es factible mantener la calidad de consulta.`,
  };
}

// ── Component ──────────────────────────────────────────────────

export default function HorariosPage() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<DaySchedule[]>(defaultSchedules());
  const [agendaActive, setAgendaActive] = useState(false);
  const [overrides, setOverrides] = useState<ScheduleOverride[]>([]);
  const [stats, setStats] = useState<ConsultationStats | null>(null);
  const [blockFrom, setBlockFrom] = useState("");
  const [blockTo, setBlockTo] = useState("");
  const [newBlockReason, setNewBlockReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingOverride, setLoadingOverride] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(""), 5000);
  };

  // ── Load data ──────────────────────────────────────────────

  const loadData = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const [schedulesData, overridesData, tenantData, statsData] = await Promise.all([
        dashboard.getSchedules(token).catch(() => null),
        dashboard.getOverrides(token).catch(() => []),
        dashboard.getTenant(token).catch(() => null),
        dashboard.getMyConsultationStats(token).catch(() => null),
      ]);

      if (statsData) setStats(statsData);

      // Set agenda active from tenant data
      const tenant = tenantData as { doctorProfile?: { agendaActive?: boolean } };
      if (tenant?.doctorProfile) {
        setAgendaActive(tenant.doctorProfile.agendaActive ?? false);
      }

      // Map API data to local state
      const apiSchedules = schedulesData as Array<{
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        slotDurationMin: number;
        breakStart?: string;
        breakEnd?: string;
        isActive?: boolean;
        maxAppointments?: number | null;
      }>;

      if (apiSchedules && apiSchedules.length > 0) {
        const mapped = DAY_ORDER.map((dayOfWeek) => {
          const existing = apiSchedules.find(
            (s) => s.dayOfWeek === dayOfWeek
          );
          if (existing) {
            return {
              dayOfWeek,
              enabled: existing.isActive !== false,
              startTime: existing.startTime || "09:00",
              endTime: existing.endTime || "17:00",
              slotDurationMin: existing.slotDurationMin || 30,
              breakStart: existing.breakStart || "12:00",
              breakEnd: existing.breakEnd || "13:00",
              noBreak: !existing.breakStart,
              maxAppointments: existing.maxAppointments ?? null,
            };
          }
          return {
            dayOfWeek,
            enabled: false,
            startTime: "09:00",
            endTime: "17:00",
            slotDurationMin: 30,
            breakStart: "12:00",
            breakEnd: "13:00",
            noBreak: false,
            maxAppointments: null,
          };
        });
        setSchedules(mapped);
      }

      if (overridesData) {
        setOverrides(overridesData as ScheduleOverride[]);
      }
    } catch {
      // Silently handle load errors - the page shows defaults
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Schedule handlers ──────────────────────────────────────

  const updateDay = (
    index: number,
    field: keyof DaySchedule,
    value: string | number | boolean
  ) => {
    setSchedules((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSaveSchedules = async () => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = schedules.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        isActive: s.enabled,
        startTime: s.startTime,
        endTime: s.endTime,
        slotDurationMin: Number(s.slotDurationMin),
        ...(s.noBreak
          ? {}
          : { breakStart: s.breakStart, breakEnd: s.breakEnd }),
        maxAppointments: s.maxAppointments ?? null,
      }));
      await dashboard.updateSchedules(payload, token);
      showSuccess("Horarios guardados correctamente.");
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Error al guardar horarios."
      );
    } finally {
      setSaving(false);
    }
  };

  // ── Agenda toggle ──────────────────────────────────────────

  const handleToggleAgenda = async () => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      await dashboard.toggleAgenda(token);
      setAgendaActive((prev) => !prev);
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Error al cambiar estado."
      );
    }
  };

  // ── Override handlers ──────────────────────────────────────

  const reloadOverrides = async (token: string) => {
    try {
      setOverrides(((await dashboard.getOverrides(token)) as ScheduleOverride[]) ?? []);
    } catch {
      /* noop */
    }
  };

  const handleBlockRange = async () => {
    if (!blockFrom) {
      showError("Selecciona al menos la fecha inicial.");
      return;
    }
    const to = blockTo || blockFrom;
    if (to < blockFrom) {
      showError("La fecha final debe ser igual o posterior a la inicial.");
      return;
    }

    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    setLoadingOverride(true);
    try {
      await dashboard.blockOverrideRange(
        { from: blockFrom, to, reason: newBlockReason || undefined },
        token
      );
      await reloadOverrides(token);
      setBlockFrom("");
      setBlockTo("");
      setNewBlockReason("");
      showSuccess(blockFrom === to ? "Dia bloqueado." : "Rango bloqueado.");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Error al bloquear.");
    } finally {
      setLoadingOverride(false);
    }
  };

  const handleDeleteGroup = async (ids: string[]) => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      await Promise.all(ids.map((id) => dashboard.deleteOverride(id, token)));
      setOverrides((prev) => prev.filter((o) => !ids.includes(o.id)));
      showSuccess(ids.length > 1 ? "Rango desbloqueado." : "Dia desbloqueado.");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Error al desbloquear.");
    }
  };

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Configurar Horarios</h1>
        <p className="text-sm text-gray-500 mt-1">
          Define los dias y horas en que atiendes. Los pacientes podran agendar
          solo en los horarios que habilites.
        </p>
      </div>

      {/* Toast messages */}
      {successMsg && (
        <div className="mb-4 p-3 rounded-lg border border-green-300 bg-green-50 text-green-700 text-sm">
          {successMsg}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 rounded-lg border border-red-300 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Average consultation duration (read-only, calculated) */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex items-center gap-4">
        <div className="w-10 h-10 bg-teal/10 rounded-lg flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5 text-teal" strokeWidth={1.5} />
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-sm font-semibold text-navy">Duración promedio de tu consulta</span>
            <span className="text-2xl font-bold text-teal">
              {stats ? `${stats.averageConsultationTime} min` : "—"}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {stats && stats.totalConsultations > 0 ? (
              <>Calculado con tus últimas {stats.totalConsultations} consulta{stats.totalConsultations === 1 ? "" : "s"} (mín {stats.minConsultationTime} min · máx {stats.maxConsultationTime} min)</>
            ) : (
              <>Aún no tienes consultas registradas. El promedio se calculará automáticamente.</>
            )}
          </p>
        </div>
      </div>

      {/* Agenda toggle */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex items-center justify-between">
        <div>
          <span className="font-semibold text-gray-800">Agenda activa</span>
          <p className="text-xs text-gray-500 mt-0.5">
            {agendaActive
              ? "Tu agenda es visible para los pacientes"
              : "Tu agenda no es visible para pacientes aun"}
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggleAgenda}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            agendaActive ? "bg-teal" : "bg-gray-300"
          }`}
          aria-label="Toggle agenda"
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              agendaActive ? "translate-x-6" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Info banner when inactive */}
      {!agendaActive && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex gap-3">
          <Info className="w-5 h-5 text-navy shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700">
            Tu agenda no es visible para pacientes aun. Configura tus horarios y
            activala cuando estes listo.
          </p>
        </div>
      )}

      {/* Schedule grid */}
      <div className="space-y-4 mb-6">
        {schedules.map((day, index) => {
          const thresholdMin =
            stats && stats.totalConsultations >= 10
              ? stats.averageConsultationTime
              : 30;
          const capacityAlert = evaluateCapacity(day, thresholdMin);
          return (
          <div
            key={day.dayOfWeek}
            className={`bg-white rounded-xl border border-gray-200 p-4 transition-opacity ${
              !day.enabled ? "opacity-50 bg-gray-50" : ""
            }`}
          >
            {/* Day header with toggle */}
            <div className="flex items-center gap-3 mb-3">
              <button
                type="button"
                onClick={() => updateDay(index, "enabled", !day.enabled)}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  day.enabled ? "bg-teal" : "bg-gray-300"
                }`}
                aria-label={`Toggle ${DAYS_OF_WEEK[day.dayOfWeek]}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    day.enabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <span className="font-semibold text-gray-800">
                {DAYS_OF_WEEK[day.dayOfWeek]}
              </span>
            </div>

            {/* Day config (shown only when enabled) */}
            {day.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-13">
                {/* Start / End */}
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">
                      Hora inicio
                    </label>
                    <select
                      value={day.startTime}
                      onChange={(e) =>
                        updateDay(index, "startTime", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal focus:border-teal outline-none"
                    >
                      {TIME_SLOTS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">
                      Hora fin
                    </label>
                    <select
                      value={day.endTime}
                      onChange={(e) =>
                        updateDay(index, "endTime", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal focus:border-teal outline-none"
                    >
                      {TIME_SLOTS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Break */}
                <div className="md:col-span-2">
                  <div className="flex items-center gap-4">
                    {!day.noBreak && (
                      <div className="flex items-center gap-2 flex-1">
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 mb-1">
                            Descanso desde
                          </label>
                          <select
                            value={day.breakStart}
                            onChange={(e) =>
                              updateDay(index, "breakStart", e.target.value)
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal focus:border-teal outline-none"
                          >
                            {TIME_SLOTS.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                        <span className="text-gray-400 mt-5">a</span>
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 mb-1">
                            Hasta
                          </label>
                          <select
                            value={day.breakEnd}
                            onChange={(e) =>
                              updateDay(index, "breakEnd", e.target.value)
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal focus:border-teal outline-none"
                          >
                            {TIME_SLOTS.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                    <label className="flex items-center gap-2 cursor-pointer shrink-0 mt-5">
                      <input
                        type="checkbox"
                        checked={day.noBreak}
                        onChange={(e) =>
                          updateDay(index, "noBreak", e.target.checked)
                        }
                        className="h-4 w-4 rounded border-gray-300 text-teal focus:ring-teal accent-teal"
                      />
                      <span className="text-sm text-gray-600">
                        Sin descanso
                      </span>
                    </label>
                  </div>
                </div>

                {/* Max appointments */}
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">
                    Cupos máximos del día{" "}
                    <span className="text-gray-400 font-normal">(opcional, vacío = sin tope)</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={day.maxAppointments ?? ""}
                    onChange={(e) => {
                      const raw = e.target.value;
                      updateDay(
                        index,
                        "maxAppointments",
                        raw === "" ? (null as unknown as number) : Math.max(1, Math.min(200, Number(raw))),
                      );
                    }}
                    placeholder="Ej: 14"
                    className="w-full md:w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal focus:border-teal outline-none"
                  />
                  {capacityAlert && (
                    <div
                      className={`mt-2 flex items-start gap-2 text-xs rounded-md px-3 py-2 ${
                        capacityAlert.level === "ok"
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : capacityAlert.level === "warn"
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {capacityAlert.level === "ok" ? (
                        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      )}
                      <span>{capacityAlert.message}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          );
        })}
      </div>

      {/* Save button */}
      <button
        type="button"
        onClick={handleSaveSchedules}
        disabled={saving}
        className="w-full py-3 bg-navy text-white rounded-lg font-semibold hover:bg-navy-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed mb-10"
      >
        {saving ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-5 w-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Guardando...
          </span>
        ) : (
          "Guardar horarios"
        )}
      </button>

      {/* ── Blocked dates section ──────────────────────────────── */}
      <div className="border-t border-gray-200 pt-8">
        <h2 className="text-xl font-bold text-navy mb-1">Dias bloqueados</h2>
        <p className="text-sm text-gray-500 mb-6">
          Bloquea un rango de dias de una vez (vacaciones, congresos) o un dia suelto.
        </p>

        {/* Add block form (range) */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Desde</label>
              <input
                type="date"
                value={blockFrom}
                onChange={(e) => {
                  const v = e.target.value;
                  setBlockFrom(v);
                  // Si "Hasta" queda antes del inicio, lo igualamos.
                  if (blockTo && blockTo < v) setBlockTo(v);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal focus:border-teal outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">
                Hasta{" "}
                <span className="text-gray-400 font-normal">(opcional, 1 dia si vacio)</span>
              </label>
              <input
                type="date"
                value={blockTo}
                min={blockFrom || undefined}
                onChange={(e) => setBlockTo(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal focus:border-teal outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">
                Motivo{" "}
                <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                value={newBlockReason}
                onChange={(e) => setNewBlockReason(e.target.value)}
                placeholder="Vacaciones, feriado..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal focus:border-teal outline-none"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleBlockRange}
                disabled={loadingOverride}
                className="flex items-center gap-1 px-4 py-2 bg-navy text-white rounded-lg text-sm font-medium hover:bg-navy-dark transition-colors disabled:opacity-60 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                {loadingOverride ? "Bloqueando..." : "Bloquear"}
              </button>
            </div>
          </div>
        </div>

        {/* Blocked dates list (grouped into ranges) */}
        {overrides.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-500 text-sm">
            No hay dias bloqueados
          </div>
        ) : (
          <div className="space-y-2">
            {groupOverrides(overrides).map((g) => {
              const isRange = g.from !== g.to;
              return (
                <div
                  key={g.from + g.to}
                  className="bg-white rounded-xl border border-gray-200 p-3 flex items-center justify-between"
                >
                  <div>
                    <span className="font-medium text-gray-800 text-sm">
                      {isRange ? (
                        <>
                          {formatDay(g.from)} <span className="text-gray-400">al</span> {formatDay(g.to)}
                          <span className="text-gray-400 font-normal"> ({g.ids.length} dias)</span>
                        </>
                      ) : (
                        formatDay(g.from)
                      )}
                    </span>
                    {g.reason && (
                      <span className="text-gray-500 text-sm ml-2">— {g.reason}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteGroup(g.ids)}
                    className="text-gray-400 hover:text-red-600 transition-colors p-1"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
