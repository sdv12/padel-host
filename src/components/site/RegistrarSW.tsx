"use client";

import { useEffect } from "react";

export function RegistrarSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Si falla el registro, la app sigue funcionando normal, solo sin PWA.
      });
    }
  }, []);
  return null;
}
