import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          color: "#fafaf9",
          fontSize: 19,
          fontFamily: "sans-serif",
          fontWeight: 800,
          letterSpacing: -1.5,
        }}
      >
        vm<span style={{ color: "#f59e0b" }}>.</span>
      </div>
    ),
    size,
  );
}
