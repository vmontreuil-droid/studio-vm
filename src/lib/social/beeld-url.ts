// Afspraak voor de beeldadressen van social-berichten: de beeldroute, de
// contentmachine en de publisher gebruiken allemaal dit ene bestand.
//
// Altijd JPEG (Instagram en de Graph-API aanvaarden geen WebP) en buiten
// /api/ (robots.txt blokkeert /api/, platformen moeten het beeld kunnen
// ophalen). Het pad bevat een punt, dus de taal-middleware laat het met rust.

export type SocialFormaat = "og" | "portrait" | "square" | "story" | "gbp";

export const SOCIAL_FORMATEN: Record<SocialFormaat, { w: number; h: number; label: string }> = {
  og: { w: 1200, h: 630, label: "Linkvoorbeeld 1200×630" },
  portrait: { w: 1080, h: 1350, label: "Feed staand 1080×1350" },
  square: { w: 1080, h: 1080, label: "Feed vierkant 1080×1080" },
  story: { w: 1080, h: 1920, label: "Story / Reel 1080×1920" },
  gbp: { w: 1200, h: 900, label: "Google-bericht 1200×900" },
};

export function isSocialFormaat(v: unknown): v is SocialFormaat {
  return typeof v === "string" && v in SOCIAL_FORMATEN;
}

/** Relatief pad naar het beeld van een bericht; `v` breekt caches na een wijziging. */
export function socialBeeldPad(postId: string, formaat: SocialFormaat = "portrait", v?: string): string {
  return `/beeld/social/${encodeURIComponent(postId)}/${formaat}.jpg${v ? `?v=${encodeURIComponent(v)}` : ""}`;
}
