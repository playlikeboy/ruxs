# RUXs Kids Vendor Types & Architecture Specification

## Overview

RUXs Kids transitions from a single generic vendor type into **10 distinct, scalable, independently scheduled and fulfilled vendor types**. Each vendor type possesses its own schema isolation, custom profile attributes, specialized item tables, and custom verification rules.

---

## 1. The 10 Specialized Kids Vendor Types

| Vendor Type | Display Title | Fulfilment Model | Core Offerings | Distinct Schema Profile | Distinct Item Table |
|---|---|---|---|---|---|
| `kids_academics` | Academic & Learning | Booking (`services`) | Home tutors, phonics, abacus, exam revision | `kids_academics_profiles` | `kids_academics_items` |
| `kids_stem` | Science, STEM & Coding | Booking (`services`) | Robotics, electronics, block coding, science projects | `kids_stem_profiles` | `kids_stem_items` |
| `kids_performing_arts` | Dance, Music & Performing Arts | Booking (`services`) | Classical/western dance, vocal, keyboard, guitar, drama | `kids_performing_arts_profiles` | `kids_performing_arts_items` |
| `kids_arts_crafts` | Art, Craft & Creative | Booking (`services`) | Drawing, painting, pottery, origami, calligraphy | `kids_arts_crafts_profiles` | `kids_arts_crafts_items` |
| `kids_school_projects` | School Project & Competition | Booking (`services`) | Science working models, scrapbooks, fancy-dress styling | `kids_school_projects_profiles` | `kids_school_projects_items` |
| `kids_camps` | Holiday Camp & Workshop Organizers | Booking (`services`) | Summer/winter camps, STEM bootcamps, theatre intensives | `kids_camps_profiles` | `kids_camps_items` |
| `kids_sports_fitness` | Sports, Fitness & Mind Skills | Booking (`services`) | Chess, kids yoga, gymnastics, skating | `kids_sports_fitness_profiles` | `kids_sports_fitness_items` |
| `kids_life_skills` | Life Skills & Hobby | Booking (`services`) | No-fire cooking, dining etiquette, magic tricks, gardening | `kids_life_skills_profiles` | `kids_life_skills_items` |
| `kids_products` | Kids' Products & Materials | Delivery (`products`) | Art kits, science kits, educational toys, project supplies | `kids_products_profiles` | `kids_products_items` |
| `kids_institutions` | Institutions & Group Providers | Booking (`services`) | Preschools, daycare activity centers, dance academies | `kids_institutions_profiles` | `kids_institutions_items` |

---

## 2. Fulfilment & Tool Isolation

1. **Service Providers (`booking`)**:
   - Types: `kids_academics`, `kids_stem`, `kids_performing_arts`, `kids_arts_crafts`, `kids_school_projects`, `kids_camps`, `kids_sports_fitness`, `kids_life_skills`, `kids_institutions`.
   - Access: Merchant Panel **Calendar**, **Services**, and **Passes** tools (`src/core/vendor-types.ts`).
   - Consumer Booking: Trial session scheduling, multi-session passes, batch enrollments.
   
2. **Physical Goods Vendors (`delivery`)**:
   - Type: `kids_products`.
   - Access: Merchant Panel **Storefront Orders**, **Inventory**, and **Run Sheet** tools.
   - Consumer Checkout: Added to the universal household cart, same-day/next-day doorstep delivery, integer paise billing.

---

## 3. Database Architecture & Trigger Enforcements

Every type-specific table is protected by a PostgreSQL trigger generated in `0014_kids_vendor_types_and_media.sql`:

```sql
CREATE TRIGGER kids_stem_profiles_type_assert
  BEFORE INSERT OR UPDATE ON kids_stem_profiles
  FOR EACH ROW EXECUTE FUNCTION ruxs_assert_vendor_type('kids_stem');
```

This prevents database contamination:
- Attempting to insert a row for `vendorId` whose `vendor_type` is not `kids_stem` immediately raises an exception.
- All 10 profile tables and 10 item tables are individually safeguarded.

---

## 4. Media & Credentials Engine

- **ImgBB Integration**: Certificates, photo galleries, and card posters are uploaded using ImgBB API (`src/lib/imgbb.ts`).
- **YouTube Preview Videos**: Tutors, choreographers, and academies can add preview video URLs (`watch`, `youtu.be`, `shorts`, `embed`), which are automatically converted to privacy-enhanced embed players (`src/core/media.ts`).
- **Parent Card Posters**: Activities and DIY kits render custom poster art with fallback theme emojis.

---

## 5. Admin Panel Auto-Approval

Vendors created directly by platform administrators via `/admin/vendors/new` are **automatically set to `"active"` status**, bypassing manual review queues:

```typescript
// src/features/admin/actions.ts
const [inserted] = await db
  .insert(vendors)
  .values({
    ...
    status: "active", // Auto-approved for Admin creation
  })
```
