"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ClipboardList,
  Activity,
  Pill,
  Loader2,
  Save,
  Printer,
  Plus,
  Trash2,
  AlertCircle,
  User,
  ShieldAlert,
  Heart,
  Stethoscope,
  FileText,
  Phone,
  Cake,
  IdCard,
} from "lucide-react";
import { getToken, dashboard } from "@/lib/api";

type Tab = "nota" | "vitales" | "receta";

interface MedicalRecord {
  appointment: {
    id: string;
    date: string;
    status: string;
    reason: string;
    queuePosition: number | null;
    patient: {
      id: string;
      name: string;
      phone: string;
      cedula: string | null;
      dateOfBirth: string | null;
      gender: string | null;
    };
  };
  antecedentes: {
    bloodType: string | null;
    allergies: string | null;
    chronicConditions: string | null;
    currentMedications: string | null;
    surgeries: string | null;
    familyHistory: string | null;
    insurance: string | null;
    isVip: boolean;
    notes: string | null;
  } | null;
  consultationNote: {
    subjective: string | null;
    objective: string | null;
    assessment: string | null;
    plan: string | null;
  } | null;
  vitalSigns: {
    bloodPressureSys: number | null;
    bloodPressureDia: number | null;
    heartRate: number | null;
    respiratoryRate: number | null;
    temperature: number | null;
    weight: number | null;
    height: number | null;
    oxygenSaturation: number | null;
  } | null;
  prescription: {
    items: Array<{
      drug: string;
      dose?: string;
      frequency?: string;
      duration?: string;
      instructions?: string;
    }> | null;
    notes: string | null;
  } | null;
}

interface RxItem {
  drug: string;
  dose: string;
  frequency: string;
  duration: string;
  instructions: string;
}

const emptyRxItem = (): RxItem => ({
  drug: "",
  dose: "",
  frequency: "",
  duration: "",
  instructions: "",
});

function calcAge(dob: string | null): number | null {
  if (!dob) return null;
  const b = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age >= 0 ? age : null;
}

function calcBmi(weight: string, height: string): { bmi: number; label: string; color: string } | null {
  const w = parseFloat(weight);
  const h = parseFloat(height);
  if (!w || !h || h <= 0) return null;
  const bmi = w / (h / 100) ** 2;
  let label = "";
  let color = "";
  if (bmi < 18.5) { label = "Bajo peso"; color = "text-blue-600"; }
  else if (bmi < 25) { label = "Normal"; color = "text-teal"; }
  else if (bmi < 30) { label = "Sobrepeso"; color = "text-amber-600"; }
  else { label = "Obesidad"; color = "text-red-600"; }
  return { bmi: Math.round(bmi * 10) / 10, label, color };
}

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("es-DO", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
  } catch { return d; }
}

export default function AtenderCitaPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.id as string;

  const [tab, setTab] = useState<Tab>("nota");
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // SOAP form
  const [soap, setSoap] = useState({ subjective: "", objective: "", assessment: "", plan: "" });
  const [savingSoap, setSavingSoap] = useState(false);
  const [soapMsg, setSoapMsg] = useState("");

  // Vitals form (string state for easy controlled inputs)
  const [vitals, setVitals] = useState({
    bloodPressureSys: "", bloodPressureDia: "", heartRate: "", respiratoryRate: "",
    temperature: "", weight: "", height: "", oxygenSaturation: "",
  });
  const [savingVitals, setSavingVitals] = useState(false);
  const [vitalsMsg, setVitalsMsg] = useState("");

  // Rx form
  const [rxItems, setRxItems] = useState<RxItem[]>([]);
  const [rxNotes, setRxNotes] = useState("");
  const [savingRx, setSavingRx] = useState(false);
  const [rxMsg, setRxMsg] = useState("");

  // Refs para autosave (evitan closures obsoletos al guardar al salir / cambiar tab)
  const mountedRef = useRef(true);
  const hydratedRef = useRef(false);
  const dirtyRef = useRef({ soap: false, vitals: false, rx: false });
  const soapRef = useRef(soap);
  const vitalsRef = useRef(vitals);
  const rxItemsRef = useRef(rxItems);
  const rxNotesRef = useRef(rxNotes);
  useEffect(() => { soapRef.current = soap; }, [soap]);
  useEffect(() => { vitalsRef.current = vitals; }, [vitals]);
  useEffect(() => { rxItemsRef.current = rxItems; }, [rxItems]);
  useEffect(() => { rxNotesRef.current = rxNotes; }, [rxNotes]);

  const fetchRecord = useCallback(async () => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    try {
      const data = await dashboard.getMedicalRecord(appointmentId, token);
      setRecord(data);
      // hidrate forms
      setSoap({
        subjective: data.consultationNote?.subjective ?? "",
        objective: data.consultationNote?.objective ?? "",
        assessment: data.consultationNote?.assessment ?? "",
        plan: data.consultationNote?.plan ?? "",
      });
      setVitals({
        bloodPressureSys: data.vitalSigns?.bloodPressureSys?.toString() ?? "",
        bloodPressureDia: data.vitalSigns?.bloodPressureDia?.toString() ?? "",
        heartRate: data.vitalSigns?.heartRate?.toString() ?? "",
        respiratoryRate: data.vitalSigns?.respiratoryRate?.toString() ?? "",
        temperature: data.vitalSigns?.temperature?.toString() ?? "",
        weight: data.vitalSigns?.weight?.toString() ?? "",
        height: data.vitalSigns?.height?.toString() ?? "",
        oxygenSaturation: data.vitalSigns?.oxygenSaturation?.toString() ?? "",
      });
      const items = data.prescription?.items ?? [];
      setRxItems(
        items.length
          ? items.map((it) => ({
              drug: it.drug ?? "",
              dose: it.dose ?? "",
              frequency: it.frequency ?? "",
              duration: it.duration ?? "",
              instructions: it.instructions ?? "",
            }))
          : []
      );
      setRxNotes(data.prescription?.notes ?? "");
      // Tras hidratar, marcamos como limpio y habilitamos autosave.
      dirtyRef.current = { soap: false, vitals: false, rx: false };
      hydratedRef.current = true;
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar la cita");
    } finally {
      setLoading(false);
    }
  }, [appointmentId, router]);

  useEffect(() => { fetchRecord(); }, [fetchRecord]);

  const bmi = useMemo(() => calcBmi(vitals.weight, vitals.height), [vitals.weight, vitals.height]);

  // ── Persistencia compartida (botón manual, autosave y salida) ──────────────
  // silent=true: guarda en segundo plano sin spinners ni mensajes.
  const persistSoap = useCallback(async (silent = false) => {
    const token = getToken();
    if (!token) return;
    if (!silent) { setSavingSoap(true); setSoapMsg(""); }
    try {
      await dashboard.upsertConsultationNote(appointmentId, soapRef.current, token);
      dirtyRef.current.soap = false;
      if (!silent && mountedRef.current) {
        setSoapMsg("Nota guardada");
        setTimeout(() => { if (mountedRef.current) setSoapMsg(""); }, 2500);
      }
    } catch (err) {
      if (mountedRef.current) setError(err instanceof Error ? err.message : "Error al guardar nota");
    } finally {
      if (!silent && mountedRef.current) setSavingSoap(false);
    }
  }, [appointmentId]);

  const persistVitals = useCallback(async (silent = false) => {
    const token = getToken();
    if (!token) return;
    if (!silent) { setSavingVitals(true); setVitalsMsg(""); }
    try {
      // Enviamos null explícito en los vacíos para que limpiar un vital lo borre en BD.
      const payload: Record<string, number | null> = {};
      for (const [k, v] of Object.entries(vitalsRef.current)) {
        payload[k] = v !== "" && !isNaN(Number(v)) ? Number(v) : null;
      }
      await dashboard.upsertVitalSigns(appointmentId, payload, token);
      dirtyRef.current.vitals = false;
      if (!silent && mountedRef.current) {
        setVitalsMsg("Signos vitales guardados");
        setTimeout(() => { if (mountedRef.current) setVitalsMsg(""); }, 2500);
      }
    } catch (err) {
      if (mountedRef.current) setError(err instanceof Error ? err.message : "Error al guardar signos vitales");
    } finally {
      if (!silent && mountedRef.current) setSavingVitals(false);
    }
  }, [appointmentId]);

  const persistRx = useCallback(async (silent = false) => {
    const token = getToken();
    if (!token) return;
    if (!silent) { setSavingRx(true); setRxMsg(""); }
    try {
      const items = rxItemsRef.current
        .filter((it) => it.drug.trim().length > 0)
        .map((it) => ({
          drug: it.drug.trim(),
          dose: it.dose.trim() || undefined,
          frequency: it.frequency.trim() || undefined,
          duration: it.duration.trim() || undefined,
          instructions: it.instructions.trim() || undefined,
        }));
      await dashboard.upsertPrescription(appointmentId, { items, notes: rxNotesRef.current }, token);
      dirtyRef.current.rx = false;
      if (!silent && mountedRef.current) {
        setRxMsg("Receta guardada");
        setTimeout(() => { if (mountedRef.current) setRxMsg(""); }, 2500);
      }
    } catch (err) {
      if (mountedRef.current) setError(err instanceof Error ? err.message : "Error al guardar receta");
    } finally {
      if (!silent && mountedRef.current) setSavingRx(false);
    }
  }, [appointmentId]);

  const handleSaveSoap = () => persistSoap(false);
  const handleSaveVitals = () => persistVitals(false);
  const handleSaveRx = () => persistRx(false);

  // Autosave con debounce: solo si ya hidratamos y la sección tiene cambios.
  useEffect(() => {
    if (!hydratedRef.current || !dirtyRef.current.soap) return;
    const t = setTimeout(() => persistSoap(true), 1500);
    return () => clearTimeout(t);
  }, [soap, persistSoap]);

  useEffect(() => {
    if (!hydratedRef.current || !dirtyRef.current.vitals) return;
    const t = setTimeout(() => persistVitals(true), 1500);
    return () => clearTimeout(t);
  }, [vitals, persistVitals]);

  useEffect(() => {
    if (!hydratedRef.current || !dirtyRef.current.rx) return;
    const t = setTimeout(() => persistRx(true), 1500);
    return () => clearTimeout(t);
  }, [rxItems, rxNotes, persistRx]);

  // Al desmontar (salir de la consulta) guardamos lo que quede pendiente.
  useEffect(() => {
    // Restaurar al montar: en StrictMode (dev) el efecto corre mount→unmount→mount,
    // y sin esto mountedRef quedaría en false y los spinners no se resetearían nunca.
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (dirtyRef.current.soap) persistSoap(true);
      if (dirtyRef.current.vitals) persistVitals(true);
      if (dirtyRef.current.rx) persistRx(true);
    };
  }, [persistSoap, persistVitals, persistRx]);

  // Cambiar de pestaña: vaciamos (flush) lo pendiente antes de cambiar de vista.
  const handleTabChange = async (next: Tab) => {
    if (dirtyRef.current.soap) await persistSoap(true);
    if (dirtyRef.current.vitals) await persistVitals(true);
    if (dirtyRef.current.rx) await persistRx(true);
    setTab(next);
  };

  // Marcadores de cambios (disparan el autosave y el flush al salir).
  const updateSoap = (patch: Partial<typeof soap>) => {
    dirtyRef.current.soap = true;
    setSoap((s) => ({ ...s, ...patch }));
  };
  const updateVitals = (patch: Partial<typeof vitals>) => {
    dirtyRef.current.vitals = true;
    setVitals((v) => ({ ...v, ...patch }));
  };
  const setRxItemsDirty = (items: RxItem[]) => {
    dirtyRef.current.rx = true;
    setRxItems(items);
  };
  const setRxNotesDirty = (notes: string) => {
    dirtyRef.current.rx = true;
    setRxNotes(notes);
  };

  const handlePrintRx = () => window.print();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-7 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-32 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-96 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error && !record) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" strokeWidth={1.5} />
        <p className="text-sm text-gray-600 mb-4">{error}</p>
        <Link href="/dashboard" className="text-sm text-teal hover:underline">
          Volver a la agenda
        </Link>
      </div>
    );
  }

  if (!record) return null;

  const age = calcAge(record.appointment.patient.dateOfBirth);

  return (
    <div className="no-print-wrapper">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-teal mb-4 no-print"
      >
        <ChevronLeft className="w-4 h-4" />
        Agenda
      </Link>

      {/* Patient + appointment header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4 no-print">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-teal/10 flex items-center justify-center shrink-0">
            <User className="w-7 h-7 text-teal" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/dashboard/pacientes/${record.appointment.patient.id}`}
                className="text-lg font-bold text-navy hover:text-teal"
              >
                {record.appointment.patient.name}
              </Link>
              {record.antecedentes?.isVip && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  VIP
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700">
                {record.appointment.reason === "RESULTS_DELIVERY" ? (
                  <FileText className="w-3 h-3" strokeWidth={1.5} />
                ) : (
                  <Stethoscope className="w-3 h-3" strokeWidth={1.5} />
                )}
                {record.appointment.reason === "RESULTS_DELIVERY" ? "Entrega resultados" : "Consulta"}
              </span>
              {record.appointment.queuePosition != null && (
                <span className="text-xs text-gray-500">Turno #{record.appointment.queuePosition}</span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
              <span className="inline-flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.5} />
                {record.appointment.patient.phone}
              </span>
              {record.appointment.patient.cedula && (
                <span className="inline-flex items-center gap-1.5">
                  <IdCard className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.5} />
                  {record.appointment.patient.cedula}
                </span>
              )}
              {age !== null && (
                <span className="inline-flex items-center gap-1.5">
                  <Cake className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.5} />
                  {age} años
                </span>
              )}
              {record.antecedentes?.bloodType && (
                <span className="inline-flex items-center gap-1.5 text-red-600 font-medium">
                  <Heart className="w-3.5 h-3.5" strokeWidth={1.5} />
                  {record.antecedentes.bloodType}
                </span>
              )}
            </div>
            {/* Alerts: alergias y crónicos visibles siempre */}
            {(record.antecedentes?.allergies || record.antecedentes?.chronicConditions) && (
              <div className="mt-3 grid gap-2">
                {record.antecedentes?.allergies && (
                  <div className="inline-flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                    <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={1.5} />
                    <span><strong>Alergias:</strong> {record.antecedentes.allergies}</span>
                  </div>
                )}
                {record.antecedentes?.chronicConditions && (
                  <div className="inline-flex items-start gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={1.5} />
                    <span><strong>Crónicas:</strong> {record.antecedentes.chronicConditions}</span>
                  </div>
                )}
              </div>
            )}
            {record.antecedentes?.currentMedications && (
              <p className="mt-2 text-xs text-gray-600">
                <strong className="text-gray-700">Medicación habitual:</strong> {record.antecedentes.currentMedications}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-4 no-print">
        {(["nota", "vitales", "receta"] as const).map((t) => {
          const labels: Record<Tab, string> = { nota: "Nota SOAP", vitales: "Signos vitales", receta: "Receta" };
          const icons: Record<Tab, React.ElementType> = { nota: ClipboardList, vitales: Activity, receta: Pill };
          const Icon = icons[t];
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                active ? "border-teal text-teal" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={1.5} />
              {labels[t]}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg border border-red-300 bg-red-50 text-red-700 text-sm no-print">
          {error}
        </div>
      )}

      {/* SOAP */}
      {tab === "nota" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 no-print">
          <div className="space-y-4">
            <SoapField
              letter="S" title="Subjetivo" hint="Motivo de consulta, síntomas, anamnesis"
              value={soap.subjective}
              onChange={(v) => updateSoap({ subjective: v })}
            />
            <SoapField
              letter="O" title="Objetivo" hint="Examen físico, hallazgos clínicos"
              value={soap.objective}
              onChange={(v) => updateSoap({ objective: v })}
            />
            <SoapField
              letter="A" title="Análisis / Diagnóstico" hint="Impresión clínica, diagnóstico"
              value={soap.assessment}
              onChange={(v) => updateSoap({ assessment: v })}
            />
            <SoapField
              letter="P" title="Plan / Indicaciones" hint="Próximos pasos, estudios, recomendaciones"
              value={soap.plan}
              onChange={(v) => updateSoap({ plan: v })}
            />
          </div>
          <SaveBar saving={savingSoap} msg={soapMsg} onSave={handleSaveSoap} />
        </div>
      )}

      {/* Vitales */}
      {tab === "vitales" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 no-print">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <VitalsField label="PA sistólica" unit="mmHg" value={vitals.bloodPressureSys}
              onChange={(v) => updateVitals({ bloodPressureSys: v })} />
            <VitalsField label="PA diastólica" unit="mmHg" value={vitals.bloodPressureDia}
              onChange={(v) => updateVitals({ bloodPressureDia: v })} />
            <VitalsField label="Frecuencia cardíaca" unit="lpm" value={vitals.heartRate}
              onChange={(v) => updateVitals({ heartRate: v })} />
            <VitalsField label="Frecuencia respiratoria" unit="rpm" value={vitals.respiratoryRate}
              onChange={(v) => updateVitals({ respiratoryRate: v })} />
            <VitalsField label="Temperatura" unit="°C" step="0.1" value={vitals.temperature}
              onChange={(v) => updateVitals({ temperature: v })} />
            <VitalsField label="Saturación O₂" unit="%" value={vitals.oxygenSaturation}
              onChange={(v) => updateVitals({ oxygenSaturation: v })} />
            <VitalsField label="Peso" unit="kg" step="0.1" value={vitals.weight}
              onChange={(v) => updateVitals({ weight: v })} />
            <VitalsField label="Talla" unit="cm" value={vitals.height}
              onChange={(v) => updateVitals({ height: v })} />
          </div>
          {bmi && (
            <div className="mt-5 inline-flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-xs uppercase tracking-wide text-gray-500">IMC</span>
              <span className="text-xl font-bold text-gray-900">{bmi.bmi}</span>
              <span className={`text-sm font-medium ${bmi.color}`}>{bmi.label}</span>
            </div>
          )}
          <SaveBar saving={savingVitals} msg={vitalsMsg} onSave={handleSaveVitals} />
        </div>
      )}

      {/* Receta */}
      {tab === "receta" && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 no-print">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-700">Medicamentos</p>
              <button
                onClick={() => setRxItemsDirty([...rxItems, emptyRxItem()])}
                className="inline-flex items-center gap-1.5 text-sm text-teal hover:text-teal-dark"
              >
                <Plus className="w-4 h-4" strokeWidth={1.5} />
                Agregar
              </button>
            </div>
            {rxItems.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                <Pill className="w-10 h-10 text-gray-300 mx-auto mb-2" strokeWidth={1.5} />
                <p className="text-sm text-gray-500">Sin medicamentos. Agrega uno o usa solo las indicaciones de abajo.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rxItems.map((it, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-5">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Medicamento</label>
                      <input
                        type="text"
                        value={it.drug}
                        onChange={(e) => updateRxItem(idx, "drug", e.target.value, rxItems, setRxItemsDirty)}
                        placeholder="Amoxicilina 500mg"
                        className="form-input"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Dosis</label>
                      <input
                        type="text"
                        value={it.dose}
                        onChange={(e) => updateRxItem(idx, "dose", e.target.value, rxItems, setRxItemsDirty)}
                        placeholder="1 cápsula"
                        className="form-input"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Frecuencia</label>
                      <input
                        type="text"
                        value={it.frequency}
                        onChange={(e) => updateRxItem(idx, "frequency", e.target.value, rxItems, setRxItemsDirty)}
                        placeholder="c/ 8h"
                        className="form-input"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Duración</label>
                      <input
                        type="text"
                        value={it.duration}
                        onChange={(e) => updateRxItem(idx, "duration", e.target.value, rxItems, setRxItemsDirty)}
                        placeholder="7 días"
                        className="form-input"
                      />
                    </div>
                    <div className="md:col-span-1 flex md:items-end md:justify-end">
                      <button
                        onClick={() => setRxItemsDirty(rxItems.filter((_, i) => i !== idx))}
                        className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-red-500 hover:bg-red-50"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    </div>
                    <div className="md:col-span-12">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Instrucciones</label>
                      <input
                        type="text"
                        value={it.instructions}
                        onChange={(e) => updateRxItem(idx, "instructions", e.target.value, rxItems, setRxItemsDirty)}
                        placeholder="Tomar con alimentos"
                        className="form-input"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Indicaciones adicionales</label>
              <textarea
                value={rxNotes}
                onChange={(e) => setRxNotesDirty(e.target.value)}
                rows={3}
                placeholder="Reposo, dieta blanda, control en 7 días, etc."
                className="form-input"
              />
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              {rxMsg && <span className="text-sm text-teal">{rxMsg}</span>}
              <button
                onClick={handlePrintRx}
                className="inline-flex items-center gap-2 border border-navy text-navy px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy/5"
              >
                <Printer className="w-4 h-4" strokeWidth={1.5} />
                Imprimir
              </button>
              <button
                onClick={handleSaveRx}
                disabled={savingRx}
                className="inline-flex items-center gap-2 bg-navy text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-navy-dark disabled:opacity-60"
              >
                {savingRx ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar
              </button>
            </div>
          </div>

          {/* Printable receta (hidden until print) */}
          <div className="print-only">
            <PrintableReceta
              patient={record.appointment.patient}
              date={record.appointment.date}
              items={rxItems.filter((it) => it.drug.trim())}
              notes={rxNotes}
            />
          </div>
        </>
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
        :global(.print-only) { display: none; }
        @media print {
          :global(.no-print) { display: none !important; }
          :global(.no-print-wrapper > *:not(.print-only)) { display: none !important; }
          :global(.print-only) { display: block !important; }
        }
      `}</style>
    </div>
  );
}

function updateRxItem(
  idx: number,
  key: keyof RxItem,
  value: string,
  items: RxItem[],
  setItems: (items: RxItem[]) => void,
) {
  setItems(items.map((it, i) => (i === idx ? { ...it, [key]: value } : it)));
}

function SoapField({
  letter, title, hint, value, onChange,
}: { letter: string; title: string; hint: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-teal/10 text-teal text-sm font-bold">
          {letter}
        </span>
        <label className="text-sm font-medium text-gray-700">{title}</label>
      </div>
      <p className="text-xs text-gray-500 mb-1.5 ml-8">{hint}</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="form-input"
      />
    </div>
  );
}

function VitalsField({
  label, unit, value, onChange, step,
}: { label: string; unit: string; value: string; onChange: (v: string) => void; step?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          step={step ?? "1"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="form-input pr-12"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{unit}</span>
      </div>
    </div>
  );
}

function SaveBar({ saving, msg, onSave }: { saving: boolean; msg: string; onSave: () => void }) {
  return (
    <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
      {msg && <span className="text-sm text-teal">{msg}</span>}
      <button
        onClick={onSave}
        disabled={saving}
        className="inline-flex items-center gap-2 bg-navy text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-navy-dark disabled:opacity-60"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Guardar
      </button>
    </div>
  );
}

function PrintableReceta({
  patient, date, items, notes,
}: {
  patient: { name: string; cedula: string | null; dateOfBirth: string | null };
  date: string;
  items: RxItem[];
  notes: string;
}) {
  const age = calcAge(patient.dateOfBirth);
  return (
    <div style={{ padding: "1.5cm", fontFamily: "Georgia, serif", color: "#111", maxWidth: "21cm" }}>
      <h1 style={{ textAlign: "center", borderBottom: "2px solid #111", paddingBottom: 8, marginBottom: 16, fontSize: 18 }}>
        Récipe Médico
      </h1>
      <div style={{ fontSize: 12, marginBottom: 12 }}>
        <p><strong>Paciente:</strong> {patient.name}</p>
        <p>
          {patient.cedula && <><strong>Cédula:</strong> {patient.cedula} &nbsp;&nbsp;</>}
          {age !== null && <><strong>Edad:</strong> {age} años &nbsp;&nbsp;</>}
          <strong>Fecha:</strong> {formatDate(date)}
        </p>
      </div>
      <hr style={{ border: 0, borderTop: "1px solid #999", margin: "12px 0" }} />
      <div style={{ minHeight: "12cm", fontSize: 13 }}>
        {items.length > 0 ? (
          <ol style={{ paddingLeft: 20, lineHeight: 1.6 }}>
            {items.map((it, i) => (
              <li key={i} style={{ marginBottom: 10 }}>
                <strong>{it.drug}</strong>
                {it.dose && <> &mdash; {it.dose}</>}
                {it.frequency && <> &mdash; {it.frequency}</>}
                {it.duration && <> &mdash; {it.duration}</>}
                {it.instructions && (
                  <div style={{ fontSize: 11, color: "#444", marginLeft: 4 }}>{it.instructions}</div>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p style={{ fontStyle: "italic" }}>Sin medicamentos prescritos.</p>
        )}
        {notes && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontWeight: "bold", marginBottom: 4 }}>Indicaciones:</p>
            <p style={{ whiteSpace: "pre-wrap" }}>{notes}</p>
          </div>
        )}
      </div>
      <div style={{ marginTop: 60, fontSize: 11, textAlign: "center" }}>
        <div style={{ borderTop: "1px solid #111", width: 240, margin: "0 auto", paddingTop: 4 }}>
          Firma y sello del médico
        </div>
      </div>
    </div>
  );
}
