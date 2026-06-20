"use client";

import { useCallback, useEffect, useState } from "react";
import { X, Loader2, Banknote, ShieldCheck, AlertCircle } from "lucide-react";
import { getToken, dashboard } from "@/lib/api";

interface Insurance {
  id: string;
  name: string;
  shortName: string | null;
  patientCopay: number | null;
  insuranceCoverage: number | null;
}

function money(n: number, currency = "DOP") {
  const symbol = currency === "DOP" ? "RD$" : "";
  return `${symbol}${n.toLocaleString("es-DO", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export default function PaymentModal({
  appointmentId,
  patientName,
  onClose,
  onSaved,
}: {
  appointmentId: string;
  patientName: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [fee, setFee] = useState<number | null>(null);
  const [currency, setCurrency] = useState("DOP");
  const [insurances, setInsurances] = useState<Insurance[]>([]);

  // Selección: "" = sin seguro
  const [insuranceId, setInsuranceId] = useState("");
  const [cashAmount, setCashAmount] = useState(0); // editable: lo que el doctor decide cobrar al paciente
  const [insuranceAmount, setInsuranceAmount] = useState(0); // FIJO: lo que reembolsa la ARS
  const [proposedCash, setProposedCash] = useState(0); // efectivo propuesto = precio - aporte ARS
  const [isCourtesy, setIsCourtesy] = useState(false);
  const [notes, setNotes] = useState("");

  // Calcula el efectivo propuesto y el aporte (fijo) de la ARS seleccionada.
  // Modelo RD: precio de consulta - lo que paga la ARS = parte del paciente (editable).
  const applyInsurance = useCallback(
    (id: string, feeValue: number | null, list: Insurance[]) => {
      if (!id) {
        // Privado: el paciente paga el precio completo.
        const proposed = feeValue ?? 0;
        setProposedCash(proposed);
        setCashAmount(proposed);
        setInsuranceAmount(0);
        return;
      }
      const ars = list.find((i) => i.id === id);
      const coverage = ars?.insuranceCoverage ?? 0;
      // Propuesto: copay configurado si existe, si no precio - aporte ARS (>= 0).
      const proposed =
        ars?.patientCopay ?? Math.max(0, (feeValue ?? 0) - coverage);
      setInsuranceAmount(coverage);
      setProposedCash(proposed);
      setCashAmount(proposed);
    },
    [],
  );

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    (async () => {
      try {
        const ctx = await dashboard.getPaymentContext(appointmentId, token);
        setFee(ctx.fee);
        setCurrency(ctx.currency);
        setInsurances(ctx.insurances);
        if (ctx.payment) {
          // Editar un cobro ya registrado
          const pid = ctx.payment.insuranceId ?? "";
          const ars = ctx.insurances.find((i) => i.id === pid);
          const proposed = pid
            ? ars?.patientCopay ?? Math.max(0, (ctx.fee ?? 0) - (ars?.insuranceCoverage ?? 0))
            : ctx.fee ?? 0;
          setInsuranceId(pid);
          setCashAmount(ctx.payment.cashAmount);
          setInsuranceAmount(ctx.payment.insuranceAmount);
          setProposedCash(proposed);
          setIsCourtesy(ctx.payment.isCourtesy);
          setNotes(ctx.payment.notes ?? "");
        } else {
          applyInsurance("", ctx.fee, ctx.insurances);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar el cobro");
      } finally {
        setLoading(false);
      }
    })();
  }, [appointmentId, applyInsurance]);

  const selectInsurance = (id: string) => {
    setInsuranceId(id);
    applyInsurance(id, fee, insurances);
  };

  const toggleCourtesy = (val: boolean) => {
    setIsCourtesy(val);
    if (val) {
      setCashAmount(0);
      setInsuranceAmount(0);
    } else {
      applyInsurance(insuranceId, fee, insurances);
    }
  };

  const selectedArs = insurances.find((i) => i.id === insuranceId);
  const arsNotConfigured = !!insuranceId && selectedArs?.patientCopay == null && selectedArs?.insuranceCoverage == null;
  const total = cashAmount + insuranceAmount;
  const discount = Math.max(0, proposedCash - cashAmount);

  const handleSave = async () => {
    const token = getToken();
    if (!token) return;
    setSaving(true);
    setError("");
    try {
      await dashboard.registerPayment(
        appointmentId,
        {
          fee: fee ?? total,
          cashAmount,
          insuranceId: insuranceId || null,
          insuranceAmount,
          isCourtesy,
          notes: notes.trim() || undefined,
        },
        token,
      );
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar el cobro");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-semibold text-navy">Cobrar consulta</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">{patientName}</p>

        {loading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-teal" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Seguro */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seguro (ARS)</label>
              <select
                value={insuranceId}
                onChange={(e) => selectInsurance(e.target.value)}
                disabled={isCourtesy}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal focus:border-teal outline-none disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">Sin seguro (privado)</option>
                {insurances.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.shortName || i.name}
                  </option>
                ))}
              </select>
              {arsNotConfigured && (
                <p className="mt-1.5 text-xs text-amber-700 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
                  Esta ARS no tiene tarifa configurada. Ajusta los montos o configúrala.
                </p>
              )}
            </div>

            {/* Efectivo del paciente (EDITABLE) */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                <Banknote className="w-3.5 h-3.5 text-teal" strokeWidth={1.5} /> Efectivo (paciente)
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={cashAmount}
                disabled={isCourtesy}
                onChange={(e) => setCashAmount(Math.max(0, Number(e.target.value) || 0))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal focus:border-teal disabled:bg-gray-50 disabled:text-gray-400"
              />
              {!isCourtesy && (
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Propuesto: {money(proposedCash, currency)}
                    {discount > 0 && (
                      <span className="text-amber-700"> · descuento {money(discount, currency)}</span>
                    )}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCashAmount(proposedCash)}
                      className="text-xs px-2 py-0.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
                    >
                      Completo
                    </button>
                    {insuranceId && (
                      <button
                        type="button"
                        onClick={() => setCashAmount(0)}
                        className="text-xs px-2 py-0.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
                        title="No cobrar al paciente, solo lo de la ARS"
                      >
                        Solo ARS
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Aporte ARS (FIJO) + total */}
            <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-gray-600">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" strokeWidth={1.5} /> Aporte ARS
                  <span className="text-[10px] uppercase tracking-wide text-gray-400">(fijo)</span>
                </span>
                <span className="font-medium text-gray-700">{money(insuranceAmount, currency)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Efectivo paciente</span>
                <span className="font-medium text-gray-700">{money(cashAmount, currency)}</span>
              </div>
              <div className="flex items-center justify-between pt-1.5 border-t border-gray-200">
                <span className="text-xs text-gray-500">Total que recibe el doctor</span>
                <span className="text-lg font-bold text-navy">{money(total, currency)}</span>
              </div>
            </div>

            {/* Cortesía */}
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isCourtesy}
                onChange={(e) => toggleCourtesy(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-teal focus:ring-teal"
              />
              Cortesía (no se cobra)
            </label>

            {/* Notas */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nota (opcional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. abonó la mitad, pago pendiente…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal focus:border-teal outline-none"
              />
            </div>

            {error && (
              <div className="p-2.5 rounded-lg border border-red-300 bg-red-50 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={onClose}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-navy text-white py-2.5 rounded-lg text-sm font-medium hover:bg-navy-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "Guardando…" : "Confirmar cobro"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
