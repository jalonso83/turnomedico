"use client";

import { useEffect, useState } from "react";
import { Download, Share, Plus, X } from "lucide-react";

/** Evento beforeinstallprompt (no está en las libs estándar de TS). */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Card "Instala la app" interactivo.
 * - Android/Chrome/Edge: botón que dispara el prompt nativo de instalación.
 * - iPhone/Safari (o navegadores sin prompt): instrucciones manuales.
 * - Si ya está instalada (standalone): no muestra nada.
 */
export default function InstallAppCard() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        !("MSStream" in window)
    );
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        // iOS Safari standalone flag
        (navigator as unknown as { standalone?: boolean }).standalone === true
    );

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Ya instalada → no mostrar nada.
  if (isStandalone || installed) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      setDeferredPrompt(null);
      return;
    }
    // Sin prompt nativo (iOS u otros) → mostrar instrucciones.
    setShowInstructions(true);
  };

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-3">
        <Download
          className="w-5 h-5 text-blue-mid shrink-0"
          strokeWidth={1.5}
        />
        <div className="text-left flex-1">
          <p className="text-sm font-medium text-navy">Instala la app</p>
          <p className="text-xs text-gray-600">
            Para recibir recordatorios automáticos de tus citas
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleInstall}
        className="mt-3 w-full bg-navy text-white py-2.5 rounded-lg text-sm font-medium hover:bg-navy-dark transition-colors"
      >
        Instalar app
      </button>

      {showInstructions && (
        <div className="mt-3 rounded-lg bg-white border border-blue-100 p-3 text-left">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-sm font-medium text-navy">Cómo instalar</p>
            <button
              type="button"
              onClick={() => setShowInstructions(false)}
              aria-label="Cerrar"
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {isIOS ? (
            <ol className="space-y-2 text-xs text-gray-600">
              <li className="flex items-center gap-2">
                <span className="font-semibold text-navy">1.</span>
                Toca el botón Compartir
                <Share className="w-4 h-4 text-blue-mid inline" strokeWidth={1.5} />
                en la barra de Safari.
              </li>
              <li className="flex items-center gap-2">
                <span className="font-semibold text-navy">2.</span>
                Elige{" "}
                <span className="inline-flex items-center gap-1 font-medium text-navy">
                  Agregar a inicio
                  <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                </span>
                .
              </li>
              <li className="flex items-center gap-2">
                <span className="font-semibold text-navy">3.</span>
                Confirma con <span className="font-medium text-navy">Agregar</span>.
              </li>
            </ol>
          ) : (
            <p className="text-xs text-gray-600">
              Abre el menú de tu navegador (⋮) y elige{" "}
              <span className="font-medium text-navy">
                Instalar app
              </span>{" "}
              o{" "}
              <span className="font-medium text-navy">
                Agregar a pantalla de inicio
              </span>
              .
            </p>
          )}
        </div>
      )}
    </div>
  );
}
