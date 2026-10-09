/**
 * RUXS Central Design System Tokens
 * Theme: Warm Ivory & Blush-Pink with Airbnb DLS Clarity & Cute Pastel Touches
 *
 * Source of Truth for colors, typography, radii, shadows, and spacing.
 */

export const DS_TOKENS = {
  name: "RUXS Warm Cute Airbnb DLS",
  colors: {
    // Reference Primary Palette
    canvas: {
      DEFAULT: "#FEC7BE",
      soft: "#FFC9C4",
      subtle: "rgba(254, 199, 190, 0.35)",
    },
    surface: {
      DEFAULT: "#FFF8ED",       // Main warm ivory page canvas
      raised: "#FFFCF7",        // Elevated cards, modals, sheets
      band: "#FFF2DF",          // Warm ivory section band / secondary background
      subtle: "#F9EFE2",        // Subdued container / inactive item
      border: "rgba(90, 85, 75, 0.12)",
      borderHover: "rgba(90, 85, 75, 0.24)",
      borderActive: "#BD4B2A",
    },
    ink: {
      DEFAULT: "#5A554B",       // Deep warm-brown primary text
      muted: "#746E63",         // Secondary reading text
      subtle: "#9B958B",        // Placeholder, disabled, fine captions
      white: "#FFFFFF",
    },
    coral: {
      DEFAULT: "#FF804E",       // Iconic warm coral accent & highlights
      light: "#FFA07A",
      soft: "rgba(255, 128, 78, 0.14)",
      glow: "rgba(255, 128, 78, 0.25)",
    },
    action: {
      DEFAULT: "#BD4B2A",       // High-contrast accessible action (WCAG AA compliant on ivory)
      hover: "#A84224",         // Primary hover state
      active: "#8F361C",
      disabled: "rgba(189, 75, 42, 0.45)",
    },
    // Cute Pastel Accents & Illustrations
    pastel: {
      blue: "#C4DFEF",          // Soft milk/water pastel
      yellow: "#FFE59C",        // Breakfast/morning sun pastel
      pink: "#F2A4A4",          // Heart/flower petal pastel
      mint: "#D5EED8",          // Fresh produce / organic
      lavender: "#E8DCF8",      // Pet care / laundry
    },
    // Status & Feedback (calibrated for warm ivory background)
    status: {
      success: "#2E7D32",       // Legible forest green
      successBg: "#E8F5E9",
      warning: "#B45309",       // Deep amber
      warningBg: "#FEF3C7",
      error: "#C62828",         // Crimson red
      errorBg: "#FFEBEE",
      info: "#1E88E5",          // Sky blue
      infoBg: "#E1F5FE",
    },
    white: "#FFFFFF",
  },
  typography: {
    fontDisplay: '"Baloo 2", "Nunito Sans", ui-rounded, system-ui, -apple-system, sans-serif',
    fontBody: '"Nunito Sans", "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    scale: {
      display: "clamp(2rem, 5vw, 3.25rem)",
      h1: "clamp(1.75rem, 4vw, 2.5rem)",
      h2: "clamp(1.35rem, 3vw, 1.85rem)",
      h3: "clamp(1.15rem, 2.5vw, 1.35rem)",
      bodyLg: "1.0625rem",
      body: "0.9375rem",
      bodySm: "0.8125rem",
      caption: "0.6875rem",
    },
    weights: {
      regular: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
      extraBold: "800",
    },
    lineHeights: {
      tight: "1.15",
      snug: "1.3",
      normal: "1.5",
      relaxed: "1.65",
    },
  },
  radius: {
    xs: "6px",
    sm: "10px",
    md: "14px",
    lg: "18px",
    xl: "22px",
    "2xl": "28px",
    pill: "9999px",
  },
  shadows: {
    card: "0 4px 18px -2px rgba(90, 85, 75, 0.06), 0 2px 6px -1px rgba(90, 85, 75, 0.04)",
    elevated: "0 10px 30px -4px rgba(90, 85, 75, 0.09), 0 4px 12px -2px rgba(90, 85, 75, 0.05)",
    floating: "0 18px 44px -6px rgba(90, 85, 75, 0.14), 0 6px 16px -2px rgba(90, 85, 75, 0.08)",
    pill: "0 8px 24px -4px rgba(189, 75, 42, 0.22), 0 3px 8px -2px rgba(189, 75, 42, 0.15)",
    subtle: "0 1px 3px rgba(90, 85, 75, 0.08)",
  },
  spacing: {
    px1: "4px",
    px2: "8px",
    px3: "12px",
    px4: "16px",
    px5: "20px",
    px6: "24px",
    px8: "32px",
    px10: "40px",
    px12: "48px",
    px16: "64px",
    px20: "80px",
    px24: "96px",
  },
  layout: {
    maxWidth: "1180px",
    readableWidth: "680px",
    gutter: "20px",
    headerHeight: "64px",
    bottomNavHeight: "72px",
  },
  transitions: {
    fast: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
    normal: "250ms cubic-bezier(0.4, 0, 0.2, 1)",
    spring: "350ms cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  },
} as const;

export type DSTokens = typeof DS_TOKENS;

// Backward-compatible export for opengraph / og-image renderers
export const RUXS_DESIGN_SYSTEM = {
  name: "RUXS Warm Cute DLS",
  colors: {
    background: "#FFF8ED",
    surface: "#FFFCF7",
    surfaceRaised: "#FFF2DF",
    text: "#5A554B",
    muted: "#746E63",
    subtle: "#9B958B",
    line: "rgba(90, 85, 75, 0.12)",
    brand: "#FF804E",
    action: "#BD4B2A",
    surfaceBand: "#FFF2DF",
    signal: "#2E7D32",
    cream: "#FFF8ED",
  },
  radius: { sm: "10px", md: "14px", lg: "18px", xl: "22px", pill: "9999px" },
  layout: { maxWidth: "1180px", gutter: "20px" },
} as const;
