import { ImageResponse } from "next/og";

// Wit vm.-logo (exact het merklettertype: Montserrat ExtraBold,
// lowercase, strakke tracking) op transparante achtergrond.
// Bereikbaar op /logo-white.png — bv. voor het Mollie-betaalscherm.
export const contentType = "image/png";
export const dynamic = "force-dynamic";

async function montserrat(): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(
      "https://cdn.jsdelivr.net/fontsource/fonts/montserrat@latest/latin-800-normal.ttf",
      { cache: "force-cache" },
    );
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

export async function GET() {
  const fontData = await montserrat();
  return new ImageResponse(
    (
      <div
        style={{
          background: "transparent",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            fontFamily: fontData ? "Montserrat" : "sans-serif",
            fontWeight: 800,
            fontSize: 200,
            letterSpacing: -14,
            lineHeight: 1,
          }}
        >
          <span style={{ color: "#ffffff" }}>vm</span>
          <span style={{ color: "#f59e0b" }}>.</span>
        </div>
      </div>
    ),
    {
      width: 760,
      height: 320,
      headers: {
        "cache-control": "public, max-age=86400, immutable",
      },
      ...(fontData
        ? {
            fonts: [
              {
                name: "Montserrat",
                data: fontData,
                weight: 800 as const,
                style: "normal" as const,
              },
            ],
          }
        : {}),
    },
  );
}
