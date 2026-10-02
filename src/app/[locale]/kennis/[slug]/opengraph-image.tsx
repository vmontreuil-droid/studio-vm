import { ImageResponse } from "next/og";
import { isValidLocale, DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/i18n/config";
import { KENNIS, kennisArtikel } from "@/lib/kennis";

// Deelkaart per kennisartikel: zelfde ontwerp en kleuren als de kaart van
// [locale]/opengraph-image, met de artikeltitel als kop.

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Studio VM";

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => KENNIS.map((a) => ({ locale, slug: a.slug })));
}

const KENNISBANK: Record<Locale, string> = {
  nl: "Kennisbank",
  fr: "Base de connaissances",
  en: "Knowledge base",
  de: "Wissensdatenbank",
  es: "Base de conocimiento",
};

/** Lange titels krijgen een kleinere letter, zodat ze binnen de kaart passen. */
function kopGrootte(titel: string): number {
  const n = titel.length;
  if (n <= 24) return 84;
  if (n <= 36) return 76;
  if (n <= 50) return 68;
  return 62;
}

/**
 * Satori legt de regel uit met de breedte van losse letters, maar tekent elk
 * woord mét kerning, dus smaller. Daardoor valt achter lange woorden een gat
 * ("Koordinatenreferenzsysteme   und"). Elke letter apart zetten houdt meten
 * en tekenen gelijk; de woorden lopen dan door met een vaste tussenruimte.
 * Een spatie voor ? ! : ; » of na « blijft vast, zodat zo'n teken nooit
 * alleen op een regel komt.
 */
function kopWoorden(titel: string): string[] {
  return titel.normalize("NFC").split(/(?<!«) (?![?!:;»])/);
}

export default async function OG({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const l: Locale = isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  const artikel = kennisArtikel(slug) ?? KENNIS[0];
  const titel = artikel.i18n[l].titel;
  const grootte = kopGrootte(titel);
  const tussenruimte = Math.round(grootte * 0.25);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0c0a09",
          display: "flex",
          flexDirection: "column",
          padding: "80px",
          color: "#fafaf9",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "60%",
            height: "100%",
            background:
              "radial-gradient(circle at 70% 30%, rgba(245, 158, 11, 0.25), transparent 60%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.05), transparent 42%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 7,
            background: "#f59e0b",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 48,
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, "Cascadia Code", monospace',
            fontWeight: 700,
            letterSpacing: -2,
          }}
        >
          <span>vm</span>
          <span style={{ color: "#f59e0b" }}>.</span>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <h1
            style={{
              display: "flex",
              flexWrap: "wrap",
              columnGap: tussenruimte,
              fontSize: grootte,
              fontWeight: 700,
              lineHeight: 1.05,
              margin: 0,
              maxWidth: 1040,
            }}
          >
            {kopWoorden(titel).map((woord, i) => (
              <div key={i} style={{ display: "flex" }}>
                {Array.from(woord).map((teken, j) =>
                  teken === " " ? (
                    <span key={j} style={{ width: tussenruimte }} />
                  ) : (
                    <span key={j}>{teken}</span>
                  ),
                )}
              </div>
            ))}
          </h1>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            color: "#a8a29e",
            fontSize: 26,
          }}
        >
          <span>{`Studio VM · ${KENNISBANK[l]}`}</span>
          <span style={{ color: "#f59e0b", fontFamily: "monospace" }}>
            studio-vm.be/{l}
          </span>
        </div>
      </div>
    ),
    size,
  );
}
