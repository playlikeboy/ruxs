/**
 * Fills the demo stores with storefront details and one-time menu items, and
 * adds a demo dairy. Safe to re-run: updates by slug, inserts items by name.
 * Run after `db:seed`: `bun run src/db/seed-storefronts.ts`.
 */
import { and, eq } from "drizzle-orm";
import { scriptDb, scriptPool } from "./script-client";
import { products, vendors } from "./schema";

type Item = {
  kind: "tiffin" | "water" | "milk" | "other";
  name: string;
  section: string;
  pricePaise: number;
  description: string;
  isVeg?: boolean | null;
  shift?: "lunch" | "dinner" | "morning" | "evening";
  cutoffAt?: string;
  allowSubscription?: boolean;
};

const STORES: {
  slug: string;
  description: string;
  latitude: number;
  longitude: number;
  deliveryFeePaise: number;
  items: Item[];
}[] = [
  {
    slug: "annapurna-tiffin",
    description: "Ghar jaisa veg khana from a home kitchen in HSR. Fresh phulkas, seasonal sabzi, Jain on request.",
    latitude: 12.9116,
    longitude: 77.6389,
    deliveryFeePaise: 0,
    items: [
      { kind: "tiffin", name: "Rajma Chawal Bowl", section: "Bowls", pricePaise: 12000, description: "Slow-cooked rajma, jeera rice, onion salad.", isVeg: true, allowSubscription: false },
      { kind: "tiffin", name: "Paneer Paratha (2 pc)", section: "Parathas", pricePaise: 11000, description: "With curd and pickle.", isVeg: true, allowSubscription: false },
      { kind: "tiffin", name: "Masala Chaas", section: "Add-ons", pricePaise: 3000, description: "Spiced buttermilk, 300 ml.", isVeg: true, allowSubscription: false },
    ],
  },
  {
    slug: "neer-20l",
    description: "BIS-certified 20L cans delivered to your door every morning. Empties picked up on the same trip.",
    latitude: 12.9142,
    longitude: 77.6455,
    deliveryFeePaise: 0,
    items: [
      { kind: "water", name: "1L Bottles (12 pack)", section: "Bottles", pricePaise: 18000, description: "Packaged drinking water, sealed case.", isVeg: null, allowSubscription: false },
    ],
  },
  {
    slug: "dabbawala-powai",
    description: "Maharashtrian and North Indian dabbas packed fresh every morning in Powai.",
    latitude: 19.1197,
    longitude: 72.9051,
    deliveryFeePaise: 2000,
    items: [
      { kind: "tiffin", name: "Misal Pav", section: "Snacks", pricePaise: 9000, description: "Spicy usal, farsan, two pav.", isVeg: true, allowSubscription: false },
      { kind: "tiffin", name: "Chicken Curry Rice", section: "Meals", pricePaise: 16000, description: "Home-style curry with steamed rice.", isVeg: false, allowSubscription: false },
    ],
  },
  { slug: "sahyadri-water", description: "Natural mineral water in 20L jars across Powai and Andheri East.", latitude: 19.1159, longitude: 72.9087, deliveryFeePaise: 0, items: [] },
  {
    slug: "dilli-rasoi",
    description: "Punjabi-style lunches for Cyber City offices and homes. Less oil, full taste.",
    latitude: 28.4949,
    longitude: 77.0891,
    deliveryFeePaise: 2500,
    items: [
      { kind: "tiffin", name: "Chole Kulche", section: "Specials", pricePaise: 11000, description: "Two kulchas, pindi chole, onion-chilli.", isVeg: true, allowSubscription: false },
    ],
  },
  { slug: "yamuna-pure", description: "5-stage purified 20L cans for Noida sectors 50–78.", latitude: 28.6271, longitude: 77.3712, deliveryFeePaise: 0, items: [] },
  {
    slug: "deccan-meals",
    description: "Andhra and Hyderabadi meals from Madhapur, delivered hot.",
    latitude: 17.4483,
    longitude: 78.3915,
    deliveryFeePaise: 1500,
    items: [
      { kind: "tiffin", name: "Pesarattu with Ginger Chutney", section: "Breakfast", pricePaise: 8000, description: "Green moong dosa, two chutneys.", isVeg: true, shift: "morning", cutoffAt: "07:30", allowSubscription: false },
    ],
  },
  { slug: "puneri-bhojan", description: "Gharghuti Puneri thalis near Hinjewadi Phase 1.", latitude: 18.5912, longitude: 73.7389, deliveryFeePaise: 1000, items: [] },
];

const DAIRY = {
  slug: "gaushala-fresh-dairy",
  name: "Gaushala Fresh Dairy",
  phone: "+919999900099",
  upiVpa: "gaushaladairy@upi",
  city: "Bengaluru",
  area: "HSR Layout",
  description: "Farm milk in glass bottles before 7 am, plus curd and paneer. Demo store.",
  latitude: 12.9098,
  longitude: 77.6481,
};

const DAIRY_ITEMS: Item[] = [
  { kind: "milk", name: "Cow Milk 1L (glass bottle)", section: "Milk", pricePaise: 8000, description: "Delivered chilled before 7 am. Return the bottle next day.", isVeg: true, shift: "morning", cutoffAt: "21:00" },
  { kind: "milk", name: "Buffalo Milk 500ml", section: "Milk", pricePaise: 4500, description: "Creamy, great for chai.", isVeg: true, shift: "morning", cutoffAt: "21:00" },
  { kind: "milk", name: "Fresh Dahi 400g", section: "Curd & paneer", pricePaise: 6000, description: "Set overnight.", isVeg: true, shift: "morning", cutoffAt: "21:00" },
  { kind: "milk", name: "Malai Paneer 200g", section: "Curd & paneer", pricePaise: 11000, description: "Soft, made the same morning.", isVeg: true, shift: "morning", cutoffAt: "21:00", allowSubscription: false },
];

async function upsertItems(vendorId: string, items: Item[]) {
  for (const item of items) {
    const [existing] = await scriptDb
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.vendorId, vendorId), eq(products.name, item.name)))
      .limit(1);
    if (existing) continue;
    await scriptDb.insert(products).values({
      vendorId,
      kind: item.kind,
      name: item.name,
      section: item.section,
      description: item.description,
      isVeg: item.isVeg ?? null,
      shift: item.shift ?? "lunch",
      cutoffAt: item.cutoffAt ?? "11:00",
      pricePaise: item.pricePaise,
      allowSubscription: item.allowSubscription ?? true,
      allowOneTime: true,
      lateRule: "full",
    });
  }
}

async function main() {
  for (const store of STORES) {
    const [vendor] = await scriptDb
      .update(vendors)
      .set({
        description: store.description,
        latitude: store.latitude,
        longitude: store.longitude,
        deliveryFeePaise: store.deliveryFeePaise,
        serviceRadiusKm: 8,
      })
      .where(eq(vendors.slug, store.slug))
      .returning({ id: vendors.id });
    if (!vendor) {
      console.log("skip (not seeded):", store.slug);
      continue;
    }
    // Existing subscription meals are vegetarian thalis in the demo data.
    await scriptDb.update(products).set({ isVeg: true }).where(and(eq(products.vendorId, vendor.id), eq(products.kind, "tiffin")));
    await upsertItems(vendor.id, store.items);
    console.log("✓", store.slug);
  }

  let [dairy] = await scriptDb.select({ id: vendors.id }).from(vendors).where(eq(vendors.slug, DAIRY.slug)).limit(1);
  if (!dairy) {
    [dairy] = await scriptDb
      .insert(vendors)
      .values({ ...DAIRY, plan: "free", status: "active", serviceRadiusKm: 6 })
      .returning({ id: vendors.id });
  }
  await upsertItems(dairy!.id, DAIRY_ITEMS);
  console.log("✓", DAIRY.slug);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => scriptPool.end());
