import { ImageResponse } from "next/og";
import { RuxsMark } from "@/components/marketing/ruxs-mark";

export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          backgroundColor: "#FAFAF7",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <RuxsMark width={64} height={64} aria-hidden="true" />
          <span style={{ fontSize: 38, fontWeight: 800, color: "#BD4B2A", letterSpacing: "-0.04em" }}>
            RUXs
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 1020 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: "#1C1B19",
              letterSpacing: "-0.04em",
              lineHeight: 1.08,
            }}
          >
            More of everyday life, sorted locally.
          </div>
          <div style={{ fontSize: 28, color: "#6B6862", lineHeight: 1.4 }}>
            Meals, water and dairy, kids&apos; learning, thoughtful gifts and neighbourhood specialists.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              padding: "12px 24px",
              backgroundColor: "#FFE8DD",
              color: "#1C1B19",
              borderRadius: 14,
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            Everyday essentials
          </div>
          <div
            style={{
              padding: "12px 24px",
              backgroundColor: "#FFF3C9",
              color: "#1C1B19",
              borderRadius: 14,
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            Kids Zone
          </div>
          <span style={{ marginLeft: "auto", fontSize: 22, color: "#6B6862" }}>
            ruxs.in
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
