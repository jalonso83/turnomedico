"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { publicApi } from "@/lib/api";
import {
  Star,
  MapPin,
  Phone,
  Building2,
  DollarSign,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  User,
  Loader2,
  AlertCircle,
  Download,
  CalendarDays,
  Info,
  Stethoscope,
  FileText,
} from "lucide-react";

type AppointmentReason = "CONSULTATION" | "RESULTS_DELIVERY";

const REASON_LABEL: Record<AppointmentReason, string> = {
  CONSULTATION: "Consulta",
  RESULTS_DELIVERY: "Entrega de resultados",
};

// ── Types ──────────────────────────────────────────────────────────
interface DoctorProfile {
  id: string;
  name: string;
  slug: string;
  specialty: string;
  subspecialty?: string;
  bio?: string;
  photoUrl?: string;
  consultorioName?: string;
  address?: string;
  floor?: string;
  reference?: string;
  city?: string;
  sector?: string;
  fee?: number;
  rating?: number;
  reviews?: number;
  phone?: string;
}

interface BookingConfirmation {
  appointmentId: string;
  date: string;
  queuePosition: number | null;
  doctorStartTime: string | null;
  reason: AppointmentReason;
  doctorName: string;
  consultorioName: string | null;
}

interface DayAvailability {
  date: string;
  dayOpen: boolean;
  doctorStartTime: string | null;
  maxAppointments: number | null;
  takenCount: number;
  availableCount: number | null;
  reason?: "blocked" | "closed" | "full";
}

// ── Helpers ────────────────────────────────────────────────────────
const DAY_NAMES_SHORT = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
const MONTH_NAMES_SHORT = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

function getNext14Days(): Date[] {
  const days: Date[] = [];
  const now = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }
  return days;
}

function formatDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function to12Hour(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${mStr} ${ampm}`;
}

function formatDisplayDate(dateStr: string): string {
  // Handle ISO format "2026-04-15T00:00:00.000Z" → "2026-04-15"
  const clean = dateStr.split("T")[0];
  const [y, m, d] = clean.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const dayName = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"][date.getDay()];
  const monthName = MONTH_NAMES_SHORT[date.getMonth()];
  return `${dayName} ${d} de ${monthName}, ${y}`;
}

function isValidDominicanPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-().]/g, "");
  return /^(1)?(809|829|849)\d{7}$/.test(cleaned);
}

// ── Component ──────────────────────────────────────────────────────
export default function DoctorProfilePage() {
  const params = useParams();
  const slug = params.slug as string;
  const bookingRef = useRef<HTMLDivElement>(null);

  // Profile state
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  // Booking state
  const [days] = useState(getNext14Days);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availability, setAvailability] = useState<DayAvailability | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [reason, setReason] = useState<AppointmentReason>("CONSULTATION");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Confirmation
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);

  // Date picker scroll
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch profile
  useEffect(() => {
    if (!slug) return;
    setProfileLoading(true);
    publicApi
      .getDoctorProfile(slug)
      .then((data) => {
        setDoctor(data as DoctorProfile);
      })
      .catch((err) => {
        setProfileError(err instanceof Error ? err.message : "Error al cargar el perfil");
      })
      .finally(() => setProfileLoading(false));
  }, [slug]);

  // Auto-select today
  useEffect(() => {
    if (!profileLoading && doctor) {
      setSelectedDate(days[0]);
    }
  }, [profileLoading, doctor, days]);

  // Fetch availability when date changes
  const fetchAvailability = useCallback(async (date: Date) => {
    setSlotsLoading(true);
    setSlotsError("");
    setAvailability(null);
    setShowForm(false);

    try {
      const data = await publicApi.getDoctorSlots(slug, formatDateISO(date)) as DayAvailability;
      setAvailability(data);
    } catch (err) {
      setSlotsError(err instanceof Error ? err.message : "Error al cargar disponibilidad");
    } finally {
      setSlotsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (selectedDate && doctor) {
      fetchAvailability(selectedDate);
    }
  }, [selectedDate, doctor, fetchAvailability]);

  const canBook =
    availability != null &&
    availability.dayOpen &&
    (availability.availableCount == null || availability.availableCount > 0);

  // Scroll date picker
  const scrollDates = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const amount = direction === "left" ? -200 : 200;
      scrollContainerRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  // Scroll to booking section
  const scrollToBooking = () => {
    bookingRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Submit booking
  const handleSubmit = async () => {
    setFormError("");

    if (!patientName.trim()) {
      setFormError("Ingresa tu nombre completo");
      return;
    }
    if (!patientPhone.trim()) {
      setFormError("Ingresa tu numero de telefono");
      return;
    }
    if (!isValidDominicanPhone(patientPhone)) {
      setFormError("Numero invalido. Usa formato dominicano: 809-000-0000");
      return;
    }
    if (!selectedDate) {
      setFormError("Selecciona una fecha");
      return;
    }
    if (!canBook) {
      setFormError("No hay cupos disponibles para esa fecha");
      return;
    }

    setSubmitting(true);
    try {
      const result = await publicApi.bookAppointment(slug, {
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim(),
        date: formatDateISO(selectedDate),
        reason,
      });
      setConfirmation({
        appointmentId: result.appointmentId,
        date: result.date,
        queuePosition: result.queuePosition,
        doctorStartTime: result.doctorStartTime,
        reason: result.reason,
        doctorName: result.doctorName,
        consultorioName: result.consultorioName,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al agendar la cita");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading state ────────────────────────────────────────────
  if (profileLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-32 h-32 rounded-2xl bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-7 bg-gray-200 rounded w-2/3" />
              <div className="h-5 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          </div>
          <div className="mt-8 space-y-3">
            <div className="h-5 bg-gray-200 rounded w-1/4" />
            <div className="flex gap-2">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="w-16 h-20 bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────
  if (profileError || !doctor) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" strokeWidth={1.5} />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No se pudo cargar el perfil</h2>
        <p className="text-sm text-gray-500 mb-6">{profileError || "Medico no encontrado"}</p>
        <Link
          href="/buscar"
          className="inline-flex items-center gap-2 text-sm text-teal hover:underline"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver a buscar
        </Link>
      </div>
    );
  }

  // ── Confirmation screen ──────────────────────────────────────
  if (confirmation) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-teal" strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Cita confirmada!
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Tu cita ha sido agendada exitosamente
          </p>

          <div className="bg-gray-50 rounded-xl p-5 text-left space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-teal mt-0.5 shrink-0" strokeWidth={1.5} />
              <div>
                <p className="text-xs text-gray-500">Medico</p>
                <p className="text-sm font-medium text-gray-900">{confirmation.doctorName}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CalendarDays className="w-4 h-4 text-teal mt-0.5 shrink-0" strokeWidth={1.5} />
              <div>
                <p className="text-xs text-gray-500">Fecha</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDisplayDate(confirmation.date)}
                </p>
                {confirmation.doctorStartTime && (
                  <p className="text-xs text-gray-500 mt-1">
                    El doctor comienza a atender a las {to12Hour(confirmation.doctorStartTime)}
                  </p>
                )}
              </div>
            </div>
            {confirmation.queuePosition != null && (
              <div className="flex items-start gap-3">
                <span className="w-4 h-4 mt-0.5 shrink-0 text-teal font-bold text-base leading-4">#</span>
                <div>
                  <p className="text-xs text-gray-500">Tu turno</p>
                  <p className="text-lg font-bold text-teal">#{confirmation.queuePosition}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              {confirmation.reason === "RESULTS_DELIVERY" ? (
                <FileText className="w-4 h-4 text-teal mt-0.5 shrink-0" strokeWidth={1.5} />
              ) : (
                <Stethoscope className="w-4 h-4 text-teal mt-0.5 shrink-0" strokeWidth={1.5} />
              )}
              <div>
                <p className="text-xs text-gray-500">Motivo</p>
                <p className="text-sm font-medium text-gray-900">
                  {REASON_LABEL[confirmation.reason]}
                </p>
              </div>
            </div>
            {doctor.address && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-teal mt-0.5 shrink-0" strokeWidth={1.5} />
                <div>
                  <p className="text-xs text-gray-500">Direccion</p>
                  <p className="text-sm font-medium text-gray-900">
                    {doctor.address}
                    {doctor.floor ? `, Piso ${doctor.floor}` : ""}
                    {doctor.city ? ` - ${doctor.city}` : ""}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-teal mt-0.5 shrink-0" strokeWidth={1.5} />
              <div>
                <p className="text-xs text-gray-500">ID de cita</p>
                <p className="text-sm font-mono text-gray-700">{confirmation.appointmentId}</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 mb-6">
            Te enviaremos un recordatorio 24h y 1h antes de tu cita
          </p>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-blue-mid shrink-0" strokeWidth={1.5} />
              <div className="text-left">
                <p className="text-sm font-medium text-navy">Instala la app</p>
                <p className="text-xs text-gray-600">
                  Para recibir recordatorios automaticos de tus citas
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href={`/cita/${confirmation.appointmentId}`}
              className="block text-center bg-teal text-white py-3 rounded-lg text-sm font-medium hover:bg-teal-dark transition-colors"
            >
              Ver detalles de mi cita
            </Link>
            <Link
              href="/"
              className="block text-center text-sm text-gray-500 hover:text-gray-700 transition-colors py-2"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Main profile + booking ───────────────────────────────────
  const isToday = (d: Date) => formatDateISO(d) === formatDateISO(new Date());

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
      {/* Back link */}
      <Link
        href="/buscar"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-teal transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Volver a buscar
      </Link>

      {/* Doctor Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 mb-6">
        <div className="flex flex-col sm:flex-row gap-5">
          {/* Photo */}
          <div className="shrink-0">
            {doctor.photoUrl ? (
              <img
                src={doctor.photoUrl}
                alt={doctor.name}
                className="w-28 h-28 rounded-2xl object-cover"
              />
            ) : (
              <div className="w-28 h-28 rounded-2xl bg-teal/10 flex items-center justify-center">
                <User className="w-14 h-14 text-teal" strokeWidth={1} />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{doctor.name}</h1>
            <p className="text-teal font-semibold text-base mb-0.5">{doctor.specialty}</p>
            {doctor.subspecialty && (
              <p className="text-sm text-gray-500 mb-2">{doctor.subspecialty}</p>
            )}

            {/* Rating */}
            {doctor.rating != null && (
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(doctor.rating!)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-200"
                    }`}
                    strokeWidth={1.5}
                  />
                ))}
                <span className="text-sm text-gray-500 ml-1">
                  {doctor.rating} ({doctor.reviews || 0} resenas)
                </span>
              </div>
            )}

            {/* Details grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {doctor.consultorioName && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Building2 className="w-4 h-4 text-gray-400 shrink-0" strokeWidth={1.5} />
                  {doctor.consultorioName}
                </div>
              )}
              {doctor.city && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" strokeWidth={1.5} />
                  {doctor.city}
                  {doctor.sector ? `, ${doctor.sector}` : ""}
                </div>
              )}
              {doctor.address && (
                <div className="flex items-center gap-2 text-gray-600 sm:col-span-2">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" strokeWidth={1.5} />
                  {doctor.address}
                  {doctor.floor ? `, Piso ${doctor.floor}` : ""}
                  {doctor.reference ? ` (${doctor.reference})` : ""}
                </div>
              )}
              {doctor.fee != null && (
                <div className="flex items-center gap-2 text-gray-600">
                  <DollarSign className="w-4 h-4 text-gray-400 shrink-0" strokeWidth={1.5} />
                  Consulta: <span className="font-semibold text-navy">RD${doctor.fee.toLocaleString()}</span>
                </div>
              )}
              {doctor.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" strokeWidth={1.5} />
                  {doctor.phone}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {doctor.bio && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <p className="text-sm text-gray-600 leading-relaxed">{doctor.bio}</p>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={scrollToBooking}
          className="w-full mt-5 bg-brand-gradient text-white py-3.5 rounded-xl text-base font-semibold hover:opacity-95 transition-opacity"
        >
          Agendar Cita
        </button>
      </div>

      {/* ── Booking Widget ────────────────────────────────────── */}
      <div ref={bookingRef} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
        <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-teal" strokeWidth={1.5} />
          Selecciona el día
        </h2>

        {/* Date picker */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => scrollDates("left")}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-400"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div
              ref={scrollContainerRef}
              className="flex gap-2 overflow-x-auto scrollbar-hide flex-1"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {days.map((day) => {
                const iso = formatDateISO(day);
                const selected = selectedDate && formatDateISO(selectedDate) === iso;
                const today = isToday(day);
                return (
                  <button
                    key={iso}
                    onClick={() => setSelectedDate(day)}
                    className={`flex flex-col items-center px-3 py-2.5 rounded-xl border-2 min-w-[4.5rem] transition-all text-center shrink-0 ${
                      selected
                        ? "border-teal bg-teal/5 text-teal"
                        : "border-gray-200 hover:border-teal/30 text-gray-600"
                    }`}
                  >
                    <span className="text-[10px] uppercase font-medium tracking-wide">
                      {DAY_NAMES_SHORT[day.getDay()]}
                    </span>
                    <span className="text-xl font-bold leading-tight">{day.getDate()}</span>
                    <span className="text-[10px] text-gray-400">
                      {MONTH_NAMES_SHORT[day.getMonth()]}
                    </span>
                    {today && (
                      <span className="text-[9px] font-medium text-teal mt-0.5">Hoy</span>
                    )}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => scrollDates("right")}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-400"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Availability panel */}
        <div className="mb-6">
          {slotsLoading ? (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-sm">Cargando disponibilidad...</span>
            </div>
          ) : slotsError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
              {slotsError}
            </div>
          ) : availability && selectedDate ? (
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-5">
              {!availability.dayOpen ? (
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" strokeWidth={1.5} />
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {availability.reason === "blocked"
                        ? "El doctor no atiende ese día"
                        : "El doctor no tiene horario ese día"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Selecciona otra fecha del calendario.</p>
                  </div>
                </div>
              ) : availability.reason === "full" ? (
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" strokeWidth={1.5} />
                  <div>
                    <p className="text-sm font-medium text-amber-800">No quedan cupos para esa fecha</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Ya se reservaron {availability.takenCount} de {availability.maxAppointments} cupos. Prueba otro día.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal shrink-0" strokeWidth={1.5} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {availability.availableCount != null ? (
                          <>
                            <span className="text-teal font-bold text-base">{availability.availableCount}</span>{" "}
                            cupo{availability.availableCount === 1 ? "" : "s"} disponible{availability.availableCount === 1 ? "" : "s"}
                          </>
                        ) : (
                          <>Disponible. <span className="text-gray-500 font-normal">(Sin límite de cupos)</span></>
                        )}
                      </p>
                      {availability.maxAppointments != null && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {availability.takenCount} ya reservado{availability.takenCount === 1 ? "" : "s"} de {availability.maxAppointments} totales
                        </p>
                      )}
                    </div>
                  </div>
                  {availability.doctorStartTime && (
                    <div className="flex items-center gap-3 pl-8">
                      <Clock className="w-4 h-4 text-gray-400 shrink-0" strokeWidth={1.5} />
                      <p className="text-xs text-gray-600">
                        El doctor empieza a atender a las{" "}
                        <span className="font-medium text-gray-900">{to12Hour(availability.doctorStartTime)}</span>
                      </p>
                    </div>
                  )}
                  <div className="flex items-start gap-3 pl-8">
                    <Info className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" strokeWidth={1.5} />
                    <p className="text-xs text-gray-600">
                      Se atiende por orden de turno (no por hora). Al confirmar, te asignaremos un número.
                    </p>
                  </div>
                  {!showForm && (
                    <button
                      onClick={() => setShowForm(true)}
                      className="w-full mt-2 bg-brand-gradient text-white py-3 rounded-xl text-sm font-semibold hover:opacity-95 transition-opacity"
                    >
                      Reservar mi turno
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Booking form (shown when "Reservar mi turno" pressed) */}
        {showForm && selectedDate && canBook && (
          <div className="border-t border-gray-100 pt-6">
            {/* Summary */}
            <div className="bg-teal/5 border border-teal/20 rounded-xl p-4 mb-5">
              <p className="text-sm text-gray-700">
                Tu turno para el{" "}
                <span className="font-semibold text-teal">{formatDisplayDate(formatDateISO(selectedDate))}</span>
                {availability?.doctorStartTime && (
                  <>
                    {" "}— el doctor empieza a las{" "}
                    <span className="font-semibold text-teal">{to12Hour(availability.doctorStartTime)}</span>
                  </>
                )}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Motivo de la cita
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["CONSULTATION", "RESULTS_DELIVERY"] as const).map((r) => {
                    const isActive = reason === r;
                    const Icon = r === "CONSULTATION" ? Stethoscope : FileText;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setReason(r)}
                        className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border-2 transition-all text-center ${
                          isActive
                            ? "border-teal bg-teal/5 text-teal"
                            : "border-gray-200 text-gray-600 hover:border-teal/30"
                        }`}
                      >
                        <Icon className="w-5 h-5" strokeWidth={1.5} />
                        <span className="text-xs font-medium leading-tight">
                          {REASON_LABEL[r]}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {reason === "RESULTS_DELIVERY" && (
                  <p className="text-xs text-gray-500 mt-2 flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" strokeWidth={1.5} />
                    Marcamos tu turno como entrega de resultados — suele ser más corto que una consulta.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Juan Perez"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-teal focus:border-teal outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Numero de telefono
                </label>
                <input
                  type="tel"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="809-000-0000"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-teal focus:border-teal outline-none transition-colors"
                />
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {formError}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-brand-gradient text-white py-3.5 rounded-xl text-base font-semibold hover:opacity-95 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Agendando...
                  </>
                ) : (
                  "Confirmar Cita"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
