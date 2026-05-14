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
          color: "#f59e0b",
          fontSize: 16,
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, "Cascadia Code", monospace',
          fontWeight: 700,
          letterSpacing: -1,
        }}
      >
        &lt;/&gt;
      </div>
    ),
    size,
  );
}
