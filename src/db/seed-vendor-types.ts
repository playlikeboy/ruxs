/**
 * Sample data for the per-type tables (migration 0013) and a week of demo
 * bookings so the merchant calendar has something to show. Only touches the
 * clearly fake demo stores below; safe to re-run.
 *
 *   bun --env-file=.env src/db/seed-vendor-types.ts
 */
import crypto from "crypto";
import { and, eq, inArray } from "drizzle-orm";
import { scriptDb, scriptPool } from "./script-client";
import { bookings, customers, products, services, vendors } from "./schema";
import { toVendorType, type VendorType } from "../core/vendor-types";
import { addDaysIST, istDateTime, todayIST } from "../core/time";
import { writeItemDetails, writeTypeProfile } from "../features/vendor-types/tables";

type Values = Record<string, unknown>;

const PROFILES: Record<string, Values> = {
  "annapurna-tiffin": { diet: "veg", cuisines: ["South Indian", "North Indian"], mealSlots: ["lunch", "dinner"], weeklyOff: ["sun"], trialMealPaise: 6000, dabbaType: "steel", fssaiNumber: "11224999000123" },
  "dabbawala-powai": { diet: "mixed", cuisines: ["Maharashtrian", "Punjabi"], mealSlots: ["lunch", "dinner"], weeklyOff: [], trialMealPaise: 8000, dabbaType: "steel" },
  "dilli-rasoi": { diet: "veg", cuisines: ["Punjabi", "Delhi street"], mealSlots: ["breakfast", "lunch", "dinner"], weeklyOff: ["sun"], dabbaType: "eco" },
  "deccan-meals": { diet: "mixed", cuisines: ["Hyderabadi", "Andhra"], mealSlots: ["breakfast", "lunch", "dinner"], dabbaType: "disposable" },
  "puneri-bhojan": { diet: "veg", cuisines: ["Maharashtrian"], mealSlots: ["lunch", "dinner"], weeklyOff: ["sun"], dabbaType: "steel" },
  "maa-annapurna-rasoi-ranchi": { diet: "veg", cuisines: ["Bihari", "Jharkhandi"], mealSlots: ["lunch", "dinner"], weeklyOff: ["sun"], trialMealPaise: 5000, dabbaType: "steel" },
  "harmu-ghar-ka-khana": { diet: "veg", cuisines: ["North Indian"], mealSlots: ["lunch", "dinner"], dabbaType: "steel" },
  "doranda-tiffin-point": { diet: "mixed", cuisines: ["Bengali", "North Indian"], mealSlots: ["lunch", "dinner"], dabbaType: "disposable" },
  "neer-20l": { waterSource: "ro", brands: ["Neer"], tdsPpm: 80, upperFloorDelivery: true, sameDayDelivery: true },
  "sahyadri-water": { waterSource: "mineral", brands: ["Sahyadri"], tdsPpm: 120, bisLicense: "IS 14543 / CM/L-7700123" },
  "yamuna-pure": { waterSource: "ro", brands: ["Yamuna Pure"], tdsPpm: 90 },
  "subarnarekha-aqua-20l": { waterSource: "ro", brands: ["Subarnarekha Aqua"], tdsPpm: 70, sameDayDelivery: true },
  "neel-jal-water-ranchi": { waterSource: "mineral", brands: ["Bisleri", "Kinley"], tdsPpm: 110 },
  "gaushala-fresh-dairy": { source: "own_farm", animals: ["cow", "buffalo"], packaging: "glass_bottle", morningDeliveryBy: "06:45" },
  "gwala-fresh-dairy-ranchi": { source: "own_farm", animals: ["cow", "buffalo"], packaging: "pouch", morningDeliveryBy: "07:00", eveningDelivery: true },
  "craftyvibes-gifts-ranchi": { occasions: ["Birthday", "Anniversary", "Rakhi", "Diwali"], customisation: true, minLeadDays: 2, giftWrapPaise: 4900 },
  "morabadi-daily-needs": { storeKind: "grocery", opensAt: "07:00", closesAt: "21:30" },
  "wonderbox-kids-kits-ranchi": { storeKind: "kids_kits", opensAt: "10:00", closesAt: "20:00" },
  "fitwithankit-ranchi": { gymName: "Ankit Fitness Studio", gymAddress: "Lalpur Chowk, Ranchi", womenOnlySlots: false },
  "ironcore-gym-ranchi": { gymName: "IronCore Gym", gymAddress: "Harmu Housing Colony, Ranchi", womenOnlySlots: true },
  "dr-meera-physio-ranchi": { registrationNumber: "JH-PT-2017-0412", conditionsTreated: ["Back pain", "Knee replacement rehab", "Frozen shoulder", "Stroke rehab"], clinicName: "Meera Physio Care", clinicAddress: "Kanke Road, Ranchi", homeVisits: true, homeVisitFeePaise: 10000 },
  "kineto-physio-doranda": { registrationNumber: "JH-PT-2020-1187", conditionsTreated: ["ACL rehab", "Tennis elbow", "Posture"], clinicName: "Kineto Sports Rehab", clinicAddress: "Doranda, Ranchi", homeVisits: true, homeVisitFeePaise: 15000 },
  "shree-bridal-mehndi-ranchi": { organicHenna: true, teamSize: 4, travelFeePaise: 20000, bridalAdvanceDays: 14, portfolioUrl: "https://instagram.com/" },
  "robosparks-kids-stem-ranchi": { ageGroupsServed: ["6-8", "9-12", "13-16"] },
  "mindcraft-kids-chess-ranchi": { ageGroupsServed: ["6-8", "9-12", "13-16"] },
  "little-picassos-art-ranchi": { ageGroupsServed: ["3-5", "6-8", "9-12"] },
};

/** Per-item details guessed from the demo catalogue text. */
function itemValues(type: VendorType, name: string, description: string | null): Values | null {
  const text = `${name} ${description ?? ""}`.toLowerCase();
  switch (type) {
    case "tiffin":
      return {
        itemsIncluded: description?.slice(0, 200) ?? null,
        cuisine: /paratha|rajma|chole|kulch/.test(text) ? "Punjabi" : /dosa|idli|pesarattu/.test(text) ? "South Indian" : /litti|dhuska/.test(text) ? "Jharkhandi" : null,
        spiceLevel: /spicy|misal|chilli/.test(text) ? "spicy" : /diet|kids/.test(text) ? "mild" : "medium",
        calories: /diet/.test(text) ? 450 : /thali/.test(text) ? 750 : null,
      };
    case "fitness":
      return { level: /trial/.test(text) ? "beginner" : /strength|hiit/.test(text) ? "intermediate" : "all", focus: /yoga|mobility/.test(text) ? "Mobility" : /strength/.test(text) ? "Strength" : /hiit/.test(text) ? "Fat loss" : null };
    case "physio":
      return { conditions: /surgery/.test(text) ? ["Post-surgery rehab"] : /sports/.test(text) ? ["Sports injuries"] : ["Back pain", "Neck pain"], equipment: /consult|online/.test(text) ? null : "TENS, ultrasound, IFT" };
    case "gifts":
      return { occasion: /birthday|anniversary/.test(text) ? "Birthday" : "Any occasion", leadDays: /custom|personal|resin/.test(text) ? 3 : 1, personalisationHint: /custom|personal/.test(text) ? "Name and a short message" : null };
    default:
      return null;
  }
}

const CLIENTS = [
  { name: "Riya Sharma (demo)", phone: "+919999900141" },
  { name: "Amit Verma (demo)", phone: "+919999900142" },
  { name: "Neha Gupta (demo)", phone: "+919999900143" },
  { name: "Rahul Singh (demo)", phone: "+919999900144" },
];

/** Times (IST) and day offsets for a believable demo week. */
const SLOTS: { day: number; time: string; status: "confirmed" | "done" | "no_show" | "cancelled"; mode: "home" | "studio" | "online" }[] = [
  { day: -2, time: "07:00", status: "done", mode: "home" },
  { day: -2, time: "17:30", status: "done", mode: "studio" },
  { day: -1, time: "08:00", status: "no_show", mode: "studio" },
  { day: -1, time: "18:00", status: "done", mode: "home" },
  { day: 0, time: "07:30", status: "done", mode: "home" },
  { day: 0, time: "17:00", status: "confirmed", mode: "studio" },
  { day: 1, time: "07:00", status: "confirmed", mode: "home" },
  { day: 1, time: "09:00", status: "cancelled", mode: "online" },
  { day: 2, time: "18:30", status: "confirmed", mode: "studio" },
  { day: 3, time: "08:30", status: "confirmed", mode: "home" },
  { day: 4, time: "17:30", status: "confirmed", mode: "online" },
];

async function seedProfiles() {
  const rows = await scriptDb.select().from(vendors).where(inArray(vendors.slug, Object.keys(PROFILES)));
  for (const v of rows) {
    const type = toVendorType(v.vendorType, v.businessType);
    await writeTypeProfile(scriptDb, v.id, type, PROFILES[v.slug]!);

    const items =
      type === "fitness" || type === "physio" || type === "mehndi"
        ? (await scriptDb.select({ id: services.id, name: services.name, description: services.description }).from(services).where(eq(services.vendorId, v.id)))
        : (await scriptDb.select({ id: products.id, name: products.name, description: products.description }).from(products).where(eq(products.vendorId, v.id)));
    for (const item of items) {
      const values = itemValues(type, item.name, item.description);
      if (values) await writeItemDetails(scriptDb, v.id, type, item.id, values);
    }
    console.log("✓ profile", v.slug, `(${type}, ${items.length} items)`);
  }
}

async function seedBookings(slug: string) {
  const [v] = await scriptDb.select().from(vendors).where(eq(vendors.slug, slug)).limit(1);
  if (!v) return;
  const svc = await scriptDb.select().from(services).where(eq(services.vendorId, v.id));
  if (svc.length === 0) return;

  const clientIds: string[] = [];
  for (const c of CLIENTS) {
    await scriptDb
      .insert(customers)
      .values({ vendorId: v.id, name: c.name, phone: c.phone, society: "Demo Residency", tower: "A", floor: "2", flat: "204", linkTokenHash: crypto.randomBytes(32).toString("hex") })
      .onConflictDoNothing();
    const [row] = await scriptDb.select({ id: customers.id }).from(customers).where(and(eq(customers.vendorId, v.id), eq(customers.phone, c.phone))).limit(1);
    clientIds.push(row!.id);
  }

  const today = todayIST();
  let n = 0;
  for (const [i, s] of SLOTS.entries()) {
    const service = svc[i % svc.length]!;
    const startsAt = istDateTime(addDaysIST(today, s.day), s.time);
    const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60_000);
    const res = await scriptDb
      .insert(bookings)
      .values({
        number: `BK-DEMO-${slug.slice(0, 4).toUpperCase()}-${addDaysIST(today, s.day).slice(5).replace("-", "")}${s.time.replace(":", "")}`,
        clientKey: `seed-${slug}-${addDaysIST(today, s.day)}-${s.time}`,
        vendorId: v.id,
        customerId: clientIds[i % clientIds.length]!,
        userId: "seed-demo-client",
        serviceId: service.id,
        startsAt,
        endsAt,
        mode: service.modes.includes(s.mode) ? s.mode : (service.modes[0] as "home"),
        address: s.mode === "home" ? "Flat 204, Tower A, Demo Residency, Ranchi" : null,
        pricePaise: service.pricePaise,
        paymentMode: "pay_at_session",
        paymentStatus: s.status === "done" ? "paid" : "unpaid",
        notes: i === 0 ? "First session, mild lower-back pain. Bring a mat." : null,
        status: s.status,
        cancelReason: s.status === "cancelled" ? "Client travelling" : null,
      })
      .onConflictDoNothing()
      .returning({ id: bookings.id });
    n += res.length;
  }
  console.log("✓ bookings", slug, `+${n}`);
}

async function main() {
  await seedProfiles();
  for (const slug of ["dr-meera-physio-ranchi", "fitwithankit-ranchi", "shree-bridal-mehndi-ranchi"]) await seedBookings(slug);
}

main()
  .then(() => scriptPool.end())
  .catch(async (err) => {
    console.error(err);
    await scriptPool.end();
    process.exit(1);
  });
