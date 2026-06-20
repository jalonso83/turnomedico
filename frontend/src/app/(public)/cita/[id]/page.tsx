"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, publicApi } from "@/lib/api";
import { APPOINTMENT_STATUS } from "@/lib/constants";
import {
  CalendarDays,
  Clock,
  MapPin,
  User,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronLeft,
  AlertCircle,
} from "lucide-react";

interface AppointmentDetails {
  id: string;
  patientName: string;
  patientPhone: string;
  date: string;
  startTime: string | null;
  queuePosition: number | null;
  doctorStartTime: string | null;
  status: string;
  doctorName: string;
  doctorSpecialty?: string;
  address?: string;
  city?: string;
  floor?: string;
  consultorioName?: string;
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function to12Hour(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${mStr} ${ampm}`;
}

function formatDate(dateStr: string): string {
  const clean = dateStr.split("T")[0];
  const [y, m, d] = clean.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  return `${dayNames[date.getDay()]} ${d} de ${MONTH_NAMES[m - 1]}, ${y}`;
}

export default function CitaPage() {
  const params = useParams();
  const id = params.id as string;

  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [cancelError, setCancelError] = useState("");

  // Fetch appointment
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api<AppointmentDetails>(`/appointments/${id}`)
      .then((data) => {
        setAppointment(data);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Error al cargar la cita");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    setCancelError("");
    setCancelling(true);
    try {
      await publicApi.cancelAppointment(id);
      setCancelled(true);
      setShowCancelDialog(false);
      if (appointment) {
        setAppointment({ ...appointment, status: "CANCELLED_PATIENT" });
      }
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "Error al cancelar la cita");
    } finally {
      setCancelling(false);
    }
  };

  const isCancellable = appointment &&
    !["CANCELLED_PATIENT", "CANCELLED_DOCTOR", "COMPLETED", "NO_SHOW"].includes(appointment.status);

  // Loading
  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 animate-pulse">
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4" />
          <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto mb-6" />
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  // Error
  if (error || !appointment) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" strokeWidth={1.5} />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No se pudo cargar la cita</h2>
        <p className="text-sm text-gray-500 mb-6">{error || "Cita no encontrada"}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-teal hover:underline"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver al inicio
        </Link>
      </div>
    );
  }

  const statusInfo = APPOINTMENT_STATUS[appointment.status as keyof typeof APPOINTMENT_STATUS] || {
    label: appointment.status,
    color: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-teal transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Volver al inicio
      </Link>

      {/* Cancelled success banner */}
      {cancelled && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-500 shrink-0" strokeWidth={1.5} />
          <div>
            <p className="text-sm font-medium text-red-800">Cita cancelada</p>
            <p className="text-xs text-red-600">Tu cita ha sido cancelada exitosamente</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
        {/* Status header */}
        <div className="text-center mb-6">
          {appointment.status === "CANCELLED_PATIENT" || appointment.status === "CANCELLED_DOCTOR" ? (
            <XCircle className="w-14 h-14 text-red-400 mx-auto mb-3" strokeWidth={1.5} />
          ) : appointment.status === "COMPLETED" ? (
            <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-3" strokeWidth={1.5} />
          ) : (
            <CalendarDays className="w-14 h-14 text-teal mx-auto mb-3" strokeWidth={1.5} />
          )}
          <h1 className="text-xl font-bold text-gray-900 mb-2">Detalles de tu cita</h1>
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}
          >
            {statusInfo.label}
          </span>
        </div>

        {/* Details */}
        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3">
            <User className="w-4 h-4 text-teal mt-0.5 shrink-0" strokeWidth={1.5} />
            <div>
              <p className="text-xs text-gray-500">Medico</p>
              <p className="text-sm font-medium text-gray-900">{appointment.doctorName}</p>
              {appointment.doctorSpecialty && (
                <p className="text-xs text-gray-500">{appointment.doctorSpecialty}</p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CalendarDays className="w-4 h-4 text-teal mt-0.5 shrink-0" strokeWidth={1.5} />
            <div>
              <p className="text-xs text-gray-500">Fecha</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(appointment.date)}
              </p>
            </div>
          </div>

          {appointment.queuePosition != null && (
            <div className="flex items-start gap-3">
              <span className="w-4 h-4 mt-0.5 shrink-0 text-teal font-bold text-base leading-4">#</span>
              <div>
                <p className="text-xs text-gray-500">Tu turno</p>
                <p className="text-lg font-bold text-teal">#{appointment.queuePosition}</p>
              </div>
            </div>
          )}

          {appointment.doctorStartTime && (
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-teal mt-0.5 shrink-0" strokeWidth={1.5} />
              <div>
                <p className="text-xs text-gray-500">El doctor empieza a atender</p>
                <p className="text-sm font-medium text-gray-900">
                  {to12Hour(appointment.doctorStartTime)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Te avisaremos cuando se acerque tu turno
                </p>
              </div>
            </div>
          )}

          {(appointment.address || appointment.consultorioName) && (
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-teal mt-0.5 shrink-0" strokeWidth={1.5} />
              <div>
                <p className="text-xs text-gray-500">Direccion</p>
                <p className="text-sm font-medium text-gray-900">
                  {appointment.consultorioName && <>{appointment.consultorioName}<br /></>}
                  {appointment.address}
                  {appointment.floor ? `, Piso ${appointment.floor}` : ""}
                  {appointment.city ? ` - ${appointment.city}` : ""}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <Clock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" strokeWidth={1.5} />
            <div>
              <p className="text-xs text-gray-500">ID de cita</p>
              <p className="text-sm font-mono text-gray-600">{appointment.id}</p>
            </div>
          </div>
        </div>

        {/* Cancel button */}
        {isCancellable && !cancelled && (
          <button
            onClick={() => setShowCancelDialog(true)}
            className="w-full border-2 border-red-300 text-red-600 py-3 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
          >
            Cancelar cita
          </button>
        )}
      </div>

      {/* Cancel confirmation dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-7 h-7 text-red-500" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Cancelar cita?</h3>
              <p className="text-sm text-gray-500">
                Esta accion no se puede deshacer. Se cancelara tu cita del{" "}
                {formatDate(appointment.date)}
                {appointment.queuePosition != null && (
                  <> (turno #{appointment.queuePosition})</>
                )}
                .
              </p>
            </div>

            {cancelError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-4">
                {cancelError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelDialog(false);
                  setCancelError("");
                }}
                disabled={cancelling}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                No, mantener
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {cancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cancelando...
                  </>
                ) : (
                  "Si, cancelar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
