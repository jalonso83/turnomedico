"use client";

import { useCallback, useEffect, useState } from "react";
import { X, Loader2, Banknote, ShieldCheck, AlertCircle } from "lucide-react";
import { getToken, dashboard } from "@/lib/api";
import PaymentItemsEditor, {
  money,
  splitService,
  type CatalogService,
  type ServiceLine,
} from "./PaymentItemsEditor";

interface Insurance {
  id: string;
  name: string;
  shortName: string | null;
  patientCopay: number | null;
  insuranceCoverage: number | null;
}

let lineSeq = 0;
const nextKey = () => `l${++lineSeq}`;

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

  // Catálogo y líneas de servicio de esta factura
  const [services, setServices] = useState<CatalogService[]>([]);
  const [lines, setLines] = useState<ServiceLine[]>([]);

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
        setServices(ctx.services ?? []);
        if (ctx.payment) {
          // Editar un cobro ya registrado
          const pid = ctx.payment.insuranceId ?? "";
          const ars = ctx.insurances.find((i) => i.id === pid);
          const proposed = pid
            ? ars?.patientCopay ?? Math.max(0, (ctx.fee ?? 0) - (ars?.insuranceCoverage ?? 0))
            : ctx.fee ?? 0;
          setInsuranceId(pid);
          setInsuranceAmount(ctx.payment.insuranceAmount);
          setProposedCash(proposed);
          setIsCourtesy(ctx.payment.isCourtesy);
          setNotes(ctx.payment.notes ?? "");

          // La cabecera trae los totales; para la caja de "efectivo de la
          // consulta" hay que quedarse solo con la línea de consulta.
          const items = ctx.payment.items ?? [];
          const consulta = items.find((i) => i.kind === "CONSULTATION");
          setCashAmount(consulta ? consulta.cashAmount : ctx.payment.cashAmount);
          setInsuranceAmount(consulta ? consulta.insuranceAmount : ctx.payment.insuranceAmount);
          setLines(
            items
              .filter((i) => i.kind !== "CONSULTATION")
              .map((i) => ({
                key: nextKey(),
                serviceId: i.serviceId,
                description: i.description,
                unitPrice: i.unitPrice,
                quantity: i.quantity,
                cashAmount: i.cashAmount,
                insuranceAmount: i.insuranceAmount,
              })),
          );
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
    // Cambiar de ARS cambia también el reparto de cada servicio, porque cada
    // uno tiene su propia tarifa pactada con esa ARS.
    setLines((prev) =>
      prev.map((l) => {
        const svc = services.find((s) => s.id === l.serviceId);
        if (!svc) return l; // línea libre: se queda como está
        return { ...l, ...splitService(svc, id, l.quantity) };
      }),
    );
  };

  const addLine = (serviceId: string) => {
    const svc = services.find((s) => s.id === serviceId);
    if (!svc) return;
    setLines((prev) => [
      ...prev,
      {
        key: nextKey(),
        serviceId: svc.id,
        description: svc.name,
        unitPrice: svc.price,
        quantity: 1,
        ...splitService(svc, insuranceId, 1),
      },
    ]);
  };

  const changeLine = (key: string, patch: Partial<ServiceLine>) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.key !== key) return l;
        const next = { ...l, ...patch };
        // Si cambió la cantidad, se recalcula el reparto desde la tarifa.
        // Si el usuario editó el efectivo a mano, se respeta su número.
        if (patch.quantity !== undefined) {
          const svc = services.find((s) => s.id === l.serviceId);
          if (svc) Object.assign(next, splitService(svc, insuranceId, next.quantity));
        }
        return next;
      }),
    );
  };

  const removeLine = (key: string) => setLines((prev) => prev.filter((l) => l.key !== key));

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

  // La cortesía no borra las líneas: deja constancia de lo que se hizo,
  // pero pone todos los montos en cero.
  const svcCash = isCourtesy ? 0 : lines.reduce((s, l) => s + l.cashAmount, 0);
  const svcInsurance = isCourtesy ? 0 : lines.reduce((s, l) => s + l.insuranceAmount, 0);
  const totalCash = cashAmount + svcCash;
  const totalInsurance = insuranceAmount + svcInsurance;
  const total = totalCash + totalInsurance;
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
          items: [
            {
              kind: "CONSULTATION",
              description: "Consulta",
              unitPrice: fee ?? cashAmount + insuranceAmount,
              quantity: 1,
              cashAmount,
              insuranceAmount,
            },
            ...lines.map((l) => ({
              kind: "SERVICE" as const,
              serviceId: l.serviceId,
              description: l.description,
              unitPrice: l.unitPrice,
              quantity: l.quantity,
              cashAmount: l.cashAmount,
              insuranceAmount: l.insuranceAmount,
            })),
          ],
          insuranceId: insuranceId || null,
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
          <h3 className="text-lg font-semibold text-navy">Cobrar</h3>
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

            {/* Servicios del catálogo */}
            <PaymentItemsEditor
              services={services}
              lines={lines}
              currency={currency}
              disabled={isCourtesy}
              onAdd={addLine}
              onChange={changeLine}
              onRemove={removeLine}
            />

            {/* Desglose + total */}
            <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Consulta</span>
                <span className="font-medium text-gray-700">{money(cashAmount, currency)}</span>
              </div>
              {lines.length > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    Servicios{" "}
                    <span className="text-xs text-gray-400">
                      ({lines.length})
                    </span>
                  </span>
                  <span className="font-medium text-gray-700">{money(svcCash, currency)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-gray-600">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" strokeWidth={1.5} /> Aporte ARS
                </span>
                <span className="font-medium text-gray-700">
                  {money(totalInsurance, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1.5 border-t border-gray-200">
                <span className="text-xs text-gray-500">Total que recibe el doctor</span>
                <span className="text-lg font-bold text-navy">{money(total, currency)}</span>
              </div>
              {totalCash > 0 && (
                <p className="text-[11px] text-gray-500 text-right">
                  Efectivo a recibir ahora: {money(totalCash, currency)}
                </p>
              )}
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
