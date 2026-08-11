"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Banknote,
  ShieldCheck,
  Wallet,
  AlertCircle,
  Gift,
  Loader2,
  CheckCircle,
  Lock,
} from "lucide-react";
import { getToken, dashboard } from "@/lib/api";

interface DayRow {
  date: string;
  cashTotal: number;
  insuranceTotal: number;
  consultationsTotal: number;
  servicesTotal: number;
  total: number;
  paidCount: number;
  courtesyCount: number;
  pendingCount: number;
  isClosed: boolean;
}

interface CashSummary {
  date: string;
  isClosed: boolean;
  closing: { id: string; cashCounted: number; difference: number; closedAt: string } | null;
  consultationsTotal: number;
  servicesTotal: number;
  cashTotal: number;
  insuranceTotal: number;
  total: number;
  paidCount: number;
  courtesyCount: number;
  pendingCount: number;
  byInsurance: Array<{
    insuranceId: string;
    name: string;
    shortName: string | null;
    amount: number;
    count: number;
  }>;
  pending: Array<{ appointmentId: string; patientName: string }>;
}

function money(n: number) {
  return `RD$${n.toLocaleString("es-DO", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function hace(dias: number) {
  const d = new Date(Date.now() - 4 * 60 * 60 * 1000);
  d.setDate(d.getDate() - dias);
  return d.toISOString().slice(0, 10);
}

function diaCorto(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("es-DO", {
    weekday: "short", day: "numeric", month: "short", timeZone: "UTC",
  });
}

function todayStr() {
  const now = new Date();
  const dr = new Date(now.getTime() - 4 * 60 * 60 * 1000);
  return dr.toISOString().slice(0, 10);
}

export default function CajaPage() {
  const router = useRouter();
  const [date, setDate] = useState(todayStr());
  const [data, setData] = useState<CashSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [tab, setTab] = useState<"hoy" | "historial">("hoy");
  const [desde, setDesde] = useState(hace(30));
  const [hasta, setHasta] = useState(todayStr());
  const [rango, setRango] = useState<{
    days: DayRow[];
    totals: {
      cashTotal: number; insuranceTotal: number; consultationsTotal: number;
      servicesTotal: number; total: number; diasConMovimiento: number;
      byInsurance: Array<{ insuranceId: string; name: string; shortName: string | null; amount: number; count: number }>;
    };
  } | null>(null);
  const [loadingRango, setLoadingRango] = useState(false);

  // Cierre de caja
  const [showClose, setShowClose] = useState(false);
  const [counted, setCounted] = useState("");
  const [closeNotes, setCloseNotes] = useState("");
  const [closing, setClosing] = useState(false);

  const fetchCash = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const res = await dashboard.getCashToday(token, date);
      setData(res);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar la caja");
    } finally {
      setLoading(false);
    }
  }, [date, router]);

  const fetchRango = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoadingRango(true);
    setError("");
    try {
      setRango(await dashboard.getCashRange(desde, hasta, token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar el historial");
    } finally {
      setLoadingRango(false);
    }
  }, [desde, hasta]);

  useEffect(() => {
    fetchCash();
  }, [fetchCash]);

  useEffect(() => {
    if (tab === "historial") fetchRango();
  }, [tab, fetchRango]);

  const cerrarCaja = async () => {
    const token = getToken();
    if (!token || !data) return;
    const monto = Number(counted);
    if (Number.isNaN(monto) || monto < 0) {
      setError("Escribe el efectivo contado");
      return;
    }
    setClosing(true);
    setError("");
    try {
      await dashboard.closeCash(
        { date, cashCounted: monto, notes: closeNotes.trim() || undefined },
        token,
      );
      setShowClose(false);
      setCounted("");
      setCloseNotes("");
      await fetchCash();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cerrar la caja");
    } finally {
      setClosing(false);
    }
  };

  const reabrir = async () => {
    const token = getToken();
    if (!token || !data?.closing) return;
    setClosing(true);
    try {
      await dashboard.reopenCash(data.closing.id, token);
      await fetchCash();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo reabrir");
    } finally {
      setClosing(false);
    }
  };

  const diferencia = data ? Number(counted || 0) - data.cashTotal : 0;

  return (
    <div>
      <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Caja</h1>
          <p className="text-sm text-gray-500 mt-0.5">Cobros del día y facturación por días</p>
        </div>
        {tab === "hoy" ? (
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal focus:border-teal outline-none"
          />
        ) : (
          <div className="flex items-center gap-2">
            <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal" />
            <span className="text-gray-400 text-sm">a</span>
            <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal" />
          </div>
        )}
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {(["hoy", "historial"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === k
                ? "border-teal text-teal"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {k === "hoy" ? "Día" : "Historial"}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg border border-red-300 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {tab === "hoy" && (loading || !data ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-teal" />
        </div>
      ) : (
        <>
          {/* Estado del cierre del día */}
          {data.isClosed && data.closing ? (
            <div className="mb-5 rounded-xl border border-gray-300 bg-gray-50 p-4 flex flex-wrap items-center gap-3">
              <Lock className="w-5 h-5 text-gray-500 shrink-0" strokeWidth={1.5} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">Caja cerrada</p>
                <p className="text-xs text-gray-500">
                  Contado {money(data.closing.cashCounted)} · sistema {money(data.cashTotal)} ·{" "}
                  <span className={data.closing.difference === 0 ? "text-green-700" : "text-red-600"}>
                    {data.closing.difference === 0
                      ? "cuadró exacto"
                      : `${data.closing.difference > 0 ? "sobra" : "falta"} ${money(Math.abs(data.closing.difference))}`}
                  </span>
                </p>
              </div>
              <button
                onClick={reabrir}
                disabled={closing}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-white disabled:opacity-60"
              >
                Reabrir
              </button>
            </div>
          ) : (
            (data.paidCount > 0 || data.courtesyCount > 0) && (
              <div className="mb-5 flex justify-end">
                <button
                  onClick={() => { setCounted(String(data.cashTotal)); setShowClose(true); }}
                  className="bg-navy text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-dark flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" strokeWidth={1.5} /> Cerrar caja del día
                </button>
              </div>
            )
          )}
          {/* Tarjetas principales */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">Efectivo en caja</p>
                <div className="w-9 h-9 bg-teal/10 rounded-lg flex items-center justify-center">
                  <Wallet className="w-4.5 h-4.5 text-teal" strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-3xl font-bold text-teal">{money(data.cashTotal)}</p>
              <p className="text-xs text-gray-400 mt-1">Esto es lo que debes contar físico</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">Por cobrar a seguros</p>
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                  <ShieldCheck className="w-4.5 h-4.5 text-blue-600" strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-3xl font-bold text-blue-600">{money(data.insuranceTotal)}</p>
              <p className="text-xs text-gray-400 mt-1">No es efectivo — se cobra a las ARS</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">Total facturado</p>
                <div className="w-9 h-9 bg-navy/5 rounded-lg flex items-center justify-center">
                  <Banknote className="w-4.5 h-4.5 text-navy" strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-3xl font-bold text-navy">{money(data.total)}</p>
              <p className="text-xs text-gray-400 mt-1">Efectivo + aporte de seguros</p>
            </div>
          </div>

          {/* Conteos */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" strokeWidth={1.5} />
              <div>
                <p className="text-xl font-bold text-gray-900">{data.paidCount}</p>
                <p className="text-xs text-gray-500">Cobradas</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
              <Gift className="w-5 h-5 text-purple-600" strokeWidth={1.5} />
              <div>
                <p className="text-xl font-bold text-gray-900">{data.courtesyCount}</p>
                <p className="text-xs text-gray-500">Cortesías</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600" strokeWidth={1.5} />
              <div>
                <p className="text-xl font-bold text-gray-900">{data.pendingCount}</p>
                <p className="text-xs text-gray-500">Pendientes de cobro</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Por ARS */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-navy mb-3">Por cobrar por ARS</h2>
              {data.byInsurance.length === 0 ? (
                <p className="text-sm text-gray-500">No hay cobros con seguro este día.</p>
              ) : (
                <div className="space-y-2">
                  {data.byInsurance.map((ins) => (
                    <div key={ins.insuranceId} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{ins.shortName || ins.name}</p>
                        <p className="text-xs text-gray-500">{ins.count} consulta{ins.count !== 1 ? "s" : ""}</p>
                      </div>
                      <span className="text-sm font-bold text-blue-600">{money(ins.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pendientes */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-navy mb-3">Pendientes de cobro</h2>
              {data.pending.length === 0 ? (
                <p className="text-sm text-gray-500">Todo cobrado. 🎉</p>
              ) : (
                <div className="space-y-2">
                  {data.pending.map((p) => (
                    <Link
                      key={p.appointmentId}
                      href="/dashboard"
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 hover:text-teal"
                    >
                      <span className="text-sm text-gray-900">{p.patientName}</span>
                      <span className="text-xs text-amber-600 font-medium">Cobrar →</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* De dónde viene el dinero */}
          <div className="mt-4 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-navy mb-3">De dónde viene el dinero</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Consultas</p>
                <p className="text-xl font-bold text-navy">{money(data.consultationsTotal)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Servicios</p>
                <p className="text-xl font-bold text-teal">{money(data.servicesTotal)}</p>
              </div>
            </div>
          </div>
        </>
      ))}

      {/* Historial por días */}
      {tab === "historial" && (loadingRango || !rango ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-teal" />
        </div>
      ) : rango.days.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-xl p-10 text-center">
          <p className="text-sm text-gray-500">No hubo movimiento en ese rango.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            {[
              { l: "Efectivo", v: rango.totals.cashTotal, c: "text-teal" },
              { l: "Por cobrar a ARS", v: rango.totals.insuranceTotal, c: "text-blue-600" },
              { l: "Servicios", v: rango.totals.servicesTotal, c: "text-violet-600" },
              { l: "Total del período", v: rango.totals.total, c: "text-navy" },
            ].map((k) => (
              <div key={k.l} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <p className="text-xs text-gray-500">{k.l}</p>
                <p className={`text-2xl font-bold ${k.c}`}>{money(k.v)}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-navy">
                Día por día
                <span className="ml-2 text-xs font-normal text-gray-400">
                  {rango.totals.diasConMovimiento} días con movimiento
                </span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <tr>
                    <th className="text-left font-medium px-4 py-2">Día</th>
                    <th className="text-right font-medium px-4 py-2">Consultas</th>
                    <th className="text-right font-medium px-4 py-2">Servicios</th>
                    <th className="text-right font-medium px-4 py-2">Efectivo</th>
                    <th className="text-right font-medium px-4 py-2">ARS</th>
                    <th className="text-right font-medium px-4 py-2">Total</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {rango.days.map((d) => {
                    const maxTotal = Math.max(...rango.days.map((x) => x.total), 1);
                    return (
                      <tr key={d.date} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <button
                            onClick={() => { setDate(d.date); setTab("hoy"); }}
                            className="text-left hover:text-teal"
                          >
                            <span className="capitalize">{diaCorto(d.date)}</span>
                            <span
                              className="block h-1 mt-1 rounded bg-teal/40"
                              style={{ width: `${Math.max(4, (d.total / maxTotal) * 90)}px` }}
                            />
                          </button>
                        </td>
                        <td className="px-4 py-2 text-right text-gray-600">{money(d.consultationsTotal)}</td>
                        <td className="px-4 py-2 text-right text-gray-600">{money(d.servicesTotal)}</td>
                        <td className="px-4 py-2 text-right text-teal font-medium">{money(d.cashTotal)}</td>
                        <td className="px-4 py-2 text-right text-blue-600">{money(d.insuranceTotal)}</td>
                        <td className="px-4 py-2 text-right font-bold text-navy">{money(d.total)}</td>
                        <td className="px-4 py-2 text-right whitespace-nowrap">
                          {d.isClosed && <Lock className="w-3.5 h-3.5 text-gray-400 inline" strokeWidth={1.5} />}
                          {d.pendingCount > 0 && (
                            <span className="text-xs text-amber-600 ml-1">{d.pendingCount} sin cobrar</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {rango.totals.byInsurance.length > 0 && (
            <div className="mt-4 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-navy mb-3">Por cobrar por ARS en el período</h2>
              <div className="space-y-2">
                {rango.totals.byInsurance.map((ins) => (
                  <div
                    key={ins.insuranceId}
                    className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-sm text-gray-900">{ins.shortName || ins.name}</span>
                    <span className="text-sm font-bold text-blue-600">{money(ins.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ))}

      {/* Modal de cierre */}
      {showClose && data && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-navy mb-1">Cerrar caja</h3>
            <p className="text-sm text-gray-500 mb-4">{date}</p>

            <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2.5 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Efectivo según el sistema</span>
                <span className="font-medium">{money(data.cashTotal)}</span>
              </div>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Efectivo contado en la gaveta
            </label>
            <input
              type="number"
              min={0}
              value={counted}
              onChange={(e) => setCounted(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal"
            />
            <p className={`mt-1.5 text-sm ${diferencia === 0 ? "text-green-700" : "text-red-600"}`}>
              {diferencia === 0
                ? "Cuadra exacto"
                : `${diferencia > 0 ? "Sobra" : "Falta"} ${money(Math.abs(diferencia))}`}
            </p>

            {data.pendingCount > 0 && (
              <p className="mt-3 text-xs text-amber-700 flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                Quedan {data.pendingCount} pacientes atendidos sin cobrar. Si cierras, no podrás
                registrarles el cobro sin reabrir el día.
              </p>
            )}

            <label className="block text-xs font-medium text-gray-500 mt-3 mb-1">Nota (opcional)</label>
            <input
              type="text"
              value={closeNotes}
              onChange={(e) => setCloseNotes(e.target.value)}
              placeholder="Ej. faltaron 200 del vuelto"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal"
            />

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowClose(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={cerrarCaja}
                disabled={closing}
                className="flex-1 bg-navy text-white py-2.5 rounded-lg text-sm font-medium hover:bg-navy-dark disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {closing && <Loader2 className="w-4 h-4 animate-spin" />}
                Cerrar caja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
