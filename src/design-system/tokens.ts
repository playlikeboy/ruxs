export const RUXS_DESIGN_SYSTEM = {
  name: "RUXS Editorial Utility",
  colors: {
    background: "#0b0d0c",
    surface: "#101412",
    surfaceRaised: "#151a17",
    text: "#f4f2ec",
    muted: "#a9aea8",
    subtle: "#777d77",
    line: "rgba(244, 242, 236, 0.10)",
    brand: "#e24a3b",
    surfaceBand: "#0e1210",
    signal: "#9fc58f",
    cream: "#e7dfc8",
  },
  radius: { sm: "10px", md: "14px", lg: "20px", pill: "999px" },
  layout: { maxWidth: "1180px", gutter: "20px" },
} as const;

export type RuxsDesignSystem = typeof RUXS_DESIGN_SYSTEM;
