"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { dashboard, getToken } from "@/lib/api";
import { CITIES_RD } from "@/lib/constants";
import { CheckCircle, Copy, Check, Info } from "lucide-react";

interface OnboardingData {
  consultorioName: string;
  address: string;
  floor: string;
  reference: string;
  city: string;
  sector: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [slug, setSlug] = useState("");

  const [form, setForm] = useState<OnboardingData>({
    consultorioName: "",
    address: "",
    floor: "",
    reference: "",
    city: "",
    sector: "",
  });

  // Pre-fill city from registration
  useEffect(() => {
    const savedCity = localStorage.getItem("onboarding_city");
    if (savedCity) {
      setForm((prev) => ({ ...prev, city: savedCity }));
      localStorage.removeItem("onboarding_city");
    }
  }, []);

  const handleSubmit = async () => {
    setError("");

    if (!form.consultorioName.trim()) {
      setError("Ingresa el nombre de tu consultorio.");
      return;
    }
    if (!form.address.trim()) {
      setError("Ingresa la direccion de tu consultorio.");
      return;
    }
    if (!form.city) {
      setError("Selecciona una ciudad.");
      return;
    }

    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const data = await dashboard.completeOnboarding(form, token);
      setSlug(data.slug || "tu-consultorio");
      setStep(2);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al guardar. Intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    const link = `turnomedico.do/${slug}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = link;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const updateField = (field: keyof OnboardingData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const inputClass =
    "w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-teal focus:border-teal outline-none transition-colors";

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/">
          <Image
            src="/logo.png"
            alt="TurnoMedico"
            width={240}
            height={80}
            className="h-20 w-auto mx-auto"
          />
        </Link>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= 1
                  ? "bg-teal text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              1
            </div>
            <span
              className={`text-sm font-medium hidden sm:inline ${
                step >= 1 ? "text-teal" : "text-gray-400"
              }`}
            >
              Consultorio
            </span>
          </div>
          <div
            className={`w-8 h-0.5 ${
              step >= 2 ? "bg-teal" : "bg-gray-200"
            }`}
          />
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= 2
                  ? "bg-teal text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              2
            </div>
            <span
              className={`text-sm font-medium hidden sm:inline ${
                step >= 2 ? "text-teal" : "text-gray-400"
              }`}
            >
              Listo
            </span>
          </div>
        </div>

        {/* Step 1: Office details */}
        {step === 1 && (
          <div>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-navy">
                Datos del consultorio
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Paso 1 de 2 — Informacion de tu consultorio
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg border border-red-300 bg-red-50 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del consultorio
                </label>
                <input
                  type="text"
                  value={form.consultorioName}
                  onChange={(e) =>
                    updateField("consultorioName", e.target.value)
                  }
                  className={inputClass}
                  placeholder="Centro Medico San Rafael"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Direccion
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  className={inputClass}
                  placeholder="Av. Lincoln #45, Santo Domingo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Piso / Suite / Consultorio
                </label>
                <input
                  type="text"
                  value={form.floor}
                  onChange={(e) => updateField("floor", e.target.value)}
                  className={inputClass}
                  placeholder="Piso 3, Suite 302"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Referencia
                </label>
                <input
                  type="text"
                  value={form.reference}
                  onChange={(e) => updateField("reference", e.target.value)}
                  className={inputClass}
                  placeholder="Frente al parque Colon, edificio azul"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ciudad
                </label>
                <select
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  className={inputClass}
                >
                  <option value="">Selecciona tu ciudad</option>
                  {CITIES_RD.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sector / Barrio{" "}
                  <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={form.sector}
                  onChange={(e) => updateField("sector", e.target.value)}
                  className={inputClass}
                  placeholder="Piantini"
                />
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3 bg-navy text-white rounded-lg font-semibold hover:bg-navy-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Guardando...
                  </span>
                ) : (
                  "Siguiente"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Success */}
        {step === 2 && (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-teal mx-auto mb-4" />

            <h1 className="text-2xl font-bold text-navy mb-2">
              Felicidades! Tu consultorio esta registrado
            </h1>

            <p className="text-gray-500 text-sm mb-6">
              Comparte este link con tus pacientes para que agenden cita
              directamente
            </p>

            {/* Copyable link */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6">
              <span className="flex-1 text-sm font-medium text-navy truncate text-left">
                turnomedico.do/{slug}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 px-3 py-1.5 bg-teal text-white rounded-md text-sm font-medium hover:bg-teal-dark transition-colors shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar
                  </>
                )}
              </button>
            </div>

            {/* Info card */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-navy shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-navy">
                    Proximo paso
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Configura tus horarios de atencion en el dashboard para
                    activar tu agenda
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => router.push("/dashboard/horarios")}
                className="w-full py-3 bg-navy text-white rounded-lg font-semibold hover:bg-navy-dark transition-colors"
              >
                Ir a configurar mis horarios
              </button>
              <Link
                href="/dashboard"
                className="block w-full py-3 text-teal font-semibold hover:text-teal-dark transition-colors text-center"
              >
                Ir al dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
