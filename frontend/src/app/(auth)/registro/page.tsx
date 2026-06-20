"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, setTokens } from "@/lib/api";
import { SPECIALTIES, CITIES_RD } from "@/lib/constants";
import { Eye, EyeOff } from "lucide-react";

interface StepOneData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
}

interface StepTwoData {
  specialty: string;
  city: string;
  acceptTerms: boolean;
}

export default function RegistroPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [stepOne, setStepOne] = useState<StepOneData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });

  const [stepTwo, setStepTwo] = useState<StepTwoData>({
    specialty: "",
    city: "",
    acceptTerms: false,
  });

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleStepOneNext = () => {
    setError("");

    if (
      !stepOne.name.trim() ||
      !stepOne.email.trim() ||
      !stepOne.password ||
      !stepOne.confirmPassword ||
      !stepOne.phone.trim()
    ) {
      setError("Por favor completa todos los campos.");
      return;
    }

    if (!validateEmail(stepOne.email)) {
      setError("Ingresa un email válido.");
      return;
    }

    if (stepOne.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (stepOne.password !== stepOne.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!stepTwo.specialty) {
      setError("Selecciona una especialidad.");
      return;
    }

    if (!stepTwo.city) {
      setError("Selecciona una ciudad.");
      return;
    }

    if (!stepTwo.acceptTerms) {
      setError("Debes aceptar los términos y condiciones.");
      return;
    }

    setLoading(true);
    try {
      const data = await auth.register({
        name: stepOne.name,
        email: stepOne.email,
        password: stepOne.password,
        phone: stepOne.phone,
        specialty: stepTwo.specialty,
        city: stepTwo.city,
      });
      setTokens(data.accessToken, data.refreshToken);
      // Store city selection for onboarding pre-fill
      if (stepTwo.city) {
        localStorage.setItem("onboarding_city", stepTwo.city);
      }
      router.push("/registro/onboarding");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al crear la cuenta. Intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
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
              Datos del médico
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
              Consultorio
            </span>
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-navy">Crear tu cuenta</h1>
          <p className="text-sm text-gray-500 mt-1">
            {step === 1
              ? "Paso 1 de 2 — Datos del médico"
              : "Paso 2 de 2 — Datos del consultorio"}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg border border-red-300 bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Doctor info */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo
              </label>
              <input
                type="text"
                value={stepOne.name}
                onChange={(e) =>
                  setStepOne({ ...stepOne, name: e.target.value })
                }
                className={inputClass}
                placeholder="Dr. Juan Pérez"
                autoComplete="name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={stepOne.email}
                onChange={(e) =>
                  setStepOne({ ...stepOne, email: e.target.value })
                }
                className={inputClass}
                placeholder="doctor@email.com"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={stepOne.password}
                  onChange={(e) =>
                    setStepOne({ ...stepOne, password: e.target.value })
                  }
                  className={`${inputClass} pr-12`}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={stepOne.confirmPassword}
                  onChange={(e) =>
                    setStepOne({
                      ...stepOne,
                      confirmPassword: e.target.value,
                    })
                  }
                  className={`${inputClass} pr-12`}
                  placeholder="Repite tu contraseña"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showConfirm ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={stepOne.phone}
                onChange={(e) =>
                  setStepOne({ ...stepOne, phone: e.target.value })
                }
                className={inputClass}
                placeholder="809-000-0000"
                autoComplete="tel"
              />
            </div>

            {/* Next button */}
            <button
              type="button"
              onClick={handleStepOneNext}
              className="w-full py-3 bg-navy text-white rounded-lg font-semibold hover:bg-navy-dark transition-colors"
            >
              Siguiente
            </button>
          </div>
        )}

        {/* Step 2: Office info */}
        {step === 2 && (
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Specialty */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Especialidad
              </label>
              <select
                value={stepTwo.specialty}
                onChange={(e) =>
                  setStepTwo({ ...stepTwo, specialty: e.target.value })
                }
                className={inputClass}
              >
                <option value="">Selecciona una especialidad</option>
                {SPECIALTIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ciudad
              </label>
              <select
                value={stepTwo.city}
                onChange={(e) =>
                  setStepTwo({ ...stepTwo, city: e.target.value })
                }
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

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={stepTwo.acceptTerms}
                onChange={(e) =>
                  setStepTwo({ ...stepTwo, acceptTerms: e.target.checked })
                }
                className="mt-1 h-4 w-4 rounded border-gray-300 text-teal focus:ring-teal accent-teal"
              />
              <span className="text-sm text-gray-600">
                Acepto los{" "}
                <Link
                  href="/terminos"
                  className="text-teal hover:text-teal-dark underline"
                  target="_blank"
                >
                  términos y condiciones
                </Link>{" "}
                y la{" "}
                <Link
                  href="/privacidad"
                  className="text-teal hover:text-teal-dark underline"
                  target="_blank"
                >
                  política de privacidad
                </Link>
              </span>
            </label>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setStep(1);
                }}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Anterior
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] py-3 bg-brand-gradient text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
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
                    Creando cuenta...
                  </span>
                ) : (
                  "Crear mi consultorio — Gratis 30 días"
                )}
              </button>
            </div>
          </form>
        )}

        {/* Login link */}
        <div className="mt-6 text-center text-sm text-gray-600">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="text-teal font-semibold hover:text-teal-dark transition-colors"
          >
            Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
