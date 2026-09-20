import { db, isTestEnv } from "./index";
import {
  tenants as tenantsTable,
  services as servicesTable,
  products as productsTable,
  users as usersTable,
  households as householdsTable,
  householdMembers as householdMembersTable,
  subscriptions as subscriptionsTable,
  deliveryRuns as deliveryRunsTable,
  deliveryStops as deliveryStopsTable,
  disputes as disputesTable,
  householdExpenses as householdExpensesTable,
  householdExpenseParticipants as householdExpenseParticipantsTable,
  khataEntries as khataEntriesTable,
} from "./schema";
import { eq } from "drizzle-orm";

export interface SeededVendorMenuItem {
  title: string;
  items: string[];
  diet: "PURE_VEG" | "JAIN" | "NON_VEG";
}

export interface SeededVendorShift {
  id: "MORNING" | "AFTERNOON" | "EVENING" | "NIGHT";
  label: string;
  timing: string;
  cutoff: string;
  pricePaise: number;
  monthlyEstimatePaise: number;
  menu?: SeededVendorMenuItem;
}

export interface SeededVendorVariety {
  id: string;
  name: string;
  fatPercent?: string;
  packaging?: string;
  pricePaise: number;
  unit: string;
  depositPaise?: number;
}

export interface SeededVendorData {
  id: string;
  businessName: string;
  slug: string;
  phone: string;
  email: string;
  upiId: string;
  fssaiNumber: string;
  planTier: "STARTER" | "GROWTH" | "PRO";
  vendorType: "MILKMAN" | "WATER_SERVICE" | "TIFFIN";
  status: "VERIFIED" | "PENDING_APPROVAL" | "SUSPENDED";
  locality: string;
  city: string;
  coveredSocieties: string[];
  rating: number;
  reviewCount: number;
  deliverySlots: string[];
  shifts: SeededVendorShift[];
  varieties?: SeededVendorVariety[];
  services: Array<{
    id: string;
    category: "MILK" | "WATER" | "TIFFIN";
    name: string;
    description: string;
    cutoffTimeStr: string;
    pollTimeStr: string;
    products: Array<{
      id: string;
      name: string;
      unitType: string;
      basePricePaise: number;
    }>;
  }>;
}

export const SEEDED_VENDORS: SeededVendorData[] = [
  {
    id: "ten_sharma_tiffin",
    businessName: "Sharma Homestyle Tiffin & Meals",
    slug: "sharma-homestyle-tiffin",
    phone: "+919876543201",
    email: "sharma.kitchen@ruxs.in",
    upiId: "sharmatiffin@okhdfcbank",
    fssaiNumber: "11223344556677",
    planTier: "GROWTH",
    vendorType: "TIFFIN",
    status: "VERIFIED",
    locality: "HSR Layout Sector 2",
    city: "Bengaluru",
    coveredSocieties: ["Sobha Classic", "Purva Fairmont", "Prestige Ferns", "SJR Parkway"],
    rating: 4.9,
    reviewCount: 184,
    deliverySlots: ["Afternoon Lunch (12:30 PM)", "Night Dinner (7:30 PM)"],
    shifts: [
      {
        id: "AFTERNOON",
        label: "Afternoon Lunch",
        timing: "12:30 PM – 2:00 PM",
        cutoff: "10:00 AM",
        pricePaise: 11000,
        monthlyEstimatePaise: 330000,
        menu: {
          title: "Royal Punjabi Lunch Thali",
          items: ["4 Soft Ghee Phulkas", "Dal Tadka", "Paneer Butter Masala", "Jeera Basmati Rice", "Boondi Raita", "Gulab Jamun"],
          diet: "PURE_VEG",
        },
      },
      {
        id: "NIGHT",
        label: "Night Dinner",
        timing: "7:30 PM – 9:00 PM",
        cutoff: "06:00 PM",
        pricePaise: 12000,
        monthlyEstimatePaise: 360000,
        menu: {
          title: "Homestyle Light Dinner Thali",
          items: ["3 Multigrain Rotis", "Yellow Dal Fry", "Aloo Gobi Matar", "Steamed Rice", "Roasted Papad", "Kachumber Salad"],
          diet: "PURE_VEG",
        },
      },
    ],
    services: [
      {
        id: "srv_sharma_lunch",
        category: "TIFFIN",
        name: "Afternoon Executive Lunch",
        description: "Freshly cooked hot home-style lunch delivered in insulated steel dabbas.",
        cutoffTimeStr: "10:00",
        pollTimeStr: "07:30",
        products: [
          {
            id: "prd_sharma_lunch_thali",
            name: "Sharma Daily Lunch Thali",
            unitType: "MEAL",
            basePricePaise: 11000,
          },
        ],
      },
      {
        id: "srv_sharma_dinner",
        category: "TIFFIN",
        name: "Night Comfort Dinner",
        description: "Balanced, light dinner prepared with minimal oil and fresh ingredients.",
        cutoffTimeStr: "18:00",
        pollTimeStr: "15:00",
        products: [
          {
            id: "prd_sharma_dinner_thali",
            name: "Sharma Daily Dinner Thali",
            unitType: "MEAL",
            basePricePaise: 12000,
          },
        ],
      },
    ],
  },
  {
    id: "ten_deshmukh_tiffin",
    businessName: "Deshmukh Kitchen & Tiffin Service",
    slug: "deshmukh-kitchen-tiffin",
    phone: "+919876543202",
    email: "deshmukh.meals@ruxs.in",
    upiId: "deshmukhkitchen@icici",
    fssaiNumber: "22334455667788",
    planTier: "STARTER",
    vendorType: "TIFFIN",
    status: "VERIFIED",
    locality: "Koramangala 4th Block",
    city: "Bengaluru",
    coveredSocieties: ["Prestige Meridian", "Purva Fairmont", "Raheja Residency"],
    rating: 4.8,
    reviewCount: 92,
    deliverySlots: ["Morning Breakfast (7:30 AM)", "Afternoon Lunch (1:00 PM)"],
    shifts: [
      {
        id: "MORNING",
        label: "Morning Breakfast",
        timing: "7:30 AM – 9:00 AM",
        cutoff: "09:00 PM (Prev Night)",
        pricePaise: 7000,
        monthlyEstimatePaise: 210000,
        menu: {
          title: "Traditional South & West Breakfast",
          items: ["Poha / Soft Idli Sambar", "Fresh Coconut Chutney", "Filter Coffee decoction"],
          diet: "PURE_VEG",
        },
      },
      {
        id: "AFTERNOON",
        label: "Afternoon Lunch",
        timing: "1:00 PM – 2:30 PM",
        cutoff: "10:30 AM",
        pricePaise: 11500,
        monthlyEstimatePaise: 345000,
        menu: {
          title: "Maharashtra Poli Bhaji Thali",
          items: ["3 Thin Wheat Chapattis", "Varan Bhaat with Pure Desi Ghee", "Batata Sukhi Bhaji", "Koshimbir", "Solkadhi"],
          diet: "PURE_VEG",
        },
      },
    ],
    services: [
      {
        id: "srv_deshmukh_lunch",
        category: "TIFFIN",
        name: "Maharashtrian Special Lunch",
        description: "Authentic authentic home-style poli-bhaji thali made daily.",
        cutoffTimeStr: "10:30",
        pollTimeStr: "08:00",
        products: [
          {
            id: "prd_deshmukh_lunch_thali",
            name: "Deshmukh Special Thali",
            unitType: "MEAL",
            basePricePaise: 11500,
          },
        ],
      },
    ],
  },
  {
    id: "ten_gupta_dairy",
    businessName: "Gupta Pure Cow & Buffalo Dairy",
    slug: "gupta-pure-dairy",
    phone: "+919876543203",
    email: "gupta.dairy@ruxs.in",
    upiId: "guptadairy@paytm",
    fssaiNumber: "33445566778899",
    planTier: "PRO",
    vendorType: "MILKMAN",
    status: "VERIFIED",
    locality: "HSR Layout Sector 1",
    city: "Bengaluru",
    coveredSocieties: ["Sobha Classic", "Purva Fairmont", "Prestige Ferns", "SJR Parkway", "Sobha Silicon Oasis"],
    rating: 4.95,
    reviewCount: 310,
    deliverySlots: ["Early Morning (5:30 AM – 7:00 AM)", "Evening (5:30 PM – 7:00 PM)"],
    shifts: [
      {
        id: "MORNING",
        label: "Early Morning Dairy Run",
        timing: "5:30 AM – 7:00 AM",
        cutoff: "09:00 PM (Prev Night)",
        pricePaise: 6500,
        monthlyEstimatePaise: 195000,
      },
      {
        id: "EVENING",
        label: "Evening Fresh Batch",
        timing: "5:30 PM – 7:00 PM",
        cutoff: "03:00 PM",
        pricePaise: 6500,
        monthlyEstimatePaise: 195000,
      },
    ],
    varieties: [
      {
        id: "COW_A2",
        name: "Desi Gir Cow A2 Raw Milk",
        fatPercent: "4.8% Fat",
        packaging: "Glass Bottle",
        pricePaise: 8500,
        unit: "1 Liter",
      },
      {
        id: "COW_FRESH",
        name: "Farm Fresh Pure Cow Milk",
        fatPercent: "3.8% Fat",
        packaging: "Glass Bottle",
        pricePaise: 6500,
        unit: "1 Liter",
      },
      {
        id: "BUFFALO",
        name: "Thick Cream Buffalo Milk",
        fatPercent: "6.5% Fat",
        packaging: "Eco Pouch",
        pricePaise: 7500,
        unit: "1 Liter",
      },
    ],
    services: [
      {
        id: "srv_gupta_milk_morning",
        category: "MILK",
        name: "Morning Doorstep Milk Delivery",
        description: "Farm milk delivered in sealed glass bottles before 7:00 AM.",
        cutoffTimeStr: "21:00",
        pollTimeStr: "19:00",
        products: [
          {
            id: "prd_gupta_cow_milk",
            name: "1L Pure Farm Cow Milk",
            unitType: "LITER",
            basePricePaise: 6500,
          },
          {
            id: "prd_gupta_a2_milk",
            name: "1L Gir Cow A2 Raw Milk",
            unitType: "LITER",
            basePricePaise: 8500,
          },
        ],
      },
    ],
  },
  {
    id: "ten_krishna_dairy",
    businessName: "Krishna Natural Farms & Organic Milk",
    slug: "krishna-natural-farms",
    phone: "+919876543204",
    email: "krishna.farms@ruxs.in",
    upiId: "krishnafarms@okhdfcbank",
    fssaiNumber: "44556677889900",
    planTier: "GROWTH",
    vendorType: "MILKMAN",
    status: "VERIFIED",
    locality: "Bellandur & Haralur Road",
    city: "Bengaluru",
    coveredSocieties: ["SJR Parkway", "Prestige Ferns", "Sobha Classic"],
    rating: 4.88,
    reviewCount: 140,
    deliverySlots: ["Early Morning (5:00 AM – 6:30 AM)"],
    shifts: [
      {
        id: "MORNING",
        label: "Early Morning Drop",
        timing: "5:00 AM – 6:30 AM",
        cutoff: "09:30 PM (Prev Night)",
        pricePaise: 7800,
        monthlyEstimatePaise: 234000,
      },
    ],
    varieties: [
      {
        id: "ORGANIC_COW",
        name: "Certified Organic Grass-Fed Milk",
        fatPercent: "4.2% Fat",
        packaging: "Glass Bottle",
        pricePaise: 7800,
        unit: "1 Liter",
      },
    ],
    services: [
      {
        id: "srv_krishna_milk",
        category: "MILK",
        name: "Organic Morning Milk Drop",
        description: "Certified zero-pesticide, grass-fed cow milk in hygienic sanitized bottles.",
        cutoffTimeStr: "21:30",
        pollTimeStr: "19:00",
        products: [
          {
            id: "prd_krishna_organic_milk",
            name: "1L Organic Cow Milk",
            unitType: "LITER",
            basePricePaise: 7800,
          },
        ],
      },
    ],
  },
  {
    id: "ten_aqua_pure",
    businessName: "AquaPure 20L Water Suppliers",
    slug: "aquapure-water-suppliers",
    phone: "+919876543205",
    email: "aquapure@ruxs.in",
    upiId: "aquapure@ybl",
    fssaiNumber: "55667788990011",
    planTier: "GROWTH",
    vendorType: "WATER_SERVICE",
    status: "VERIFIED",
    locality: "HSR Layout & Bellandur",
    city: "Bengaluru",
    coveredSocieties: ["Sobha Classic", "Purva Fairmont", "Prestige Ferns", "SJR Parkway", "Prestige Meridian"],
    rating: 4.75,
    reviewCount: 220,
    deliverySlots: ["Morning (8:00 AM – 11:00 AM)", "Afternoon (2:00 PM – 5:00 PM)"],
    shifts: [
      {
        id: "MORNING",
        label: "Morning Society Run",
        timing: "8:00 AM – 11:00 AM",
        cutoff: "07:00 AM",
        pricePaise: 5000,
        monthlyEstimatePaise: 60000, // based on ~12 cans / mo
      },
      {
        id: "AFTERNOON",
        label: "Afternoon Society Run",
        timing: "2:00 PM – 5:00 PM",
        cutoff: "01:00 PM",
        pricePaise: 5000,
        monthlyEstimatePaise: 60000,
      },
    ],
    varieties: [
      {
        id: "JAR_20L_BISLERI",
        name: "Bisleri Sealed 20L Bubbletop Can",
        packaging: "20L Sealed Can",
        pricePaise: 9000,
        depositPaise: 15000,
        unit: "20L Jar",
      },
      {
        id: "JAR_20L_RO",
        name: "RO Ultra-Pure 20L Mineral Can",
        packaging: "20L Sanitized Jar",
        pricePaise: 5000,
        depositPaise: 15000,
        unit: "20L Jar",
      },
    ],
    services: [
      {
        id: "srv_aqua_water",
        category: "WATER",
        name: "Scheduled 20L Jar Drop",
        description: "Factory sanitized 20-litre cans with 1-to-1 empty jar exchange.",
        cutoffTimeStr: "07:00",
        pollTimeStr: "06:00",
        products: [
          {
            id: "prd_aqua_ro_jar",
            name: "20L RO Mineral Water Can",
            unitType: "JAR",
            basePricePaise: 5000,
          },
          {
            id: "prd_aqua_bisleri_jar",
            name: "20L Bisleri Sealed Can",
            unitType: "JAR",
            basePricePaise: 9000,
          },
        ],
      },
    ],
  },
  {
    id: "ten_balaji_pending",
    businessName: "Balaji South Indian Meals",
    slug: "balaji-south-indian-meals",
    phone: "+919876543206",
    email: "balaji.meals@ruxs.in",
    upiId: "balajimeals@upi",
    fssaiNumber: "66778899001122",
    planTier: "STARTER",
    vendorType: "TIFFIN",
    status: "PENDING_APPROVAL",
    locality: "BTM Layout 2nd Stage",
    city: "Bengaluru",
    coveredSocieties: ["Sobha Classic", "Purva Fairmont"],
    rating: 0,
    reviewCount: 0,
    deliverySlots: ["Afternoon Lunch (12:30 PM)"],
    shifts: [
      {
        id: "AFTERNOON",
        label: "Afternoon Lunch",
        timing: "12:30 PM – 2:00 PM",
        cutoff: "10:00 AM",
        pricePaise: 9500,
        monthlyEstimatePaise: 285000,
        menu: {
          title: "Karnataka Traditional Oota",
          items: ["Ragi Mudde / 3 Phulkas", "Bassaru / Sambar", "Palya", "Curd Rice", "Payasa"],
          diet: "PURE_VEG",
        },
      },
    ],
    services: [],
  },
];

let seededInMemory = false;

/**
 * Ensures database has all baseline verified vendors and catalogs
 */
export async function seedDatabase(force: boolean = false): Promise<{ count: number; seeded: boolean }> {
  if (seededInMemory && !force) {
    return { count: SEEDED_VENDORS.length, seeded: false };
  }

  if (!isTestEnv) {
    try {
      // Check if tenants exist
      const existing = await db.select().from(tenantsTable);
      if (existing.length >= 4 && !force) {
        seededInMemory = true;
        return { count: existing.length, seeded: false };
      }

      for (const v of SEEDED_VENDORS) {
        // Upsert tenant
        const typeConfigJson = JSON.stringify({
          shifts: v.shifts,
          varieties: v.varieties || [],
          coveredSocieties: v.coveredSocieties,
          rating: v.rating,
          reviewCount: v.reviewCount,
          deliverySlots: v.deliverySlots,
        });

        const credentialsJson = JSON.stringify({
          loginToken: `vtok_${v.slug}_${Math.random().toString(36).substring(2, 8)}`,
          accessPin: Math.floor(100000 + Math.random() * 900000).toString(),
          directUrl: `https://ruxs.in/login?vendorToken=vtok_${v.slug}&slug=${v.slug}`,
        });

        // Insert or update tenant
        await db
          .insert(tenantsTable)
          .values({
            id: v.id,
            businessName: v.businessName,
            slug: v.slug,
            phone: v.phone,
            email: v.email,
            upiId: v.upiId,
            fssaiNumber: v.fssaiNumber,
            planTier: v.planTier,
            vendorType: v.vendorType,
            typeConfig: typeConfigJson,
            credentials: credentialsJson,
            address: `${v.locality}, ${v.city}`,
            status: v.status,
          })
          .onConflictDoUpdate({
            target: tenantsTable.id,
            set: {
              businessName: v.businessName,
              vendorType: v.vendorType,
              typeConfig: typeConfigJson,
              credentials: credentialsJson,
              status: v.status,
              updatedAt: new Date(),
            },
          });

        // Insert services and products
        for (const s of v.services) {
          await db
            .insert(servicesTable)
            .values({
              id: s.id,
              tenantId: v.id,
              category: s.category,
              name: s.name,
              description: s.description,
              cutoffTimeStr: s.cutoffTimeStr,
              lateCancellationFeePercent: 50,
              requiresAssetTracking: s.category === "WATER",
              allowsQuantityAdjustment: true,
              allowsSkip: true,
              isActive: true,
            })
            .onConflictDoNothing();

          for (const p of s.products) {
            await db
              .insert(productsTable)
              .values({
                id: p.id,
                tenantId: v.id,
                serviceId: s.id,
                name: p.name,
                unitType: p.unitType,
                basePricePaise: p.basePricePaise,
                isAddon: false,
                isActive: true,
              })
              .onConflictDoNothing();
          }
        }
      }

      const todayStr = new Date().toISOString().split("T")[0];

      // 1. Seed Core Users
      await db
        .insert(usersTable)
        .values([
          {
            id: "drv_ramesh",
            phone: "+919876543299",
            fullName: "Ramesh Kumar (Driver)",
            email: "ramesh.kumar@ruxs.in",
            role: "DRIVER",
            tenantId: "ten_sharma_tiffin",
            whatsappOptIn: true,
            status: "ACTIVE",
          },
          {
            id: "usr_priya",
            phone: "+919876543210",
            fullName: "Priya Sundaram",
            email: "priya.sundaram@gmail.com",
            role: "CUSTOMER",
            tenantId: "ten_sharma_tiffin",
            whatsappOptIn: true,
            status: "ACTIVE",
          },
          {
            id: "usr_rahul",
            phone: "+919876543211",
            fullName: "Rahul Verma",
            email: "rahul.verma@gmail.com",
            role: "CUSTOMER",
            tenantId: "ten_sharma_tiffin",
            whatsappOptIn: true,
            status: "ACTIVE",
          },
          {
            id: "usr_ananya",
            phone: "+919876543217",
            fullName: "Ananya Deshmukh",
            email: "ananya.d@gmail.com",
            role: "CUSTOMER",
            tenantId: "ten_deshmukh_tiffin",
            whatsappOptIn: true,
            status: "ACTIVE",
          },
          {
            id: "usr_suresh",
            phone: "+919876543288",
            fullName: "Suresh Nair",
            email: "suresh.nair@gmail.com",
            role: "CUSTOMER",
            tenantId: "ten_sharma_tiffin",
            whatsappOptIn: true,
            status: "ACTIVE",
          },
        ])
        .onConflictDoNothing();

      // 2. Seed Households
      await db
        .insert(householdsTable)
        .values([
          {
            id: "hh_sobha_b402",
            name: "Sobha Classic B-402",
            societyName: "Sobha Classic",
            towerWing: "Tower B",
            floor: "4",
            flatNumber: "B-402",
            city: "Bengaluru",
            primaryOwnerId: "usr_priya",
          },
          {
            id: "hh_prestige_a104",
            name: "Prestige Falcon A-104",
            societyName: "Prestige Falcon",
            towerWing: "Tower A",
            floor: "1",
            flatNumber: "A-104",
            city: "Bengaluru",
            primaryOwnerId: "usr_ananya",
          },
        ])
        .onConflictDoNothing();

      // 3. Seed Household Members
      await db
        .insert(householdMembersTable)
        .values([
          {
            id: "hm_priya",
            householdId: "hh_sobha_b402",
            userId: "usr_priya",
            role: "PRIMARY_OWNER",
          },
          {
            id: "hm_rahul",
            householdId: "hh_sobha_b402",
            userId: "usr_rahul",
            role: "MEMBER",
          },
          {
            id: "hm_ananya",
            householdId: "hh_prestige_a104",
            userId: "usr_ananya",
            role: "PRIMARY_OWNER",
          },
        ])
        .onConflictDoNothing();

      // 4. Seed Subscriptions Across Milk, Water, and Tiffin
      await db
        .insert(subscriptionsTable)
        .values([
          {
            id: "sub_priya_tiffin",
            tenantId: "ten_sharma_tiffin",
            customerId: "usr_priya",
            householdId: "hh_sobha_b402",
            productId: "prod_sharma_lunch_thali",
            defaultQuantity: 1,
            shift: "LUNCH",
            instructions: "Leave dabba on shoe rack outside door, ring bell once",
            status: "ACTIVE",
            cadence: "DAILY",
            startDate: todayStr,
          },
          {
            id: "sub_priya_milk",
            tenantId: "ten_gupta_dairy",
            customerId: "usr_priya",
            householdId: "hh_sobha_b402",
            productId: "prod_gupta_cow_milk",
            defaultQuantity: 2,
            shift: "MORNING",
            instructions: "Drop glass bottles in insulated bag",
            status: "ACTIVE",
            cadence: "DAILY",
            startDate: todayStr,
          },
          {
            id: "sub_priya_water",
            tenantId: "ten_aquapure_water",
            customerId: "usr_priya",
            householdId: "hh_sobha_b402",
            productId: "prod_aqua_20l_can",
            defaultQuantity: 1,
            shift: "MORNING",
            instructions: "Collect empty 20L bubbletop can from foyer",
            status: "ACTIVE",
            cadence: "CUSTOM",
            startDate: todayStr,
          },
          {
            id: "sub_rahul_tiffin",
            tenantId: "ten_sharma_tiffin",
            customerId: "usr_rahul",
            householdId: "hh_sobha_b402",
            productId: "prod_sharma_dinner_thali",
            defaultQuantity: 1,
            shift: "EVENING",
            instructions: "Deliver hot between 7:30 PM and 8:30 PM",
            status: "ACTIVE",
            cadence: "DAILY",
            startDate: todayStr,
          },
        ])
        .onConflictDoNothing();

      // 5. Seed Delivery Runs & Stops
      await db
        .insert(deliveryRunsTable)
        .values([
          {
            id: "run_2026-09-12_lunch_drv_ramesh",
            tenantId: "ten_sharma_tiffin",
            driverId: "drv_ramesh",
            driverName: "Ramesh Kumar",
            date: todayStr,
            shift: "LUNCH",
            totalStops: 4,
            completedStops: 1,
            skippedStops: 0,
            failedStops: 0,
            status: "IN_PROGRESS",
          },
        ])
        .onConflictDoNothing();

      await db
        .insert(deliveryStopsTable)
        .values([
          {
            id: "stop_run_lunch_01",
            runId: "run_2026-09-12_lunch_drv_ramesh",
            fulfillmentId: "ful_run_lunch_01",
            customerId: "usr_priya",
            customerName: "Priya Sundaram",
            customerPhone: "+91 98765 43210",
            society: "Sobha Classic",
            tower: "Tower B",
            floor: 4,
            flat: "B-402",
            serviceName: "Daily Executive Veg Lunch",
            quantity: 1,
            status: "DELIVERED",
            dropPreference: "DOORSTEP",
            notes: "Ring doorbell once, leave on shoe rack",
            deliveredAt: "12:15 PM",
            assetDelivered: 1,
            assetCollected: 1,
          },
          {
            id: "stop_run_lunch_02",
            runId: "run_2026-09-12_lunch_drv_ramesh",
            fulfillmentId: "ful_run_lunch_02",
            customerId: "usr_rahul",
            customerName: "Rahul Verma",
            customerPhone: "+91 98765 43211",
            society: "Sobha Classic",
            tower: "Tower B",
            floor: 1,
            flat: "B-101",
            serviceName: "Daily Executive Veg Lunch",
            quantity: 1,
            status: "PENDING",
            dropPreference: "HANDOVER",
            notes: "Hand over directly to security if flat bell unacknowledged",
          },
          {
            id: "stop_run_lunch_03",
            runId: "run_2026-09-12_lunch_drv_ramesh",
            fulfillmentId: "ful_run_lunch_03",
            customerId: "usr_ananya",
            customerName: "Ananya Deshmukh",
            customerPhone: "+91 98765 43217",
            society: "Sobha Classic",
            tower: "Tower A",
            floor: 8,
            flat: "A-804",
            serviceName: "Jain Satvik Thali",
            quantity: 1,
            status: "PENDING",
            dropPreference: "DOORSTEP",
          },
          {
            id: "stop_run_lunch_04",
            runId: "run_2026-09-12_lunch_drv_ramesh",
            fulfillmentId: "ful_run_lunch_04",
            customerId: "usr_suresh",
            customerName: "Suresh Nair",
            customerPhone: "+91 98765 43288",
            society: "Sobha Classic",
            tower: "Tower C",
            floor: 2,
            flat: "C-203",
            serviceName: "Homestyle Dal Roti",
            quantity: 2,
            status: "PENDING",
            dropPreference: "SECURITY_GATE",
          },
        ])
        .onConflictDoNothing();

      // 6. Seed Disputes
      await db
        .insert(disputesTable)
        .values([
          {
            id: "dsp_demo_01",
            tenantId: "ten_sharma_tiffin",
            customerId: "usr_rahul",
            customerName: "Rahul Verma (Sobha Classic B-101)",
            customerPhone: "+91 98765 43211",
            fulfillmentId: "ful_run_lunch_02",
            reason: "LATE_DELIVERY",
            disputedAmountPaise: 16000,
            status: "OPEN",
            customerComment: "Lunch arrived 1 hour past the office break cutoff window. Container was cold.",
          },
          {
            id: "dsp_demo_02",
            tenantId: "ten_aquapure_water",
            customerId: "usr_priya",
            customerName: "Priya Sundaram (Sobha Classic B-402)",
            customerPhone: "+91 98765 43210",
            fulfillmentId: "ful_demo_water_01",
            reason: "DAMAGED_OR_LEAKING",
            disputedAmountPaise: 8000,
            status: "OPEN",
            customerComment: "The tamper-proof neck seal of the 20L water can was broken on arrival.",
          },
          {
            id: "dsp_demo_03",
            tenantId: "ten_gupta_dairy",
            customerId: "usr_rahul",
            customerName: "Rahul Verma (Sobha Classic B-101)",
            customerPhone: "+91 98765 43211",
            fulfillmentId: "ful_demo_milk_01",
            reason: "WRONG_ITEM",
            disputedAmountPaise: 4200,
            status: "OPEN",
            customerComment: "Received Buffalo milk packet instead of A2 Desi Cow Milk ordered.",
          },
        ])
        .onConflictDoNothing();

      // 7. Seed Household Expenses
      await db
        .insert(householdExpensesTable)
        .values([
          {
            id: "exp_sobha_groceries",
            householdId: "hh_sobha_b402",
            description: "Sobha B-402 Monthly Dairy & Water Pool",
            totalAmountPaise: 240000,
            paidByUserId: "usr_priya",
            paidByName: "Priya Sundaram",
            paidByUpi: "priya@okaxis",
            strategy: "EQUAL",
            isFullySettled: false,
          },
        ])
        .onConflictDoNothing();

      await db
        .insert(householdExpenseParticipantsTable)
        .values([
          {
            id: "exp_part_priya",
            expenseId: "exp_sobha_groceries",
            userId: "usr_priya",
            name: "Priya Sundaram",
            phone: "+919876543210",
            sharePaise: 120000,
            isSettled: true,
            upiId: "priya@okaxis",
          },
          {
            id: "exp_part_rahul",
            expenseId: "exp_sobha_groceries",
            userId: "usr_rahul",
            name: "Rahul Verma",
            phone: "+919876543211",
            sharePaise: 120000,
            isSettled: false,
            upiId: "rahul@oksbi",
          },
        ])
        .onConflictDoNothing();

      // 8. Seed Digital Khata Ledger
      await db
        .insert(khataEntriesTable)
        .values([
          {
            id: "kht_priya_credit_01",
            tenantId: "ten_sharma_tiffin",
            customerId: "usr_priya",
            entryType: "PAYMENT",
            direction: "CREDIT",
            amountPaise: 300000,
            runningBalancePaise: -300000,
            referenceType: "PAYMENT",
            referenceId: "upi_tx_seed_01",
            description: "Monthly advance deposit for Executive Veg Lunch",
          },
          {
            id: "kht_priya_debit_01",
            tenantId: "ten_sharma_tiffin",
            customerId: "usr_priya",
            entryType: "FULFILLMENT_CHARGE",
            direction: "DEBIT",
            amountPaise: 12000,
            runningBalancePaise: -288000,
            referenceType: "FULFILLMENT",
            referenceId: "ful_run_lunch_01",
            description: "Daily Executive Veg Lunch fulfilled",
          },
        ])
        .onConflictDoNothing();
    } catch (error) {
      console.warn("Neon DB seed skipped or failed, fallback to memory:", error);
    }
  }

  seededInMemory = true;
  return { count: SEEDED_VENDORS.length, seeded: true };
}
