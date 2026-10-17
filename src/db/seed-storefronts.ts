/**
 * Fills the demo stores with storefront details and one-time menu items, and
 * adds a demo dairy plus a set of demo stores around Ranchi. Safe to re-run: updates by slug, inserts items by name.
 * Run after `db:seed`: `bun run src/db/seed-storefronts.ts`.
 */
import { and, eq } from "drizzle-orm";
import { scriptDb, scriptPool } from "./script-client";
import { availabilityRules, categories, products, providerProfiles, services, vendors } from "./schema";

type Item = {
  kind: "tiffin" | "water" | "milk" | "other" | "fitness" | "physio" | "mehndi" | "gifts" | string;
  name: string;
  section: string;
  pricePaise: number;
  description: string;
  isVeg?: boolean | null;
  shift?: "lunch" | "dinner" | "morning" | "evening";
  cutoffAt?: string;
  allowSubscription?: boolean;
  durationMinutes?: number;
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


type DemoVendor = {
  slug: string;
  name: string;
  phone: string;
  upiVpa: string;
  city: string;
  area: string;
  description: string;
  latitude: number;
  longitude: number;
  serviceRadiusKm: number;
  deliveryFeePaise: number;
  items: Item[];
  /** Booking providers: modes, weekly free hours and profile. Their items become services. */
  serviceModes?: string[];
  hours?: { days: string[]; start: string; end: string }[];
  profile?: { headline: string; qualifications: string; experienceYears: number; specialities: string[]; languages: string[]; gender: "female" | "male" };
};

const RANCHI: DemoVendor[] = [
  {
    slug: "maa-annapurna-rasoi-ranchi",
    name: "Maa Annapurna Rasoi",
    phone: "+919999900101",
    upiVpa: "maaannapurna.demo@upi",
    city: "Ranchi",
    area: "Lalpur",
    description: "Ghar ka Jharkhandi-Bihari khana from Lalpur. Dal-bhaat, sabzi, chokha and fresh rotis every day. Demo store.",
    latitude: 23.3751,
    longitude: 85.3361,
    serviceRadiusKm: 8,
    deliveryFeePaise: 0,
    items: [
      { kind: "tiffin", name: "Veg Lunch Thali", section: "Thalis", pricePaise: 8000, description: "Dal, bhaat, two sabzi, 4 roti, salad.", isVeg: true, cutoffAt: "10:00" },
      { kind: "tiffin", name: "Veg Dinner Thali", section: "Thalis", pricePaise: 8000, description: "Dal, sabzi, 5 roti, achar.", isVeg: true, shift: "dinner", cutoffAt: "17:00" },
      { kind: "tiffin", name: "Litti Chokha (4 pc)", section: "Specials", pricePaise: 6000, description: "Sattu litti, baingan-aloo chokha, ghee.", isVeg: true, allowSubscription: false },
      { kind: "tiffin", name: "Dhuska with Ghugni", section: "Specials", pricePaise: 5000, description: "Jharkhand-style rice-dal dhuska, 4 pc.", isVeg: true, shift: "morning", cutoffAt: "07:30", allowSubscription: false },
    ],
  },
  {
    slug: "harmu-ghar-ka-khana",
    name: "Harmu Ghar Ka Khana",
    phone: "+919999900102",
    upiVpa: "harmukhana.demo@upi",
    city: "Ranchi",
    area: "Harmu",
    description: "Monthly tiffin for students and working people near Harmu and Ashok Nagar. Light, less-oil meals. Demo store.",
    latitude: 23.3529,
    longitude: 85.2984,
    serviceRadiusKm: 7,
    deliveryFeePaise: 1000,
    items: [
      { kind: "tiffin", name: "Student Lunch Box", section: "Tiffins", pricePaise: 7000, description: "Dal, sabzi, 4 roti, rice.", isVeg: true, cutoffAt: "10:30" },
      { kind: "tiffin", name: "Diet Dinner Box", section: "Tiffins", pricePaise: 9000, description: "Multigrain roti, moong dal, salad, sabzi.", isVeg: true, shift: "dinner", cutoffAt: "17:30" },
      { kind: "tiffin", name: "Paneer Butter Masala + 4 Roti", section: "A la carte", pricePaise: 14000, description: "Rich gravy, soft rotis.", isVeg: true, allowSubscription: false },
    ],
  },
  {
    slug: "doranda-tiffin-point",
    name: "Doranda Tiffin Point",
    phone: "+919999900103",
    upiVpa: "dorandatiffin.demo@upi",
    city: "Ranchi",
    area: "Doranda",
    description: "Veg and non-veg tiffins around Doranda, Hinoo and the station side. Sunday special fish curry. Demo store.",
    latitude: 23.3252,
    longitude: 85.3249,
    serviceRadiusKm: 8,
    deliveryFeePaise: 1500,
    items: [
      { kind: "tiffin", name: "Veg Thali", section: "Thalis", pricePaise: 8500, description: "Dal, rice, sabzi, 4 roti.", isVeg: true, cutoffAt: "10:00" },
      { kind: "tiffin", name: "Chicken Curry Thali", section: "Thalis", pricePaise: 13000, description: "Home-style chicken, rice, 3 roti.", isVeg: false, cutoffAt: "10:00" },
      { kind: "tiffin", name: "Fish Curry Rice", section: "Specials", pricePaise: 15000, description: "Rohu in mustard gravy, steamed rice.", isVeg: false, allowSubscription: false },
      { kind: "tiffin", name: "Egg Curry + Rice", section: "Specials", pricePaise: 9000, description: "Two eggs, onion-tomato gravy.", isVeg: false, allowSubscription: false },
    ],
  },
  {
    slug: "subarnarekha-aqua-20l",
    name: "Subarnarekha Aqua 20L",
    phone: "+919999900104",
    upiVpa: "subarnarekha.demo@upi",
    city: "Ranchi",
    area: "Kanke Road",
    description: "RO + UV purified 20L jars for Kanke Road, Morabadi and Lalpur. Empties picked up on the same trip. Demo store.",
    latitude: 23.4052,
    longitude: 85.3221,
    serviceRadiusKm: 10,
    deliveryFeePaise: 0,
    items: [
      { kind: "water", name: "20L RO Water Jar", section: "Jars", pricePaise: 3500, description: "Sealed jar, delivered by 9 am.", isVeg: null, shift: "morning", cutoffAt: "08:00" },
      { kind: "water", name: "20L Chilled Jar", section: "Jars", pricePaise: 4500, description: "Cooled jar for summer afternoons.", isVeg: null, shift: "evening", cutoffAt: "14:00", allowSubscription: false },
    ],
  },
  {
    slug: "neel-jal-water-ranchi",
    name: "Neel Jal Water Supply",
    phone: "+919999900105",
    upiVpa: "neeljal.demo@upi",
    city: "Ranchi",
    area: "Ashok Nagar",
    description: "20L cans and 1L bottle cases for homes and offices from Ashok Nagar to Doranda. Demo store.",
    latitude: 23.3476,
    longitude: 85.3089,
    serviceRadiusKm: 9,
    deliveryFeePaise: 0,
    items: [
      { kind: "water", name: "20L Mineral Water Can", section: "Cans", pricePaise: 4000, description: "BIS-certified, returnable can.", isVeg: null, shift: "morning", cutoffAt: "08:00" },
      { kind: "water", name: "1L Bottles (12 pack)", section: "Bottles", pricePaise: 16000, description: "Sealed case.", isVeg: null, allowSubscription: false },
    ],
  },
  {
    slug: "gwala-fresh-dairy-ranchi",
    name: "Gwala Fresh Dairy",
    phone: "+919999900106",
    upiVpa: "gwaladairy.demo@upi",
    city: "Ranchi",
    area: "Bariatu",
    description: "Cow and buffalo milk at your door before 7 am, plus dahi, paneer and ghee. Demo store.",
    latitude: 23.3884,
    longitude: 85.3489,
    serviceRadiusKm: 7,
    deliveryFeePaise: 0,
    items: [
      { kind: "milk", name: "Cow Milk 1L", section: "Milk", pricePaise: 6000, description: "Fresh, delivered before 7 am.", isVeg: true, shift: "morning", cutoffAt: "21:00" },
      { kind: "milk", name: "Buffalo Milk 1L", section: "Milk", pricePaise: 7000, description: "Creamy, great for chai.", isVeg: true, shift: "morning", cutoffAt: "21:00" },
      { kind: "milk", name: "Fresh Dahi 500g", section: "Dahi & paneer", pricePaise: 5000, description: "Set overnight.", isVeg: true, shift: "morning", cutoffAt: "21:00" },
      { kind: "milk", name: "Desi Ghee 500ml", section: "Ghee", pricePaise: 38000, description: "Slow-cooked from cow milk.", isVeg: true, shift: "morning", cutoffAt: "21:00", allowSubscription: false },
    ],
  },
  {
    slug: "morabadi-daily-needs",
    name: "Morabadi Daily Needs",
    phone: "+919999900107",
    upiVpa: "morabadineeds.demo@upi",
    city: "Ranchi",
    area: "Morabadi",
    description: "Bread, eggs, atta and household basics delivered every morning around Morabadi and Bariatu. Demo store.",
    latitude: 23.3946,
    longitude: 85.3372,
    serviceRadiusKm: 6,
    deliveryFeePaise: 1000,
    items: [
      { kind: "other", name: "Brown Bread 400g", section: "Bakery", pricePaise: 5000, description: "Baked the same morning.", isVeg: true, shift: "morning", cutoffAt: "21:00" },
      { kind: "other", name: "Eggs (12)", section: "Eggs", pricePaise: 9000, description: "Farm eggs, one dozen.", isVeg: false, shift: "morning", cutoffAt: "21:00" },
      { kind: "other", name: "Chakki Atta 5kg", section: "Staples", pricePaise: 26000, description: "Stone-ground wheat flour.", isVeg: null, allowSubscription: false },
      { kind: "other", name: "Newspaper (Hindi)", section: "Daily", pricePaise: 600, description: "Morning paper at your door.", isVeg: null, shift: "morning", cutoffAt: "21:00" },
    ],
  },
  {
    slug: "craftyvibes-gifts-ranchi",
    name: "CraftyVibes Handcrafted Gifts",
    phone: "+919999900116",
    upiVpa: "craftyvibes.demo@upi",
    city: "Ranchi",
    area: "Kanke Road",
    description: "Customized gifts, resin floral art, photo lamps & curated celebration hampers. Handcrafted in Ranchi. Demo store.",
    latitude: 23.4012,
    longitude: 85.3255,
    serviceRadiusKm: 12,
    deliveryFeePaise: 2000,
    items: [
      { kind: "gifts", name: "Personalized 3D Illusion Photo Lamp", section: "Custom Lamps", pricePaise: 79900, description: "Warm LED acrylic lamp engraved with your custom photo & message.", isVeg: null, allowSubscription: false },
      { kind: "gifts", name: "Custom Resin Flower Preservation Frame", section: "Resin Art", pricePaise: 129900, description: "Handcrafted resin keepsake frame with golden flakes and custom text.", isVeg: null, allowSubscription: false },
      { kind: "gifts", name: "Handmade Scented Candle Gift Set (3 pack)", section: "Hampers", pricePaise: 59900, description: "Soy wax luxury aromatherapy candles in lavender, vanilla & rose.", isVeg: null, allowSubscription: false },
      { kind: "gifts", name: "Luxury Birthday / Anniversary Gift Hamper", section: "Hampers", pricePaise: 149900, description: "Curated gift box with custom mug, chocolates, handmade card and scented candle.", isVeg: null, allowSubscription: false },
    ],
  },
];


const WEEK = ["mon", "tue", "wed", "thu", "fri", "sat"];

/** Demo trainers and physiotherapists in Ranchi (booking providers). */
const RANCHI_PROVIDERS: DemoVendor[] = [
  {
    slug: "fitwithankit-ranchi",
    profile: { headline: "Certified personal trainer · weight loss & strength", qualifications: "ACE Certified Personal Trainer", experienceYears: 6, specialities: ["Weight loss", "Strength", "Home workouts", "Yoga"], languages: ["Hindi", "English"], gender: "male" },
    name: "Ankit Fitness Coaching",
    phone: "+919999900111",
    upiVpa: "ankitfit.demo@upi",
    city: "Ranchi",
    area: "Lalpur",
    description: "Certified personal trainer (ACE). Weight loss, strength and home workouts with minimal equipment. Demo provider.",
    latitude: 23.3739,
    longitude: 85.3342,
    serviceRadiusKm: 8,
    deliveryFeePaise: 0,
    serviceModes: ["home", "studio", "online"],
    hours: [
      { days: WEEK, start: "06:00", end: "10:00" },
      { days: WEEK, start: "17:00", end: "20:00" },
    ],
    items: [
      { kind: "fitness", name: "Trial session", section: "Personal training", pricePaise: 19900, description: "Fitness check, goal setting and a full workout.", isVeg: null, durationMinutes: 45 },
      { kind: "fitness", name: "Personal training (60 min)", section: "Personal training", pricePaise: 59900, description: "One-on-one session at home, gym or online.", isVeg: null, durationMinutes: 60 },
      { kind: "fitness", name: "Yoga & mobility (60 min)", section: "Yoga", pricePaise: 49900, description: "Flexibility, breathing and posture.", isVeg: null, durationMinutes: 60 },
    ],
  },
  {
    slug: "ironcore-gym-ranchi",
    profile: { headline: "Gym-floor coaching in Harmu, women-only slots", qualifications: "K11 certified coaches", experienceYears: 8, specialities: ["Strength", "Bodybuilding", "HIIT"], languages: ["Hindi", "English"], gender: "male" },
    name: "IronCore Trainers",
    phone: "+919999900112",
    upiVpa: "ironcore.demo@upi",
    city: "Ranchi",
    area: "Harmu",
    description: "Gym-floor trainers at Harmu. Strength, bodybuilding and women-only slots. Demo provider.",
    latitude: 23.3541,
    longitude: 85.3002,
    serviceRadiusKm: 6,
    deliveryFeePaise: 0,
    serviceModes: ["studio"],
    hours: [
      { days: WEEK, start: "05:30", end: "11:00" },
      { days: ["mon", "wed", "fri"], start: "16:00", end: "21:00" },
    ],
    items: [
      { kind: "fitness", name: "Strength coaching (60 min)", section: "Gym sessions", pricePaise: 39900, description: "Technique-first lifting with a coach.", isVeg: null, durationMinutes: 60 },
      { kind: "fitness", name: "Women-only HIIT (45 min)", section: "Gym sessions", pricePaise: 29900, description: "Small-group style, female trainer.", isVeg: null, durationMinutes: 45 },
    ],
  },
  {
    slug: "dr-meera-physio-ranchi",
    profile: { headline: "Orthopaedic physiotherapist · home visits", qualifications: "BPT, MPT (Ortho)", experienceYears: 9, specialities: ["Back pain", "Knee pain", "Post-surgery rehab", "Elderly care"], languages: ["Hindi", "English", "Bengali"], gender: "female" },
    name: "Dr. Meera's Physio Care",
    phone: "+919999900113",
    upiVpa: "meeraphysio.demo@upi",
    city: "Ranchi",
    area: "Bariatu",
    description: "BPT, MPT (Ortho). Back and knee pain, post-surgery rehab and elderly care at home. Demo provider.",
    latitude: 23.3871,
    longitude: 85.3478,
    serviceRadiusKm: 10,
    deliveryFeePaise: 0,
    serviceModes: ["home", "studio"],
    hours: [
      { days: WEEK, start: "09:00", end: "13:00" },
      { days: ["mon", "tue", "wed", "thu", "fri"], start: "16:00", end: "19:00" },
    ],
    items: [
      { kind: "physio", name: "Physiotherapy at home (45 min)", section: "Sessions", pricePaise: 79900, description: "Assessment and treatment at your home. Equipment brought along.", isVeg: null, durationMinutes: 45 },
      { kind: "physio", name: "Clinic session (45 min)", section: "Sessions", pricePaise: 59900, description: "At the Bariatu clinic with IFT/TENS if needed.", isVeg: null, durationMinutes: 45 },
      { kind: "physio", name: "Post-surgery rehab (60 min)", section: "Rehab", pricePaise: 99900, description: "Knee/hip replacement and fracture rehab plan.", isVeg: null, durationMinutes: 60 },
    ],
  },
  {
    slug: "kineto-physio-doranda",
    profile: { headline: "Sports injury and posture rehab", qualifications: "BPT, Sports Physio certification", experienceYears: 5, specialities: ["Sports injuries", "Posture", "Online plans"], languages: ["Hindi", "English"], gender: "male" },
    name: "Kineto Physio & Sports Rehab",
    phone: "+919999900114",
    upiVpa: "kineto.demo@upi",
    city: "Ranchi",
    area: "Doranda",
    description: "Sports injuries, posture correction and online exercise plans. Demo provider.",
    latitude: 23.3259,
    longitude: 85.3262,
    serviceRadiusKm: 8,
    deliveryFeePaise: 0,
    serviceModes: ["home", "online"],
    hours: [{ days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"], start: "07:00", end: "12:00" }],
    items: [
      { kind: "physio", name: "Sports injury session (60 min)", section: "Sessions", pricePaise: 89900, description: "Assessment, taping and a home exercise plan.", isVeg: null, durationMinutes: 60 },
      { kind: "physio", name: "Online consultation (30 min)", section: "Online", pricePaise: 34900, description: "Video consult with an exercise plan.", isVeg: null, durationMinutes: 30 },
    ],
  },
  {
    slug: "shree-bridal-mehndi-ranchi",
    profile: {
      headline: "Professional bridal & festive mehndi artist · 8+ yrs experience",
      qualifications: "Certified Henna Designer & Bridal Specialist",
      experienceYears: 8,
      specialities: ["Bridal Mehndi", "Arabic Henna", "Rajasthani Traditional", "Indo-Western", "Baby Shower & Karwa Chauth"],
      languages: ["Hindi", "English"],
      gender: "female",
    },
    name: "Shree Bridal Mehndi Designer",
    phone: "+919999900115",
    upiVpa: "shreemehndi.demo@upi",
    city: "Ranchi",
    area: "Lalpur",
    description: "Specialist in Bridal, Rajasthani, Arabic & Indo-Western mehndi designs. Organic dark stain henna, available for home visits across Ranchi. Demo artist.",
    latitude: 23.3712,
    longitude: 85.3355,
    serviceRadiusKm: 12,
    deliveryFeePaise: 0,
    serviceModes: ["home", "studio"],
    hours: [{ days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"], start: "09:00", end: "20:00" }],
    items: [
      { kind: "mehndi", name: "Bridal Full Hands & Feet (Organic Henna)", section: "Bridal Packages", pricePaise: 350000, description: "Intricate bridal patterns up to elbows and calves. 100% natural organic dark stain henna.", isVeg: null, durationMinutes: 180 },
      { kind: "mehndi", name: "Arabic Designer Mehndi (Both Hands)", section: "Occasions", pricePaise: 69900, description: "Flowing floral and geometric Arabic motifs on both hands (front & back).", isVeg: null, durationMinutes: 45 },
      { kind: "mehndi", name: "Festive / Party Guest Mehndi (Per Hand)", section: "Occasions", pricePaise: 25000, description: "Quick elegant henna for festive occasions, family and guests.", isVeg: null, durationMinutes: 20 },
    ],
  },
];

async function upsertServices(vendorId: string, items: Item[], modes: string[]) {
  for (const item of items) {
    const [existing] = await scriptDb
      .select({ id: services.id })
      .from(services)
      .where(and(eq(services.vendorId, vendorId), eq(services.name, item.name)))
      .limit(1);
    if (existing) continue;
    await scriptDb.insert(services).values({
      vendorId,
      categoryId: item.kind,
      name: item.name,
      description: item.description,
      durationMinutes: item.durationMinutes ?? 60,
      pricePaise: item.pricePaise,
      modes: item.name.toLowerCase().includes("online") ? ["online"] : item.name.toLowerCase().includes("clinic") ? ["studio"] : modes,
    });
  }
}

async function ensureVendor(v: DemoVendor) {
  const { items, hours, profile, ...fields } = v;
  const provider = !!hours;
  let [row] = await scriptDb.select({ id: vendors.id }).from(vendors).where(eq(vendors.slug, v.slug)).limit(1);
  if (!row) {
    [row] = await scriptDb
      .insert(vendors)
      .values({ ...fields, plan: "free", status: "active", businessType: provider ? "booking" : "delivery" })
      .returning({ id: vendors.id });
  }
  if (provider) {
    await scriptDb.update(vendors).set({ businessType: "booking" }).where(eq(vendors.id, row!.id));
    await upsertServices(row!.id, items, v.serviceModes ?? ["home"]);
    if (profile) {
      await scriptDb.insert(providerProfiles).values({ vendorId: row!.id, ...profile }).onConflictDoUpdate({ target: providerProfiles.vendorId, set: profile });
    }
  } else {
    await upsertItems(row!.id, items);
  }
  if (hours) {
    const existing = await scriptDb.select({ id: availabilityRules.id }).from(availabilityRules).where(eq(availabilityRules.vendorId, row!.id)).limit(1);
    if (existing.length === 0) {
      await scriptDb.insert(availabilityRules).values(
        hours.flatMap((h) => h.days.map((weekday) => ({ vendorId: row!.id, weekday, startTime: h.start, endTime: h.end })))
      );
    }
  }
  console.log("✓", v.slug);
}

async function main() {
  const NEW_CATEGORIES = [
    {
      id: "mehndi",
      label: "Mehndi Artists",
      shortLabel: "Mehndi",
      emoji: "🌿",
      blurb: "Bridal, Arabic & festive mehndi designers at home",
      tint: "#FEF3C7",
      coverFrom: "#FDE68A",
      coverTo: "#D97706",
      sort: 4,
      isActive: true,
      fulfilment: "booking" as const,
    },
    {
      id: "gifts",
      label: "Custom Gifts & Hampers",
      shortLabel: "Gifts",
      emoji: "🎁",
      blurb: "Personalized hampers, resin art & handcrafted gifts",
      tint: "#FCE7F3",
      coverFrom: "#FBCFE8",
      coverTo: "#DB2777",
      sort: 7,
      isActive: true,
      fulfilment: "delivery" as const,
    },
  ];

  for (const cat of NEW_CATEGORIES) {
    await scriptDb
      .insert(categories)
      .values(cat)
      .onConflictDoUpdate({
        target: categories.id,
        set: {
          label: cat.label,
          shortLabel: cat.shortLabel,
          emoji: cat.emoji,
          blurb: cat.blurb,
          tint: cat.tint,
          coverFrom: cat.coverFrom,
          coverTo: cat.coverTo,
          sort: cat.sort,
          fulfilment: cat.fulfilment,
        },
      });
    console.log("✓ category", cat.id);
  }

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

  for (const v of RANCHI) await ensureVendor(v);
  for (const v of RANCHI_PROVIDERS) await ensureVendor(v);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => scriptPool.end());
