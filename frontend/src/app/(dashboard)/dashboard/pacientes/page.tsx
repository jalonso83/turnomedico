"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, Search, Phone, Calendar, ChevronDown, ChevronUp, Clock, ArrowRight } from "lucide-react";
import { getToken, dashboard } from "@/lib/api";

interface Patient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  lastVisit?: string | null;
  totalAppointments?: number;
  totalVisits?: number; // legacy fallback
  tenantPatients?: Array<{
    createdAt: string;
  }>;
  appointments?: Array<{
    id: string;
    date: string;
    startTime: string;
    status: string;
  }>;
}

interface HistoryEntry {
  id: string;
  date: string;
  startTime: string;
  status: string;
}

export default function PacientesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [history, setHistory] = useState<Record<string, HistoryEntry[]>>({});
  const [historyLoading, setHistoryLoading] = useState<string | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const fetchPatients = useCallback(
    async (query?: string) => {
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const data = await dashboard.getPatients(token, query || undefined);
        const list = Array.isArray(data)
          ? data
          : ((data as { patients?: Patient[] })?.patients ?? []);
        setPatients(list as Patient[]);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar pacientes");
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setLoading(true);
      fetchPatients(value);
    }, 400);
    setSearchTimeout(timeout);
  };

  const toggleExpand = async (patientId: string) => {
    if (expandedId === patientId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(patientId);

    if (!history[patientId]) {
      const token = getToken();
      if (!token) return;

      setHistoryLoading(patientId);
      try {
        const data = await dashboard.getPatientHistory(patientId, token);
        const entries = Array.isArray(data)
          ? data
          : ((data as { appointments?: HistoryEntry[] })?.appointments ?? []);
        setHistory((prev) => ({ ...prev, [patientId]: entries as HistoryEntry[] }));
      } catch {
        setHistory((prev) => ({ ...prev, [patientId]: [] }));
      } finally {
        setHistoryLoading(null);
      }
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("es-DO", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const STATUS_LABELS: Record<string, string> = {
    COMPLETED: "Completado",
    CONFIRMED: "Confirmado",
    CANCELLED_PATIENT: "Cancelado",
    CANCELLED_DOCTOR: "Cancelado",
    NO_SHOW: "No asistio",
    IN_PROGRESS: "En consulta",
    ARRIVED: "Llego",
    PENDING: "Pendiente",
  };

  if (loading && patients.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <div className="h-7 w-36 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-72 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse mb-6" />
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-6">
              <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Pacientes</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Historial de pacientes que han agendado o visitado tu consultorio
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-lg border border-red-300 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={1.5} />
        <input
          type="text"
          placeholder="Buscar por nombre o telefono..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal outline-none transition-colors"
        />
      </div>

      {/* Table or Empty State */}
      {patients.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left text-xs font-semibold text-navy uppercase tracking-wider px-6 py-3">
                  Nombre
                </th>
                <th className="text-left text-xs font-semibold text-navy uppercase tracking-wider px-6 py-3">
                  Telefono
                </th>
                <th className="text-left text-xs font-semibold text-navy uppercase tracking-wider px-6 py-3">
                  Ultima visita
                </th>
                <th className="text-left text-xs font-semibold text-navy uppercase tracking-wider px-6 py-3">
                  Total visitas
                </th>
                <th className="text-right text-xs font-semibold text-navy uppercase tracking-wider px-6 py-3">
                  Historial
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {patients.map((patient) => {
                const isExpanded = expandedId === patient.id;
                const patientHistory = history[patient.id];
                const isLoadingHistory = historyLoading === patient.id;

                // Derive last visit and total visits from appointments if not directly provided
                const lastVisit =
                  patient.lastVisit ||
                  (patient.appointments && patient.appointments.length > 0
                    ? patient.appointments[0].date
                    : null);
                const totalVisits =
                  patient.totalAppointments ??
                  patient.totalVisits ??
                  patient.appointments?.length ??
                  0;

                return (
                  <tr key={patient.id} className="group">
                    <td colSpan={5} className="p-0">
                      <div
                        className="flex items-center hover:bg-gray-50 transition-colors cursor-pointer px-6 py-4"
                        onClick={() => toggleExpand(patient.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{patient.name}</p>
                        </div>
                        <div className="w-40">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Phone className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.5} />
                            {patient.phone}
                          </div>
                        </div>
                        <div className="w-36">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.5} />
                            {lastVisit ? formatDate(lastVisit) : "N/A"}
                          </div>
                        </div>
                        <div className="w-28">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal/10 text-teal">
                            {totalVisits} visitas
                          </span>
                        </div>
                        <div className="w-16 text-right">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400 inline" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400 inline" />
                          )}
                        </div>
                      </div>

                      {/* Expanded history */}
                      {isExpanded && (
                        <div className="px-6 pb-4 bg-gray-50/50">
                          {isLoadingHistory ? (
                            <div className="py-4 space-y-2">
                              {[1, 2].map((i) => (
                                <div key={i} className="h-8 w-full bg-gray-200 rounded animate-pulse" />
                              ))}
                            </div>
                          ) : patientHistory && patientHistory.length > 0 ? (
                            <div className="space-y-2 py-2">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Historial de citas
                              </p>
                              {patientHistory.map((entry) => (
                                <div
                                  key={entry.id}
                                  className="flex items-center gap-4 px-4 py-2.5 bg-white rounded-lg border border-gray-100"
                                >
                                  <Calendar className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                                  <span className="text-sm text-gray-700">
                                    {formatDate(entry.date)}
                                  </span>
                                  <Clock className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.5} />
                                  <span className="text-sm text-gray-600">{entry.startTime}</span>
                                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                    {STATUS_LABELS[entry.status] || entry.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 py-3">Sin historial de citas disponible.</p>
                          )}
                          <div className="pt-2 mt-2 border-t border-gray-100">
                            <Link
                              href={`/dashboard/pacientes/${patient.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 text-sm font-medium text-teal hover:text-teal-dark"
                            >
                              Ver ficha completa
                              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                            </Link>
                          </div>
                        </div>
                      )}
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
            <Users className="w-10 h-10 text-teal" strokeWidth={1.5} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {search
              ? "No se encontraron pacientes"
              : "Aun no tienes pacientes registrados"}
          </h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            {search
              ? "Intenta con otro nombre o numero de telefono."
              : "Cuando tus pacientes agenden citas o los registres como walk-in, apareceran aqui con su historial de visitas."}
          </p>
        </div>
      )}
    </div>
  );
}
