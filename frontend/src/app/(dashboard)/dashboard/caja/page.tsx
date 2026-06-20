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
} from "lucide-react";
import { getToken, dashboard } from "@/lib/api";

interface CashSummary {
  date: string;
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

  useEffect(() => {
    fetchCash();
  }, [fetchCash]);

  return (
    <div>
      <div className="flex flex-wrap justify-between items-start gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Caja del día</h1>
          <p className="text-sm text-gray-500 mt-0.5">Resumen de cobros de la consulta</p>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal focus:border-teal outline-none"
        />
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg border border-red-300 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading || !data ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-teal" />
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
