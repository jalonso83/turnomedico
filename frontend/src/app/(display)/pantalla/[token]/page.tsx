"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Clock, AlertCircle, Users, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";

interface QueueItem {
  position: number;
  initials: string;
  status: "waiting" | "upcoming";
  startTime: string | null;
}

interface CurrentPatient {
  initials: string;
  status: string;
  queuePosition: number;
}

interface DisplayConfig {
  displayName: string;
  welcomeMessage: string | null;
  theme: string;
  primaryColor: string;
  logoUrl: string | null;
}

interface DisplayData {
  config: DisplayConfig;
  doctorName: string;
  specialty: string;
  currentPatient: CurrentPatient | null;
  waitingQueue: QueueItem[];
  upcomingQueue: QueueItem[];
  stats: {
    total: number;
    completed: number;
    waiting: number;
    noShows: number;
    remaining: number;
    avgWaitMinutes: number;
  };
}

function to12Hour(time: string | null): string | null {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

export default function WaitingRoomDisplay() {
  const params = useParams();
  const token = params.token as string;
  const [time, setTime] = useState(new Date());
  const [data, setData] = useState<DisplayData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Clock - update every second
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch display data
  const fetchData = useCallback(async () => {
    try {
      const result = await api<DisplayData>(`/display/${token}`);
      setData(result);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Initial load + polling every 10 seconds
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Error state
  if (error && !data) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" strokeWidth={1.5} />
          <h1 className="text-2xl font-bold mb-2">Pantalla no disponible</h1>
          <p className="text-gray-400">{error}</p>
          <p className="text-gray-500 text-sm mt-4">Token: {token}</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal/30 border-t-teal rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Cargando pantalla...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="bg-brand-gradient px-8 py-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{data.doctorName}</h1>
          <p className="text-white/60 text-lg mt-1">
            {data.config.welcomeMessage || `${data.specialty} — Bienvenido/a, por favor espere su turno`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-5xl font-bold tabular-nums tracking-tight">
            {time.toLocaleTimeString("es-DO", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p className="text-white/60 capitalize mt-1">
            {time.toLocaleDateString("es-DO", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-8">
        {data.currentPatient ? (
          /* Current patient being attended */
          <div className="text-center">
            <p className="text-xl text-gray-400 mb-6 uppercase tracking-widest font-medium">
              Turno actual
            </p>
            <div className="bg-gradient-to-br from-teal/20 to-teal/5 border-2 border-teal/30 rounded-3xl px-20 py-14 backdrop-blur">
              <p className="text-9xl font-bold text-teal mb-4 tabular-nums">
                #{data.currentPatient.queuePosition}
              </p>
              <p className="text-3xl text-white/80 font-medium">
                Paciente {data.currentPatient.initials}
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal/20 text-teal text-lg font-medium">
                <span className="w-2.5 h-2.5 bg-teal rounded-full animate-pulse" />
                {data.currentPatient.status}
              </div>
            </div>
          </div>
        ) : data.stats.total === 0 ? (
          /* No appointments today */
          <div className="text-center">
            <Clock className="w-20 h-20 text-gray-600 mx-auto mb-6" strokeWidth={1} />
            <p className="text-2xl text-gray-400 font-medium">
              No hay citas programadas para hoy
            </p>
            <p className="text-gray-500 mt-2">
              La pantalla se actualizará automáticamente
            </p>
          </div>
        ) : (
          /* Appointments exist but no one in consultation */
          <div className="text-center">
            <Users className="w-20 h-20 text-teal/50 mx-auto mb-6" strokeWidth={1} />
            <p className="text-2xl text-gray-400 font-medium">
              {data.stats.waiting > 0
                ? `${data.stats.waiting} paciente${data.stats.waiting > 1 ? "s" : ""} en espera`
                : "Esperando próximo paciente"
              }
            </p>
            <p className="text-gray-500 mt-2">
              La consulta comenzará en breve
            </p>
          </div>
        )}
      </div>

      {/* Queue */}
      <div className="bg-white/5 border-t border-white/10 px-8 py-6">
        {data.waitingQueue.length > 0 ? (
          <div>
            <p className="text-sm text-gray-400 uppercase tracking-wider font-medium mb-3">
              En sala de espera ({data.waitingQueue.length})
            </p>
            <div className="flex gap-3 overflow-x-auto">
              {data.waitingQueue.map((item) => (
                <div
                  key={item.position}
                  className="px-6 py-3 rounded-xl text-center bg-teal/10 border border-teal/20 shrink-0"
                >
                  <p className="text-2xl font-bold text-teal">#{item.position}</p>
                  <p className="text-sm text-gray-400">{item.initials}</p>
                  {to12Hour(item.startTime) && (
                    <p className="text-xs text-gray-500 mt-1">{to12Hour(item.startTime)}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-500" strokeWidth={1.5} />
              <div>
                <p className="text-sm text-gray-400">Sala de espera</p>
                <p className="text-base text-white/70">Sin pacientes en espera</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm text-gray-400">Atendidos hoy</p>
                <p className="text-base text-white/70 flex items-center gap-1 justify-end">
                  <CheckCircle className="w-4 h-4 text-teal" strokeWidth={1.5} />
                  {data.stats.completed}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Restantes</p>
                <p className="text-base text-white/70">{data.stats.remaining}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-brand-gradient px-8 py-3 flex items-center justify-between text-sm text-white/40">
        <span>TurnoMedico — turnomedico.do</span>
        <span>Actualización automática cada 10 segundos</span>
      </div>
    </div>
  );
}
