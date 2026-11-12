/**
 * RUXs Store starter data: the 15 categories (also seeded by migration 0024)
 * and a few sample products per aisle. Every sample product is INACTIVE and
 * has zero stock: an admin reviews the details, adds real photos and stock,
 * then switches it on. Safe to re-run: categories and products skip by id/SKU.
 *
 *   bun run db:seed:store
 */
import { scriptDb, scriptPool } from "./script-client";
import { storeCategories, storeProducts, storeSettings } from "./schema";
import { storeSlug } from "../core/store";

const CATEGORIES: { id: string; name: string; description: string; emojiIcon: string }[] = [
  { id: "diy-craft-kits", name: "DIY & craft kits", description: "Make-it-yourself kits with everything in the box.", emojiIcon: "Scissors" },
  { id: "robotics-electronics", name: "Robotics & electronics", description: "Build and program robots, circuits and gadgets.", emojiIcon: "Bot" },
  { id: "science-lab-kits", name: "Science & lab kits", description: "Hands-on experiments for curious minds.", emojiIcon: "FlaskConical" },
  { id: "coding-stem-toys", name: "Coding & STEM toys", description: "Learn logic and coding through play.", emojiIcon: "Code" },
  { id: "art-painting", name: "Art & painting supplies", description: "Colours, brushes, canvases and sketch books.", emojiIcon: "Palette" },
  { id: "puzzles-brain-games", name: "Puzzles & brain games", description: "Jigsaws, logic puzzles and memory games.", emojiIcon: "Puzzle" },
  { id: "building-blocks", name: "Building blocks & construction", description: "Blocks, bricks and construction sets.", emojiIcon: "Blocks" },
  { id: "board-card-games", name: "Board games & card games", description: "Games for the whole family.", emojiIcon: "Dices" },
  { id: "books-workbooks", name: "Books & activity workbooks", description: "Story books and activity workbooks.", emojiIcon: "BookOpen" },
  { id: "musical-toys", name: "Musical toys & instruments", description: "First instruments and musical toys.", emojiIcon: "Music" },
  { id: "outdoor-sports", name: "Outdoor & sports play", description: "Balls, skipping ropes and outdoor play.", emojiIcon: "Volleyball" },
  { id: "montessori-early-learning", name: "Montessori & early learning (0–5)", description: "Gentle learning toys for little ones.", emojiIcon: "Baby" },
  { id: "school-stationery", name: "School & stationery", description: "Notebooks, pencils and school supplies.", emojiIcon: "PencilRuler" },
  { id: "party-gift-hampers", name: "Party & gift hampers", description: "Return gifts and ready hampers.", emojiIcon: "Gift" },
  { id: "spare-parts-refills", name: "Spare parts & refills", description: "Batteries, motors, sensors and paint refills.", emojiIcon: "Wrench" },
];

type Sample = {
  categoryId: string;
  sku: string;
  name: string;
  tagline: string;
  pricePaise: number;
  ageMin: number;
  ageMax: number | null;
  skills: string[];
  boxContents: string[];
};

// Placeholders for an admin to edit: plain descriptions, no ratings or claims.
const SAMPLES: Sample[] = [
  { categoryId: "diy-craft-kits", sku: "RS-DIY-001", name: "Paper craft starter kit", tagline: "Fold, cut and glue simple paper models", pricePaise: 34900, ageMin: 5, ageMax: 10, skills: ["Creativity", "Motor skills"], boxContents: ["Coloured sheets", "Glue stick", "Safety scissors", "Instruction card"] },
  { categoryId: "diy-craft-kits", sku: "RS-DIY-002", name: "Clay modelling set", tagline: "Air-dry clay with shaping tools", pricePaise: 44900, ageMin: 4, ageMax: 10, skills: ["Creativity", "Motor skills"], boxContents: ["Air-dry clay", "Shaping tools", "Guide"] },
  { categoryId: "robotics-electronics", sku: "RS-ROB-001", name: "Solar robot kit", tagline: "Build a small robot that runs on sunlight", pricePaise: 89900, ageMin: 8, ageMax: 14, skills: ["STEM", "Problem solving"], boxContents: ["Solar panel", "Motor", "Plastic parts", "Manual"] },
  { categoryId: "robotics-electronics", sku: "RS-ROB-002", name: "Basic circuits kit", tagline: "Snap-together circuits with a bulb, buzzer and switch", pricePaise: 79900, ageMin: 8, ageMax: 14, skills: ["STEM", "Electronics"], boxContents: ["Snap parts", "Battery holder", "Project book"] },
  { categoryId: "science-lab-kits", sku: "RS-SCI-001", name: "Kitchen science kit", tagline: "Simple experiments with everyday materials", pricePaise: 59900, ageMin: 7, ageMax: 12, skills: ["STEM", "Curiosity"], boxContents: ["Test tubes", "Measuring cups", "Experiment cards"] },
  { categoryId: "coding-stem-toys", sku: "RS-COD-001", name: "Coding cards game", tagline: "Learn sequencing and loops without a screen", pricePaise: 39900, ageMin: 5, ageMax: 10, skills: ["Logic", "Coding basics"], boxContents: ["Card deck", "Game board", "Rule book"] },
  { categoryId: "art-painting", sku: "RS-ART-001", name: "Watercolour paint set", tagline: "Watercolours with brushes and a pad", pricePaise: 29900, ageMin: 4, ageMax: null, skills: ["Creativity"], boxContents: ["Watercolour cakes", "2 brushes", "Paper pad"] },
  { categoryId: "puzzles-brain-games", sku: "RS-PUZ-001", name: "100-piece jigsaw puzzle", tagline: "A colourful jigsaw for focus and patience", pricePaise: 24900, ageMin: 5, ageMax: null, skills: ["Focus", "Problem solving"], boxContents: ["100 pieces", "Picture guide"] },
  { categoryId: "building-blocks", sku: "RS-BLK-001", name: "Building blocks tub", tagline: "Interlocking blocks for free building", pricePaise: 69900, ageMin: 3, ageMax: 8, skills: ["Creativity", "Motor skills"], boxContents: ["Blocks", "Storage tub"] },
  { categoryId: "montessori-early-learning", sku: "RS-MON-001", name: "Shape sorter", tagline: "Wooden shapes to sort and stack", pricePaise: 49900, ageMin: 1, ageMax: 3, skills: ["Motor skills", "Shapes"], boxContents: ["Wooden box", "Shape blocks"] },
  { categoryId: "spare-parts-refills", sku: "RS-SPR-001", name: "AA batteries (pack of 4)", tagline: "Spare batteries for kits and toys", pricePaise: 9900, ageMin: 0, ageMax: null, skills: [], boxContents: ["4 AA batteries"] },
];

async function main() {
  await scriptDb.insert(storeCategories).values(CATEGORIES.map((c, i) => ({ ...c, sort: i }))).onConflictDoNothing();
  console.log(`✓ ${CATEGORIES.length} store categories`);

  await scriptDb
    .insert(storeSettings)
    .values({ id: 1, codMaxPaise: 300000, deliveryFeePaise: 4000, freeDeliveryAbovePaise: 49900 })
    .onConflictDoNothing();

  const rows = SAMPLES.map((s) => ({
    ...s,
    slug: storeSlug(s.name),
    description: "",
    stock: 0,
    isActive: false, // admin reviews, adds photos and stock, then switches it on
    isFeatured: false,
  }));
  const inserted = await scriptDb.insert(storeProducts).values(rows).onConflictDoNothing().returning({ sku: storeProducts.sku });
  console.log(`✓ ${inserted.length} sample products added (inactive), ${rows.length - inserted.length} already there`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => scriptPool.end());
