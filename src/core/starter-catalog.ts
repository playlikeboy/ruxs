import type { VendorType } from "./vendor-types";

/**
 * A conventional first menu for each vendor type, so a new store is never empty.
 * Owners edit prices or archive anything that does not fit. Prices are paise.
 */
export interface StarterProduct {
  name: string;
  description: string;
  section: string;
  shift: "lunch" | "dinner" | "morning" | "evening";
  pricePaise: number;
  depositPaise?: number;
  assetName?: string;
  cutoffAt: string;
  isVeg?: boolean;
  allowSubscription?: boolean;
}

export interface StarterService {
  name: string;
  description: string;
  durationMinutes: number;
  pricePaise: number;
  modes: ("home" | "studio" | "online")[];
}

export interface StarterKidsClass {
  title: string;
  description: string;
  minAge: number;
  maxAge: number;
  durationMinutes: number;
  pricePaise: number;
  deliveryModes: ("home" | "studio" | "online")[];
}

export type StarterCatalog =
  | { kind: "products"; items: StarterProduct[] }
  | { kind: "services"; items: StarterService[] }
  | { kind: "kids"; items: StarterKidsClass[] };

const PRODUCTS: Partial<Record<VendorType, StarterProduct[]>> = {
  tiffin: [
    { name: "Veg lunch thali", description: "4 roti, rice, dal, seasonal sabzi, salad", section: "Thalis", shift: "lunch", pricePaise: 8000, cutoffAt: "10:00", isVeg: true, assetName: "dabba" },
    { name: "Mini lunch", description: "3 roti, dal, sabzi", section: "Thalis", shift: "lunch", pricePaise: 6000, cutoffAt: "10:00", isVeg: true, assetName: "dabba" },
    { name: "Veg dinner thali", description: "4 roti, rice, dal, sabzi", section: "Thalis", shift: "dinner", pricePaise: 8000, cutoffAt: "17:00", isVeg: true, assetName: "dabba" },
    { name: "Egg curry meal", description: "Egg curry, rice, 2 roti", section: "Specials", shift: "lunch", pricePaise: 9000, cutoffAt: "10:00", isVeg: false, assetName: "dabba" },
  ],
  water: [
    { name: "20L RO water can", description: "Sealed 20 litre can, delivered to your door", section: "Water cans", shift: "morning", pricePaise: 3000, depositPaise: 15000, assetName: "can", cutoffAt: "20:00", isVeg: true },
    { name: "20L chilled can", description: "Chilled 20 litre can", section: "Water cans", shift: "evening", pricePaise: 4000, depositPaise: 15000, assetName: "can", cutoffAt: "14:00", isVeg: true },
    { name: "1L bottles, pack of 12", description: "Packaged drinking water", section: "Bottles", shift: "morning", pricePaise: 18000, cutoffAt: "20:00", isVeg: true, allowSubscription: false },
  ],
  milk: [
    { name: "Cow milk, 1 litre", description: "Fresh, delivered before 7 am", section: "Milk", shift: "morning", pricePaise: 6000, cutoffAt: "21:00", isVeg: true },
    { name: "Buffalo milk, 1 litre", description: "Full cream, delivered before 7 am", section: "Milk", shift: "morning", pricePaise: 7000, cutoffAt: "21:00", isVeg: true },
    { name: "Curd, 500 g", description: "Set fresh every morning", section: "Dairy", shift: "morning", pricePaise: 4000, cutoffAt: "21:00", isVeg: true },
    { name: "Paneer, 200 g", description: "Soft fresh paneer", section: "Dairy", shift: "morning", pricePaise: 9000, cutoffAt: "21:00", isVeg: true, allowSubscription: false },
  ],
  gifts: [
    { name: "Birthday gift hamper", description: "Chocolates, card and a small gift, wrapped", section: "Hampers", shift: "evening", pricePaise: 79900, cutoffAt: "12:00", allowSubscription: false },
    { name: "Fresh flower bouquet", description: "Seasonal flowers, hand tied", section: "Flowers", shift: "evening", pricePaise: 49900, cutoffAt: "12:00", allowSubscription: false },
    { name: "Photo mug", description: "Your photo printed on a ceramic mug", section: "Personalised", shift: "evening", pricePaise: 34900, cutoffAt: "12:00", allowSubscription: false },
  ],
  store: [
    { name: "Bread, 400 g", description: "Fresh sandwich bread", section: "Daily needs", shift: "morning", pricePaise: 4500, cutoffAt: "21:00", isVeg: true },
    { name: "Eggs, 6 pcs", description: "Farm eggs", section: "Daily needs", shift: "morning", pricePaise: 4800, cutoffAt: "21:00", isVeg: false },
    { name: "Newspaper", description: "Daily morning newspaper", section: "Daily needs", shift: "morning", pricePaise: 600, cutoffAt: "21:00" },
  ],
  kids_products: [
    { name: "Craft starter kit", description: "Colours, glue, paper and a project guide", section: "Kits", shift: "evening", pricePaise: 49900, cutoffAt: "12:00", allowSubscription: false },
    { name: "Science experiment box", description: "5 safe experiments for ages 6 to 10", section: "Kits", shift: "evening", pricePaise: 79900, cutoffAt: "12:00", allowSubscription: false },
  ],
};

const SERVICES: Partial<Record<VendorType, StarterService[]>> = {
  fitness: [
    { name: "Trial session", description: "Meet your trainer and plan your goals", durationMinutes: 45, pricePaise: 19900, modes: ["home", "studio"] },
    { name: "Personal training, 1 hour", description: "Strength and fat loss, one to one", durationMinutes: 60, pricePaise: 59900, modes: ["home", "studio"] },
    { name: "Yoga at home", description: "Breathing, mobility and flexibility", durationMinutes: 60, pricePaise: 49900, modes: ["home", "online"] },
  ],
  physio: [
    { name: "Assessment", description: "First visit: diagnosis and a treatment plan", durationMinutes: 45, pricePaise: 50000, modes: ["home", "studio"] },
    { name: "Back and neck pain session", description: "Manual therapy and guided exercise", durationMinutes: 45, pricePaise: 60000, modes: ["home", "studio"] },
    { name: "Post-surgery rehab", description: "Knee, hip or shoulder recovery", durationMinutes: 60, pricePaise: 80000, modes: ["home"] },
  ],
  mehndi: [
    { name: "Simple mehndi, both hands", description: "Arabic or floral, front side", durationMinutes: 60, pricePaise: 50000, modes: ["home", "studio"] },
    { name: "Party mehndi", description: "Both hands, front and back", durationMinutes: 90, pricePaise: 120000, modes: ["home", "studio"] },
    { name: "Bridal mehndi", description: "Full hands and feet, organic henna", durationMinutes: 240, pricePaise: 600000, modes: ["home"] },
  ],
};

const KIDS: Partial<Record<VendorType, StarterKidsClass[]>> = {
  kids_performing_arts: [
    { title: "Bollywood dance for beginners", description: "Fun choreography, rhythm and stage confidence", minAge: 5, maxAge: 12, durationMinutes: 60, pricePaise: 49900, deliveryModes: ["studio"] },
    { title: "Hip hop basics", description: "Grooves, footwork and freestyle", minAge: 8, maxAge: 16, durationMinutes: 60, pricePaise: 59900, deliveryModes: ["studio"] },
  ],
  kids_academics: [
    { title: "Maths and science tuition", description: "Homework help and concept practice", minAge: 6, maxAge: 14, durationMinutes: 60, pricePaise: 39900, deliveryModes: ["home", "online"] },
    { title: "English reading and writing", description: "Phonics, reading aloud and creative writing", minAge: 5, maxAge: 10, durationMinutes: 60, pricePaise: 34900, deliveryModes: ["home", "online"] },
  ],
  kids_stem: [
    { title: "Scratch coding for kids", description: "Build games and animations step by step", minAge: 7, maxAge: 13, durationMinutes: 60, pricePaise: 59900, deliveryModes: ["studio", "online"] },
    { title: "Robotics starter", description: "Sensors, motors and a robot to take home", minAge: 8, maxAge: 14, durationMinutes: 90, pricePaise: 89900, deliveryModes: ["studio"] },
  ],
  kids_arts_crafts: [
    { title: "Drawing and painting", description: "Sketching, colours and a finished artwork", minAge: 4, maxAge: 12, durationMinutes: 60, pricePaise: 39900, deliveryModes: ["studio", "home"] },
    { title: "Clay modelling", description: "Shape, dry and paint a clay model", minAge: 5, maxAge: 12, durationMinutes: 60, pricePaise: 44900, deliveryModes: ["studio"] },
  ],
  kids_school_projects: [
    { title: "Science model help", description: "Plan and build a working school model", minAge: 8, maxAge: 16, durationMinutes: 90, pricePaise: 69900, deliveryModes: ["studio", "home"] },
  ],
  kids_camps: [
    { title: "Weekend activity club", description: "Games, crafts and stories with friends", minAge: 5, maxAge: 12, durationMinutes: 180, pricePaise: 79900, deliveryModes: ["studio"] },
  ],
  kids_sports_fitness: [
    { title: "Kids yoga", description: "Balance, breathing and focus", minAge: 5, maxAge: 12, durationMinutes: 45, pricePaise: 29900, deliveryModes: ["studio", "online"] },
    { title: "Chess for beginners", description: "Rules, openings and friendly games", minAge: 6, maxAge: 14, durationMinutes: 60, pricePaise: 39900, deliveryModes: ["studio", "online"] },
  ],
  kids_life_skills: [
    { title: "Public speaking", description: "Speak clearly and confidently", minAge: 7, maxAge: 14, durationMinutes: 60, pricePaise: 49900, deliveryModes: ["studio", "online"] },
  ],
  kids_institutions: [
    { title: "Preschool trial day", description: "A full morning in our play-based classroom", minAge: 3, maxAge: 5, durationMinutes: 180, pricePaise: 0, deliveryModes: ["studio"] },
  ],
  kids: [
    { title: "Activity trial class", description: "Try a class and meet the teacher", minAge: 4, maxAge: 12, durationMinutes: 60, pricePaise: 29900, deliveryModes: ["studio"] },
  ],
};

export function starterCatalog(type: VendorType): StarterCatalog | null {
  if (PRODUCTS[type]) return { kind: "products", items: PRODUCTS[type]! };
  if (SERVICES[type]) return { kind: "services", items: SERVICES[type]! };
  if (KIDS[type]) return { kind: "kids", items: KIDS[type]! };
  return null;
}
