"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { clearTokens, getToken, dashboard } from "@/lib/api";
import {
  Calendar,
  Users,
  Clock,
  UserCircle,
  Settings,
  LogOut,
  Activity,
  Banknote,
} from "lucide-react";

type NavVisibility = true | false | "schedule";

const ALL_NAV_ITEMS: {
  href: string;
  label: string;
  icon: typeof Calendar;
  secretary: NavVisibility;
}[] = [
  { href: "/dashboard", label: "Agenda del dia", icon: Calendar, secretary: true },
  { href: "/dashboard/caja", label: "Caja", icon: Banknote, secretary: true },
  { href: "/dashboard/pacientes", label: "Pacientes", icon: Users, secretary: true },
  { href: "/dashboard/horarios", label: "Horarios", icon: Clock, secretary: "schedule" },
  { href: "/dashboard/perfil", label: "Mi perfil", icon: UserCircle, secretary: false },
  { href: "/dashboard/configuracion", label: "Configuracion", icon: Settings, secretary: false },
];

/** Rutas que la secretaria PUEDE abrir (todo lo demás se redirige a /dashboard). */
function secretaryCanAccess(pathname: string, canManageSchedule: boolean): boolean {
  if (pathname === "/dashboard") return true; // agenda del día (lista)
  if (pathname.startsWith("/dashboard/caja")) return true;
  if (pathname.startsWith("/dashboard/pacientes")) return true;
  if (pathname.startsWith("/dashboard/horarios")) return canManageSchedule;
  // /dashboard/agenda/[id] (clínico), /perfil, /configuracion → bloqueado
  return false;
}

interface TenantData {
  tenant: { name: string; slug: string };
  doctorProfile?: { specialty: string; agendaActive: boolean } | null;
}

interface MeData {
  id: string;
  name: string;
  role: "DOCTOR" | "SECRETARY" | "PLATFORM_ADMIN";
  canManageSchedule: boolean;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [me, setMe] = useState<MeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    Promise.all([dashboard.getTenant(token), dashboard.getMe(token)])
      .then(([tenantData, meData]) => {
        setTenant(tenantData as TenantData);
        setMe(meData as MeData);
      })
      .catch(() => {
        clearTokens();
        router.push("/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  // Gating de rutas para la secretaria
  useEffect(() => {
    if (!me || me.role !== "SECRETARY") return;
    if (!secretaryCanAccess(pathname, me.canManageSchedule)) {
      router.replace("/dashboard");
    }
  }, [me, pathname, router]);

  const handleLogout = () => {
    clearTokens();
    router.push("/login");
  };

  const isSecretary = me?.role === "SECRETARY";

  const navItems = ALL_NAV_ITEMS.filter((item) => {
    if (!isSecretary) return true;
    if (item.secretary === true) return true;
    if (item.secretary === "schedule") return me?.canManageSchedule ?? false;
    return false;
  });

  const userName = me?.name || tenant?.tenant?.name || "";
  const roleLabel = isSecretary ? "Secretaria" : tenant?.doctorProfile?.specialty || "";
  const agendaActive = tenant?.doctorProfile?.agendaActive ?? false;

  return (
    <div className="min-h-full flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="TurnoMedico"
              width={160}
              height={48}
              className="h-12 w-auto"
            />
          </Link>
          <p className="text-xs text-gray-500 mt-1">
            {isSecretary ? "Panel de recepcion" : "Panel del consultorio"}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-teal/10 text-navy font-semibold border-l-[3px] border-teal"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-teal" : "text-gray-400"}`} strokeWidth={1.5} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full text-left text-sm text-gray-500 hover:text-red-600 px-3 py-2.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" strokeWidth={1.5} />
            Cerrar sesion
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {loading ? (
              <>
                <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-navy">{userName}</p>
                <span className="text-xs text-gray-500">{roleLabel}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="h-6 w-28 bg-gray-200 rounded-full animate-pulse" />
            ) : (
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full ${
                  agendaActive
                    ? "bg-teal/10 text-teal"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                <Activity className="w-3.5 h-3.5" strokeWidth={2} />
                {agendaActive ? "Agenda activa" : "Agenda inactiva"}
              </span>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
