---
name: RUXs Design System
description: A calm Indian kitchen notebook made premium — hyper-local essentials, kids activities, and neighborhood commerce.
colors:
  bg: "#FAFAF7"
  surface: "#FFFFFF"
  ink: "#1C1B19"
  muted: "#6B6862"
  line: "#E7E5DF"
  accent: "#BD4B2A"
  good: "#2F7D4F"
  warn: "#9A5B00"
  bad: "#B42318"
  peach: "#FFE8DD"
  butter: "#FFF3C9"
  mint: "#E1F3E7"
  sky: "#E2EEFA"
  blush: "#FCE4EC"
  kids-cream: "#FFF8EC"
  kids-ink: "#3B1F5C"
  kids-bubblegum: "#FF6FAE"
  kids-grape: "#9B5CF6"
  kids-sunny: "#FFD23F"
  kids-sky: "#4CC9F0"
  kids-mint: "#3DDC97"
  kids-peach: "#FFB38A"
typography:
  display:
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 4rem)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  title:
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  caption:
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.01em"
  tabular:
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "normal"
rounded:
  sm: "6px"
  md: "10px"
  lg: "12px"
  xl: "16px"
  bubble: "22px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "12px 20px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
  card-standard:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "20px"
---

# RUXs Design System & UI Rules

## Overview

RUXs visual direction is **a calm Indian kitchen notebook made premium**:
- Lots of warm white space (`--bg: #FAFAF7`), preventing cognitive fatigue.
- One confident terracotta/coral accent (`--accent: #BD4B2A`), carrying a 5.2:1 contrast ratio against white.
- Clear typographic hierarchy anchored in Geist Sans, with strict tabular numerals for counts, currency, and times.
- Clean vector geometry and authored linework for illustrations; no generic AI slop, no purple-to-blue gradients, no uncalibrated shadows, and no nested cards.
- The interface distinguishes sharply between four surfaces:
  1. **Persuade (Marketing)**: Editorial, generous spacing, authentic neighborhood proof.
  2. **Operate (Merchant Panel & Admin)**: High-density, scanable, big tabular numbers, thumb-first mobile run sheets.
  3. **Operate (Household Web App `/app`)**: Clear one-store cart, simple calendar skip/extra toggles, no native app barriers.
  4. **Experience (Kids Zone)**: Playful candy accents on warm dotted paper, animated micro-interactions, distinct guardian-presence and safety badges.

---

## Colors

### Core Semantic Tokens (Platform-Wide)

| Token | Hex | Role & Usage |
|---|---|---|
| `bg` | `#FAFAF7` | Page background canvas (warm ivory notebook) |
| `surface` | `#FFFFFF` | Cards, active tabs, floating sheets, inputs |
| `ink` | `#1C1B19` | High-contrast primary copy, dark vector strokes |
| `muted` | `#6B6862` | Secondary labels, descriptions, timestamps (meets WCAG AA) |
| `line` | `#E7E5DF` | Hairline dividers and structural borders (1px) |
| `accent` | `#BD4B2A` | Confident coral: primary actions, active indicators, focal links |
| `good` | `#2F7D4F` | Delivered deliveries, confirmed orders, verified badges |
| `warn` | `#9A5B00` | Cutoff approaching (<30m), pending review, filling fast |
| `bad` | `#B42318` | Late skips, failed deliveries, overdue balance |

### Marketing-Only Pastel Tints
Pastels are strictly background tints or vector illustration fills on public marketing surfaces. **Never use pastels for body copy or inside merchant kitchen tools.**
- `peach`: `#FFE8DD` (Hero aura, meal plan highlights)
- `butter`: `#FFF3C9` (Value callouts, merchant benefit callouts)
- `mint`: `#E1F3E7` (Delivery proof, zero-commission banners)
- `sky`: `#E2EEFA` (Water supply & purity badges)
- `blush`: `#FCE4EC` (Family & creative craft highlights)

### Kids Zone Specialty Palette
Used strictly within `/app/kids` and the Kids mode switch to signal a dedicated, safe space for children:
`kids-cream` (`#FFF8EC`), `kids-ink` (`#3B1F5C`), `kids-bubblegum` (`#FF6FAE`), `kids-grape` (`#9B5CF6`), `kids-sunny` (`#FFD23F`), `kids-sky` (`#4CC9F0`), `kids-mint` (`#3DDC97`), `kids-peach` (`#FFB38A`).

---

## Typography

- **Primary Typeface**: Geist Sans (`font-sans`), loaded locally with zero layout shift.
- **Tabular Figures (`tabular-nums`)**: Mandatory on all countdowns, kitchen order counts, dates, and rupee sums (`Intl.NumberFormat("en-IN")`).
- **Scale & Measure**:
  - Hero Display: `clamp(2.25rem, 5vw, 4rem)`, line-height `1.08`, tracking `-0.025em`.
  - Section Headings: `1.75rem` to `2.25rem`, tracking `-0.02em`.
  - Body Copy: `1rem` (16px), line-height `1.6`, maximum line length `65–75ch`. Form inputs are **never below 16px** to prevent mobile browser zoom.
  - Controls & Badges: `0.8125rem` (13px) to `0.875rem` (14px), font-weight `600`.
  - Kitchen Cook Number: `3rem` (48px) tabular figures, readable from 10 feet in a busy kitchen.

---

## Layout

- **Base Rhythm**: 4px base grid (`4`, `8`, `12`, `16`, `24`, `32`, `48`, `64`, `96`).
- **Vertical Spacing**: Generous separation between sections; always ensure more space above a heading than below it to cement grouping.
- **Max Widths**:
  - Marketing narrative: `max-w-6xl` (1152px).
  - Editorial copy: `max-w-2xl` to `max-w-3xl` for optimal reading measure.
  - Mobile Operate Views: Tested and optimized thumb-first at 360px viewport width. Critical daily taps sit in the bottom 40% of the screen.

---

## Elevation & Depth

- **Declare Elevation Once**: A card uses either a crisp 1px hairline border (`border border-line`) OR a soft ambient shadow (`shadow-[0_8px_24px_-12px_rgba(28,27,25,0.08)]`), never heavy "ghost card" combinations.
- **No Zero-Blur Hard Shadows**: Banned outside playful kids badges. Standard UI relies on subtle tonal contrast and hairline containment.
- **Surface Layering**:
  - Level 0: Canvas background (`--bg: #FAFAF7`)
  - Level 1: Standard cards and sheets (`--surface: #FFFFFF` + `border-line`)
  - Level 2: Interactive dropdowns, popovers, and sticky summary bars
  - Level 3: Modal dialogs with soft backdrop overlay (`bg-black/35 backdrop-blur-[2px]`)

---

## Shapes

- **Controls & Inputs**: `rounded-[10px]` (`--radius-control`). Clean, modern, tactile.
- **Cards & Containers**: `rounded-[12px]` to `rounded-[16px]` (`--radius-card`).
- **Pills & Status Chips**: `rounded-full`. Reserved for small status badges, quantity indicators, and avatars.
- **Kids Mode Cards**: `rounded-[22px]` to `rounded-[26px]` for a soft, friendly, child-safe toy feel.

---

## Components

### Buttons
- **Primary**: Solid terracotta (`bg-accent text-white`), hover `opacity-95`, active `scale-[0.98]`.
- **Secondary**: Crisp outlined (`border border-line bg-white text-ink hover:bg-bg`).
- **Ghost**: Pure text with accent hover (`text-muted hover:text-ink`).
- **Touch Target**: Minimum 48px × 48px on mobile devices.

### Status Pills
- Always pair status colors with readable text (e.g. `Delivered` + green dot, `Due Today` + amber dot). Never rely on color alone.

### Interactive Micro-Interactions
- Authored SVG icons with hover keyframes (`src/components/ui/animate-icons.tsx`) for the Kids Zone.
- Pure CSS transitions: 150ms to 200ms ease-out. Respects `prefers-reduced-motion`.

---

## Do's and Don'ts

### Do
- Do use tabular numbers (`tabular-nums`) for every currency figure, kitchen counter, and delivery timestamp.
- Do keep body line measure between 65ch and 75ch for effortless reading.
- Do let headings speak on their own merits with clear weight and scale.
- Do theme browser native surfaces: selection (`::selection`), caret color, and custom focus rings.
- Do maintain strict separation between in-home service verification (mandatory guardian presence) and physical goods.

### Don't
- Don't put kickers or eyebrows above headings. Delete the label and let the heading carry its weight.
- Don't use purple-to-blue gradient text or shiny glowing borders.
- Don't build repetitive grids of identical small cards (icon + title + description) as lazy page scaffolding.
- Don't use raw floating-point numbers for money; all prices are stored and computed in integer paise.
- Don't leak household phone numbers to drivers or vendors (DPDP Act 2023 compliance).
