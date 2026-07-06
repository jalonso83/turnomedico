"use client";

import { useEffect } from "react";

/**
 * Registra el Service Worker de TurnoMedico una sola vez, de forma global.
 * Se monta en el layout raíz. No renderiza nada.
 * El SW (public/sw.js) habilita instalación PWA y, más adelante, push.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((err) => {
        console.error("[PWA] No se pudo registrar el service worker:", err);
      });
  }, []);

  return null;
}
