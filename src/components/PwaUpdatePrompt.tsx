"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function PwaUpdatePrompt() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let registration: ServiceWorkerRegistration | null = null;

    const showUpdateToast = () => {
      toast.info("Nova versão disponível", {
        description: "Recarregue para usar a versão mais recente.",
        action: {
          label: "Recarregar",
          onClick: () => window.location.reload(),
        },
        duration: Infinity,
      });
    };

    const onUpdateFound = () => {
      const worker = registration?.installing;
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          showUpdateToast();
        }
      });
    };

    const register = async () => {
      try {
        registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          registration.addEventListener("updatefound", onUpdateFound);
          await registration.update();
        } else {
          registration = await navigator.serviceWorker.register("/sw.js");
          registration.addEventListener("updatefound", onUpdateFound);
        }
      } catch {
        // PWA não registrado ou falha silenciosa
      }
    };

    register();

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && registration) {
        registration.update();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      registration?.removeEventListener("updatefound", onUpdateFound);
    };
  }, []);

  return null;
}
