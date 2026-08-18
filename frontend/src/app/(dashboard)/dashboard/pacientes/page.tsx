"use client";

import { Fragment, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Search,
  Phone,
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Clock,
  ArrowRight,
} from "lucide-react";
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

  const PORPAGINA = 20;
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPatients = useCallback(
    async (query?: string, pagina = 1) => {
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const data = await dashboard.getPatients(token, query || undefined, pagina, PORPAGINA);
        const list = Array.isArray(data)
          ? data
          : ((data as { patients?: Patient[] })?.patients ?? []);
        setPatients(list as Patient[]);
        setTotal((data as { total?: number })?.total ?? list.length);
        setTotalPages((data as { totalPages?: number })?.totalPages ?? 1);
        setPage(pagina);
        setExpandedId(null); // al cambiar de página, cerrar el acordeón abierto
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

  const irAPagina = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    setLoading(true);
    fetchPatients(search || undefined, p);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setLoading(true);
      // Una búsqueda nueva siempre arranca en la página 1: quedarse en la 5
      // mostraría "sin resultados" aunque los haya.
      fetchPatients(value, 1);
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
                {/* Anchos fijos en las columnas de dato: sin esto, el ancho lo
                    decide el contenido y las columnas se mueven de una carga a
                    otra segun el largo de los telefonos o las fechas. */}
                <th className="w-44 text-left text-xs font-semibold text-navy uppercase tracking-wider px-6 py-3">
                  Telefono
                </th>
                <th className="w-44 text-left text-xs font-semibold text-navy uppercase tracking-wider px-6 py-3">
                  Ultima visita
                </th>
                <th className="w-36 text-left text-xs font-semibold text-navy uppercase tracking-wider px-6 py-3">
                  Total visitas
                </th>
                <th className="w-24 text-right text-xs font-semibold text-navy uppercase tracking-wider px-6 py-3">
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
                  <Fragment key={patient.id}>
                    {/* Fila resumen: celdas de tabla reales, para que caigan
                        debajo de su encabezado. Antes era un solo td con
                        colSpan={5} y un flexbox adentro con anchos propios:
                        dos sistemas de layout distintos que no podian
                        alinearse, y por eso Telefono y Ultima visita salian
                        corridas respecto a su etiqueta. */}
                    <tr
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => toggleExpand(patient.id)}
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{patient.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" strokeWidth={1.5} />
                          {patient.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" strokeWidth={1.5} />
                          {lastVisit ? formatDate(lastVisit) : "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal/10 text-teal whitespace-nowrap">
                          {totalVisits} visitas
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400 inline" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400 inline" />
                        )}
                      </td>
                    </tr>

                    {/* Historial: fila aparte que ocupa todo el ancho */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} className="px-6 pb-4 bg-gray-50/50">
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
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>

          {/* Paginado. Se muestra el rango y el total para que quede claro que
              la lista no termina en los 20 que se ven. */}
          <div className="flex items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-6 py-3">
            <p className="text-xs text-gray-600">
              {total === 0 ? (
                "Sin pacientes"
              ) : (
                <>
                  Mostrando{" "}
                  <span className="font-semibold text-navy">
                    {(page - 1) * PORPAGINA + 1}–{Math.min(page * PORPAGINA, total)}
                  </span>{" "}
                  de <span className="font-semibold text-navy">{total}</span>
                  {total === 1 ? " paciente" : " pacientes"}
                </>
              )}
            </p>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => irAPagina(page - 1)}
                  disabled={page === 1 || loading}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-white disabled:opacity-35 disabled:hover:bg-transparent"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 text-xs text-gray-600 tabular-nums">
                  Página <span className="font-semibold text-navy">{page}</span> de {totalPages}
                </span>
                <button
                  onClick={() => irAPagina(page + 1)}
                  disabled={page === totalPages || loading}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-white disabled:opacity-35 disabled:hover:bg-transparent"
                  aria-label="Página siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
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
