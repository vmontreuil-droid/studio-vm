"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[studio-vm] global error:", error);
  }, [error]);

  return (
    <html lang="nl">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0c0a09",
          color: "#fafaf9",
          fontFamily: "system-ui, -apple-system, sans-serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <div>
          <p
            style={{
              fontFamily: "ui-monospace, monospace",
              fontSize: 12,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "#f59e0b",
            }}
          >
            Fatal error
          </p>
          <h1 style={{ fontSize: 40, fontWeight: 700, margin: "12px 0 0" }}>
            <span style={{ color: "#f59e0b" }}>&lt;</span>vm
            <span style={{ color: "#f59e0b" }}>/&gt;</span> — er ging iets grondig mis.
          </h1>
          <p style={{ color: "#a8a29e", marginTop: 16 }}>
            Something broke at the root. / Quelque chose a cassé à la racine.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 28,
              borderRadius: 999,
              background: "#fafaf9",
              color: "#0c0a09",
              border: "none",
              padding: "12px 24px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Probeer opnieuw / Retry
          </button>
        </div>
      </body>
    </html>
  );
}
