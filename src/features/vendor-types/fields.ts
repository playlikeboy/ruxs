import type { VendorType } from "@/core/vendor-types";

/*
 * The type-specific fields each vendor type fills in. One list drives both the
 * merchant form (components/type-fields.tsx) and the server validation
 * (schemas.ts), so the two can't drift. Keys are the Drizzle column names of the
 * matching table in db/schema/vendor-types.ts.
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
  | { key: string; label: string; kind: "time"; required?: boolean; hint?: string }
  | { key: string; label: string; kind: "image"; hint?: string }
  | { key: string; label: string; kind: "images"; max?: number; hint?: string; isCertificate?: boolean }
  | { key: string; label: string; kind: "video"; placeholder?: string; hint?: string };

export type FieldValue = string | number | boolean | string[] | null;
export type FieldValues = Record<string, FieldValue>;

const opts = (...pairs: [string, string][]): Option[] => pairs.map(([value, label]) => ({ value, label }));

const WEEKDAYS = opts(["mon", "Mon"], ["tue", "Tue"], ["wed", "Wed"], ["thu", "Thu"], ["fri", "Fri"], ["sat", "Sat"], ["sun", "Sun"]);
const GENDER = opts(["female", "Female"], ["male", "Male"], ["other", "Other"]);
const LANGUAGES: Field = { key: "languages", label: "Languages you speak", kind: "tags", placeholder: "Hindi, English" };

// Shared media and safety fields
const CERTIFICATES: Field = {
  key: "certificates",
  label: "Certificates & Accreditations (ImgBB)",
  kind: "images",
  max: 10,
  isCertificate: true,
  hint: "Upload qualification degrees, coaching accreditations, or police verification documents.",
};

const GALLERY: Field = {
  key: "galleryImages",
  label: "Studio & Activity Photos (ImgBB)",
  kind: "images",
  max: 8,
  hint: "Show your workspace, classrooms, or past activities.",
};

const PREVIEW_VIDEO: Field = {
  key: "previewVideoUrl",
  label: "Preview Video (YouTube Link)",
  kind: "video",
  placeholder: "https://www.youtube.com/watch?v=...",
  hint: "Parents can preview your demo class, teaching style, or dance recital.",
};

const POSTER_IMAGE: Field = {
  key: "posterUrl",
  label: "Card Poster Image (ImgBB)",
  kind: "image",
  hint: "Shown on cards in the kids discovery feed.",
};

const ITEM_VIDEO: Field = {
  key: "videoUrl",
  label: "Activity Preview Video (YouTube)",
  kind: "video",
  placeholder: "https://www.youtube.com/watch?v=...",
  hint: "Optional YouTube video showing this specific class or workshop.",
};

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
    { key: "headline", label: "Headline", kind: "text", max: 120, placeholder: "Kids Activity & Learning Academy" },
    { key: "qualifications", label: "Qualifications", kind: "text", max: 200, placeholder: "B.Ed, certified educator" },
    { key: "experienceYears", label: "Experience", kind: "number", min: 0, max: 60, required: true, suffix: "years" },
    { key: "specialties", label: "What you teach", kind: "tags", placeholder: "Robotics, Chess, Clay art" },
    LANGUAGES,
    CERTIFICATES,
    PREVIEW_VIDEO,
    GALLERY,
  ],

  // ── 10 Differentiated Kids Types Profiles ──────────────────────────────────
  kids_academics: [
    { key: "headline", label: "Headline", kind: "text", max: 120, placeholder: "Home tutor for Nursery–Class 5 · phonics & maths" },
    { key: "qualifications", label: "Qualifications & Degrees", kind: "text", max: 200, placeholder: "B.Ed, M.Sc Mathematics, Certified Phonics Trainer" },
    { key: "experienceYears", label: "Teaching Experience", kind: "number", min: 0, max: 50, required: true, suffix: "years" },
    { key: "subjects", label: "Subjects You Teach", kind: "tags", placeholder: "Mathematics, Phonics, English, Hindi, Abacus, EVS" },
    { key: "board", label: "School Curriculum Board", kind: "select", options: opts(["all", "All boards"], ["cbse", "CBSE"], ["icse", "ICSE"], ["state", "State Board"], ["ib", "IB / Cambridge"]) },
    { key: "homeTuitionAvailable", label: "Available for Home Tutoring (Child's Home)", kind: "bool" },
    { key: "guardianSupervisionRequired", label: "Guardian Must Be Present During Home Session", kind: "bool", hint: "Mandatory safeguard for 1-on-1 home tutoring" },
    CERTIFICATES,
    PREVIEW_VIDEO,
    GALLERY,
  ],

  kids_stem: [
    { key: "headline", label: "Headline", kind: "text", max: 120, placeholder: "STEM, robotics & coding instructor for ages 6–15" },
    { key: "qualifications", label: "Certifications & Experience", kind: "text", max: 200, placeholder: "B.Tech Computer Science, Certified LEGO Robotics Mentor" },
    { key: "experienceYears", label: "Teaching Experience", kind: "number", min: 0, max: 50, required: true, suffix: "years" },
    { key: "disciplines", label: "Disciplines", kind: "tags", placeholder: "Robotics, Scratch Coding, Python, Arduino, Science Experiments" },
    { key: "toolsUsed", label: "Hardware & Kits Used", kind: "tags", placeholder: "LEGO Spike, Micro:bit, Arduino, Tinkercad" },
    { key: "kitProvided", label: "Hardware/Electronics Kits Provided in Class", kind: "bool" },
    { key: "labEquipped", label: "Has Equipped STEM Lab/Maker Space", kind: "bool" },
    { key: "homeTuitionAvailable", label: "Available for Home Visits", kind: "bool" },
    CERTIFICATES,
    PREVIEW_VIDEO,
    GALLERY,
  ],

  kids_performing_arts: [
    { key: "headline", label: "Headline", kind: "text", max: 120, placeholder: "Certified dance choreographer & classical music tutor" },
    { key: "qualifications", label: "Dance/Music Accreditations", kind: "text", max: 200, placeholder: "Visharad in Kathak / Trinity Grade 5 Guitar" },
    { key: "experienceYears", label: "Performance & Teaching Experience", kind: "number", min: 0, max: 50, required: true, suffix: "years" },
    { key: "artForms", label: "Art Forms Offered", kind: "multi", options: opts(["dance", "Dance"], ["vocal", "Vocal Music"], ["instrument", "Instrument"], ["drama", "Theatre & Drama"], ["speaking", "Public Speaking"]) },
    { key: "danceStyles", label: "Dance & Music Styles", kind: "tags", placeholder: "Bollywood, Kathak, Hip-Hop, Classical, Keyboard, Guitar" },
    { key: "instruments", label: "Instruments Taught", kind: "tags", placeholder: "Keyboard, Guitar, Tabla, Ukulele, Drums" },
    { key: "homeTuitionAvailable", label: "Available for Home Lessons", kind: "bool" },
    { key: "guardianSupervisionRequired", label: "Guardian Must Be Present During Home Session", kind: "bool" },
    { key: "auditionPrep", label: "Prepares Children for Stage Shows & Competitions", kind: "bool" },
    CERTIFICATES,
    PREVIEW_VIDEO,
    GALLERY,
  ],

  kids_arts_crafts: [
    { key: "headline", label: "Headline", kind: "text", max: 120, placeholder: "Creative art & clay modelling teacher for young minds" },
    { key: "qualifications", label: "Art Qualifications", kind: "text", max: 200, placeholder: "BFA, Diploma in Fine Arts & Pottery" },
    { key: "experienceYears", label: "Art & Teaching Experience", kind: "number", min: 0, max: 50, required: true, suffix: "years" },
    { key: "craftMediums", label: "Mediums You Teach", kind: "tags", placeholder: "Watercolour, Canvas Painting, Clay Modelling, Origami, Calligraphy" },
    { key: "materialsIncluded", label: "Art & Craft Supplies Included in Session Fee", kind: "bool" },
    { key: "homeTuitionAvailable", label: "Available for In-Home Workshops", kind: "bool" },
    CERTIFICATES,
    PREVIEW_VIDEO,
    GALLERY,
  ],

  kids_school_projects: [
    { key: "headline", label: "Headline", kind: "text", max: 120, placeholder: "Science working models & school competition project specialist" },
    { key: "qualifications", label: "Maker Background", kind: "text", max: 200, placeholder: "B.Sc Physics, 7+ years creating working models" },
    { key: "experienceYears", label: "Experience", kind: "number", min: 0, max: 50, required: true, suffix: "years" },
    { key: "projectCategories", label: "Specialities", kind: "tags", placeholder: "Working Science Models, EVS Scrapbooks, Dioramas, Charts, Props" },
    { key: "turnaroundDays", label: "Standard Turnaround Time", kind: "number", min: 1, max: 30, required: true, suffix: "days" },
    { key: "customModels", label: "Builds Custom Science & School Models", kind: "bool" },
    { key: "expressDelivery", label: "Express 24-48hr Guidance Available", kind: "bool" },
    CERTIFICATES,
    PREVIEW_VIDEO,
    GALLERY,
  ],

  kids_camps: [
    { key: "headline", label: "Headline", kind: "text", max: 120, placeholder: "Summer & winter camp organizer · STEM, creative & outdoors" },
    { key: "qualifications", label: "Camp Director Credentials", kind: "text", max: 200, placeholder: "Child Care Certified, Wilderness First Aid, Certified Educator" },
    { key: "experienceYears", label: "Camp Leadership Experience", kind: "number", min: 0, max: 50, required: true, suffix: "years" },
    { key: "campThemes", label: "Camp Themes", kind: "tags", placeholder: "STEM Bootcamp, Art Camp, Creative Writing, Adventure Club" },
    { key: "minAge", label: "Minimum Age Accepted", kind: "number", min: 3, max: 18, required: true, suffix: "yrs" },
    { key: "maxAge", label: "Maximum Age Accepted", kind: "number", min: 3, max: 18, required: true, suffix: "yrs" },
    { key: "batchCapacity", label: "Max Kids Per Batch", kind: "number", min: 3, max: 100, required: true, suffix: "campers" },
    { key: "firstAidCertified", label: "Staff Certified in First Aid & CPR", kind: "bool" },
    { key: "venueAddress", label: "Camp Venue / Facility Address", kind: "textarea", max: 300 },
    CERTIFICATES,
    PREVIEW_VIDEO,
    GALLERY,
  ],

  kids_sports_fitness: [
    { key: "headline", label: "Headline", kind: "text", max: 120, placeholder: "FIDE rated chess coach & certified kids yoga trainer" },
    { key: "qualifications", label: "Coach Certifications & Ratings", kind: "text", max: 200, placeholder: "FIDE Arena Candidate Master, Certified Kids Yoga Instructor" },
    { key: "experienceYears", label: "Coaching Experience", kind: "number", min: 0, max: 50, required: true, suffix: "years" },
    { key: "activityTypes", label: "Activities Coached", kind: "tags", placeholder: "Chess, Yoga, Rubik's Cube, Gymnastics, Skating, Fitness" },
    { key: "fideRating", label: "FIDE Chess Rating (if applicable)", kind: "number", min: 1000, max: 3000 },
    { key: "coachingLevel", label: "Coaching Level", kind: "select", options: opts(["all", "All levels"], ["beginner", "Beginner"], ["intermediate", "Intermediate"], ["tournament", "Tournament prep"]) },
    { key: "equipmentProvided", label: "Boards & Gear Provided", kind: "bool" },
    { key: "homeTuitionAvailable", label: "Available for Home Coaching", kind: "bool" },
    CERTIFICATES,
    PREVIEW_VIDEO,
    GALLERY,
  ],

  kids_life_skills: [
    { key: "headline", label: "Headline", kind: "text", max: 120, placeholder: "No-fire cooking, dining etiquette & public confidence coach" },
    { key: "qualifications", label: "Instructor Background", kind: "text", max: 200, placeholder: "Certified Etiquette Coach, Culinary Arts Diploma" },
    { key: "experienceYears", label: "Experience", kind: "number", min: 0, max: 50, required: true, suffix: "years" },
    { key: "skillDomains", label: "Life Skills Taught", kind: "tags", placeholder: "No-fire Cooking, Dining Etiquette, Magic Tricks, Gardening, Public Speaking" },
    { key: "interactiveSessions", label: "Hands-on Interactive Workshops", kind: "bool" },
    CERTIFICATES,
    PREVIEW_VIDEO,
    GALLERY,
  ],

  kids_products: [
    { key: "storeKind", label: "Products Category", kind: "select", options: opts(["kids_kits", "DIY & Activity Kits"], ["craft_supplies", "Art & Craft Supplies"], ["science_boxes", "Science Experiment Kits"], ["toys_rentals", "Costume & Toy Rentals"], ["educational", "Educational Learning Toys"]) },
    { key: "productKinds", label: "Types of Kits & Materials", kind: "tags", placeholder: "DIY Science Boxes, Clay Kits, Robotics Boards, Costumes, Craft Packs" },
    { key: "nonToxicCertified", label: "100% Non-Toxic & Child-Safe Materials Certified", kind: "bool" },
    { key: "rentalAvailable", label: "Offers Costume / Instrument Rentals", kind: "bool" },
    { key: "gstin", label: "GSTIN Number", kind: "text", max: 15 },
    PREVIEW_VIDEO,
    GALLERY,
  ],

  kids_institutions: [
    { key: "headline", label: "Headline", kind: "text", max: 120, placeholder: "Licensed preschool, daycare & early learning centre" },
    { key: "institutionType", label: "Institution Type", kind: "select", options: opts(["preschool", "Preschool & Nursery"], ["daycare", "Daycare & Creche"], ["academy", "Children's Activity Academy"], ["play_centre", "Indoor Play & Activity Centre"], ["stem_hub", "Robotics & STEM Hub"]) },
    { key: "registrationNumber", label: "Government / Trust Registration No.", kind: "text", max: 50 },
    { key: "campusSqft", label: "Campus / Centre Area", kind: "number", min: 100, max: 50000, suffix: "sq ft" },
    { key: "cctvMonitored", label: "Full CCTV Coverage & Security Guards", kind: "bool" },
    { key: "studentTeacherRatio", label: "Student-to-Teacher Ratio", kind: "text", max: 20, placeholder: "1:6" },
    { key: "certifiedStaffCount", label: "Number of Certified Staff", kind: "number", min: 1, max: 100, required: true, suffix: "staff" },
    CERTIFICATES,
    PREVIEW_VIDEO,
    GALLERY,
  ],
};

/** Per-item fields. */
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

  // ── 10 Differentiated Kids Item Fields ──────────────────────────────────────
  kids_academics: [
    POSTER_IMAGE,
    ITEM_VIDEO,
    { key: "subject", label: "Subject", kind: "text", max: 60, placeholder: "Class 4 Maths & Phonics" },
    { key: "gradeLevel", label: "Grade Level", kind: "text", max: 40, placeholder: "Class 1 to 5" },
    { key: "batchOr1on1", label: "Format", kind: "select", options: opts(["1on1", "1-on-1 Private Tuition"], ["batch", "Small Batch (Max 4)"]) },
    { key: "syllabusBoard", label: "Board", kind: "select", options: opts(["cbse", "CBSE"], ["icse", "ICSE"], ["state", "State Board"], ["all", "All Boards"]) },
    { key: "trialAvailable", label: "Offer Discounted Trial Class", kind: "bool" },
  ],

  kids_stem: [
    POSTER_IMAGE,
    ITEM_VIDEO,
    { key: "topic", label: "Topic", kind: "text", max: 80, placeholder: "Intro to Scratch & Robotics" },
    { key: "hardwareIncluded", label: "Hardware Kit Included for Student", kind: "bool" },
    { key: "softwareRequired", label: "Software / Laptop Needed", kind: "text", max: 100, placeholder: "Laptop with Chrome browser" },
    { key: "handsOnRatio", label: "Hands-on Practical Percentage", kind: "number", min: 10, max: 100, suffix: "%" },
  ],

  kids_performing_arts: [
    POSTER_IMAGE,
    ITEM_VIDEO,
    { key: "genreStyle", label: "Dance/Music Style", kind: "text", max: 60, placeholder: "Bollywood & Semi-classical" },
    { key: "instrumentNeeded", label: "Instrument Needed", kind: "text", max: 60, placeholder: "Keyboard or Acoustic Guitar" },
    { key: "skillLevel", label: "Skill Level", kind: "select", options: opts(["beginner", "Beginner"], ["intermediate", "Intermediate"], ["all", "All Levels"]) },
    { key: "recitalIncluded", label: "Showcase Recital / Stage Performance Included", kind: "bool" },
  ],

  kids_arts_crafts: [
    POSTER_IMAGE,
    ITEM_VIDEO,
    { key: "medium", label: "Medium", kind: "text", max: 60, placeholder: "Air-dry Clay & Acrylic Painting" },
    { key: "materialsList", label: "Materials Provided", kind: "text", max: 150, placeholder: "Clay block, rolling tools, paint palette" },
    { key: "takeHomeKeepsake", label: "Finished Project Take-Home Keepsake", kind: "bool" },
  ],

  kids_school_projects: [
    POSTER_IMAGE,
    ITEM_VIDEO,
    { key: "targetStandard", label: "Target Class / Grade", kind: "text", max: 40, placeholder: "Class 3 to 8" },
    { key: "subjectDomain", label: "Subject", kind: "text", max: 60, placeholder: "Science & EVS" },
    { key: "modelDimensions", label: "Estimated Model Size", kind: "text", max: 60, placeholder: "30 x 20 x 20 cm" },
    { key: "diyGuideIncluded", label: "Step-by-step DIY Guide Included", kind: "bool" },
  ],

  kids_camps: [
    POSTER_IMAGE,
    ITEM_VIDEO,
    { key: "dailySchedule", label: "Daily Schedule Timings", kind: "text", max: 100, placeholder: "10:00 AM – 1:00 PM (Monday to Friday)" },
    { key: "mealsIncluded", label: "Healthy Snacks Provided", kind: "bool" },
    { key: "fieldTripsIncluded", label: "Field Trips / Outdoor Sessions", kind: "bool" },
    { key: "parentShowcaseDate", label: "Parent Showcase Day", kind: "text", max: 60, placeholder: "Final Friday 12:00 PM" },
  ],

  kids_sports_fitness: [
    POSTER_IMAGE,
    ITEM_VIDEO,
    { key: "sportType", label: "Activity / Sport", kind: "text", max: 60, placeholder: "Chess Tactics & Strategy" },
    { key: "difficultyLevel", label: "Level", kind: "select", options: opts(["beginner", "Beginner"], ["intermediate", "Intermediate"], ["tournament", "Tournament"]) },
    { key: "gearRequired", label: "Gear Required from Student", kind: "text", max: 100, placeholder: "Comfortable sports wear / yoga mat" },
    { key: "physicalIntensity", label: "Physical Intensity", kind: "select", options: opts(["light", "Light (Mental / Mind)"], ["moderate", "Moderate"], ["high", "High Energetic"]) },
  ],

  kids_life_skills: [
    POSTER_IMAGE,
    ITEM_VIDEO,
    { key: "skillFocus", label: "Focus Skill", kind: "text", max: 80, placeholder: "Table Manners & Dining Etiquette" },
    { key: "prerequisites", label: "Prerequisites", kind: "text", max: 100, placeholder: "None (Age 6+)" },
    { key: "takeHomeProject", label: "Includes Take-Home Practical Project", kind: "bool" },
  ],

  kids_products: [
    POSTER_IMAGE,
    ITEM_VIDEO,
    { key: "recommendedAge", label: "Recommended Age", kind: "text", max: 40, placeholder: "Ages 5–10" },
    { key: "safetyCertified", label: "Child-Safe & Non-Toxic Tested", kind: "bool" },
    { key: "boxContents", label: "What's in the Box", kind: "text", max: 200, placeholder: "10 science experiment components, manual, goggles" },
    { key: "diyManualIncluded", label: "Illustrated DIY Manual Included", kind: "bool" },
    { key: "rentalDepositPaise", label: "Refundable Rental Deposit", kind: "rupees", max: 10000, hint: "For costumes or musical instrument rentals only" },
  ],

  kids_institutions: [
    POSTER_IMAGE,
    ITEM_VIDEO,
    { key: "ageBracket", label: "Age Bracket", kind: "text", max: 40, placeholder: "2.5 to 5 years" },
    { key: "batchTiming", label: "Batch Timings", kind: "text", max: 80, placeholder: "9:00 AM – 12:30 PM" },
    { key: "facilitiesIncluded", label: "Facilities Included", kind: "tags", placeholder: "AC Classrooms, Splash Pool, Ball Pit, Smart Board" },
    { key: "parentObservationAllowed", label: "Parent Live Observation / Visit Permitted", kind: "bool" },
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
