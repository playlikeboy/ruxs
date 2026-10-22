# RUXs Kids Feature Module

The `src/features/kids` module powers the Kids Marketplace, including tutoring, creative workshops, summer camps, and activity kits.

## Structure

```
src/features/kids/
├── components/
│   ├── kids-activity-card.tsx       # Class/tutor preview card with poster, video modal & age badge
│   ├── kids-kit-card.tsx            # DIY science & craft kit card connected to household cart
│   ├── kids-workshop-card.tsx       # Summer/holiday camp card with seat fill meter & booking CTA
│   ├── kids-safety-guarantee.tsx    # Safeguarding trust points with animated shield icon
│   ├── kids-sub-nav.tsx             # Animated category navigation bar
│   ├── booking-form.tsx             # Student registration and slot scheduling
│   └── pass-card.tsx                # Multi-session activity pass card
├── queries.ts                       # Server-only database queries (getKidsActivities, getKidsProviderBySlug)
├── actions.ts                       # Server actions for bookings and pass redemptions
└── types.ts                         # Domain TypeScript interfaces (KidsActivityItem, KidsKitItem, etc.)
```

## Fulfilment Integration
- Kits (`kids_products`) are physical products fulfilled via `src/features/consumer/components/cart-store.ts` and the unified delivery pipeline.
- Classes and Camps are booked via `kidsBookings` and `kidsPasses` using integer paise ledger records.
