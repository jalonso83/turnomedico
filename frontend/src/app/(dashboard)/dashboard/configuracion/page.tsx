"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Monitor,
  Users,
  CreditCard,
  AlertTriangle,
  Plus,
  Save,
  Sun,
  Moon,
  Loader2,
  CalendarClock,
  Power,
} from "lucide-react";
import { getToken, dashboard } from "@/lib/api";

interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  canManageSchedule: boolean;
}

interface OfficeConfig {
  displayName: string;
  welcomeMessage: string | null;
  theme: string;
  primaryColor: string;
  logoUrl: string | null;
}

interface SubscriptionData {
  status: string;
  plan?: {
    name: string;
    slug: string;
    maxAppointments: number | null;
    priceMonthly: number;
  };
  trialEndsAt?: string;
}

export default function ConfiguracionPage() {
  const router = useRouter();
  const [displayConfig, setDisplayConfig] = useState<OfficeConfig>({
    displayName: "",
    welcomeMessage: "Bienvenido/a -- Por favor espere su turno",
    theme: "DARK",
    primaryColor: "#2ABFBF",
    logoUrl: null,
  });

  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Equipo / secretarias
  const [staff, setStaff] = useState<Staff[]>([]);
  const [newStaff, setNewStaff] = useState({
    name: "",
    email: "",
    password: "",
    canManageSchedule: true,
  });
  const [creatingStaff, setCreatingStaff] = useState(false);
  const [staffError, setStaffError] = useState("");
  const [staffMsg, setStaffMsg] = useState("");

  const inputClass =
    "w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-teal focus:border-teal outline-none transition-colors text-sm";

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    // Load tenant settings, subscription info and staff
    Promise.all([
      dashboard.getTenantSettings(token).catch(() => null),
      dashboard.getTenant(token).catch(() => null),
      dashboard.getStaff(token).catch(() => []),
    ])
      .then(([settingsData, tenantData, staffData]) => {
        const settings = settingsData as { officeConfig?: OfficeConfig; profile?: Record<string, unknown> } | null;
        const tenant = tenantData as { name?: string; subscription?: SubscriptionData } | null;
        setStaff((staffData as Staff[]) ?? []);

        if (settings?.officeConfig) {
          setDisplayConfig({
            displayName: settings.officeConfig.displayName || "",
            welcomeMessage: settings.officeConfig.welcomeMessage || "Bienvenido/a -- Por favor espere su turno",
            theme: settings.officeConfig.theme || "DARK",
            primaryColor: settings.officeConfig.primaryColor || "#2ABFBF",
            logoUrl: settings.officeConfig.logoUrl || null,
          });
        } else if (tenant?.name) {
          setDisplayConfig((prev) => ({
            ...prev,
            displayName: tenant.name || prev.displayName,
          }));
        }

        if (tenant?.subscription) {
          setSubscription(tenant.subscription);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Error al cargar configuracion");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleSave = async () => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMsg("");

    try {
      await dashboard.updateTenantSettings(
        {
          displayName: displayConfig.displayName,
          welcomeMessage: displayConfig.welcomeMessage,
          theme: displayConfig.theme,
          primaryColor: displayConfig.primaryColor,
          logoUrl: displayConfig.logoUrl,
        },
        token
      );
      setSuccessMsg("Configuracion guardada correctamente");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar configuracion");
      setTimeout(() => setError(""), 5000);
    } finally {
      setSaving(false);
    }
  };

  const reloadStaff = async (token: string) => {
    try {
      setStaff(((await dashboard.getStaff(token)) as Staff[]) ?? []);
    } catch {
      /* noop */
    }
  };

  const handleCreateStaff = async () => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    if (!newStaff.name.trim() || !newStaff.email.trim() || newStaff.password.length < 6) {
      setStaffError("Completa nombre, email y una contrasena de al menos 6 caracteres");
      setTimeout(() => setStaffError(""), 5000);
      return;
    }

    setCreatingStaff(true);
    setStaffError("");
    setStaffMsg("");
    try {
      await dashboard.createStaff(
        {
          name: newStaff.name.trim(),
          email: newStaff.email.trim(),
          password: newStaff.password,
          canManageSchedule: newStaff.canManageSchedule,
        },
        token,
      );
      setStaffMsg("Secretaria creada. Entregale su email y contrasena temporal.");
      setNewStaff({ name: "", email: "", password: "", canManageSchedule: true });
      await reloadStaff(token);
      setTimeout(() => setStaffMsg(""), 5000);
    } catch (err) {
      setStaffError(err instanceof Error ? err.message : "Error al crear secretaria");
      setTimeout(() => setStaffError(""), 5000);
    } finally {
      setCreatingStaff(false);
    }
  };

  const handleToggleSchedule = async (s: Staff) => {
    const token = getToken();
    if (!token) return;
    await dashboard.updateStaff(s.id, { canManageSchedule: !s.canManageSchedule }, token);
    await reloadStaff(token);
  };

  const handleToggleActive = async (s: Staff) => {
    const token = getToken();
    if (!token) return;
    await dashboard.updateStaff(s.id, { isActive: !s.isActive }, token);
    await reloadStaff(token);
  };

  const planName =
    subscription?.plan?.name ||
    (subscription?.status === "TRIAL" ? "Plan Trial" : "Plan Freemium");
  const planDescription =
    subscription?.plan?.maxAppointments
      ? `${subscription.plan.maxAppointments} citas/mes`
      : subscription?.status === "TRIAL"
        ? "Trial activo"
        : "30 citas/mes -- Gratis";

  if (loading) {
    return (
      <div className="max-w-3xl">
        <div className="mb-6">
          <div className="h-7 w-44 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-72 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="h-5 w-48 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="space-y-3">
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Configuracion</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Personaliza tu consultorio, equipo y suscripcion
        </p>
      </div>

      {/* Toast messages */}
      {successMsg && (
        <div className="mb-4 p-3 rounded-lg border border-green-300 bg-green-50 text-green-700 text-sm">
          {successMsg}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 rounded-lg border border-red-300 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Waiting room display card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-teal/10 rounded-lg flex items-center justify-center">
              <Monitor className="w-5 h-5 text-teal" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-navy">Pantalla de Sala de Espera</h2>
              <p className="text-xs text-gray-500">Configura lo que tus pacientes ven en la TV</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre a mostrar</label>
              <input
                type="text"
                value={displayConfig.displayName}
                onChange={(e) => setDisplayConfig({ ...displayConfig, displayName: e.target.value })}
                className={inputClass}
                placeholder="Consultorio Dr. Garcia Perez"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje de bienvenida</label>
              <input
                type="text"
                value={displayConfig.welcomeMessage || ""}
                onChange={(e) => setDisplayConfig({ ...displayConfig, welcomeMessage: e.target.value })}
                className={inputClass}
                placeholder="Bienvenido/a -- Por favor espere su turno"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tema de la pantalla</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setDisplayConfig({ ...displayConfig, theme: "DARK" })}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    displayConfig.theme === "DARK"
                      ? "bg-navy text-white"
                      : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Moon className="w-4 h-4" strokeWidth={1.5} />
                  Oscuro
                </button>
                <button
                  onClick={() => setDisplayConfig({ ...displayConfig, theme: "LIGHT" })}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    displayConfig.theme === "LIGHT"
                      ? "bg-navy text-white"
                      : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Sun className="w-4 h-4" strokeWidth={1.5} />
                  Claro
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color primario</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={displayConfig.primaryColor}
                    onChange={(e) => setDisplayConfig({ ...displayConfig, primaryColor: e.target.value })}
                    className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={displayConfig.primaryColor}
                    onChange={(e) => setDisplayConfig({ ...displayConfig, primaryColor: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL del logo</label>
                <input
                  type="url"
                  value={displayConfig.logoUrl || ""}
                  onChange={(e) => setDisplayConfig({ ...displayConfig, logoUrl: e.target.value || null })}
                  className={inputClass}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Team card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal/10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-teal" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-navy">Equipo</h2>
                <p className="text-xs text-gray-500">
                  Tu secretaria puede ver la agenda, cobrar y editar datos basicos del
                  paciente. No ve el expediente clinico.
                </p>
              </div>
            </div>
          </div>

          {/* Staff toast */}
          {staffMsg && (
            <div className="mb-3 p-3 rounded-lg border border-green-300 bg-green-50 text-green-700 text-sm">
              {staffMsg}
            </div>
          )}
          {staffError && (
            <div className="mb-3 p-3 rounded-lg border border-red-300 bg-red-50 text-red-700 text-sm">
              {staffError}
            </div>
          )}

          {/* Staff list */}
          {staff.length > 0 ? (
            <div className="space-y-2 mb-5">
              {staff.map((sec) => (
                <div
                  key={sec.id}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
                    sec.isActive ? "bg-gray-50 border-gray-100" : "bg-gray-50/50 border-gray-100 opacity-60"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">{sec.name}</p>
                      {!sec.isActive && (
                        <span className="text-[10px] uppercase tracking-wide text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
                          Inactiva
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{sec.email}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Toggle permiso de horario */}
                    <button
                      onClick={() => handleToggleSchedule(sec)}
                      title={
                        sec.canManageSchedule
                          ? "Puede editar tu horario (click para quitar)"
                          : "No puede editar tu horario (click para permitir)"
                      }
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
                        sec.canManageSchedule
                          ? "border-teal/30 bg-teal/10 text-teal"
                          : "border-gray-300 text-gray-400 hover:bg-gray-50"
                      }`}
                    >
                      <CalendarClock className="w-3.5 h-3.5" strokeWidth={1.5} />
                      Horario
                    </button>
                    {/* Activar / desactivar */}
                    <button
                      onClick={() => handleToggleActive(sec)}
                      title={sec.isActive ? "Desactivar acceso" : "Reactivar acceso"}
                      className={`p-1.5 rounded-lg transition-colors ${
                        sec.isActive
                          ? "text-gray-400 hover:text-red-500 hover:bg-red-50"
                          : "text-gray-400 hover:text-teal hover:bg-teal/10"
                      }`}
                    >
                      <Power className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-5">No tienes secretarias registradas aun.</p>
          )}

          {/* Create secretary form */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-700 mb-3">Agregar secretaria</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                value={newStaff.name}
                onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                placeholder="Nombre"
                className={inputClass}
              />
              <input
                type="email"
                value={newStaff.email}
                onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                placeholder="Email"
                className={inputClass}
              />
            </div>
            <input
              type="text"
              value={newStaff.password}
              onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
              placeholder="Contrasena temporal (min. 6 caracteres)"
              className={`${inputClass} mb-3`}
            />
            <label className="flex items-center gap-2 mb-4 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={newStaff.canManageSchedule}
                onChange={(e) => setNewStaff({ ...newStaff, canManageSchedule: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-teal focus:ring-teal"
              />
              <span className="text-sm text-gray-700">Puede editar mi horario laboral</span>
            </label>
            <button
              onClick={handleCreateStaff}
              disabled={creatingStaff}
              className="inline-flex items-center gap-1.5 bg-navy text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-navy-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {creatingStaff ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" strokeWidth={1.5} />
              )}
              {creatingStaff ? "Creando..." : "Crear secretaria"}
            </button>
          </div>
        </div>

        {/* Subscription card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-teal/10 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-teal" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-navy">Suscripcion</h2>
              <p className="text-xs text-gray-500">Tu plan actual y facturacion</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-semibold text-gray-900">{planName}</p>
              <p className="text-xs text-gray-500 mt-0.5">{planDescription}</p>
            </div>
            <button className="inline-flex items-center gap-2 bg-brand-gradient text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
              Actualizar plan
            </button>
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-white rounded-xl border-2 border-red-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-red-700">Zona de peligro</h2>
              <p className="text-xs text-gray-500">Acciones irreversibles</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-red-50/50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">Desactivar mi cuenta</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Tu perfil publico sera removido y los pacientes no podran agendar.
              </p>
            </div>
            <button className="text-sm font-medium text-red-600 border border-red-300 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors">
              Desactivar
            </button>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-navy text-white px-6 py-3 rounded-lg font-semibold hover:bg-navy-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" strokeWidth={1.5} />
            )}
            {saving ? "Guardando..." : "Guardar configuracion"}
          </button>
        </div>
      </div>
    </div>
  );
}
