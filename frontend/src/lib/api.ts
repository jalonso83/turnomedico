const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

interface FetchOptions extends RequestInit {
  token?: string;
}

export async function api<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, headers, ...rest } = options;

  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...rest,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Error del servidor" }));
    const msg = Array.isArray(error.message) ? error.message[0] : error.message;
    throw new Error(msg || `Error ${res.status}`);
  }

  const json = await res.json();
  // Unwrap { data, message } envelope if present
  return json.data !== undefined ? json.data : json;
}

// ── Token helpers ──────────────────────────────────────────────
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

// ── Auth endpoints ─────────────────────────────────────────────
export const auth = {
  login: (email: string, password: string) =>
    api<{ accessToken: string; refreshToken: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    specialty: string;
    city: string;
  }) =>
    api<{ accessToken: string; refreshToken: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  refresh: (refreshToken: string) =>
    api<{ accessToken: string; refreshToken: string }>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),
};

// ── Public endpoints ───────────────────────────────────────────
export const publicApi = {
  searchDoctors: (params: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return api(`/public/doctors?${query}`);
  },

  getDoctorProfile: (slug: string) =>
    api(`/public/doctors/${slug}`),

  getDoctorSlots: (slug: string, date: string) =>
    api(`/appointments/slots/${slug}?date=${date}`),

  bookAppointment: (
    slug: string,
    data: {
      patientName: string;
      patientPhone: string;
      date: string;
      reason: "CONSULTATION" | "RESULTS_DELIVERY";
    }
  ) =>
    api<{
      appointmentId: string;
      date: string;
      queuePosition: number | null;
      doctorStartTime: string | null;
      status: string;
      reason: "CONSULTATION" | "RESULTS_DELIVERY";
      doctorName: string;
      consultorioName: string | null;
    }>(`/appointments/book/${slug}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  cancelAppointment: (id: string) =>
    api(`/appointments/${id}/cancel`, {
      method: "PUT",
    }),

  getInsurances: () =>
    api<Array<{ id: string; name: string; slug: string; shortName: string | null; logoUrl: string | null }>>("/public/insurances"),
};

// ── Dashboard endpoints (require auth) ─────────────────────────
export const dashboard = {
  // ── Tenant ────────────────────────────────────────────────
  getTenant: (token: string) =>
    api("/dashboard/tenant", { token }),

  updateTenant: (data: Record<string, unknown>, token: string) =>
    api("/dashboard/tenant", {
      method: "PUT",
      body: JSON.stringify(data),
      token,
    }),

  getTenantSettings: (token: string) =>
    api("/dashboard/tenant/settings", { token }),

  updateTenantSettings: (data: Record<string, unknown>, token: string) =>
    api("/dashboard/tenant/settings", {
      method: "PUT",
      body: JSON.stringify(data),
      token,
    }),

  // ── Appointments ──────────────────────────────────────────
  getTodayAgenda: (token: string) =>
    api("/dashboard/appointments/today", { token }),

  updateAppointmentStatus: (id: string, status: string, token: string) =>
    api(`/dashboard/appointments/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
      token,
    }),

  createWalkIn: (
    data: {
      patientName: string;
      patientPhone: string;
      notes?: string;
      reason?: "CONSULTATION" | "RESULTS_DELIVERY";
    },
    token: string,
  ) =>
    api("/dashboard/appointments/walk-in", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),

  // ── Schedules ─────────────────────────────────────────────
  getSchedules: (token: string) =>
    api("/dashboard/schedules", { token }),

  updateSchedules: (schedules: unknown[], token: string) =>
    api("/dashboard/schedules", {
      method: "PUT",
      body: JSON.stringify({ schedules }),
      token,
    }),

  toggleAgenda: (token: string) =>
    api("/dashboard/tenant/agenda-toggle", {
      method: "PUT",
      token,
    }),

  getOverrides: (token: string, from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString();
    return api(`/dashboard/schedule-overrides${qs ? `?${qs}` : ""}`, { token });
  },

  createOverride: (data: { date: string; reason?: string }, token: string) =>
    api("/dashboard/schedule-overrides", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),

  blockOverrideRange: (
    data: { from: string; to: string; reason?: string },
    token: string,
  ) =>
    api<Array<{ id: string; date: string; reason: string | null }>>(
      "/dashboard/schedule-overrides/range",
      {
        method: "POST",
        body: JSON.stringify(data),
        token,
      },
    ),

  deleteOverride: (id: string, token: string) =>
    api(`/dashboard/schedule-overrides/${id}`, {
      method: "DELETE",
      token,
    }),

  completeOnboarding: (
    data: {
      consultorioName: string;
      address: string;
      floor: string;
      reference: string;
      city: string;
      sector: string;
    },
    token: string
  ) =>
    api<{ slug: string }>("/dashboard/tenant/onboarding", {
      method: "PUT",
      body: JSON.stringify(data),
      token,
    }),

  // ── Patients ──────────────────────────────────────────────
  getPatients: (token: string, search?: string) => {
    const qs = search ? `?search=${encodeURIComponent(search)}` : "";
    return api(`/dashboard/patients${qs}`, { token });
  },

  getPatient: (id: string, token: string) =>
    api(`/dashboard/patients/${id}`, { token }),

  updatePatient: (id: string, data: Record<string, unknown>, token: string) =>
    api(`/dashboard/patients/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
      token,
    }),

  getPatientHistory: (id: string, token: string) =>
    api(`/dashboard/patients/${id}/history`, { token }),

  // ── Profile (legacy) ──────────────────────────────────────
  getProfile: (token: string) =>
    api("/dashboard/profile", { token }),

  // ── Stats ─────────────────────────────────────────────────
  getMyConsultationStats: (token: string) =>
    api<{
      averageConsultationTime: number;
      totalConsultations: number;
      minConsultationTime: number;
      maxConsultationTime: number;
      lastConsultationTime: number | null;
    }>("/smart-reminders/my-stats", { token }),

  // ── Medical Records (EMR — Plan Pro) ──────────────────────
  updateMedicalHistory: (
    patientId: string,
    data: Partial<{
      bloodType: string | null;
      allergies: string | null;
      chronicConditions: string | null;
      currentMedications: string | null;
      surgeries: string | null;
      familyHistory: string | null;
      address: string | null;
      cedula: string | null;
      dateOfBirth: string | null;
      gender: string | null;
    }>,
    token: string,
  ) =>
    api(`/dashboard/patients/${patientId}/medical-history`, {
      method: "PATCH",
      body: JSON.stringify(data),
      token,
    }),

  getPatientTimeline: (patientId: string, token: string) =>
    api<{
      timeline: Array<{
        appointmentId: string;
        date: string;
        status: string;
        reason: string;
        type: string;
        diagnosis: string | null;
        reasonText: string | null;
        plan: string | null;
        hasPrescription: boolean;
        hasVitals: boolean;
        vitalsSummary: { bp: string | null; hr: number | null; weight: number | null; temp: number | null } | null;
      }>;
    }>(`/dashboard/patients/${patientId}/timeline`, { token }),

  getMedicalRecord: (appointmentId: string, token: string) =>
    api<{
      appointment: {
        id: string;
        date: string;
        status: string;
        reason: string;
        queuePosition: number | null;
        patient: {
          id: string;
          name: string;
          phone: string;
          cedula: string | null;
          dateOfBirth: string | null;
          gender: string | null;
        };
      };
      antecedentes: {
        bloodType: string | null;
        allergies: string | null;
        chronicConditions: string | null;
        currentMedications: string | null;
        surgeries: string | null;
        familyHistory: string | null;
        insurance: string | null;
        isVip: boolean;
        notes: string | null;
      } | null;
      consultationNote: {
        subjective: string | null;
        objective: string | null;
        assessment: string | null;
        plan: string | null;
      } | null;
      vitalSigns: {
        bloodPressureSys: number | null;
        bloodPressureDia: number | null;
        heartRate: number | null;
        respiratoryRate: number | null;
        temperature: number | null;
        weight: number | null;
        height: number | null;
        oxygenSaturation: number | null;
      } | null;
      prescription: {
        items: Array<{
          drug: string;
          dose?: string;
          frequency?: string;
          duration?: string;
          instructions?: string;
        }> | null;
        notes: string | null;
      } | null;
    }>(`/dashboard/appointments/${appointmentId}/medical-record`, { token }),

  upsertConsultationNote: (
    appointmentId: string,
    data: Partial<{ subjective: string; objective: string; assessment: string; plan: string }>,
    token: string,
  ) =>
    api(`/dashboard/appointments/${appointmentId}/consultation-note`, {
      method: "PUT",
      body: JSON.stringify(data),
      token,
    }),

  upsertVitalSigns: (
    appointmentId: string,
    data: Partial<{
      bloodPressureSys: number | null;
      bloodPressureDia: number | null;
      heartRate: number | null;
      respiratoryRate: number | null;
      temperature: number | null;
      weight: number | null;
      height: number | null;
      oxygenSaturation: number | null;
    }>,
    token: string,
  ) =>
    api(`/dashboard/appointments/${appointmentId}/vital-signs`, {
      method: "PUT",
      body: JSON.stringify(data),
      token,
    }),

  upsertPrescription: (
    appointmentId: string,
    data: {
      items?: Array<{
        drug: string;
        dose?: string;
        frequency?: string;
        duration?: string;
        instructions?: string;
      }>;
      notes?: string;
    },
    token: string,
  ) =>
    api(`/dashboard/appointments/${appointmentId}/prescription`, {
      method: "PUT",
      body: JSON.stringify(data),
      token,
    }),

  // ── Pagos / Caja ──────────────────────────────────────────
  getPaymentContext: (appointmentId: string, token: string) =>
    api<{
      appointment: {
        id: string;
        reason: string;
        status: string;
        patient: { id: string; name: string };
      };
      fee: number | null;
      currency: string;
      insurances: Array<{
        id: string;
        name: string;
        shortName: string | null;
        patientCopay: number | null;
        insuranceCoverage: number | null;
      }>;
      payment: {
        id: string;
        fee: number;
        cashAmount: number;
        insuranceId: string | null;
        insuranceAmount: number;
        isCourtesy: boolean;
        notes: string | null;
      } | null;
    }>(`/dashboard/appointments/${appointmentId}/payment`, { token }),

  registerPayment: (
    appointmentId: string,
    data: {
      fee?: number;
      cashAmount?: number;
      insuranceId?: string | null;
      insuranceAmount?: number;
      isCourtesy?: boolean;
      notes?: string;
    },
    token: string,
  ) =>
    api(`/dashboard/appointments/${appointmentId}/payment`, {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),

  getCashToday: (token: string, date?: string) => {
    const qs = date ? `?date=${date}` : "";
    return api<{
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
    }>(`/dashboard/cash/today${qs}`, { token });
  },

  // ── Usuario logueado (rol + permisos) ─────────────────────
  getMe: (token: string) =>
    api<{
      id: string;
      name: string;
      email: string;
      role: "DOCTOR" | "SECRETARY" | "PLATFORM_ADMIN";
      canManageSchedule: boolean;
    }>("/dashboard/me", { token }),

  // ── Staff / Secretarias (solo el doctor) ──────────────────
  getStaff: (token: string) =>
    api<
      Array<{
        id: string;
        name: string;
        email: string;
        phone: string | null;
        role: string;
        isActive: boolean;
        canManageSchedule: boolean;
        lastLoginAt: string | null;
        createdAt: string;
      }>
    >("/dashboard/staff", { token }),

  createStaff: (
    data: {
      name: string;
      email: string;
      password: string;
      phone?: string;
      canManageSchedule?: boolean;
    },
    token: string,
  ) =>
    api("/dashboard/staff", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),

  updateStaff: (
    id: string,
    data: {
      name?: string;
      phone?: string;
      canManageSchedule?: boolean;
      isActive?: boolean;
      password?: string;
    },
    token: string,
  ) =>
    api(`/dashboard/staff/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
      token,
    }),

  deleteStaff: (id: string, token: string) =>
    api(`/dashboard/staff/${id}`, { method: "DELETE", token }),

  // ── Paciente: datos básicos NO clínicos (secretaria + doctor) ─
  getPatientBasic: (id: string, token: string) =>
    api<{
      id: string;
      tenantPatientId: string;
      name: string;
      phone: string;
      email: string | null;
      cedula: string | null;
      dateOfBirth: string | null;
      gender: string | null;
      address: string | null;
      notes: string | null;
      isVip: boolean;
      insuranceId: string | null;
      insurance: { id: string; name: string; shortName: string | null } | null;
      insuranceLegacy: string | null;
      affiliateNumber: string | null;
      appointments: Array<{
        id: string;
        date: string;
        startTime: string | null;
        status: string;
        reason: string;
      }>;
    }>(`/dashboard/patients/${id}/basic`, { token }),

  updatePatientBasic: (
    id: string,
    data: Partial<{
      name: string;
      cedula: string | null;
      dateOfBirth: string | null;
      gender: string | null;
      address: string | null;
      insuranceId: string | null;
      affiliateNumber: string | null;
      notes: string | null;
      isVip: boolean;
    }>,
    token: string,
  ) =>
    api(`/dashboard/patients/${id}/basic`, {
      method: "PATCH",
      body: JSON.stringify(data),
      token,
    }),
};
