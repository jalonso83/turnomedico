"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Plus,
  Loader2,
  Pencil,
  X,
  Check,
  ShieldCheck,
  AlertCircle,
  EyeOff,
  Eye,
  Trash2,
} from "lucide-react";
import { getToken, dashboard, type ServiceItem } from "@/lib/api";

interface AcceptedInsurance {
  id: string;
  name: string;
  shortName: string | null;
}

function money(n: number, currency = "DOP") {
  const symbol = currency === "DOP" ? "RD$" : "";
  return `${symbol}${n.toLocaleString("es-DO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/** Fila editable de tarifa por ARS dentro del panel de un servicio. */
interface TariffRow {
  insuranceId: string;
  label: string;
  copay: string;
  coverage: string;
}

export default function ServiciosPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [accepted, setAccepted] = useState<AcceptedInsurance[]>([]);

  // Alta
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [saving, setSaving] = useState(false);

  // Edición de datos básicos
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCategory, setEditCategory] = useState("");

  // Panel de tarifas
  const [tariffFor, setTariffFor] = useState<string | null>(null);
  const [rows, setRows] = useState<TariffRow[]>([]);
  const [savingTariffs, setSavingTariffs] = useState(false);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      const [list, tenant] = await Promise.all([
        dashboard.getServices(token, showInactive),
        dashboard.getTenant(token) as Promise<{
          doctorProfile?: {
            insurances?: Array<{ id: string; name: string; shortName: string | null }>;
          } | null;
        }>,
      ]);
      setServices(list);
      setAccepted(tenant?.doctorProfile?.insurances ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar los servicios");
    } finally {
      setLoading(false);
    }
  }, [router, showInactive]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    const token = getToken();
    if (!token) return;
    const price = Number(newPrice);
    if (!newName.trim() || Number.isNaN(price) || price < 0) {
      setError("Escribe un nombre y un precio válido");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await dashboard.createService(
        {
          name: newName.trim(),
          price,
          category: newCategory.trim() || undefined,
        },
        token,
      );
      setNewName("");
      setNewPrice("");
      setNewCategory("");
      setCreating(false);
      flash("Servicio creado");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el servicio");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (s: ServiceItem) => {
    setEditingId(s.id);
    setEditName(s.name);
    setEditPrice(String(s.price));
    setEditCategory(s.category ?? "");
    setTariffFor(null);
  };

  const handleUpdate = async (id: string) => {
    const token = getToken();
    if (!token) return;
    const price = Number(editPrice);
    if (!editName.trim() || Number.isNaN(price) || price < 0) {
      setError("Escribe un nombre y un precio válido");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await dashboard.updateService(
        id,
        { name: editName.trim(), price, category: editCategory.trim() || undefined },
        token,
      );
      setEditingId(null);
      flash("Servicio actualizado");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (s: ServiceItem) => {
    const token = getToken();
    if (!token) return;
    try {
      if (s.isActive) {
        await dashboard.deleteService(s.id, token);
        flash("Servicio desactivado");
      } else {
        await dashboard.updateService(s.id, { isActive: true }, token);
        flash("Servicio reactivado");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar el estado");
    }
  };

  // ── Tarifas por ARS ────────────────────────────────────────
  const openTariffs = (s: ServiceItem) => {
    setEditingId(null);
    setTariffFor(s.id);
    setRows(
      accepted.map((ars) => {
        const saved = s.insurances.find((i) => i.insuranceId === ars.id);
        return {
          insuranceId: ars.id,
          label: ars.shortName || ars.name,
          copay: saved?.patientCopay != null ? String(saved.patientCopay) : "",
          coverage: saved?.insuranceCoverage != null ? String(saved.insuranceCoverage) : "",
        };
      }),
    );
  };

  const setRow = (insuranceId: string, patch: Partial<TariffRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.insuranceId === insuranceId ? { ...r, ...patch } : r)),
    );
  };

  /** Atajo: la ARS cubre el N% del precio de lista y el paciente el resto. */
  const applyPercent = (price: number, pct: number) => {
    const coverage = Math.round((price * pct) / 100);
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        coverage: String(coverage),
        copay: String(Math.max(0, price - coverage)),
      })),
    );
  };

  const handleSaveTariffs = async (serviceId: string) => {
    const token = getToken();
    if (!token) return;
    setSavingTariffs(true);
    setError("");
    try {
      // Solo se envían las filas con al menos un monto. Las vacías
      // significan que esa ARS no cubre el servicio.
      const tariffs = rows
        .filter((r) => r.copay.trim() !== "" || r.coverage.trim() !== "")
        .map((r) => ({
          insuranceId: r.insuranceId,
          patientCopay: r.copay.trim() === "" ? null : Number(r.copay),
          insuranceCoverage: r.coverage.trim() === "" ? null : Number(r.coverage),
        }));

      if (tariffs.some((t) => Number.isNaN(t.patientCopay) || Number.isNaN(t.insuranceCoverage))) {
        setError("Hay un monto que no es un número");
        setSavingTariffs(false);
        return;
      }

      await dashboard.setServiceInsurances(serviceId, tariffs, token);
      setTariffFor(null);
      flash("Tarifas guardadas");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron guardar las tarifas");
    } finally {
      setSavingTariffs(false);
    }
  };

  const grouped = useMemo(() => {
    const map = new Map<string, ServiceItem[]>();
    for (const s of services) {
      const key = s.category?.trim() || "Sin categoría";
      map.set(key, [...(map.get(key) ?? []), s]);
    }
    return Array.from(map.entries());
  }, [services]);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-teal" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-navy flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-teal" strokeWidth={1.5} />
            Servicios
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Tu catálogo con precios. Al cobrar una consulta podrás agregarlos a la factura.
          </p>
        </div>
        <button
          onClick={() => setCreating((v) => !v)}
          className="bg-navy text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-dark transition-colors flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" /> Nuevo servicio
        </button>
      </div>

      {toast && (
        <div className="mb-4 p-3 rounded-lg border border-green-300 bg-green-50 text-green-800 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" /> {toast}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 rounded-lg border border-red-300 bg-red-50 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Alta */}
      {creating && (
        <div className="mb-6 border border-gray-200 rounded-xl p-4 bg-gray-50">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Nombre</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej. Electrocardiograma"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal focus:border-teal outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Precio sin seguro
              </label>
              <input
                type="number"
                min={0}
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="1500"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal focus:border-teal outline-none"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Categoría (opcional)
              </label>
              <input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Ej. Procedimientos"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal focus:border-teal outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="bg-navy text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-dark disabled:opacity-60 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Guardar
            </button>
            <button
              onClick={() => setCreating(false)}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-white"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Filtro */}
      <label className="flex items-center gap-2 text-sm text-gray-600 mb-3 cursor-pointer">
        <input
          type="checkbox"
          checked={showInactive}
          onChange={(e) => setShowInactive(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-teal focus:ring-teal"
        />
        Mostrar también los desactivados
      </label>

      {/* Lista */}
      {services.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-xl p-10 text-center">
          <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm text-gray-500">
            Todavía no tienes servicios. Agrega el primero para poder incluirlo al facturar.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([category, items]) => (
            <div key={category}>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                {category}
              </h2>
              <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
                {items.map((s) => (
                  <div key={s.id} className={s.isActive ? "" : "bg-gray-50"}>
                    {/* Fila */}
                    <div className="px-4 py-3 flex items-center gap-3">
                      {editingId === s.id ? (
                        <>
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-teal"
                          />
                          <input
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            placeholder="Categoría"
                            className="w-32 border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-teal"
                          />
                          <input
                            type="number"
                            min={0}
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="w-28 border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm text-right outline-none focus:ring-2 focus:ring-teal"
                          />
                          <button
                            onClick={() => handleUpdate(s.id)}
                            disabled={saving}
                            className="p-1.5 rounded-lg text-green-700 hover:bg-green-50"
                            title="Guardar"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
                            title="Cancelar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium truncate ${
                                s.isActive ? "text-navy" : "text-gray-400 line-through"
                              }`}
                            >
                              {s.name}
                            </p>
                            {s.insurances.length > 0 && (
                              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-blue-600" strokeWidth={1.5} />
                                {s.insurances.length} ARS con tarifa
                              </p>
                            )}
                          </div>
                          <span className="text-sm font-semibold text-navy shrink-0">
                            {money(s.price, s.currency)}
                          </span>
                          <button
                            onClick={() => openTariffs(s)}
                            className="text-xs px-2.5 py-1 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 shrink-0"
                          >
                            Tarifas ARS
                          </button>
                          <button
                            onClick={() => startEdit(s)}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(s)}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
                            title={s.isActive ? "Desactivar" : "Reactivar"}
                          >
                            {s.isActive ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </>
                      )}
                    </div>

                    {/* Panel de tarifas */}
                    {tariffFor === s.id && (
                      <div className="px-4 pb-4 pt-1 bg-blue-50/40 border-t border-blue-100">
                        {accepted.length === 0 ? (
                          <p className="text-sm text-amber-800 flex items-center gap-2 py-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            Todavía no has marcado con cuáles ARS trabajas. Configúralas en Mi
                            perfil y vuelve aquí.
                          </p>
                        ) : (
                          <>
                            <div className="flex items-center justify-between mb-2 mt-2">
                              <p className="text-xs text-gray-600">
                                Deja en blanco la ARS que no cubre este servicio: en ese caso lo
                                paga completo el paciente.
                              </p>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[11px] text-gray-500">La ARS cubre:</span>
                                {[50, 70, 80].map((p) => (
                                  <button
                                    key={p}
                                    onClick={() => applyPercent(s.price, p)}
                                    className="text-[11px] px-1.5 py-0.5 rounded border border-gray-300 text-gray-600 hover:bg-white"
                                  >
                                    {p}%
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                              <div className="grid grid-cols-[1fr_7rem_7rem] gap-2 px-3 py-2 bg-gray-50 text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                                <span>ARS</span>
                                <span className="text-right">Paciente</span>
                                <span className="text-right">Aporte ARS</span>
                              </div>
                              {rows.map((r) => (
                                <div
                                  key={r.insuranceId}
                                  className="grid grid-cols-[1fr_7rem_7rem] gap-2 px-3 py-2 items-center border-t border-gray-100"
                                >
                                  <span className="text-sm text-gray-700 truncate">{r.label}</span>
                                  <input
                                    type="number"
                                    min={0}
                                    value={r.copay}
                                    onChange={(e) =>
                                      setRow(r.insuranceId, { copay: e.target.value })
                                    }
                                    placeholder="—"
                                    className="border border-gray-300 rounded-lg px-2 py-1 text-sm text-right outline-none focus:ring-2 focus:ring-teal"
                                  />
                                  <input
                                    type="number"
                                    min={0}
                                    value={r.coverage}
                                    onChange={(e) =>
                                      setRow(r.insuranceId, { coverage: e.target.value })
                                    }
                                    placeholder="—"
                                    className="border border-gray-300 rounded-lg px-2 py-1 text-sm text-right outline-none focus:ring-2 focus:ring-teal"
                                  />
                                </div>
                              ))}
                            </div>

                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => handleSaveTariffs(s.id)}
                                disabled={savingTariffs}
                                className="bg-navy text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-dark disabled:opacity-60 flex items-center gap-2"
                              >
                                {savingTariffs && <Loader2 className="w-4 h-4 animate-spin" />}
                                Guardar tarifas
                              </button>
                              <button
                                onClick={() => setTariffFor(null)}
                                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-white"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() =>
                                  setRows((prev) =>
                                    prev.map((r) => ({ ...r, copay: "", coverage: "" })),
                                  )
                                }
                                className="ml-auto text-sm text-gray-500 hover:text-red-600 flex items-center gap-1.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Limpiar todo
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
