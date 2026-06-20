"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Save, Copy, Check, ExternalLink, MapPin, DollarSign, User, Loader2, Camera, X, Shield } from "lucide-react";
import { getToken, dashboard, publicApi } from "@/lib/api";

interface InsuranceOption {
  id: string;
  name: string;
  slug: string;
  shortName: string | null;
  logoUrl: string | null;
  patientCopay?: number | null;
  insuranceCoverage?: number | null;
}

interface TenantResponse {
  tenant: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
  };
  doctorProfile: {
    specialty: string;
    subspecialty: string | null;
    licenseNumber: string | null;
    bio: string | null;
    phone: string | null;
    photoUrl: string | null;
    consultorioName: string | null;
    address: string | null;
    floor: string | null;
    reference: string | null;
    city: string | null;
    sector: string | null;
    consultationFee: number | null;
    insurances: InsuranceOption[];
  } | null;
  user: { id: string; name: string; email: string; phone: string | null } | null;
}

export default function PerfilPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [profile, setProfile] = useState({
    name: "",
    specialty: "",
    subspecialty: "",
    exequatur: "",
    bio: "",
    phone: "",
    photoUrl: "",
  });

  const [location, setLocation] = useState({
    officeName: "",
    address: "",
    floor: "",
    reference: "",
    city: "",
    sector: "",
  });

  const [fee, setFee] = useState("");
  const [slug, setSlug] = useState("");
  const [insuranceCatalog, setInsuranceCatalog] = useState<InsuranceOption[]>([]);
  const [selectedInsuranceIds, setSelectedInsuranceIds] = useState<Set<string>>(new Set());
  // Tarifa pactada por ARS (strings para inputs controlados).
  const [insuranceAmounts, setInsuranceAmounts] = useState<
    Record<string, { patientCopay: string; insuranceCoverage: string }>
  >({});

  const publicUrl = slug ? `turnomedico.do/${slug}` : "";

  const inputClass =
    "w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-teal focus:border-teal outline-none transition-colors text-sm";

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    Promise.all([dashboard.getTenant(token), publicApi.getInsurances()])
      .then(([raw, insRaw]) => {
        const data = raw as TenantResponse;
        const ins = insRaw as InsuranceOption[];
        setSlug(data.tenant?.slug || "");
        setProfile({
          name: data.user?.name || data.tenant?.name || "",
          specialty: data.doctorProfile?.specialty || "",
          subspecialty: data.doctorProfile?.subspecialty || "",
          exequatur: data.doctorProfile?.licenseNumber || "",
          bio: data.doctorProfile?.bio || "",
          phone: data.doctorProfile?.phone || data.user?.phone || "",
          photoUrl: data.doctorProfile?.photoUrl || "",
        });
        setLocation({
          officeName: data.doctorProfile?.consultorioName || "",
          address: data.doctorProfile?.address || "",
          floor: data.doctorProfile?.floor || "",
          reference: data.doctorProfile?.reference || "",
          city: data.doctorProfile?.city || "",
          sector: data.doctorProfile?.sector || "",
        });
        setFee(
          data.doctorProfile?.consultationFee
            ? String(data.doctorProfile.consultationFee)
            : ""
        );
        setInsuranceCatalog(ins || []);
        setSelectedInsuranceIds(
          new Set((data.doctorProfile?.insurances || []).map((i) => i.id))
        );
        const amounts: Record<string, { patientCopay: string; insuranceCoverage: string }> = {};
        (data.doctorProfile?.insurances || []).forEach((i) => {
          amounts[i.id] = {
            patientCopay: i.patientCopay != null ? String(i.patientCopay) : "",
            insuranceCoverage: i.insuranceCoverage != null ? String(i.insuranceCoverage) : "",
          };
        });
        setInsuranceAmounts(amounts);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Error al cargar perfil");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const toggleInsurance = (id: string) => {
    setSelectedInsuranceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const setInsuranceAmount = (
    id: string,
    field: "patientCopay" | "insuranceCoverage",
    value: string,
  ) => {
    setInsuranceAmounts((prev) => ({
      ...prev,
      [id]: {
        patientCopay: prev[id]?.patientCopay ?? "",
        insuranceCoverage: prev[id]?.insuranceCoverage ?? "",
        [field]: value,
      },
    }));
  };

  const handleCopy = () => {
    if (publicUrl) {
      navigator.clipboard.writeText(`https://${publicUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      setError("Solo se permiten archivos de imagen");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("La imagen no debe superar 2MB");
      return;
    }

    // Resize and convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        const base64 = canvas.toDataURL("image/jpeg", 0.8);
        setProfile((prev) => ({ ...prev, photoUrl: base64 }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setProfile((prev) => ({ ...prev, photoUrl: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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
      await dashboard.updateTenant(
        {
          name: profile.name,
          specialty: profile.specialty,
          subspecialty: profile.subspecialty || null,
          licenseNumber: profile.exequatur || null,
          bio: profile.bio || null,
          phone: profile.phone || null,
          photoUrl: profile.photoUrl || null,
          consultorioName: location.officeName || null,
          address: location.address || null,
          floor: location.floor || null,
          reference: location.reference || null,
          city: location.city || null,
          sector: location.sector || null,
          consultationFee: fee ? parseFloat(fee) : null,
          insurances: Array.from(selectedInsuranceIds).map((id) => ({
            insuranceId: id,
            patientCopay: insuranceAmounts[id]?.patientCopay
              ? parseFloat(insuranceAmounts[id].patientCopay)
              : null,
            insuranceCoverage: insuranceAmounts[id]?.insuranceCoverage
              ? parseFloat(insuranceAmounts[id].insuranceCoverage)
              : null,
          })),
        },
        token
      );
      setSuccessMsg("Perfil guardado correctamente");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar perfil");
      setTimeout(() => setError(""), 5000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl">
        <div className="mb-6">
          <div className="h-7 w-56 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-80 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="space-y-3">
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-10 bg-gray-200 rounded animate-pulse" />
                  <div className="h-10 bg-gray-200 rounded animate-pulse" />
                </div>
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
        <h1 className="text-2xl font-bold text-navy">Mi Perfil Profesional</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Información visible para tus pacientes en tu perfil público
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
        {/* Public link card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-teal/10 rounded-lg flex items-center justify-center">
              <ExternalLink className="w-5 h-5 text-teal" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-navy">Tu link público</h2>
              <p className="text-xs text-gray-500">Comparte este enlace con tus pacientes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 font-mono">
              {publicUrl || "Sin slug asignado"}
            </div>
            <button
              onClick={handleCopy}
              disabled={!publicUrl}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy text-white rounded-lg text-sm font-medium hover:bg-navy-dark transition-colors disabled:opacity-60"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" strokeWidth={1.5} />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" strokeWidth={1.5} />
                  Copiar
                </>
              )}
            </button>
          </div>
        </div>

        {/* Photo + Professional info card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-teal/10 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-teal" strokeWidth={1.5} />
            </div>
            <h2 className="text-sm font-semibold text-navy">Datos profesionales</h2>
          </div>

          {/* Photo upload */}
          <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-100">
            <div className="relative">
              {profile.photoUrl ? (
                <div className="relative">
                  <img
                    src={profile.photoUrl}
                    alt="Foto de perfil"
                    className="w-24 h-24 rounded-full object-cover border-2 border-teal/30"
                  />
                  <button
                    onClick={handleRemovePhoto}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Foto de perfil</p>
              <p className="text-xs text-gray-500 mb-3">Se mostrará en tu perfil público. Máximo 2MB.</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 border border-navy text-navy rounded-lg text-sm font-medium hover:bg-navy/5 transition-colors"
              >
                <Camera className="w-4 h-4" strokeWidth={1.5} />
                {profile.photoUrl ? "Cambiar foto" : "Subir foto"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className={inputClass}
                placeholder="Dr. Juan García Pérez"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad</label>
              <input
                type="text"
                value={profile.specialty}
                onChange={(e) => setProfile({ ...profile, specialty: e.target.value })}
                className={inputClass}
                placeholder="Cardiología"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subespecialidad</label>
              <input
                type="text"
                value={profile.subspecialty}
                onChange={(e) => setProfile({ ...profile, subspecialty: e.target.value })}
                className={inputClass}
                placeholder="Ecocardiografía"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exequátur</label>
              <input
                type="text"
                value={profile.exequatur}
                onChange={(e) => setProfile({ ...profile, exequatur: e.target.value })}
                className={inputClass}
                placeholder="12345"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className={inputClass}
                placeholder="809-000-0000"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio / Descripción</label>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                rows={3}
                className={inputClass}
                placeholder="Breve descripción de tu experiencia y servicios..."
              />
            </div>
          </div>
        </div>

        {/* Location card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-teal/10 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-teal" strokeWidth={1.5} />
            </div>
            <h2 className="text-sm font-semibold text-navy">Ubicación del consultorio</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del consultorio</label>
              <input
                type="text"
                value={location.officeName}
                onChange={(e) => setLocation({ ...location, officeName: e.target.value })}
                className={inputClass}
                placeholder="Centro Médico Nacional"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <input
                type="text"
                value={location.address}
                onChange={(e) => setLocation({ ...location, address: e.target.value })}
                className={inputClass}
                placeholder="Av. Tiradentes #10, Ensanche Naco"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Piso / Suite</label>
              <input
                type="text"
                value={location.floor}
                onChange={(e) => setLocation({ ...location, floor: e.target.value })}
                className={inputClass}
                placeholder="Piso 3, Suite 305"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Referencia</label>
              <input
                type="text"
                value={location.reference}
                onChange={(e) => setLocation({ ...location, reference: e.target.value })}
                className={inputClass}
                placeholder="Frente al parque"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
              <input
                type="text"
                value={location.city}
                onChange={(e) => setLocation({ ...location, city: e.target.value })}
                className={inputClass}
                placeholder="Santo Domingo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
              <input
                type="text"
                value={location.sector}
                onChange={(e) => setLocation({ ...location, sector: e.target.value })}
                className={inputClass}
                placeholder="Ensanche Naco"
              />
            </div>
          </div>
        </div>

        {/* Fee card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-teal/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-teal" strokeWidth={1.5} />
            </div>
            <h2 className="text-sm font-semibold text-navy">Tarifa de consulta</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio de la consulta (RD$)</label>
            <input
              type="text"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              className={inputClass}
              placeholder="2,500"
            />
            <p className="text-xs text-gray-400 mt-1">Este precio será visible en tu perfil público</p>
          </div>
        </div>

        {/* Insurances card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-teal/10 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-teal" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-navy">Seguros médicos aceptados</h2>
              <p className="text-xs text-gray-500">Marca las ARS con las que trabajas. Aparecerán en tu perfil público.</p>
            </div>
          </div>
          {insuranceCatalog.length === 0 ? (
            <p className="text-sm text-gray-400">Cargando catálogo...</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {insuranceCatalog.map((ins) => {
                const checked = selectedInsuranceIds.has(ins.id);
                return (
                  <button
                    type="button"
                    key={ins.id}
                    onClick={() => toggleInsurance(ins.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors text-left ${
                      checked
                        ? "border-teal bg-teal/10 text-navy"
                        : "border-gray-300 bg-white text-gray-700 hover:border-teal/40"
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                        checked ? "bg-teal text-white" : "border border-gray-300 bg-white"
                      }`}
                    >
                      {checked && <Check className="w-3 h-3" strokeWidth={3} />}
                    </span>
                    <span className="truncate">{ins.shortName ?? ins.name}</span>
                  </button>
                );
              })}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-3">
            {selectedInsuranceIds.size} seleccionado{selectedInsuranceIds.size === 1 ? "" : "s"} · No es obligatorio marcar ninguno
          </p>

          {/* Tarifa pactada por ARS (alimenta el cobro en caja) */}
          {selectedInsuranceIds.size > 0 && (
            <div className="mt-5 border-t border-gray-100 pt-5">
              <h3 className="text-sm font-semibold text-navy mb-1">Tarifa por ARS</h3>
              <p className="text-xs text-gray-500 mb-4">
                Define cuánto paga el paciente en efectivo y cuánto aporta cada ARS. Estos montos se usan al cobrar la consulta.
              </p>
              <div className="space-y-3">
                {insuranceCatalog
                  .filter((ins) => selectedInsuranceIds.has(ins.id))
                  .map((ins) => (
                    <div
                      key={ins.id}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-gray-50 rounded-lg p-3"
                    >
                      <div className="sm:col-span-4">
                        <p className="text-sm font-medium text-gray-900">{ins.shortName ?? ins.name}</p>
                      </div>
                      <div className="sm:col-span-4">
                        <label className="block text-xs text-gray-500 mb-1">Efectivo paciente (RD$)</label>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={insuranceAmounts[ins.id]?.patientCopay ?? ""}
                          onChange={(e) => setInsuranceAmount(ins.id, "patientCopay", e.target.value)}
                          placeholder="2500"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal focus:border-teal outline-none"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <label className="block text-xs text-gray-500 mb-1">Aporte ARS (RD$)</label>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={insuranceAmounts[ins.id]?.insuranceCoverage ?? ""}
                          onChange={(e) => setInsuranceAmount(ins.id, "insuranceCoverage", e.target.value)}
                          placeholder="500"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal focus:border-teal outline-none"
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
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
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
