import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0c0a09",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 56,
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, "Cascadia Code", monospace',
          fontWeight: 700,
          letterSpacing: -3,
          borderRadius: 36,
        }}
      >
        <span style={{ color: "#f59e0b" }}>&lt;</span>
        <span style={{ color: "#fafaf9" }}>vm</span>
        <span style={{ color: "#f59e0b" }}>/&gt;</span>
      </div>
    ),
    size,
  );
}
