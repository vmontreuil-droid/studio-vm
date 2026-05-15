"use client";

import { usePathname } from "next/navigation";

const TINT: Record<string, string> = {
  pricing: "var(--tint-amber)",
  scan: "var(--tint-violet)",
  offerte: "var(--tint-teal)",
  werk: "var(--tint-rose)",
  mogelijkheden: "var(--tint-blue)",
  diensten: "var(--tint-teal)",
  over: "var(--tint-violet)",
  journal: "var(--tint-blue)",
  changelog: "var(--tint-rose)",
};

export function AmbientBackdrop() {
  const pathname = usePathname();
  // /nl/pricing → "pricing" ; /nl → "" (home, default amber)
  const seg = pathname.split("/").filter(Boolean)[1] ?? "";
  const tint = TINT[seg] ?? "var(--tint-amber)";

  return (
    <>
      <div aria-hidden className="page-grid" />
      <div
        aria-hidden
        className="page-aura"
        style={{ "--page-tint": tint } as React.CSSProperties}
      />
    </>
  );
}
