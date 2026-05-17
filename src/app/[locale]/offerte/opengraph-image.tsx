import { ImageResponse } from "next/og";
import { isValidLocale, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Studio VM — configurator";

const head: Record<Locale, string> = {
  nl: "Stel je website samen.",
  fr: "Composez votre site.",
  en: "Build your website.",
};
const sub: Record<Locale, string> = {
  nl: "Vaste prijs · 30% om vast te leggen · geen sterretjes",
  fr: "Prix fixe · 30% pour verrouiller · sans astérisques",
  en: "Fixed price · 30% to lock in · no asterisks",
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
          <span>Vincent Montreuil · West-Vlaanderen</span>
          <span style={{ color: "#f59e0b", fontFamily: "monospace" }}>
            studio-vm.be/{l}/offerte
          </span>
        </div>
      </div>
    ),
    size,
  );
}
