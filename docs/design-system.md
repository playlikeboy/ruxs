# RUXS Central Design System & Modular UI Architecture

RUXS uses a unified, modular design system inspired by state-of-the-art food delivery and domestic routine applications. It pairs the high-contrast operational dark aesthetic with vibrant emerald delivery greens, tactile pill controls, and real-time society geofencing.

## 1. Principles

- **Tactile & Responsive**: High-touch controls with tactile feedback (`[- 1 +]` steppers, pill buttons, floating docks).
- **Operational Clarity**: Every cutoff, delivery window, and society boundary is immediately transparent.
- **Geofenced Precision**: Real-time GPS and society boundary calculation gives residents immediate confirmation of autopilot delivery eligibility and $0 delivery fees.
- **Modular Component Hierarchy**: Built from atomic primitives (`DSButton`, `DSBadge`, `DSQuantityStepper`) composed into full-flow modular views.

## 2. Core Primitives (`src/design-system/`)

Exported from `@/src/design-system`:

| Component | Description | Reference Design Mapping |
| --- | --- | --- |
| `DSButton` | Full-pill buttons with primary emerald, secondary glass, outline, and loading states | Checkout button, CTA banners, action buttons |
| `DSBadge` | Micro-pills for calories (🔥), delivery time (⏱), status, and discounts | Flame calories badge, 20-min arrival tag |
| `DSRatingPill` | Yellow star rating badge with review counter | Merchant rating badge (`★ 4.8 (2.2k)`) |
| `DSQuantityStepper` | Tactile `[- 1 +]` pill stepper with micro-tap animations | Cart drawer and product detail steppers |
| `DSSearchBar` | Animated placeholder search bar with filter trigger | Home discovery search input |
| `DSCategoryPill` | Squircle icon tiles with active green halo | Category selection (Fast Food, Milk, Water, etc.) |
| `DSBottomNav` | Floating rounded-full pill dock with active indicator and cart badge | Persistent mobile/desktop navigation dock |
| `DSCard` | Rounded-3xl containers with glassmorphism, borders, and hover elevation | Product cards, vendor cards, hero banners |
| `DSBottomSheet` | Responsive slide-up sheet on mobile, centered modal on desktop | Customization modal, cart drawer, notifications |
| `DSTimelineStepper` | 4-step vertical delivery tracking path with green checkmarks | Live order tracking view |

## 3. Modular Customer Application Architecture (`src/modules/customer-ui/`)

The customer experience is organized into scalable, decoupled modules:

- `types.ts`: Strongly-typed contracts for catalog products, add-ons, cart items, geofence zones, tracking orders, and notifications.
- `mock-data.ts`: Multi-vertical catalog covering Fast Food, A2 Desi Cow Milk, 20L Water Cans, Homestyle Tiffin, Mandi Puja Flowers, Pet Care, and Steam Laundry.
- `context/CustomerUIContext.tsx`: Unified React state for cart calculations, geofence status, active tab, customization modals, and notifications.
- **Views**:
  - `DiscoveryView`: Header with greeting, geofence status pill, search, category chips, hero offer banner, 2-column Best Sellers grid, and nearby society partners.
  - `ProductDetailModal`: Large circular hero image with realistic drop shadow, size/cadence selector, add-on ingredients checklist with emerald checkboxes, stepper, and action CTA.
  - `CartDrawer`: Cart item list, steppers, promo code validation, geofenced free delivery calculation, and sticky checkout.
  - `TrackingView`: Simulated road map route canvas, moving courier bike pin, delivery banner, driver profile card (Call/Chat), and order progress stepper.
  - `NotificationsModal`: Live order confirmations, cutoff warnings, and promotional updates.
  - `ServicesGridView`: "Hire a Local Pro Today" 2x4 service category grid.
  - `GeofenceModal`: Radar pulse view with real-time society switcher and GPS accuracy diagnostics.

## 4. Routing & Geofencing URLs

- **Primary Customer App**: `https://ruxs.in/app` (hosted via Server Component at `app/(portal)/app/page.tsx`).
- **Legacy Route**: `https://ruxs.in/customer/dashboard` permanently redirects to `https://ruxs.in/app`.
- **Geofence Integration**: Real-time distance calculation determines inside/outside society boundary status, enabling 100% Autopilot Doorstep Delivery and waiving delivery fees.
