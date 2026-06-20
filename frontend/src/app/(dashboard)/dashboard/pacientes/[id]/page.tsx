"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  User,
  Phone,
  IdCard,
  MapPin,
  Cake,
  Loader2,
  Save,
  AlertCircle,
  Calendar,
  Stethoscope,
  FileText,
  Pill,
  Activity,
  ClipboardList,
  Heart,
  ShieldAlert,
} from "lucide-react";
import { getToken, dashboard, publicApi } from "@/lib/api";

interface PatientDetail {
  id: string;
  tenantPatientId: string;
  name: string;
  phone: string;
  email?: string | null;
  cedula?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
  notes?: string | null;
  insurance?: string | null;
  isVip?: boolean;
  bloodType?: string | null;
  allergies?: string | null;
  chronicConditions?: string | null;
  currentMedications?: string | null;
  surgeries?: string | null;
  familyHistory?: string | null;
  appointments?: Array<{
    id: string;
    date: string;
    startTime: string | null;
    status: string;
    type: string;
    notes?: string | null;
  }>;
}

interface TimelineEntry {
  appointmentId: string;
  date: string;
  status: string;
  reason: string;
  type: string;
  diagnosis: string | null;
  reasonText: string | null;
  plan: string | null;
  hasPrescription: boolean;
  hasVitals: boolean;
  vitalsSummary: { bp: string | null; hr: number | null; weight: number | null; temp: number | null } | null;
}

type Tab = "datos" | "antecedentes" | "historial";

const REASON_LABEL: Record<string, string> = {
  CONSULTATION: "Consulta",
  RESULTS_DELIVERY: "Entrega resultados",
};

function formatDate(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("es-DO", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return d;
  }
}

function calculateAge(dob?: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : null;
}

function DoctorPatientDetail() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [tab, setTab] = useState<Tab>("datos");
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [error, setError] = useState("");

  // Editable form state (mirrors patient on load)
  const [form, setForm] = useState<Partial<PatientDetail>>({});

  const fetchPatient = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      const data = (await dashboard.getPatient(patientId, token)) as PatientDetail;
      setPatient(data);
      setForm({
        cedula: data.cedula ?? "",
        dateOfBirth: data.dateOfBirth ? String(data.dateOfBirth).split("T")[0] : "",
        gender: data.gender ?? "",
        address: data.address ?? "",
        bloodType: data.bloodType ?? "",
        allergies: data.allergies ?? "",
        chronicConditions: data.chronicConditions ?? "",
        currentMedications: data.currentMedications ?? "",
        surgeries: data.surgeries ?? "",
        familyHistory: data.familyHistory ?? "",
      });
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar el paciente");
    } finally {
      setLoading(false);
    }
  }, [patientId, router]);

  const fetchTimeline = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setTimelineLoading(true);
    try {
      const data = await dashboard.getPatientTimeline(patientId, token);
      setTimeline(data.timeline || []);
    } catch {
      setTimeline([]);
    } finally {
      setTimelineLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchPatient();
  }, [fetchPatient]);

  useEffect(() => {
    if (tab === "historial" && timeline.length === 0 && !timelineLoading) {
      fetchTimeline();
    }
  }, [tab, timeline.length, timelineLoading, fetchTimeline]);

  const handleSave = async () => {
    const token = getToken();
    if (!token) return;
    setSaving(true);
    setSaveMsg("");
    try {
      await dashboard.updateMedicalHistory(
        patientId,
        {
          cedula: form.cedula || null,
          dateOfBirth: form.dateOfBirth || null,
          gender: form.gender || null,
          address: form.address || null,
          bloodType: form.bloodType || null,
          allergies: form.allergies || null,
          chronicConditions: form.chronicConditions || null,
          currentMedications: form.currentMedications || null,
          surgeries: form.surgeries || null,
          familyHistory: form.familyHistory || null,
        },
        token,
      );
      setSaveMsg("Guardado");
      await fetchPatient();
      setTimeout(() => setSaveMsg(""), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-7 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-32 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error && !patient) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" strokeWidth={1.5} />
        <p className="text-sm text-gray-600 mb-4">{error}</p>
        <Link href="/dashboard/pacientes" className="text-sm text-teal hover:underline">
          Volver a pacientes
        </Link>
      </div>
    );
  }

  if (!patient) return null;

  const age = calculateAge(patient.dateOfBirth);

  return (
    <div>
      {/* Back link */}
      <Link
        href="/dashboard/pacientes"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-teal mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Pacientes
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-teal/10 flex items-center justify-center shrink-0">
            <User className="w-8 h-8 text-teal" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-navy">{patient.name}</h1>
              {patient.isVip && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  VIP
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
              <span className="inline-flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.5} />
                {patient.phone}
              </span>
              {patient.cedula && (
                <span className="inline-flex items-center gap-1.5">
                  <IdCard className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.5} />
                  {patient.cedula}
                </span>
              )}
              {age !== null && (
                <span className="inline-flex items-center gap-1.5">
                  <Cake className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.5} />
                  {age} años
                </span>
              )}
              {patient.bloodType && (
                <span className="inline-flex items-center gap-1.5 text-red-600 font-medium">
                  <Heart className="w-3.5 h-3.5" strokeWidth={1.5} />
                  {patient.bloodType}
                </span>
              )}
            </div>
            {patient.allergies && (
              <div className="mt-2 inline-flex items-start gap-1.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-2 py-1">
                <ShieldAlert className="w-3.5 h-3.5 mt-px shrink-0" strokeWidth={1.5} />
                <span><strong>Alergias:</strong> {patient.allergies}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-4">
        {(["datos", "antecedentes", "historial"] as const).map((t) => {
          const labels: Record<Tab, string> = {
            datos: "Datos",
            antecedentes: "Antecedentes",
            historial: "Historial clínico",
          };
          const icons: Record<Tab, React.ElementType> = {
            datos: User,
            antecedentes: ClipboardList,
            historial: Activity,
          };
          const Icon = icons[t];
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                active
                  ? "border-teal text-teal"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={1.5} />
              {labels[t]}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg border border-red-300 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Tab content */}
      {tab === "datos" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Cédula">
              <input
                type="text"
                value={form.cedula ?? ""}
                onChange={(e) => setForm({ ...form, cedula: e.target.value })}
                placeholder="001-0000000-0"
                className="form-input"
              />
            </FormField>
            <FormField label="Fecha de nacimiento">
              <input
                type="date"
                value={form.dateOfBirth ?? ""}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                className="form-input"
              />
            </FormField>
            <FormField label="Sexo">
              <select
                value={form.gender ?? ""}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="form-input"
              >
                <option value="">—</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="O">Otro</option>
              </select>
            </FormField>
            <FormField label="Tipo de sangre">
              <select
                value={form.bloodType ?? ""}
                onChange={(e) => setForm({ ...form, bloodType: e.target.value })}
                className="form-input"
              >
                <option value="">—</option>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bt) => (
                  <option key={bt} value={bt}>
                    {bt}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Dirección" full>
              <input
                type="text"
                value={form.address ?? ""}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Calle, sector, ciudad"
                className="form-input"
              />
            </FormField>
          </div>
          <SaveBar saving={saving} saveMsg={saveMsg} onSave={handleSave} />
        </div>
      )}

      {tab === "antecedentes" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="space-y-4">
            <FormField label="Alergias" hint="Medicamentos, alimentos, ambientales">
              <textarea
                value={form.allergies ?? ""}
                onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                rows={2}
                placeholder="Ej: Penicilina, mariscos, polen"
                className="form-input"
              />
            </FormField>
            <FormField label="Enfermedades crónicas" hint="Diabetes, hipertensión, asma, etc.">
              <textarea
                value={form.chronicConditions ?? ""}
                onChange={(e) => setForm({ ...form, chronicConditions: e.target.value })}
                rows={2}
                className="form-input"
              />
            </FormField>
            <FormField label="Medicación habitual" hint="Fármacos que toma actualmente">
              <textarea
                value={form.currentMedications ?? ""}
                onChange={(e) => setForm({ ...form, currentMedications: e.target.value })}
                rows={2}
                className="form-input"
              />
            </FormField>
            <FormField label="Cirugías / hospitalizaciones previas">
              <textarea
                value={form.surgeries ?? ""}
                onChange={(e) => setForm({ ...form, surgeries: e.target.value })}
                rows={2}
                className="form-input"
              />
            </FormField>
            <FormField label="Antecedentes familiares" hint="Enfermedades hereditarias relevantes">
              <textarea
                value={form.familyHistory ?? ""}
                onChange={(e) => setForm({ ...form, familyHistory: e.target.value })}
                rows={2}
                className="form-input"
              />
            </FormField>
          </div>
          <SaveBar saving={saving} saveMsg={saveMsg} onSave={handleSave} />
        </div>
      )}

      {tab === "historial" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          {timelineLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : timeline.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-sm text-gray-500">Sin consultas registradas todavía.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {timeline.map((entry) => (
                <Link
                  key={entry.appointmentId}
                  href={`/dashboard/agenda/${entry.appointmentId}`}
                  className="block border border-gray-200 rounded-lg p-4 hover:border-teal hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-teal" strokeWidth={1.5} />
                      <span className="font-medium text-gray-900">{formatDate(entry.date)}</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700">
                        {entry.reason === "RESULTS_DELIVERY" ? (
                          <FileText className="w-3 h-3" strokeWidth={1.5} />
                        ) : (
                          <Stethoscope className="w-3 h-3" strokeWidth={1.5} />
                        )}
                        {REASON_LABEL[entry.reason] ?? entry.reason}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {entry.hasVitals && (
                        <span title="Signos vitales registrados" className="inline-flex items-center w-6 h-6 rounded bg-teal/10 text-teal justify-center">
                          <Activity className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </span>
                      )}
                      {entry.hasPrescription && (
                        <span title="Receta emitida" className="inline-flex items-center w-6 h-6 rounded bg-purple-100 text-purple-700 justify-center">
                          <Pill className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </span>
                      )}
                    </div>
                  </div>
                  {entry.diagnosis && (
                    <p className="text-sm text-gray-700 mb-1">
                      <span className="text-xs uppercase tracking-wide text-gray-500 mr-1.5">Dx:</span>
                      {entry.diagnosis}
                    </p>
                  )}
                  {entry.plan && (
                    <p className="text-xs text-gray-500 line-clamp-2">{entry.plan}</p>
                  )}
                  {entry.vitalsSummary && (
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                      {entry.vitalsSummary.bp && <span>PA: <strong className="text-gray-700">{entry.vitalsSummary.bp}</strong></span>}
                      {entry.vitalsSummary.hr != null && <span>FC: <strong className="text-gray-700">{entry.vitalsSummary.hr} lpm</strong></span>}
                      {entry.vitalsSummary.temp != null && <span>T°: <strong className="text-gray-700">{entry.vitalsSummary.temp}°C</strong></span>}
                      {entry.vitalsSummary.weight != null && <span>Peso: <strong className="text-gray-700">{entry.vitalsSummary.weight} kg</strong></span>}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        :global(.form-input) {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        :global(.form-input:focus) {
          border-color: #14b8a6;
          box-shadow: 0 0 0 2px rgba(20, 184, 166, 0.2);
        }
      `}</style>
    </div>
  );
}

function FormField({
  label,
  hint,
  children,
  full,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-500 mb-1.5">{hint}</p>}
      {children}
    </div>
  );
}

function SaveBar({
  saving,
  saveMsg,
  onSave,
}: {
  saving: boolean;
  saveMsg: string;
  onSave: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
      {saveMsg && <span className="text-sm text-teal">{saveMsg}</span>}
      <button
        onClick={onSave}
        disabled={saving}
        className="inline-flex items-center gap-2 bg-navy text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-navy-dark transition-colors disabled:opacity-60"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Guardar
      </button>
    </div>
  );
}

// ── Vista de la SECRETARIA: solo datos NO clínicos (demografía + ARS + afiliado) ──
interface BasicPatient {
  id: string;
  name: string;
  phone: string;
  cedula: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  notes: string | null;
  isVip: boolean;
  insuranceId: string | null;
  insurance: { id: string; name: string; shortName: string | null } | null;
  affiliateNumber: string | null;
  appointments: Array<{ id: string; date: string; startTime: string | null; status: string; reason: string }>;
}

function SecretaryPatientBasic() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [error, setError] = useState("");
  const [patient, setPatient] = useState<BasicPatient | null>(null);
  const [insurances, setInsurances] = useState<Array<{ id: string; name: string }>>([]);
  const [form, setForm] = useState<{
    name: string;
    cedula: string;
    dateOfBirth: string;
    gender: string;
    address: string;
    insuranceId: string;
    affiliateNumber: string;
    isVip: boolean;
  }>({
    name: "",
    cedula: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    insuranceId: "",
    affiliateNumber: "",
    isVip: false,
  });

  const fetchPatient = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      const data = (await dashboard.getPatientBasic(patientId, token)) as BasicPatient;
      setPatient(data);
      setForm({
        name: data.name ?? "",
        cedula: data.cedula ?? "",
        dateOfBirth: data.dateOfBirth ? String(data.dateOfBirth).split("T")[0] : "",
        gender: data.gender ?? "",
        address: data.address ?? "",
        insuranceId: data.insuranceId ?? "",
        affiliateNumber: data.affiliateNumber ?? "",
        isVip: data.isVip ?? false,
      });
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar el paciente");
    } finally {
      setLoading(false);
    }
  }, [patientId, router]);

  useEffect(() => {
    fetchPatient();
    publicApi
      .getInsurances()
      .then((list) => setInsurances(list.map((i) => ({ id: i.id, name: i.name }))))
      .catch(() => {});
  }, [fetchPatient]);

  const handleSave = async () => {
    const token = getToken();
    if (!token) return;
    setSaving(true);
    setSaveMsg("");
    setError("");
    try {
      await dashboard.updatePatientBasic(
        patientId,
        {
          name: form.name || undefined,
          cedula: form.cedula || null,
          dateOfBirth: form.dateOfBirth || null,
          gender: form.gender || null,
          address: form.address || null,
          insuranceId: form.insuranceId || null,
          affiliateNumber: form.affiliateNumber || null,
          isVip: form.isVip,
        },
        token,
      );
      setSaveMsg("Guardado");
      await fetchPatient();
      setTimeout(() => setSaveMsg(""), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal focus:border-teal outline-none transition-colors";

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-7 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error && !patient) {
    return (
      <div className="max-w-2xl">
        <Link href="/dashboard/pacientes" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy mb-4">
          <ChevronLeft className="w-4 h-4" /> Volver a pacientes
        </Link>
        <div className="p-4 rounded-lg border border-red-300 bg-red-50 text-red-700 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Link href="/dashboard/pacientes" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy mb-4">
        <ChevronLeft className="w-4 h-4" /> Volver a pacientes
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-teal/10 rounded-full flex items-center justify-center">
          <User className="w-6 h-6 text-teal" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-navy">{patient?.name}</h1>
          <p className="text-sm text-gray-500 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5" strokeWidth={1.5} /> {patient?.phone}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg border border-red-300 bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      {/* Datos básicos */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-navy mb-4">Datos del paciente</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cedula</label>
            <input value={form.cedula} onChange={(e) => setForm({ ...form, cedula: e.target.value })} className={inputClass} placeholder="000-0000000-0" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento</label>
            <input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className={inputClass}>
              <option value="">--</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Direccion</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} />
          </div>
        </div>

        <h2 className="text-sm font-semibold text-navy mt-6 mb-4">Seguro (ARS)</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ARS</label>
            <select value={form.insuranceId} onChange={(e) => setForm({ ...form, insuranceId: e.target.value })} className={inputClass}>
              <option value="">Sin seguro (privado)</option>
              {insurances.map((ars) => (
                <option key={ars.id} value={ars.id}>{ars.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">No. de afiliado</label>
            <input value={form.affiliateNumber} onChange={(e) => setForm({ ...form, affiliateNumber: e.target.value })} className={inputClass} placeholder="Contrato / afiliado" />
          </div>
        </div>

        <label className="flex items-center gap-2 mt-4 cursor-pointer select-none">
          <input type="checkbox" checked={form.isVip} onChange={(e) => setForm({ ...form, isVip: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-teal focus:ring-teal" />
          <span className="text-sm text-gray-700">Paciente VIP</span>
        </label>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          {saveMsg && <span className="text-sm text-teal">{saveMsg}</span>}
          <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 bg-navy text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-navy-dark transition-colors disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar
          </button>
        </div>
      </div>

      {/* Citas (solo lectura, sin datos clínicos) */}
      {patient && patient.appointments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mt-6">
          <h2 className="text-sm font-semibold text-navy mb-4">Citas</h2>
          <div className="space-y-2">
            {patient.appointments.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-lg">
                <Calendar className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                <span className="text-sm text-gray-700">
                  {new Date(a.date).toLocaleDateString("es-DO", { year: "numeric", month: "short", day: "numeric" })}
                </span>
                {a.startTime && <span className="text-sm text-gray-500">{a.startTime}</span>}
                <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{a.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Punto de entrada de la ruta: decide la vista según el rol del usuario.
export default function PatientDetailPage() {
  const [role, setRole] = useState<"DOCTOR" | "SECRETARY" | "PLATFORM_ADMIN" | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    dashboard
      .getMe(token)
      .then((me) => setRole(me.role))
      .catch(() => setRole("DOCTOR"));
  }, []);

  if (role === null) {
    return (
      <div className="space-y-4">
        <div className="h-7 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  return role === "SECRETARY" ? <SecretaryPatientBasic /> : <DoctorPatientDetail />;
}
