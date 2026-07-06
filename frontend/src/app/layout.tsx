import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TurnoMedico — Tu turno médico, sin esperas",
  description:
    "Agenda tu cita médica en 60 segundos. Sin llamadas, sin esperas. Plataforma de gestión de turnos médicos en República Dominicana.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "TurnoMedico",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
