"use client";

import { useReportWebVitals } from "next/web-vitals";
import { track } from "@vercel/analytics";

// Rapporteert Core Web Vitals naar Vercel Analytics als custom events.
// Zo zien we continu of de site presteert zoals ze belooft.
export function WebVitals() {
  useReportWebVitals((metric) => {
    if (
      metric.name === "LCP" ||
      metric.name === "CLS" ||
      metric.name === "INP" ||
      metric.name === "TTFB" ||
      metric.name === "FCP"
    ) {
      track("web-vital", {
        metric: metric.name,
        value: Math.round(
          metric.name === "CLS" ? metric.value * 1000 : metric.value,
        ),
        rating: metric.rating ?? "unknown",
      });
    }
  });
  return null;
}
