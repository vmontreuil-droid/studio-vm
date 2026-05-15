import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Studio VM — Websites en webshops voor lokale ondernemers";

export default function OG() {
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
            display: "flex",
            alignItems: "center",
            fontSize: 48,
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, "Cascadia Code", monospace',
            fontWeight: 700,
            letterSpacing: -2,
          }}
        >
          <span style={{ color: "#f59e0b" }}>&lt;</span>
          <span>vm</span>
          <span style={{ color: "#f59e0b" }}>/&gt;</span>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <h1
            style={{
              fontSize: 88,
              fontWeight: 700,
              letterSpacing: -2,
              lineHeight: 1.05,
              margin: 0,
              maxWidth: 900,
            }}
          >
            Websites en webshops voor lokale ondernemers.
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
          <span>Vincent Montreuil · West-Vlaanderen</span>
          <span style={{ color: "#f59e0b", fontFamily: "monospace" }}>studio-vm.be</span>
        </div>
      </div>
    ),
    size,
  );
}
