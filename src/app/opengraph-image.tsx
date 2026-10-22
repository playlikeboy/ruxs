import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, backgroundColor: "#FFFDF8", fontFamily: "Arial, Helvetica, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <img src="https://ruxs.in/brand/ruxs-app-icon.svg" width="100" height="100" alt="RUXs logo" style={{ width: 100, height: 100, borderRadius: 24 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 48, fontWeight: 900, color: "#07583F", letterSpacing: "-2px" }}>RUXs</span>
          <span style={{ fontSize: 18, color: "#746A5D" }}>YOUR NEIGHBOURHOOD, MADE EASIER</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 1020 }}>
        <div style={{ fontSize: 64, fontWeight: 800, color: "#1C1B19", letterSpacing: "-2px", lineHeight: 1.08 }}>More of everyday life, sorted locally.</div>
        <div style={{ fontSize: 27, color: "#6B6862", lineHeight: 1.35 }}>Meals, water and dairy, kids&apos; learning, thoughtful gifts and neighbourhood specialists.</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ padding: "12px 22px", backgroundColor: "#FFE8DD", color: "#1C1B19", borderRadius: 14, fontSize: 19, fontWeight: 700 }}>Everyday essentials</div>
        <div style={{ padding: "12px 22px", backgroundColor: "#FFF3C9", color: "#1C1B19", borderRadius: 14, fontSize: 19, fontWeight: 700 }}>Kids Zone</div>
        <div style={{ padding: "12px 22px", backgroundColor: "#E1F3E7", color: "#1C1B19", borderRadius: 14, fontSize: 19, fontWeight: 700 }}>Local specialists</div>
        <span style={{ marginLeft: "auto", fontSize: 22, color: "#6B6862" }}>ruxs.in</span>
      </div>
    </div>,
    { ...size },
  );
}
