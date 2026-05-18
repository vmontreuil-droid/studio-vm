import { ImageResponse } from "next/og";

// Wit vm.-logo op een volledig transparante achtergrond — bruikbaar
// voor o.a. het Mollie-betaalscherm. Bereikbaar op /logo-white.png
export const contentType = "image/png";

export function GET() {
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
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            fontSize: 150,
            fontWeight: 800,
            letterSpacing: -10,
            lineHeight: 1,
          }}
        >
          <span style={{ color: "#ffffff" }}>vm</span>
          <span style={{ color: "#f59e0b" }}>.</span>
        </div>
      </div>
    ),
    {
      width: 600,
      height: 240,
      headers: {
        "cache-control": "public, max-age=86400, immutable",
      },
    },
  );
}
