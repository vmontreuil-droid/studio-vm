import { ImageResponse } from "next/og";

// PNG-logo voor e-mails (SVG rendert niet in Gmail/Outlook). Donkere
// achtergrond = naadloos op de mailkop (#0c0a09).
export const contentType = "image/png";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0c0a09",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "0 48px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            fontSize: 132,
            fontWeight: 800,
            letterSpacing: -10,
            lineHeight: 1,
          }}
        >
          <span style={{ color: "#fafaf9" }}>vm</span>
          <span style={{ color: "#f59e0b" }}>.</span>
        </div>
        <div
          style={{
            marginTop: 14,
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: 14,
            color: "#f59e0b",
          }}
        >
          STUDIO VM
        </div>
      </div>
    ),
    {
      width: 640,
      height: 240,
      headers: {
        "cache-control": "public, max-age=86400, immutable",
      },
    },
  );
}
