import type { VendorType } from "@/core/vendor-types";

/*
 * The type-specific fields each vendor type fills in. One list drives both the
 * merchant form (components/type-fields.tsx) and the server validation
 * (schemas.ts), so the two can't drift. Keys are the Drizzle column names of the
 * matching table in db/schema/vendor-types.ts (or kids.ts for kids academies).
 */

export interface Option {
  value: string;
  label: string;
}

export type Field =
  | { key: string; label: string; kind: "text"; placeholder?: string; max?: number; hint?: string }
  | { key: string; label: string; kind: "textarea"; placeholder?: string; max?: number; hint?: string }
  | { key: string; label: string; kind: "number"; min: number; max: number; required?: boolean; suffix?: string; hint?: string }
  | { key: string; label: string; kind: "rupees"; max: number; required?: boolean; hint?: string }
  | { key: string; label: string; kind: "bool"; hint?: string }
  | { key: string; label: string; kind: "select"; options: Option[]; hint?: string }
  | { key: string; label: string; kind: "multi"; options: Option[]; hint?: string }
  | { key: string; label: string; kind: "tags"; placeholder?: string; hint?: string }
  | { key: string; label: string; kind: "time"; required?: boolean; hint?: string };

export type FieldValue = string | number | boolean | string[] | null;
export type FieldValues = Record<string, FieldValue>;

const opts = (...pairs: [string, string][]): Option[] => pairs.map(([value, label]) => ({ value, label }));

const WEEKDAYS = opts(["mon", "Mon"], ["tue", "Tue"], ["wed", "Wed"], ["thu", "Thu"], ["fri", "Fri"], ["sat", "Sat"], ["sun", "Sun"]);
const GENDER = opts(["female", "Female"], ["male", "Male"], ["other", "Other"]);
const LANGUAGES: Field = { key: "languages", label: "Languages you speak", kind: "tags", placeholder: "Hindi, English" };

export const PROFILE_FIELDS: Record<VendorType, Field[]> = {
  tiffin: [
    { key: "diet", label: "Kitchen type", kind: "select", options: opts(["veg", "Pure veg"], ["jain", "Jain"], ["egg", "Veg + egg"], ["non_veg", "Non-veg"], ["mixed", "Veg & non-veg"]) },
    { key: "cuisines", label: "Cuisines", kind: "tags", placeholder: "North Indian, Bihari, South Indian" },
    { key: "mealSlots", label: "Meals you serve", kind: "multi", options: opts(["breakfast", "Breakfast"], ["lunch", "Lunch"], ["dinner", "Dinner"], ["snacks", "Evening snacks"]) },
    { key: "weeklyOff", label: "Weekly off", kind: "multi", options: WEEKDAYS, hint: "Days the kitchen is closed" },
    { key: "trialMealPaise", label: "Trial meal price", kind: "rupees", max: 1000, hint: "Leave empty if you don't offer a trial" },
    { key: "dabbaType", label: "Packed in", kind: "select", options: opts(["steel", "Steel dabba (returnable)"], ["disposable", "Disposable box"], ["eco", "Eco-friendly box"]) },
    { key: "fssaiNumber", label: "FSSAI licence number", kind: "text", max: 20, placeholder: "14-digit number" },
  ],
  water: [
    { key: "waterSource", label: "Water type", kind: "select", options: opts(["ro", "RO purified"], ["mineral", "Packaged mineral"], ["spring", "Natural spring"], ["alkaline", "Alkaline"]) },
    { key: "brands", label: "Brands you supply", kind: "tags", placeholder: "Bisleri, Kinley, own brand" },
    { key: "tdsPpm", label: "TDS", kind: "number", min: 0, max: 2000, suffix: "ppm" },
    { key: "bisLicense", label: "BIS / ISI licence", kind: "text", max: 40 },
    { key: "upperFloorDelivery", label: "Carry cans to upper floors", kind: "bool" },
    { key: "sameDayDelivery", label: "Same-day delivery for one-time orders", kind: "bool" },
  ],
  milk: [
    { key: "source", label: "Milk source", kind: "select", options: opts(["own_farm", "Own farm / gaushala"], ["cooperative", "Cooperative"], ["brand", "Branded dairy"], ["collection_centre", "Collection centre"]) },
    { key: "animals", label: "Milk from", kind: "multi", options: opts(["cow", "Cow"], ["a2_cow", "A2 desi cow"], ["buffalo", "Buffalo"], ["goat", "Goat"]) },
    { key: "packaging", label: "Usual packaging", kind: "select", options: opts(["pouch", "Pouch"], ["glass_bottle", "Glass bottle"], ["can", "Can"], ["loose", "Loose (household vessel)"]) },
    { key: "morningDeliveryBy", label: "Morning delivery by", kind: "time", required: true },
    { key: "eveningDelivery", label: "Also deliver in the evening", kind: "bool" },
    { key: "fssaiNumber", label: "FSSAI licence number", kind: "text", max: 20 },
  ],
  gifts: [
    { key: "occasions", label: "Occasions", kind: "tags", placeholder: "Birthday, Anniversary, Diwali" },
    { key: "customisation", label: "Takes custom / personalised orders", kind: "bool" },
    { key: "minLeadDays", label: "Days needed before delivery", kind: "number", min: 0, max: 60, required: true, suffix: "days" },
    { key: "giftWrapPaise", label: "Gift-wrap charge", kind: "rupees", max: 1000, required: true },
    { key: "shipsOutsideCity", label: "Ships outside the city", kind: "bool" },
  ],
  store: [
    { key: "storeKind", label: "Store type", kind: "select", options: opts(["general", "General store"], ["grocery", "Grocery"], ["stationery", "Stationery"], ["kids_kits", "Kids kits & toys"], ["pharmacy", "Pharmacy"], ["other", "Other"]) },
    { key: "gstin", label: "GSTIN", kind: "text", max: 15 },
    { key: "opensAt", label: "Opens at", kind: "time" },
    { key: "closesAt", label: "Closes at", kind: "time" },
  ],
  fitness: [
    { key: "headline", label: "Headline", kind: "text", max: 120, placeholder: "Certified trainer · weight loss & strength" },
    { key: "certifications", label: "Certifications", kind: "text", max: 200, placeholder: "ACE, K11, ISSA" },
    { key: "experienceYears", label: "Experience", kind: "number", min: 0, max: 60, suffix: "years" },
    { key: "specialities", label: "Specialities", kind: "tags", placeholder: "Weight loss, Strength, Yoga" },
    LANGUAGES,
    { key: "gender", label: "Gender", kind: "select", options: GENDER, hint: "Some clients prefer a trainer of a specific gender" },
    { key: "gymName", label: "Gym / studio name", kind: "text", max: 80 },
    { key: "gymAddress", label: "Gym / studio address", kind: "textarea", max: 300 },
    { key: "womenOnlySlots", label: "Offers women-only slots", kind: "bool" },
  ],
  physio: [
    { key: "headline", label: "Headline", kind: "text", max: 120, placeholder: "Orthopaedic physiotherapist · home visits" },
    { key: "qualifications", label: "Qualifications", kind: "text", max: 200, placeholder: "BPT, MPT (Ortho)" },
    { key: "registrationNumber", label: "Council / IAP registration no.", kind: "text", max: 40, hint: "Shown as verified once admin checks it" },
    { key: "experienceYears", label: "Experience", kind: "number", min: 0, max: 60, suffix: "years" },
    { key: "specialities", label: "Specialities", kind: "tags", placeholder: "Ortho, Neuro, Sports" },
    { key: "conditionsTreated", label: "Conditions you treat", kind: "tags", placeholder: "Back pain, Knee pain, Frozen shoulder" },
    LANGUAGES,
    { key: "gender", label: "Gender", kind: "select", options: GENDER },
    { key: "clinicName", label: "Clinic name", kind: "text", max: 80 },
    { key: "clinicAddress", label: "Clinic address", kind: "textarea", max: 300 },
    { key: "homeVisits", label: "Does home visits", kind: "bool" },
    { key: "homeVisitFeePaise", label: "Home-visit fee", kind: "rupees", max: 5000, required: true },
  ],
  mehndi: [
    { key: "headline", label: "Headline", kind: "text", max: 120, placeholder: "Bridal & festive mehndi artist" },
    { key: "experienceYears", label: "Experience", kind: "number", min: 0, max: 60, suffix: "years" },
    { key: "styles", label: "Styles", kind: "tags", placeholder: "Bridal, Arabic, Rajasthani" },
    LANGUAGES,
    { key: "gender", label: "Gender", kind: "select", options: GENDER },
    { key: "organicHenna", label: "Uses organic henna only", kind: "bool" },
    { key: "teamSize", label: "Artists in your team", kind: "number", min: 1, max: 50, required: true, suffix: "artists" },
    { key: "travelFeePaise", label: "Travel fee for home visits", kind: "rupees", max: 5000, required: true },
    { key: "bridalAdvanceDays", label: "Book bridal this many days ahead", kind: "number", min: 0, max: 180, required: true, suffix: "days" },
    { key: "portfolioUrl", label: "Portfolio link (Instagram etc.)", kind: "text", max: 300, placeholder: "https://" },
  ],
  kids: [
    { key: "headline", label: "Headline", kind: "text", max: 120, placeholder: "LEGO robotics & coding for ages 6–14" },
    { key: "qualifications", label: "Qualifications", kind: "text", max: 200, placeholder: "B.Ed, certified STEM educator" },
    { key: "experienceYears", label: "Experience", kind: "number", min: 0, max: 60, required: true, suffix: "years" },
    { key: "specialties", label: "What you teach", kind: "tags", placeholder: "Robotics, Chess, Clay art" },
    LANGUAGES,
    { key: "ageGroupsServed", label: "Age groups", kind: "multi", options: opts(["3-5", "3–5 yrs"], ["6-8", "6–8 yrs"], ["9-12", "9–12 yrs"], ["13-16", "13–16 yrs"]) },
  ],
};

/** Per-item fields. Store and kids items need none beyond the shared catalogue. */
export const ITEM_FIELDS: Partial<Record<VendorType, Field[]>> = {
  tiffin: [
    { key: "mealType", label: "Meal", kind: "select", options: opts(["breakfast", "Breakfast"], ["lunch", "Lunch"], ["dinner", "Dinner"], ["snacks", "Snacks"]) },
    { key: "diet", label: "Diet", kind: "select", options: opts(["veg", "Veg"], ["jain", "Jain"], ["egg", "Egg"], ["non_veg", "Non-veg"]) },
    { key: "itemsIncluded", label: "What's in the dabba", kind: "text", max: 200, placeholder: "4 roti, dal, sabzi, rice, salad" },
    { key: "cuisine", label: "Cuisine", kind: "text", max: 40 },
    { key: "spiceLevel", label: "Spice", kind: "select", options: opts(["mild", "Mild"], ["medium", "Medium"], ["spicy", "Spicy"]) },
    { key: "calories", label: "Calories", kind: "number", min: 0, max: 5000, suffix: "kcal" },
  ],
  water: [
    { key: "volumeMl", label: "Volume", kind: "number", min: 100, max: 50000, required: true, suffix: "ml" },
    { key: "packSize", label: "Units per order", kind: "number", min: 1, max: 100, required: true, suffix: "per pack" },
    { key: "container", label: "Container", kind: "select", options: opts(["can", "Can"], ["jar", "Jar"], ["bottle_pack", "Bottle pack"], ["dispenser", "Dispenser"]) },
    { key: "returnable", label: "Returnable (collect empties)", kind: "bool" },
    { key: "chilled", label: "Chilled", kind: "bool" },
    { key: "brand", label: "Brand", kind: "text", max: 40 },
  ],
  milk: [
    { key: "itemType", label: "Item", kind: "select", options: opts(["milk", "Milk"], ["curd", "Curd / dahi"], ["paneer", "Paneer"], ["ghee", "Ghee"], ["butter", "Butter"], ["buttermilk", "Buttermilk"], ["other", "Other"]) },
    { key: "animal", label: "From", kind: "select", options: opts(["", "—"], ["cow", "Cow"], ["a2_cow", "A2 desi cow"], ["buffalo", "Buffalo"], ["goat", "Goat"], ["mixed", "Mixed"]) },
    { key: "quantity", label: "Quantity", kind: "number", min: 1, max: 100000 },
    { key: "unit", label: "Unit", kind: "select", options: opts(["ml", "ml"], ["l", "litre"], ["g", "g"], ["kg", "kg"], ["pcs", "pieces"]) },
    { key: "fatPercentX10", label: "Fat (×10, e.g. 45 = 4.5%)", kind: "number", min: 0, max: 1000 },
    { key: "packaging", label: "Packaging", kind: "select", options: opts(["pouch", "Pouch"], ["glass_bottle", "Glass bottle"], ["can", "Can"], ["loose", "Loose"], ["cup", "Cup"], ["jar", "Jar"]) },
  ],
  gifts: [
    { key: "occasion", label: "Occasion", kind: "text", max: 40, placeholder: "Birthday" },
    { key: "customisable", label: "Can be personalised", kind: "bool" },
    { key: "personalisationHint", label: "What buyers can personalise", kind: "text", max: 120, placeholder: "Name and date, up to 20 letters" },
    { key: "leadDays", label: "Days to make", kind: "number", min: 0, max: 60, required: true, suffix: "days" },
    { key: "giftWrap", label: "Gift wrap included", kind: "bool" },
  ],
  fitness: [
    { key: "packageType", label: "Plan type", kind: "select", options: opts(["trial", "Trial"], ["single", "Single session"], ["pack", "Session pack"], ["monthly", "Monthly"]) },
    { key: "sessionsIncluded", label: "Sessions included", kind: "number", min: 1, max: 100, required: true, suffix: "sessions" },
    { key: "validityDays", label: "Valid for", kind: "number", min: 1, max: 365, suffix: "days" },
    { key: "level", label: "Level", kind: "select", options: opts(["all", "All levels"], ["beginner", "Beginner"], ["intermediate", "Intermediate"], ["advanced", "Advanced"]) },
    { key: "focus", label: "Focus", kind: "text", max: 60, placeholder: "Fat loss, mobility" },
  ],
  physio: [
    { key: "treatmentType", label: "Type", kind: "select", options: opts(["assessment", "Assessment"], ["session", "Treatment session"], ["package", "Package"], ["consultation", "Consultation"]) },
    { key: "conditions", label: "Conditions", kind: "tags", placeholder: "Back pain, Sciatica" },
    { key: "sessionsIncluded", label: "Sessions included", kind: "number", min: 1, max: 100, required: true, suffix: "sessions" },
    { key: "equipment", label: "Equipment used", kind: "text", max: 120, placeholder: "TENS, ultrasound, IFT" },
    { key: "requiresPrescription", label: "Needs a doctor's prescription", kind: "bool" },
  ],
  mehndi: [
    { key: "style", label: "Style", kind: "select", options: opts(["bridal", "Bridal"], ["arabic", "Arabic"], ["rajasthani", "Rajasthani"], ["indo_western", "Indo-western"], ["minimal", "Minimal"], ["kids", "Kids"], ["other", "Other"]) },
    { key: "coverage", label: "Coverage", kind: "select", options: opts(["per_hand", "Per hand"], ["both_hands", "Both hands"], ["hands_and_feet", "Hands & feet"], ["full_bridal", "Full bridal"]) },
    { key: "peopleIncluded", label: "People included", kind: "number", min: 1, max: 50, required: true, suffix: "people" },
    { key: "organic", label: "Organic henna", kind: "bool" },
  ],
};

/** Short human chips for a stored row, shown to households on store pages. */
export function chipsFor(fields: Field[], row: Record<string, unknown> | null | undefined): string[] {
  if (!row) return [];
  const chips: string[] = [];
  for (const f of fields) {
    const v = row[f.key];
    if (v == null || v === "" || (Array.isArray(v) && v.length === 0)) continue;
    if (f.kind === "select") {
      const label = f.options.find((o) => o.value === v)?.label;
      if (label && label !== "—") chips.push(label);
    } else if (f.kind === "bool") {
      if (v === true) chips.push(f.label);
    } else if (f.kind === "number" && typeof v === "number") {
      if (f.key === "volumeMl") chips.push(v >= 1000 ? `${v / 1000} L` : `${v} ml`);
      else if (f.key !== "fatPercentX10" && f.key !== "quantity") chips.push(`${v}${f.suffix ? " " + f.suffix : ""}`);
    } else if (f.kind === "text" && typeof v === "string" && f.key !== "personalisationHint" && !/^https?:/.test(v)) {
      chips.push(v);
    }
  }
  return chips.slice(0, 5);
}
