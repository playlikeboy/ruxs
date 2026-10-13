import { eq } from "drizzle-orm";
import crypto from "crypto";
import { scriptDb, scriptPool } from "./script-client";
import {
  vendors,
  customers,
  products,
  subscriptions,
  orders,
  dayChanges,
  ledgerEntries,
  assetMovements,
  invoices,
} from "./schema";

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0]!;
}

export async function seed() {
  console.log("🌱 Starting seed...");

  // Check if Annapurna Tiffin already exists
  const existing = await scriptDb
    .select()
    .from(vendors)
    .where(eq(vendors.slug, "annapurna-tiffin"));

  if (existing.length > 0) {
    console.log("Demo vendor 'annapurna-tiffin' already exists. Seed is a clean no-op.");
    return;
  }

  // 1. Create Vendors
  const [tiffinVendor] = await scriptDb
    .insert(vendors)
    .values({
      slug: "annapurna-tiffin",
      name: "Annapurna Tiffin",
      phone: "+919999900001",
      upiVpa: "annapurna@upi",
      city: "Bengaluru",
      area: "HSR Layout Sector 2",
      plan: "starter",
      status: "active",
    })
    .returning();

  const [waterVendor] = await scriptDb
    .insert(vendors)
    .values({
      slug: "neer-20l",
      name: "Neer 20L",
      phone: "+919999900002",
      upiVpa: "neer20l@upi",
      city: "Bengaluru",
      area: "HSR Layout Sector 2",
      plan: "free",
      status: "active",
    })
    .returning();

  if (!tiffinVendor || !waterVendor) {
    throw new Error("Failed to insert vendors");
  }

  console.log("✓ Vendors created:", tiffinVendor.slug, waterVendor.slug);

  // 2. Create Products for Annapurna Tiffin
  const [lunchRegular] = await scriptDb
    .insert(products)
    .values({
      vendorId: tiffinVendor.id,
      kind: "tiffin",
      name: "Lunch Regular",
      shift: "lunch",
      pricePaise: 9000, // ₹90
      depositPaise: 0,
      assetName: "dabba",
      pollAt: "08:30",
      cutoffAt: "10:00",
      lateRule: "half",
    })
    .returning();

  const [lunchJain] = await scriptDb
    .insert(products)
    .values({
      vendorId: tiffinVendor.id,
      kind: "tiffin",
      name: "Lunch Jain",
      shift: "lunch",
      pricePaise: 9500, // ₹95
      depositPaise: 0,
      assetName: "dabba",
      pollAt: "08:30",
      cutoffAt: "10:00",
      lateRule: "half",
    })
    .returning();

  const [dinnerRegular] = await scriptDb
    .insert(products)
    .values({
      vendorId: tiffinVendor.id,
      kind: "tiffin",
      name: "Dinner Regular",
      shift: "dinner",
      pricePaise: 9000, // ₹90
      depositPaise: 0,
      assetName: "dabba",
      pollAt: "15:30",
      cutoffAt: "17:00",
      lateRule: "half",
    })
    .returning();

  // 3. Create Product for Neer 20L
  const [waterCan] = await scriptDb
    .insert(products)
    .values({
      vendorId: waterVendor.id,
      kind: "water",
      name: "20L Water Can",
      shift: "morning",
      pricePaise: 4000, // ₹40
      depositPaise: 15000, // ₹150 deposit
      assetName: "can",
      pollAt: "06:00",
      cutoffAt: "07:00",
      lateRule: "free",
    })
    .returning();

  if (!lunchRegular || !lunchJain || !dinnerRegular || !waterCan) {
    throw new Error("Failed to insert products");
  }

  console.log("✓ Products created");

  // 4. Create 12 Customers
  const customerData = [
    { name: "Rahul Sharma", phone: "+919999900011", society: "Green Glen Heights", tower: "Tower A", floor: "2", flat: "201" },
    { name: "Priya Patel", phone: "+919999900012", society: "Green Glen Heights", tower: "Tower A", floor: "5", flat: "502" },
    { name: "Amit Verma", phone: "+919999900013", society: "Green Glen Heights", tower: "Tower A", floor: "10", flat: "1004" },
    { name: "Sneha Rao", phone: "+919999900014", society: "Green Glen Heights", tower: "Tower B", floor: "1", flat: "102" },
    { name: "Vikram Iyer", phone: "+919999900015", society: "Green Glen Heights", tower: "Tower B", floor: "4", flat: "401" },
    { name: "Ananya Sen", phone: "+919999900016", society: "Green Glen Heights", tower: "Tower B", floor: "8", flat: "803" },
    { name: "Rohan Das", phone: "+919999900017", society: "Palm Springs", tower: "Tower 1", floor: "3", flat: "301" },
    { name: "Pooja Nair", phone: "+919999900018", society: "Palm Springs", tower: "Tower 1", floor: "6", flat: "602" },
    { name: "Karan Kapoor", phone: "+919999900019", society: "Palm Springs", tower: "Tower 1", floor: "9", flat: "904" },
    { name: "Divya Joshi", phone: "+919999900020", society: "Palm Springs", tower: "Tower 1", floor: "12", flat: "1201" },
    { name: "Manish Gupta", phone: "+919999900021", society: "Palm Springs", tower: "Tower 1", floor: "14", flat: "1403" },
    { name: "Ritu Deshmukh", phone: "+919999900022", society: "Palm Springs", tower: "Tower 1", floor: "15", flat: "1502" },
  ];

  const seededCustomers = [];
  for (const c of customerData) {
    const rawToken = `token_${c.phone}_${crypto.randomBytes(8).toString("hex")}`;
    const [cust] = await scriptDb
      .insert(customers)
      .values({
        vendorId: tiffinVendor.id,
        name: c.name,
        phone: c.phone,
        society: c.society,
        tower: c.tower,
        floor: c.floor,
        flat: c.flat,
        linkTokenHash: hashToken(rawToken),
        optedInAt: new Date(),
      })
      .returning();
    seededCustomers.push(cust!);
  }

  console.log(`✓ ${seededCustomers.length} Customers created`);

  // 5. Create Subscriptions
  const weekDays = ["mon", "tue", "wed", "thu", "fri", "sat"];
  const seededSubs = [];

  for (let i = 0; i < seededCustomers.length; i++) {
    const cust = seededCustomers[i]!;
    const prod = i % 3 === 0 ? lunchJain : lunchRegular;

    const [sub] = await scriptDb
      .insert(subscriptions)
      .values({
        vendorId: tiffinVendor.id,
        customerId: cust.id,
        productId: prod.id,
        qty: 1,
        days: weekDays,
        startsOn: "2026-10-01",
      })
      .returning();

    seededSubs.push({ sub: sub!, product: prod, customer: cust });
  }

  console.log(`✓ ${seededSubs.length} Subscriptions created`);

  // 6. 10 days of history (from 10 days ago up to yesterday)
  const today = new Date();
  const pastDays = 10;

  for (let d = pastDays; d >= 1; d--) {
    const dateObj = new Date(today);
    dateObj.setDate(today.getDate() - d);
    const serviceDate = formatDate(dateObj);

    for (const item of seededSubs) {
      const { sub, product, customer } = item;
      // Skip day for customer 1 on day 5 (before cutoff)
      const isSkip = d === 5 && customer.phone === "+919999900011";

      if (isSkip) {
        // Record day change
        await scriptDb.insert(dayChanges).values({
          vendorId: tiffinVendor.id,
          subscriptionId: sub.id,
          serviceDate,
          kind: "skip",
          qty: 0,
          source: "link",
          receivedAt: new Date(dateObj.getTime() + 8 * 3600 * 1000), // 8 AM
          isLate: false,
        });

        // Record skipped order
        await scriptDb.insert(orders).values({
          vendorId: tiffinVendor.id,
          customerId: customer.id,
          productId: product.id,
          subscriptionId: sub.id,
          serviceDate,
          shift: product.shift,
          qty: 0,
          unitPricePaise: product.pricePaise,
          status: "skipped",
        });
      } else {
        // Delivered order
        const [order] = await scriptDb
          .insert(orders)
          .values({
            vendorId: tiffinVendor.id,
            customerId: customer.id,
            productId: product.id,
            subscriptionId: sub.id,
            serviceDate,
            shift: product.shift,
            qty: 1,
            unitPricePaise: product.pricePaise,
            status: "delivered",
            deliveredAt: new Date(dateObj.getTime() + 12 * 3600 * 1000), // 12 PM
            deliveredBy: "driver-demo",
          })
          .returning();

        // Ledger entry for delivery
        await scriptDb.insert(ledgerEntries).values({
          vendorId: tiffinVendor.id,
          customerId: customer.id,
          orderId: order!.id,
          type: "delivery",
          amountPaise: product.pricePaise,
          notes: `${product.name} delivered on ${serviceDate}`,
          idempotencyKey: `order:${order!.id}:delivery`,
          createdBy: "driver-demo",
          createdAt: new Date(dateObj.getTime() + 12 * 3600 * 1000),
        });
      }
    }
  }

  // 7. Add sample payments for first two customers
  const firstCustomer = seededCustomers[0]!;
  await scriptDb.insert(ledgerEntries).values({
    vendorId: tiffinVendor.id,
    customerId: firstCustomer.id,
    type: "payment",
    amountPaise: -50000, // ₹500 paid
    notes: "UPI payment received",
    idempotencyKey: `pay:demo:${firstCustomer.id}:1`,
    createdBy: "owner-demo",
  });

  console.log("✓ 10 days of order and ledger history seeded successfully!");
}

if (import.meta.main) {
  seed()
    .then(async () => {
      console.log("🌱 Seed complete!");
      await scriptPool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error("❌ Seed failed:", err);
      await scriptPool.end();
      process.exit(1);
    });
}
