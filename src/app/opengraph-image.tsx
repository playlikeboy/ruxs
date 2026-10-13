import { ImageResponse } from "next/og";

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
          padding: 80,
          backgroundColor: "#FAFAF7",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              backgroundColor: "#BD4B2A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              fontSize: 32,
              fontWeight: 800,
            }}
          >
            R
          </div>
          <span style={{ fontSize: 36, fontWeight: 700, color: "#1C1B19", letterSpacing: "-0.02em" }}>
            RUXS
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 60,
              fontWeight: 800,
              color: "#1C1B19",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            Run your whole day on one private link.
          </div>
          <div style={{ fontSize: 28, color: "#6B6862", lineHeight: 1.4 }}>
            For neighbourhood tiffin kitchens and 20L water suppliers. One tap to skip, one kitchen count, driver run sheet, and direct UPI bills.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              padding: "12px 24px",
              backgroundColor: "#BD4B2A",
              color: "#FFFFFF",
              borderRadius: 12,
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            ruxs.in
          </div>
          <span style={{ fontSize: 20, color: "#6B6862" }}>
            Bengaluru • Free up to 20 households
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
