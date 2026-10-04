"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Lichtgewicht client-side beacon: stuurt 1 ping per route-change naar
// /api/track-pv. Werkt met sendBeacon (geen netwerk-overhead op de UX) en
// faalt stil — nooit een bezoeker storen voor analytics. UTM-schema:
// src/lib/utm.ts (utm_content = id van het bericht).
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

    // UTM-params uit huidige URL halen — usePathname() bevat geen query,
    // daarom apart via window.location.search lezen.
    let utmSource: string | null = null;
    let utmMedium: string | null = null;
    let utmCampaign: string | null = null;
    let utmContent: string | null = null;
    if (typeof window !== "undefined") {
      try {
        const sp = new URLSearchParams(window.location.search);
        utmSource = sp.get("utm_source");
        utmMedium = sp.get("utm_medium");
        utmCampaign = sp.get("utm_campaign");
        utmContent = sp.get("utm_content");
      } catch {}
    }

    const body = JSON.stringify({
      path,
      locale: locale ?? "nl",
      referrer:
        typeof document !== "undefined" ? document.referrer || null : null,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      utm_content: utmContent,
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
