import { ImageResponse } from "next/og";
import { isValidLocale, DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/i18n/config";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Studio VM — offerte / quote";

// Eén kaart per taal, bij de build gemaakt.
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

const head: Record<Locale, string> = {
  nl: "Vraag een offerte aan.",
  fr: "Demandez un devis.",
  en: "Request a quote.",
  de: "Fordern Sie ein Angebot an.",
  es: "Solicite un presupuesto.",
};
const sub: Record<Locale, string> = {
  nl: "Plannen opladen · 3D-model in het formaat van uw machine",
  fr: "Envoyez vos plans · modèle 3D au format de votre engin",
  en: "Upload your plans · 3D model in your machine's format",
  de: "Pläne hochladen · 3D-Modell im Format Ihrer Maschine",
  es: "Suba sus planos · modelo 3D en el formato de su máquina",
};
// Geen persoonsnaam op de kaart: de site spreekt als Studio VM.
const regio: Record<Locale, string> = {
  nl: "Studio VM · West-Vlaanderen",
  fr: "Studio VM · Flandre-Occidentale",
  en: "Studio VM · West Flanders",
  de: "Studio VM · Westflandern",
  es: "Studio VM · Flandes Occidental",
};

export default async function OG({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l: Locale = isValidLocale(locale) ? locale : DEFAULT_LOCALE;

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
            fontWeight: 800,
            letterSpacing: -2,
          }}
        >
          <span>vm</span>
          <span style={{ color: "#f59e0b" }}>.</span>
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <h1
            style={{
              fontSize: 92,
              fontWeight: 700,
              letterSpacing: -3,
              lineHeight: 1.05,
              margin: 0,
              maxWidth: 960,
            }}
          >
            {head[l]}
          </h1>
          <p
            style={{
              marginTop: 24,
              fontSize: 34,
              color: "#f59e0b",
              fontFamily: "monospace",
            }}
          >
            {sub[l]}
          </p>
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
          <span>{regio[l]}</span>
          <span style={{ color: "#f59e0b", fontFamily: "monospace" }}>
            studio-vm.be/{l}/offerte
          </span>
        </div>
      </div>
    ),
    size,
  );
}
