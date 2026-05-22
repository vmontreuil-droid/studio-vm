"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Lichtgewicht client-side beacon: stuurt 1 ping per route-change naar
// /api/track-pv. Werkt met sendBeacon (geen netwerk-overhead op de UX) en
// faalt stil — nooit een bezoeker storen voor analytics.
export function PageViewTracker({ locale }: { locale?: string }) {
  const path = usePathname();

  useEffect(() => {
    if (!path) return;
    // Skip admin/portail/api — die meten we serverside ook uit
    if (
      path.startsWith("/admin") ||
      path.startsWith("/portail") ||
      path.startsWith("/api")
    ) {
      return;
    }

    const body = JSON.stringify({
      path,
      locale: locale ?? "nl",
      referrer:
        typeof document !== "undefined" ? document.referrer || null : null,
    });

    try {
      if (
        typeof navigator !== "undefined" &&
        typeof navigator.sendBeacon === "function"
      ) {
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon("/api/track-pv", blob);
        return;
      }
    } catch {}

    // Fallback
    try {
      void fetch("/api/track-pv", {
        method: "POST",
        body,
        headers: { "content-type": "application/json" },
        keepalive: true,
      });
    } catch {}
  }, [path, locale]);

  return null;
}
