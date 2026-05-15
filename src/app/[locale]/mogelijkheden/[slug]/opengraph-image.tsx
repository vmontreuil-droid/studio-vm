import { ImageResponse } from "next/og";
import { LOCALES, isValidLocale, DEFAULT_LOCALE } from "@/lib/i18n/config";
import { capabilitySlugs, getCapabilityDetail } from "@/lib/capabilities";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Studio VM — mogelijkheden";

export function generateStaticParams() {
  return LOCALES.flatMap((locale) =>
    capabilitySlugs.map((slug) => ({ locale, slug })),
  );
}

export default async function OG({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const l = isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  const d = getCapabilityDetail(slug, l);

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
            left: 0,
            right: 0,
            height: 7,
            background: "#f59e0b",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(55% 65% at 78% 22%, rgba(245,158,11,0.28), transparent 62%)",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 40,
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, "Cascadia Code", monospace',
            fontWeight: 700,
            letterSpacing: -2,
          }}
        >
          vm<span style={{ color: "#f59e0b" }}>.</span>
        </div>
        <div
          style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}
        >
          <div
            style={{
              fontSize: 24,
              color: "#f59e0b",
              fontFamily: "monospace",
              textTransform: "uppercase",
              letterSpacing: 2,
            }}
          >
            {l === "fr" ? "Capacité" : l === "en" ? "Capability" : "Mogelijkheid"}
          </div>
          <h1
            style={{
              fontSize: 84,
              fontWeight: 700,
              letterSpacing: -2,
              margin: "16px 0 0",
              lineHeight: 1.05,
              maxWidth: 980,
            }}
          >
            {d?.title ?? "Studio VM"}
          </h1>
          <p
            style={{
              fontSize: 28,
              color: "#a8a29e",
              marginTop: 24,
              maxWidth: 920,
              lineHeight: 1.3,
            }}
          >
            {(d?.short ?? "").slice(0, 130)}
          </p>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            color: "#f59e0b",
            fontSize: 24,
            fontFamily: "monospace",
          }}
        >
          studio-vm.be
        </div>
      </div>
    ),
    size,
  );
}
