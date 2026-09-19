import { ImageResponse } from "next/og";
import { RUXS_DESIGN_SYSTEM as DS } from "@/src/design-system/tokens";

export const alt = "RUXS — recurring household life, quietly handled";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: DS.colors.background,
          color: DS.colors.text,
          padding: "68px 74px",
          fontFamily: "Arial",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: DS.colors.brand, color: "#fff", fontSize: 26, fontWeight: 800 }}>R</div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "0.14em" }}>RUXS</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: 930 }}>
          <div style={{ color: DS.colors.signal, fontSize: 20, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>
            Everyday infrastructure
          </div>
          <div style={{ marginTop: 18, fontSize: 78, lineHeight: 0.98, fontWeight: 600, letterSpacing: "-0.04em" }}>
            Recurring household life,
            <br />
            quietly handled.
          </div>
          <div style={{ marginTop: 24, color: DS.colors.muted, fontSize: 24 }}>
            Meals · Water · Milk · Local services
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", color: DS.colors.subtle, fontSize: 18 }}>
          <span>ruxs.in</span>
          <span>Set the default. Change what matters.</span>
        </div>
      </div>
    ),
    size,
  );
}
