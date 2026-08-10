"use client";

import { Plus, Trash2, ShieldCheck } from "lucide-react";

/** Servicio del catálogo tal como llega en el contexto de cobro. */
export interface CatalogService {
  id: string;
  name: string;
  price: number;
  category: string | null;
  insurances: Array<{
    insuranceId: string;
    patientCopay: number | null;
    insuranceCoverage: number | null;
  }>;
}

/** Línea de servicio que se está editando en el modal. */
export interface ServiceLine {
  key: string;
  serviceId: string | null;
  description: string;
  unitPrice: number;
  quantity: number;
  cashAmount: number;
  insuranceAmount: number;
}

export function money(n: number, currency = "DOP") {
  const symbol = currency === "DOP" ? "RD$" : "";
  return `${symbol}${n.toLocaleString("es-DO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Reparte una línea de servicio entre paciente y ARS según la tarifa pactada.
 * Si el servicio no tiene tarifa para esa ARS, no está cubierto: lo paga
 * completo el paciente al precio de lista.
 */
export function splitService(
  service: CatalogService,
  insuranceId: string,
  quantity: number,
): { cashAmount: number; insuranceAmount: number } {
  const tarifa = insuranceId
    ? service.insurances.find((i) => i.insuranceId === insuranceId)
    : undefined;

  if (!tarifa) {
    return { cashAmount: service.price * quantity, insuranceAmount: 0 };
  }

  const coverage = tarifa.insuranceCoverage ?? 0;
  const copay = tarifa.patientCopay ?? Math.max(0, service.price - coverage);
  return { cashAmount: copay * quantity, insuranceAmount: coverage * quantity };
}

export default function PaymentItemsEditor({
  services,
  lines,
  currency,
  disabled,
  onAdd,
  onChange,
  onRemove,
}: {
  services: CatalogService[];
  lines: ServiceLine[];
  currency: string;
  disabled: boolean;
  onAdd: (serviceId: string) => void;
  onChange: (key: string, patch: Partial<ServiceLine>) => void;
  onRemove: (key: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-sm font-medium text-gray-700">Servicios</label>
        {services.length > 0 && (
          <select
            value=""
            disabled={disabled}
            onChange={(e) => {
              if (e.target.value) onAdd(e.target.value);
            }}
            className="text-xs border border-gray-300 rounded-lg px-2 py-1 text-gray-600 outline-none focus:ring-2 focus:ring-teal disabled:bg-gray-50 disabled:text-gray-400 max-w-[60%]"
          >
            <option value="">+ Agregar servicio…</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {money(s.price, currency)}
              </option>
            ))}
          </select>
        )}
      </div>

      {services.length === 0 && lines.length === 0 ? (
        <p className="text-xs text-gray-400 py-1">
          No tienes servicios en el catálogo. Puedes agregarlos en Servicios.
        </p>
      ) : lines.length === 0 ? (
        <p className="text-xs text-gray-400 py-1">
          Solo se cobra la consulta. Agrega un servicio si hiciste algo más.
        </p>
      ) : (
        <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
          {lines.map((l) => (
            <div key={l.key} className="px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="flex-1 text-sm text-gray-700 truncate">{l.description}</span>
                <input
                  type="number"
                  min={1}
                  value={l.quantity}
                  disabled={disabled}
                  onChange={(e) =>
                    onChange(l.key, { quantity: Math.max(1, Number(e.target.value) || 1) })
                  }
                  className="w-14 border border-gray-300 rounded-lg px-2 py-1 text-sm text-center outline-none focus:ring-2 focus:ring-teal disabled:bg-gray-50"
                  title="Cantidad"
                />
                <input
                  type="number"
                  min={0}
                  value={l.cashAmount}
                  disabled={disabled}
                  onChange={(e) =>
                    onChange(l.key, { cashAmount: Math.max(0, Number(e.target.value) || 0) })
                  }
                  className="w-24 border border-gray-300 rounded-lg px-2 py-1 text-sm text-right outline-none focus:ring-2 focus:ring-teal disabled:bg-gray-50"
                  title="Efectivo del paciente por esta línea"
                />
                <button
                  type="button"
                  onClick={() => onRemove(l.key)}
                  disabled={disabled}
                  className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-40"
                  title="Quitar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {l.insuranceAmount > 0 && (
                <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-blue-600" strokeWidth={1.5} />
                  La ARS aporta {money(l.insuranceAmount, currency)} por esta línea
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { Plus };
