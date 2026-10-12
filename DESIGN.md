# DESIGN.md — RUXS Design System & UI Rules

> Read this file before touching any style, layout, or visual component in RUXS.
> Sources: `docs/PRD.md` §12 and `PROMPT.md` §7.

---

## 1. Visual Direction & Feel

Think **a calm Indian kitchen notebook made premium**:
- Lots of warm white space.
- One confident coral accent (`--accent`).
- Soft rounded shapes (10px controls, 12px cards).
- Crisp type (Geist, tabular numbers for counts and currency).
- On the marketing site: a few friendly hand-drawn touches (a smiling steel tiffin dabba, a 20L can with a tiny face, a little delivery scooter) that make people smile once without getting in the way.
- **Premium comes from restraint, spacing, and typography**, not from gradients, glossy shadows, or complex visual effects.

---

## 2. Design Tokens

### 2.1 Core App Tokens (Used throughout the entire app)

| Token | Value | Semantic Use |
| --- | --- | --- |
| `--bg` | `#FAFAF7` | Page background (warm ivory) |
| `--surface` | `#FFFFFF` | Cards, bottom sheets, inputs |
| `--ink` | `#1C1B19` | Primary text and dark line art |
| `--muted` | `#6B6862` | Secondary text, captions, metadata |
| `--line` | `#E7E5DF` | Hairline borders and dividers (no heavy shadows) |
| `--accent` | `#BD4B2A` | RUXS coral: primary buttons, links, primary interactive focal point (~5:1 on white) |
| `--good` | `#2F7D4F` | Delivered orders, received payments, confirmed statuses |
| `--warn` | `#9A5B00` | Due soon, cutoff approaching (<30 min), pending review |
| `--bad` | `#B42318` | Failed deliveries, late skips, overdue invoices |

### 2.2 Marketing-Only Pastel Tints

> **Strict Rule:** Pastels are strictly for backgrounds and illustration fills on marketing pages (`(marketing)`).
> Never use pastels for text. Never use pastels inside `/app`, `/c`, or `/admin`.

| Token | Value | Allowed Use |
| --- | --- | --- |
| `--peach` | `#FFE8DD` | Hero halo, coral-adjacent callout sections |
| `--butter` | `#FFF3C9` | Highlight chips, "how it works" step dots, final CTA banner |
| `--mint` | `#E1F3E7` | "Delivered / Paid" illustrations, success callouts |
| `--sky` | `#E2EEFA` | Water supplier section accents |
| `--blush` | `#FCE4EC` | Small decorative blobs, FAQ section backdrop |

**Rules for Pastels:**
1. Accent coral (`--accent`) is the **only** saturated color on any screen.
2. At most **two** pastels per marketing section.
3. Text placed on pastel backgrounds is always `--ink`.
4. Contrast ratio must always meet WCAG 2.2 AA.

---

## 3. Typography & Spacing

- **Font Family:** Geist Sans (`font-sans`), tabular figures enabled for counts, dates, and currency.
- **Type Scale:**
  - `12px` (`text-xs`): timestamps, metadata, fine badges
  - `14px` (`text-sm`): secondary labels, table cells, hints
  - `16px` (`text-base`): default body copy and form inputs (inputs are **never below 16px** to prevent iOS safari auto-zoom)
  - `20px` (`text-xl`): card headers, section titles
  - `28px` (`text-2xl`): page titles, sheet headers
  - `48px` (`text-5xl`): `BigCount` kitchen numbers
- **Base Grid:** 4 px base units (`4`, `8`, `12`, `16`, `24`, `32`, `48`).
- **Border Radius:**
  - `10px` (`rounded-[10px]`): buttons, inputs, steppers, controls
  - `12px` (`rounded-[12px]`): cards, modals, sheets
  - Full round (`rounded-full`): status pills, avatar chips, counters
- **Motion:** 150ms ease-out transitions. Fully disabled or reduced when `prefers-reduced-motion` is active.

---

## 4. App Screen Rules (`/app`, `/c`, `/admin`)

1. **No illustrations, no pastels, no shadows** (except the floating bottom sheet).
2. **Big numbers with tabular figures:** The kitchen count is 48px tabular font so it can be read across a steamy kitchen.
3. **Currency formatting:** Indian numbering grouping (`₹1,23,450` / `₹90.50`) via `formatINR()` / `Intl.NumberFormat("en-IN")`. Never float numbers.
4. **Status in words and colour:** Always include the word label (e.g. "Delivered", "Late skip", "Paid") alongside the color pill. Never rely on color alone.
5. **Thumb-first mobile design:** Designed first at 360px viewport width. Critical actions sit in the bottom 40% of the viewport. Touch targets are minimum 48px × 48px.
6. **Bottom nav:** At most 4 items: `Today`, `Run`, `Customers`, `More`.
7. **The only cute touch in the app:** An `EmptyState` component may feature one small single-line doodle.

---

## 5. Marketing Illustrations (`(marketing)`)

- Hand-drawn inline SVGs with 1.5–2px strokes in `--ink` and soft pastel fills.
- Maximum ~6 illustrations on the entire landing page.
- All illustrations carry `aria-hidden="true"`. None appear above the primary H1 LCP element.
- No stock photos, no emojis used as interface icons, no auto-playing sliders or carousels.
