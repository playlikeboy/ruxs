# RUXS Design System Specification (DESIGN.md)

> **Version**: 1.0.0  
> **Status**: Production Reference  
> **Design Direction**: Warm Ivory & Blush-Pink Interface with Airbnb Design Language System (DLS) clarity, restraint, and cute pastel accents.  
> **Architecture**: Next.js 16 App Router, Vinext on Cloudflare Workers, Tailwind CSS v4 CSS-first theme configuration, Neon PostgreSQL, Zero floating-point currency calculations (strict integer Paise).

---

## 1. Design Vision and Principles

RUXS provides the quiet operating layer for recurring daily services in apartment societies across India (fresh A2 cow milk, 20L water cans, homestyle tiffins, morning puja flowers, dog walking, steam laundry passes, and transparent digital Khata).

The design system is guided by four core principles adapted from Airbnb's Design Language System (DLS) and the warm, friendly visual reference:

1. **Unified & Consistent**: Every UI element is part of a single coherent system. No isolated one-offs or arbitrary CSS overrides.
2. **Warm, Approachable & Cute with Restraint**: A warm ivory interface surrounded by soft blush-pink surfaces, balanced coral accents, deep warm-brown typography, generous whitespace, rounded shapes, and occasional cute hand-drawn pastel illustrations and micro-details.
3. **Conversational & High-Trust**: High-contrast, legible typography, visible society gate-pass clearances, transparent ledger calculations, and zero floating-point discrepancies build unwavering household confidence.
4. **Lightweight & High-Performance**: Server Components by default (`page.tsx`), small client interactive islands (`XxxClient.tsx`), Tailwind v4 CSS-first tokens, and edge streaming on Cloudflare Workers.

---

## 2. Visual Reference Interpretation

The interface combines Airbnb's discovery clarity with a warm, cute domestic personality:
- **Ivory Canvas**: A soothing, warm ivory background (`#FFF8ED`) replaces sterile white or clinical dark SaaS templates.
- **Blush-Pink Aura**: Delicate blush-pink canvas and gradient halos (`#FEC7BE` / `#FFC9C4`) soften section transitions and modals.
- **Accessible Action Coral**: High-contrast, WCAG AA compliant terracotta coral (`#BD4B2A` and `#A84224`) for primary buttons and critical action triggers, with bright decorative coral (`#FF804E`) for badges, rating stars, and playful accents.
- **Deep Warm-Brown Typography**: Ink colors (`#5A554B` and `#746E63`) offer high contrast without the harshness of pure black.
- **Pastel Touches**: Soft blue (`#C4DFEF`), yellow (`#FFE59C`), and pink (`#F2A4A4`) for category badges, item illustrations, and friendly mascot details.

---

## 3. Color Palette with Hex Values and Intended Usage

| Color Token | Hex Value | Role & Usage |
| :--- | :--- | :--- |
| `--color-canvas` | `#FEC7BE` | Canvas background, blush outer borders, radial halo gradients |
| `--color-canvas-soft` | `#FFC9C4` | Soft blush container background, secondary accents |
| `--color-surface` | `#FFF8ED` | Main warm ivory page canvas (`--background`) |
| `--color-surface-raised`| `#FFFCF7` | Elevated cards, floating bottom navigation, modals, sheets (`--card`) |
| `--color-surface-band` | `#FFF2DF` | Alternate section background, category icon wells, input backgrounds |
| `--color-surface-subtle`| `#F9EFE2` | Subdued containers, stepper borders, hovered cards |
| `--color-ink` | `#5A554B` | Deep warm-brown primary text and high-contrast titles (`--foreground`) |
| `--color-ink-muted` | `#746E63` | Secondary text, subtitles, delivery windows, meta labels |
| `--color-ink-subtle` | `#9B958B` | Strikethrough prices, placeholder text, fine captions |
| `--color-coral` | `#FF804E` | Iconic decorative brand coral, search circles, top seller badges |
| `--color-action` | `#BD4B2A` | Accessible primary actions, checkout buttons, active nav tabs |
| `--color-action-hover` | `#A84224` | Primary button hover and active press state |
| `--color-cat-blue` | `#C4DFEF` | Pastel milk, water jar, and domestic service highlights |
| `--color-cat-yellow` | `#FFE59C` | Morning sun, breakfast tiffin, and rating star backgrounds |
| `--color-cat-pink` | `#F2A4A4` | Decorative hearts, flowers, and blush cheeks |
| `--color-cat-mint` | `#D5EED8` | Organic produce, green grass, and pet care badges |
| `--color-white` | `#FFFFFF` | Pure white badges, button text, icon fills |

---

## 4. Semantic Color Tokens

Tokens are centrally configured in `app/globals.css` and `src/design-system/tokens.ts`:

- **Page Background**: `var(--surface)` / `bg-surface` (`#FFF8ED`)
- **Card & Sheet Surface**: `var(--surface-raised)` / `bg-surface-raised` (`#FFFCF7`)
- **Interactive Action**: `var(--action)` / `bg-action` (`#BD4B2A`)
- **Action Hover**: `var(--action-hover)` / `hover:bg-action-hover` (`#A84224`)
- **Brand Accent**: `var(--coral)` / `text-coral` / `bg-coral` (`#FF804E`)
- **Border**: `var(--border)` (`rgba(90, 85, 75, 0.12)`)
- **Strong Border**: `var(--border-strong)` (`rgba(90, 85, 75, 0.22)`)
- **Feedback Success**: `#2E7D32` (text), `#E8F5E9` (pill background)
- **Feedback Warning**: `#B45309` (text), `#FEF3C7` (pill background)
- **Feedback Destructive**: `#C62828` (text), `#FFEBEE` (pill background)

---

## 5. Typography Families, Scale, Weights, and Line Heights

### Font Families
- **Display Headings**: `"Baloo 2", "Nunito Sans", ui-rounded, system-ui, sans-serif`
  - Friendly, rounded, expressive, confident. Used for titles, merchant headers, prices, and greetings.
- **Body & Controls**: `"Nunito Sans", "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
  - Highly readable, warm, neutral, legible at small font sizes on mobile.

### Scale & Hierarchy
- **Display**: `clamp(2rem, 5vw, 3.25rem)` / line-height `1.15` / font-weight `800`
- **H1**: `clamp(1.75rem, 4vw, 2.5rem)` / line-height `1.2` / font-weight `800`
- **H2**: `clamp(1.35rem, 3vw, 1.85rem)` / line-height `1.25` / font-weight `700`
- **H3**: `clamp(1.15rem, 2.5vw, 1.35rem)` / line-height `1.3` / font-weight `700`
- **Body Large**: `1.0625rem` (17px) / line-height `1.5` / font-weight `500`
- **Body Regular**: `0.9375rem` (15px) / line-height `1.5` / font-weight `400`
- **Body Small**: `0.8125rem` (13px) / line-height `1.45` / font-weight `500`
- **Caption / Metadata**: `0.6875rem` (11px) / line-height `1.3` / font-weight `600`

---

## 6. Spacing Scale

The spacing scale is built on 4px increments:
- `px1`: 4px
- `px2`: 8px
- `px3`: 12px
- `px4`: 16px
- `px5`: 20px
- `px6`: 24px
- `px8`: 32px
- `px10`: 40px
- `px12`: 48px
- `px16`: 64px
- `px20`: 80px

---

## 7. Content-Width and Layout Rules

- **Customer Mobile App Viewport**: `max-w-md` (mobile), `max-w-xl` (tablet), `max-w-3xl` (desktop discovery container).
- **Portal & Dashboard Maximum Width**: `1180px` (`.ds-container`).
- **Reading Width**: `680px` for policy documents, bills, and terms.
- **Page Horizontal Gutters**: 16px on mobile, 24px on tablet, 32px on desktop.
- **Safe Clearance**: All scrollable views include `pb-28` to `pb-32` clearance for floating navigation and action pills.

---

## 8. Responsive Breakpoints and Behavior

- `360px` (Compact mobile): 2-column compact grid, stacked search capsules, abbreviated tabs.
- `390px` (Modern mobile): Standard 2-column product grid, 5-tab floating pill bottom nav.
- `768px` (Tablet `md`): 3-column product grid, full horizontal category pills, side-by-side merchant card.
- `1024px` (Desktop `lg`): Split-pane layout (showcase + sticky options panel), persistent side navigation on desktop portals.
- `1440px` (Wide desktop): Centered maximum width container with balanced ivory gutters.

---

## 9. Border-Radius, Border, and Shadow Tokens

### Radii
- `rounded-sm`: `10px`
- `rounded-md`: `14px`
- `rounded-lg`: `18px`
- `rounded-xl`: `22px`
- `rounded-2xl`: `28px` (cards, dialogs, sheets)
- `rounded-full`: `9999px` (Airbnb pills, search capsule, buttons, badges)

### Shadows
- `shadow-card`: `0 4px 18px -2px rgba(90, 85, 75, 0.06), 0 2px 6px -1px rgba(90, 85, 75, 0.04)`
- `shadow-soft`: `0 10px 30px -4px rgba(90, 85, 75, 0.09), 0 4px 12px -2px rgba(90, 85, 75, 0.05)`
- `shadow-floating`: `0 18px 44px -6px rgba(90, 85, 75, 0.14), 0 6px 16px -2px rgba(90, 85, 75, 0.08)`
- `shadow-pill`: `0 8px 24px -4px rgba(189, 75, 42, 0.22), 0 3px 8px -2px rgba(189, 75, 42, 0.15)`

---

## 10. Motion and Interaction Principles

- Transition durations: `150ms` (hover/active), `250ms` (modals/sheets).
- Spring easing: `cubic-bezier(0.175, 0.885, 0.32, 1.275)` on button presses and active tabs.
- `prefers-reduced-motion`: Fully respected; animations and transitions reduce to zero duration for accessibility.

---

## 11. Accessibility and Contrast Requirements

- **Contrast Compliance**: Primary text `#5A554B` and action button `#BD4B2A` have high contrast (> 4.8:1) against the `#FFF8ED` ivory background, exceeding WCAG AA standards.
- **Focus Rings**: Standard visible outline `outline: 2px solid var(--ring); outline-offset: 3px;`.
- **Screen Reader Support**: All icons, icon-only buttons, and bottom nav links provide explicit `aria-label` and `sr-only` descriptions.
- **Keyboard Navigation**: Full tab ordering through search, category carousels, cards, steppers, and modals.

---

## 12. Component Inventory and Variants

### Primitives (`src/design-system/components/`)
1. **`DSButton`**: Variants: `primary`, `secondary`, `coral`, `pastel`, `outline`, `ghost`, `danger`. Sizes: `sm`, `md`, `lg`, `icon`.
2. **`DSCard`**: Variants: `default`, `elevated`, `glass`, `bordered`, `hero`, `blush`.
3. **`DSCategoryPill`**: Airbnb-style horizontal category tab with active indicator, pastel container, and count badge.
4. **`DSSearchBar`**: Airbnb-style floating search capsule with location, service query, and circular coral action.
5. **`DSBottomNav`**: Airbnb-style floating frosted glass pill with 5 tabs (`Discover`, `Services`, `Routines`, `Khata`, `Cart`) and coral cart counter.
6. **`DSQuantityStepper`**: Rounded pill stepper with plus/minus triggers and integer quantity display.
7. **`DSBottomSheet`**: Warm ivory sheet with 28px rounded top corners and backdrop blur.
8. **`DSTimelineStepper`**: Delivery tracking stepper with completed green checkmarks and active coral pulsating indicators.
9. **`DSRatingPill`**: Warm amber rating pill with gold star and review count.
10. **`DSBadge`**: Cute pastel badges (`cat-blue`, `cat-yellow`, `cat-pink`, `coral`, `success`, `warning`).

---

## 13. Page-Level Composition Rules

- **Header**: Top location selector (Society Hub + Flat number) + Notifications bell + User avatar linking to Digital Khata.
- **Greeting**: Warm personalized morning greeting with cute mascot or heart accent.
- **Search Capsule**: Floating pill directly below the greeting.
- **Category Carousel**: Horizontally scrollable category pills with cute pastel icon containers.
- **Featured Merchant**: Full-width high-aesthetic card with verified gate-pass badge and rating pill.
- **Listing Grid**: 2-column responsive grid of products with integer price formatting and 1-tap add (+) button.
- **Floating Cart Pill**: Fixed floating action pill above the bottom navigation when cart count > 0.

---

## 14. Illustration and Iconography Guidelines

- Cute vector SVGs live in `src/modules/customer-ui/svg-assets.tsx`.
- Hand-drawn character: `CuteCatMascotSvg` (variants: `happy`, `sleeping`, `curious`) with warm-brown ink outlines (`#5A554B`), soft blush cheeks (`#F2A4A4`), and pastel halos (`#FFE59C`).
- Decorative micro-accents: `CuteHeartSvg` placed beside greetings or favorite items.
- Domestic service icons: Milk pail, 20L water can, dabba tiffin, puja flower basket, dog walking leash, and steam iron pass.

---

## 15. CSS Architecture and Single Source of Truth

- **Framework**: Tailwind CSS v4 CSS-first theme configuration.
- **Theme Entry**: `app/globals.css` with `@theme inline` mapping tokens to utility classes (`bg-canvas`, `bg-surface`, `bg-action`, `text-ink`, `text-action`, etc.).
- **TypeScript Tokens**: `src/design-system/tokens.ts` exports `DS_TOKENS` and `RUXS_DESIGN_SYSTEM`.

---

## 16. Next.js-Specific Implementation Conventions

- **Server Component Invariant**: `page.tsx` must NEVER have `"use client"`. All pages export comprehensive SEO metadata, structured JSON-LD schemas, and dynamic server-side catalog data.
- **Client Components**: Interactive state belongs in dedicated `XxxClient.tsx` files.
- **Layout Boundaries**: Wrapped in `<Suspense fallback={null}>` to prevent client CSR bailout during page transitions.
- **Zero Floating-Point Bugs**: All currency stored and displayed in integer Paise via `formatINR(paise as Paise)`.

---

## 17. File Locations for Tokens and Components

```text
app/
  globals.css                           <- Central Tailwind v4 theme tokens
  layout.tsx                            <- Root layout with viewport themeColor #FFF8ED
  (portal)/
    app/
      page.tsx                          <- Server Component with SEO metadata
      AppClient.tsx                     <- Client Component wrapper
      CustomerAppShell.tsx              <- Shell with bottom nav, modals, and drawer
      layout.tsx                        <- Portal app layout
      location/LocationPageClient.tsx   <- Society switcher
      services/ServicesPageClient.tsx   <- Services listing
      cart/CartPageClient.tsx           <- Cart page
      khata/KhataPageClient.tsx         <- Digital Khata ledger
      tracking/TrackingPageClient.tsx   <- Live delivery tracking
      notifications/NotificationsPageClient.tsx <- Notification center
      search/SearchClient.tsx           <- Search page
      product/[id]/ProductDetailClient.tsx <- Product detail
      vendor/[id]/VendorDetailClient.tsx   <- Merchant profile

src/
  design-system/
    tokens.ts                           <- Central design tokens
    components/
      DSButton.tsx
      DSCard.tsx
      DSCategoryPill.tsx
      DSSearchBar.tsx
      DSBottomNav.tsx
      DSQuantityStepper.tsx
      DSBottomSheet.tsx
      DSTimelineStepper.tsx
      DSRatingPill.tsx
      DSBadge.tsx

  modules/customer-ui/
    components/
      DiscoveryView.tsx                 <- Main Airbnb-style home discovery
      CartDrawer.tsx                    <- Checkout drawer
      ProductDetailModal.tsx            <- 1-tap product modal
      GeofenceModal.tsx                 <- Society geofence modal
      NotificationsModal.tsx            <- Notification modal
      ServicesGridView.tsx              <- Category services grid
    svg-assets.tsx                      <- Cute mascot & domestic service SVGs
```

---

## 18. Instructions for Adding New Pages and Components

1. **New Route**:
   - Create `app/(portal)/app/your-route/page.tsx` as a Server Component.
   - Export `metadata: Metadata` with title, description, and canonical URL.
   - Create `YourRouteClient.tsx` with `"use client"` for interactivity.
2. **New Component**:
   - Use semantic Tailwind classes: `bg-surface-raised`, `text-ink`, `border-border`, `bg-action text-white`.
   - Never hardcode raw hex values or arbitrary CSS overrides.
   - Use `formatINR(amountPaise as Paise)` for all money values.

---

## 19. Anti-Patterns and Visual Inconsistencies to Avoid

- **No dark navy or pitch-black blocks**: Always use warm ivory (`#FFF8ED`) and raised surfaces (`#FFFCF7`).
- **No floating-point currency calculations**: Never do `price.toFixed(2)` or divide by 100 in math logic.
- **No "use client" on `page.tsx`**: Breaks server-side SEO metadata and OpenGraph rendering.
- **No excessive cartoons**: The cute motif is applied with restraint (hand-crafted micro-accents, pastel fills, warm outlines).
- **No glassmorphism on readable text**: Maintain solid ivory contrast beneath copy.

---

## 20. Validation and Regression-Testing Checklist

- [x] `bun run typecheck` passes with 0 TypeScript errors.
- [x] `bun test` passes across all test suites (FSM, Khata, WhatsApp, Isolation, Billing).
- [x] `bun run build` completes edge bundle without SSR/RSC bailout.
- [x] Responsive layout tested on 360px, 390px, 768px, 1024px, 1440px.
- [x] No horizontal scroll overflow at any viewport.
- [x] Focus rings clearly visible on all interactive controls.
- [x] Zero floating-point currency representation throughout UI.

---

## 21. Relevant Official Documentation References

- **Next.js 16 Release & Architecture**: [nextjs.org/blog/next-16](https://nextjs.org/blog/next-16)
- **Next.js App Router Layouts & Pages**: [nextjs.org/docs/app/getting-started/layouts-and-pages](https://nextjs.org/docs/app/getting-started/layouts-and-pages)
- **Next.js Server & Client Components**: [nextjs.org/docs/app/getting-started/server-and-client-components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- **Next.js CSS & Styling Guidance**: [nextjs.org/docs/app/getting-started/css](https://nextjs.org/docs/app/getting-started/css)
- **Next.js Metadata API**: [nextjs.org/docs/app/getting-started/metadata-and-og-images](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)
- **Tailwind CSS v4 Theme Variables**: [tailwindcss.com/docs/theme](https://tailwindcss.com/docs/theme)
- **Airbnb Design Language System (DLS)**: Airbnb Engineering & Design Language System principles (Unified, Universal, Iconic, Conversational).
