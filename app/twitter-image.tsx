import { ImageResponse } from "next/og";
import { RUXS_DESIGN_SYSTEM as DS } from "@/src/design-system/tokens";

export const alt = "RUXS — Your household, without the follow-up";
export const size = { width: 1200, height: 600 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: DS.colors.background, color: DS.colors.text, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", fontFamily: "Arial" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: DS.colors.brand, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 28, fontWeight: 800 }}>R</div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "0.12em" }}>RUXS</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 900 }}>
          <div style={{ fontSize: 22, letterSpacing: "0.16em", textTransform: "uppercase", color: DS.colors.signal, fontWeight: 700 }}>Everyday infrastructure</div>
          <div style={{ marginTop: 18, fontSize: 82, lineHeight: 0.96, fontWeight: 700, letterSpacing: "-0.045em" }}>
            Your household,
            <br />
            <span style={{ color: DS.colors.brand }}>without the follow-up.</span>
          </div>
          <div style={{ marginTop: 28, color: DS.colors.muted, fontSize: 25 }}>Meals · Water · Milk · Local services</div>
        </div>
        <div style={{ color: DS.colors.subtle, fontSize: 18, display: "flex", justifyContent: "space-between" }}><span>ruxs.in</span><span>Set the default. Change what matters.</span></div>
      </div>
    ),
    size,
  );
}