/**
 * RUXS Central Design System Tokens
 * Inspired by modern food delivery & domestic service mobile apps.
 */

export const DS_TOKENS = {
  name: "RUXS Central Design System",
  colors: {
    // Primary Brand Greens (from reference design)
    primary: {
      DEFAULT: "#10b981", // Emerald 500
      light: "#34d399",   // Emerald 400
      dark: "#059669",    // Emerald 600
      darker: "#047857",  // Emerald 700
      glow: "rgba(16, 185, 129, 0.22)",
      subtle: "rgba(16, 185, 129, 0.12)",
    },
    // Secondary Warm Accents
    accent: {
      orange: "#f97316",
      red: "#ef4444",
      amber: "#f59e0b",
      yellow: "#fbbf24",
      purple: "#8b5cf6",
      blue: "#3b82f6",
    },
    // Neutral & Dark Theme Surfaces
    surface: {
      bg: "#0b0d0c",
      card: "#121714",
      cardHover: "#161d19",
      subtle: "#18201a",
      elevated: "#1e2822",
      border: "rgba(255, 255, 255, 0.08)",
      borderHover: "rgba(255, 255, 255, 0.15)",
      borderActive: "rgba(16, 185, 129, 0.4)",
    },
    // Text Hierarchy
    text: {
      primary: "#f3f4f6",
      secondary: "#9ca3af",
      muted: "#6b7280",
      subtle: "#4b5563",
      inverted: "#0b0d0c",
    },
  },
  radius: {
    xs: "6px",
    sm: "10px",
    md: "14px",
    lg: "18px",
    xl: "24px",
    "2xl": "32px",
    pill: "9999px",
  },
  shadows: {
    sm: "0 2px 8px rgba(0, 0, 0, 0.2)",
    md: "0 8px 24px rgba(0, 0, 0, 0.28)",
    lg: "0 16px 48px rgba(0, 0, 0, 0.36)",
    glowGreen: "0 8px 24px rgba(16, 185, 129, 0.25)",
    glowPill: "0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(16, 185, 129, 0.15)",
  },
  transitions: {
    fast: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
    normal: "250ms cubic-bezier(0.4, 0, 0.2, 1)",
    spring: "350ms cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  },
  cleanMinimal: {
    canvas: "bg-gradient-to-b from-sky-50/50 via-white to-sky-50/25",
    card: "bg-gradient-to-b from-sky-50/60 to-white rounded-3xl border border-blue-100 shadow-xl shadow-black/[0.04]",
    iconBadge: "w-14 h-14 rounded-2xl bg-white shadow-lg shadow-black/[0.04] border border-blue-50 flex items-center justify-center text-black",
    input: "w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-200",
    primaryButton: "bg-gradient-to-b from-gray-700 to-gray-900 text-white font-medium py-2.5 px-5 rounded-xl shadow hover:brightness-105 cursor-pointer transition",
    secondaryButton: "rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-medium py-2.5 px-5 transition shadow-sm",
    divider: "border-t border-dashed border-gray-200",
  },
} as const;

export type DSTokens = typeof DS_TOKENS;

// Backward-compatible export for opengraph / og-image renderers
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
