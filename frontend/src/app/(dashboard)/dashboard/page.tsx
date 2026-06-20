"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  UserPlus,
  Share2,
  Clock,
  AlertTriangle,
  CheckCircle,
  X,
  Play,
  LogIn,
  Loader2,
  Stethoscope,
  FileText,
  ClipboardList,
  Banknote,
} from "lucide-react";
import PaymentModal from "@/components/PaymentModal";

type AppointmentReason = "CONSULTATION" | "RESULTS_DELIVERY";

const REASON_CONFIG: Record<
  AppointmentReason,
  { label: string; bg: string; text: string; icon: React.ElementType }
> = {
  CONSULTATION: {
    label: "Consulta",
    bg: "bg-blue-50",
    text: "text-blue-700",
    icon: Stethoscope,
  },
  RESULTS_DELIVERY: {
    label: "Entrega resultados",
    bg: "bg-amber-50",
    text: "text-amber-700",
    icon: FileText,
  },
};
import Link from "next/link";
import { getToken, dashboard } from "@/lib/api";

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  patient: {
    id: string;
    name: string;
    phone: string;
  };
  type: string;
  reason?: AppointmentReason;
  queuePosition?: number;
  notes?: string;
  payment?: { paid: boolean; isCourtesy: boolean; total: number } | null;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  PENDING: { label: "Pendiente", bg: "bg-yellow-100", text: "text-yellow-800" },
  CONFIRMED: { label: "Confirmado", bg: "bg-blue-100", text: "text-blue-800" },
  ARRIVED: { label: "Llego", bg: "bg-teal/10", text: "text-teal" },
  IN_PROGRESS: { label: "En consulta", bg: "bg-purple-100", text: "text-purple-800" },
  COMPLETED: { label: "Completado", bg: "bg-green-100", text: "text-green-800" },
  CANCELLED_PATIENT: { label: "Cancelado", bg: "bg-red-100", text: "text-red-700" },
  CANCELLED_DOCTOR: { label: "Cancelado", bg: "bg-red-100", text: "text-red-700" },
  NO_SHOW: { label: "No asistio", bg: "bg-gray-100", text: "text-gray-600" },
};

function getNextStatus(current: string): { status: string; label: string; icon: React.ElementType } | null {
  switch (current) {
    case "PENDING":
    case "CONFIRMED":
      return { status: "ARRIVED", label: "Llego", icon: LogIn };
    case "ARRIVED":
      return { status: "IN_PROGRESS", label: "En consulta", icon: Play };
    case "IN_PROGRESS":
      return { status: "COMPLETED", label: "Completado", icon: CheckCircle };
    default:
      return null;
  }
}

export default function AgendaPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [walkInName, setWalkInName] = useState("");
  const [walkInPhone, setWalkInPhone] = useState("");
  const [walkInReason, setWalkInReason] = useState<AppointmentReason>("CONSULTATION");
  const [walkInLoading, setWalkInLoading] = useState(false);
  const [tenantSlug, setTenantSlug] = useState("");
  const [payingAppt, setPayingAppt] = useState<{ id: string; name: string } | null>(null);
  const [isSecretary, setIsSecretary] = useState(false);

  const today = new Date().toLocaleDateString("es-DO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const fetchAgenda = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const data = await dashboard.getTodayAgenda(token);
      const list = Array.isArray(data)
        ? data
        : (data as { appointments?: Appointment[] })?.appointments || [];
      setAppointments(list as Appointment[]);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar la agenda");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchAgenda();
    // Load tenant slug for share link + current user role
    const token = getToken();
    if (token) {
      dashboard.getTenant(token).then((t) => {
        const tenant = t as { slug?: string };
        if (tenant?.slug) setTenantSlug(tenant.slug);
      }).catch(() => {});
      dashboard.getMe(token).then((me) => {
        setIsSecretary(me.role === "SECRETARY");
      }).catch(() => {});
    }
  }, [fetchAgenda]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchAgenda, 30000);
    return () => clearInterval(interval);
  }, [fetchAgenda]);

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    const token = getToken();
    if (!token) return;

    setUpdatingId(appointmentId);
    try {
      await dashboard.updateAppointmentStatus(appointmentId, newStatus, token);
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentId ? { ...a, status: newStatus } : a
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar estado");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleWalkIn = async () => {
    const token = getToken();
    if (!token) return;
    if (!walkInName.trim() || !walkInPhone.trim()) return;

    setWalkInLoading(true);
    try {
      await dashboard.createWalkIn(
        {
          patientName: walkInName.trim(),
          patientPhone: walkInPhone.trim(),
          reason: walkInReason,
        },
        token
      );
      setWalkInName("");
      setWalkInPhone("");
      setWalkInReason("CONSULTATION");
      setShowWalkIn(false);
      await fetchAgenda();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear walk-in");
    } finally {
      setWalkInLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (tenantSlug) {
      navigator.clipboard.writeText(`https://turnomedico.do/${tenantSlug}`);
    }
  };

  // Stats
  const totalToday = appointments.length;
  const completed = appointments.filter((a) => a.status === "COMPLETED").length;
  const waiting = appointments.filter((a) =>
    ["PENDING", "CONFIRMED", "ARRIVED"].includes(a.status)
  ).length;
  const noShow = appointments.filter((a) => a.status === "NO_SHOW").length;

  // Split de motivos (excluye canceladas y no-show)
  const activeForReason = appointments.filter(
    (a) => !["CANCELLED_PATIENT", "CANCELLED_DOCTOR", "NO_SHOW"].includes(a.status)
  );
  const consultations = activeForReason.filter((a) => a.reason === "CONSULTATION").length;
  const resultsDeliveries = activeForReason.filter((a) => a.reason === "RESULTS_DELIVERY").length;

  const stats = [
    { label: "Total hoy", value: String(totalToday), icon: Calendar, bg: "bg-navy/5", text: "text-navy", iconColor: "text-navy" },
    { label: "Atendidos", value: String(completed), icon: CheckCircle, bg: "bg-teal/5", text: "text-teal", iconColor: "text-teal" },
    { label: "En espera", value: String(waiting), icon: Clock, bg: "bg-blue-mid/5", text: "text-blue-mid", iconColor: "text-blue-mid" },
    { label: "No asistieron", value: String(noShow), icon: AlertTriangle, bg: "bg-red-50", text: "text-red-600", iconColor: "text-red-500" },
  ];

  // Loading skeleton
  if (loading) {
    return (
      <div>
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="h-7 w-48 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-3" />
              <div className="h-8 w-12 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse" />
              <div className="h-8 w-28 bg-gray-200 rounded animate-pulse ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Payment modal */}
      {payingAppt && (
        <PaymentModal
          appointmentId={payingAppt.id}
          patientName={payingAppt.name}
          onClose={() => setPayingAppt(null)}
          onSaved={() => {
            setPayingAppt(null);
            fetchAgenda();
          }}
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Agenda del dia</h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">{today}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 border border-navy text-navy px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy/5 transition-colors"
          >
            <Share2 className="w-4 h-4" strokeWidth={1.5} />
            Compartir link
          </button>
          <button
            onClick={() => setShowWalkIn(true)}
            className="inline-flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-dark transition-colors"
          >
            <UserPlus className="w-4 h-4" strokeWidth={1.5} />
            Walk-in
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 rounded-lg border border-red-300 bg-red-50 text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Walk-in modal */}
      {showWalkIn && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-navy">Registrar Walk-in</h3>
              <button onClick={() => setShowWalkIn(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["CONSULTATION", "RESULTS_DELIVERY"] as const).map((r) => {
                    const cfg = REASON_CONFIG[r];
                    const Icon = cfg.icon;
                    const active = walkInReason === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setWalkInReason(r)}
                        className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-lg border-2 transition-all text-center ${
                          active
                            ? "border-teal bg-teal/5 text-teal"
                            : "border-gray-200 text-gray-600 hover:border-teal/30"
                        }`}
                      >
                        <Icon className="w-4 h-4" strokeWidth={1.5} />
                        <span className="text-xs font-medium leading-tight">{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del paciente</label>
                <input
                  type="text"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal focus:border-teal outline-none"
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
                <input
                  type="tel"
                  value={walkInPhone}
                  onChange={(e) => setWalkInPhone(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal focus:border-teal outline-none"
                  placeholder="809-000-0000"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowWalkIn(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleWalkIn}
                disabled={walkInLoading || !walkInName.trim() || !walkInPhone.trim()}
                className="flex-1 bg-navy text-white py-2.5 rounded-lg text-sm font-medium hover:bg-navy-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {walkInLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {walkInLoading ? "Registrando..." : "Registrar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">{stat.label}</p>
                <div className={`w-8 h-8 ${stat.bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${stat.iconColor}`} strokeWidth={1.5} />
                </div>
              </div>
              <p className={`text-3xl font-bold ${stat.text}`}>{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Reason split */}
      {totalToday > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">Motivos del día</p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 ${REASON_CONFIG.CONSULTATION.bg} rounded-lg flex items-center justify-center`}>
                <Stethoscope className={`w-4 h-4 ${REASON_CONFIG.CONSULTATION.text}`} strokeWidth={1.5} />
              </div>
              <div>
                <p className={`text-lg font-bold ${REASON_CONFIG.CONSULTATION.text}`}>{consultations}</p>
                <p className="text-xs text-gray-500 -mt-0.5">Consultas</p>
              </div>
            </div>
            <div className="h-10 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 ${REASON_CONFIG.RESULTS_DELIVERY.bg} rounded-lg flex items-center justify-center`}>
                <FileText className={`w-4 h-4 ${REASON_CONFIG.RESULTS_DELIVERY.text}`} strokeWidth={1.5} />
              </div>
              <div>
                <p className={`text-lg font-bold ${REASON_CONFIG.RESULTS_DELIVERY.text}`}>{resultsDeliveries}</p>
                <p className="text-xs text-gray-500 -mt-0.5">Entrega de resultados</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appointments list or empty state */}
      {appointments.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left text-xs font-semibold text-navy uppercase tracking-wider px-6 py-3">
                  Hora
                </th>
                <th className="text-left text-xs font-semibold text-navy uppercase tracking-wider px-6 py-3">
                  Paciente
                </th>
                <th className="text-left text-xs font-semibold text-navy uppercase tracking-wider px-6 py-3">
                  Motivo
                </th>
                <th className="text-left text-xs font-semibold text-navy uppercase tracking-wider px-6 py-3">
                  Estado
                </th>
                <th className="text-right text-xs font-semibold text-navy uppercase tracking-wider px-6 py-3">
                  Accion
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {appointments.map((appt) => {
                const statusCfg = STATUS_CONFIG[appt.status] || {
                  label: appt.status,
                  bg: "bg-gray-100",
                  text: "text-gray-600",
                };
                const next = getNextStatus(appt.status);
                const isUpdating = updatingId === appt.id;

                return (
                  <tr key={appt.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.5} />
                        <span className="text-sm font-medium text-gray-900">
                          {appt.startTime}
                        </span>
                        <span className="text-xs text-gray-400">- {appt.endTime}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{appt.patient?.name || "Sin nombre"}</p>
                      <p className="text-xs text-gray-500">{appt.patient?.phone || ""}</p>
                    </td>
                    <td className="px-6 py-4">
                      {appt.reason && REASON_CONFIG[appt.reason] ? (
                        (() => {
                          const cfg = REASON_CONFIG[appt.reason];
                          const ReasonIcon = cfg.icon;
                          return (
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
                            >
                              <ReasonIcon className="w-3 h-3" strokeWidth={1.5} />
                              {cfg.label}
                            </span>
                          );
                        })()
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}
                      >
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2 justify-end">
                        {!isSecretary && ["ARRIVED", "IN_PROGRESS", "COMPLETED"].includes(appt.status) && (
                          <Link
                            href={`/dashboard/agenda/${appt.id}`}
                            className="inline-flex items-center gap-1.5 border border-teal text-teal px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-teal/5 transition-colors"
                            title="Atender / ver expediente"
                          >
                            <ClipboardList className="w-3.5 h-3.5" strokeWidth={1.5} />
                            Atender
                          </Link>
                        )}
                        {["ARRIVED", "IN_PROGRESS", "COMPLETED"].includes(appt.status) && (
                          appt.payment?.paid ? (
                            <button
                              onClick={() => setPayingAppt({ id: appt.id, name: appt.patient?.name || "Paciente" })}
                              className="inline-flex items-center gap-1.5 border border-green-300 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors"
                              title="Ver / editar cobro"
                            >
                              <Banknote className="w-3.5 h-3.5" strokeWidth={1.5} />
                              {appt.payment.isCourtesy ? "Cortesía" : "Cobrado"}
                            </button>
                          ) : (
                            <button
                              onClick={() => setPayingAppt({ id: appt.id, name: appt.patient?.name || "Paciente" })}
                              className="inline-flex items-center gap-1.5 border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                              title="Registrar cobro"
                            >
                              <Banknote className="w-3.5 h-3.5" strokeWidth={1.5} />
                              Cobrar
                            </button>
                          )
                        )}
                        {next && (
                          <button
                            onClick={() => handleStatusChange(appt.id, next.status)}
                            disabled={isUpdating}
                            className="inline-flex items-center gap-1.5 bg-navy text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-navy-dark transition-colors disabled:opacity-60"
                          >
                            {isUpdating ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <next.icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                            )}
                            {next.label}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <div className="w-20 h-20 bg-teal/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Calendar className="w-10 h-10 text-teal" strokeWidth={1.5} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay citas para hoy</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
            Configura tu horario de atencion y comparte tu link de TurnoMedico para que tus pacientes agenden sus citas.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/dashboard/horarios"
              className="inline-flex items-center gap-2 bg-navy text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-navy-dark transition-colors"
            >
              <Clock className="w-4 h-4" strokeWidth={1.5} />
              Configurar horarios
            </Link>
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 border border-navy text-navy px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-navy/5 transition-colors"
            >
              <Share2 className="w-4 h-4" strokeWidth={1.5} />
              Compartir link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
