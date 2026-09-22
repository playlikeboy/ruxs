import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Sparkles,
  MapPin,
  Calendar,
  CreditCard,
  Lock,
  Mail,
  LogIn,
  Repeat,
  ChevronRight,
  Shield,
  Building,
  BellOff,
  Check,
} from "lucide-react";
import {
  MilkSvg,
  WaterCanSvg,
  ThaliSvg,
  FlowersSvg,
  PetsSvg,
  LaundrySvg,
} from "@/src/modules/customer-ui/svg-assets";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "RUXS — Recurring Household Life, Quietly Handled",
  description:
    "RUXS is the quiet operating layer for recurring daily services in apartment societies. 1-tap fresh milk, 20L water cans, homestyle tiffins, morning puja flowers, pet care, steam iron passes, and transparent digital Khata.",
  alternates: { canonical: "https://ruxs.in/" },
  openGraph: {
    title: "RUXS — Recurring Household Life, Quietly Handled",
    description:
      "A quiet operating system for recurring household services in India. Fresh milk, 20L water cans, daily tiffins, flowers, pet walks, and laundry with transparent billing.",
    url: "https://ruxs.in/",
    siteName: "RUXS",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "RUXS — Recurring Household Services on Autopilot",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RUXS — Recurring Household Life, Quietly Handled",
    description:
      "Recurring daily services — milk, water, meals, flowers, pet care & laundry — coordinated with zero morning follow-up.",
    images: ["/twitter-image"],
  },
};

const SERVICES = [
  {
    id: "milk",
    name: "Pure Farm Milk & Dairy",
    kicker: "MORNING 06:15 AM",
    cutoff: "10 PM Cutoff",
    price: "₹0.90 / L",
    description:
      "Raw unadulterated A2 Gir Cow and fresh buffalo milk sourced from local certified farms. Delivered to your door daily before 6:30 AM with 1-tap pause/resume.",
    Icon: MilkSvg,
    highlight: "1-tap skip or extra liter request before 10 PM cutoff",
    link: "/app?category=milk",
  },
  {
    id: "water",
    name: "20L Water Can Subscriptions",
    kicker: "SCHEDULED JAR DROPS",
    cutoff: "Asset Tracked",
    price: "₹1.10 / Can",
    description:
      "Mineral and RO 20L water cans delivered straight inside your utility area. Automatic empty container tallying, zero deposits, and scheduled replenishments.",
    Icon: WaterCanSvg,
    highlight: "Barcode-scanned jar accountability & zero empty bottle loss",
    link: "/app?category=water",
  },
  {
    id: "tiffin",
    name: "Homestyle Tiffins & Kitchens",
    kicker: "LUNCH & DINNER DABBA",
    cutoff: "3-Hr Cutoff",
    price: "₹3.20 / Meal",
    description:
      "Wholesome, low-oil lunch and dinner meals cooked fresh by verified residential cloud kitchens. Complete dietary options including Jain, North, and South Indian.",
    Icon: ThaliSvg,
    highlight: "Skip any meal with 3-hour cutoff notice directly from app",
    link: "/app?category=tiffin",
  },
  {
    id: "flowers",
    name: "Morning Puja Flowers & Garlands",
    kicker: "MANDI FRESH 06:00 AM",
    cutoff: "Daily 6:00 AM",
    price: "₹0.65 / Basket",
    description:
      "Freshly plucked devotional flowers, including fragrant jasmine, marigold, rose petals, durva grass, and fresh tulsi leaves delivered every morning before sunrise.",
    Icon: FlowersSvg,
    highlight: "Sourced direct from Bangalore KR Flower Mandi at dawn",
    link: "/app?category=flowers",
  },
  {
    id: "pets",
    name: "Verified Pet Care & Dog Walking",
    kicker: "GPS-LOGGED WALKS",
    cutoff: "Verified Walkers",
    price: "₹3.50 / Walk",
    description:
      "Certified and background-checked canine handlers for 30-minute daily morning and evening walks. Includes live GPS trail tracking and tailored pet nutrition meals.",
    Icon: PetsSvg,
    highlight: "Real-time GPS route logs, pee/poop records, and photo proof",
    link: "/app?category=pets",
  },
  {
    id: "laundry",
    name: "Steam Press & Doorstep Laundry",
    kicker: "MONTHLY PASSES",
    cutoff: "24-Hr Turnaround",
    price: "₹0.25 / Garment",
    description:
      "Doorstep garment pickup in branded laundry bags with crisp commercial steam ironing and next-day hanger return. Digital wardrobe count eliminates lost clothes.",
    Icon: LaundrySvg,
    highlight: "Itemized garment pickup tally with zero paper coupon slips",
    link: "/app?category=laundry",
  },
];

const PRINCIPLES = [
  {
    number: "01",
    title: "Set The Default Once",
    description:
      "Decide what should happen on an ordinary day. RUXS carries your schedule forward automatically every morning without requiring recurring orders or checkouts.",
  },
  {
    number: "02",
    title: "1-Tap Pause & Resume",
    description:
      "Going out of station or working from home? Skip a day, pause for holidays, or request extra liters before the clear operational cutoff with zero back-and-forth messaging.",
  },
  {
    number: "03",
    title: "Society Geofenced Operations",
    description:
      "Delivery staff have pre-cleared digital gate passes. Deliveries are placed quietly at your doorstep without doorbell disturbances before 7:00 AM.",
  },
  {
    number: "04",
    title: "One Transparent Digital Khata",
    description:
      "Every fulfilled delivery, container exchange, and pause is recorded in a unified ledger. Review itemized daily statements with zero month-end reconciliation disputes.",
  },
];

const SOCIETIES = [
  "Prestige Falcon City",
  "Sobha Dream Acres",
  "Godrej Woodsman Estate",
  "Brigade Gateway",
  "DLF Westend Heights",
  "Lodha Bellezza",
  "Hiranandani Upscale",
  "Purva Sunflower",
];

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://ruxs.in/#organization",
        name: "RUXS",
        url: "https://ruxs.in/",
        logo: "https://ruxs.in/favicon.svg",
        description:
          "The quiet operating layer for recurring local household services in India.",
      },
      {
        "@type": "WebSite",
        "@id": "https://ruxs.in/#website",
        url: "https://ruxs.in/",
        name: "RUXS",
        publisher: { "@id": "https://ruxs.in/#organization" },
      },
      {
        "@type": "SoftwareApplication",
        name: "RUXS App",
        applicationCategory: "LifestyleApplication",
        operatingSystem: "Web, iOS, Android (PWA)",
        url: "https://ruxs.in/app",
        description:
          "Geofenced apartment society recurring services app for fresh milk, 20L water, homestyle tiffins, flowers, pet care, steam iron passes, and digital Khata.",
      },
      {
        "@type": "ItemList",
        name: "RUXS Recurring Domestic Services",
        itemListElement: SERVICES.map((service, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: service.name,
          description: service.description,
          url: `https://ruxs.in${service.link}`,
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="relative min-h-screen w-full bg-gradient-to-b from-sky-50/50 via-white to-sky-50/20 text-gray-900 selection:bg-blue-100 selection:text-blue-900">
        {/* =====================================================================
            1. HERO SECTION
           ===================================================================== */}
        <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28">
          <div className="ds-container">
            <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_.9fr] lg:gap-16">
              {/* Left Column: Hero Copy & Actions */}
              <div className="flex flex-col items-start text-left">
                {/* Geofencing Status Badge */}
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/90 px-3.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span>Live in 120+ Gated Apartment Societies • Bangalore & Hyderabad</span>
                </div>

                {/* Display Headline */}
                <h1 className="mt-6 text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-gray-950 leading-[1.05]">
                  Your household routines, <br className="hidden sm:inline" />
                  <span className="bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent">
                    quietly on autopilot.
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="mt-6 max-w-xl text-base sm:text-lg text-gray-600 leading-relaxed font-normal">
                  RUXS coordinates recurring local services — fresh morning milk, 20L water cans,
                  homestyle tiffins, devotional puja flowers, pet walks, and steam laundry passes —
                  scheduled once, delivered quietly to your doorstep with zero follow-up and
                  one transparent digital Khata.
                </p>

                {/* CTAs */}
                <div className="mt-8 flex flex-wrap items-center gap-3.5 w-full sm:w-auto">
                  <Link
                    href="/app"
                    className="inline-flex items-center justify-center gap-2 bg-gradient-to-b from-gray-700 to-gray-900 text-white font-medium py-3 px-6 rounded-xl shadow hover:brightness-105 transition cursor-pointer text-sm w-full sm:w-auto text-center"
                  >
                    <span>Open Customer App</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href="/#services"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-medium py-3 px-5 transition shadow-sm text-sm w-full sm:w-auto text-center"
                  >
                    <span>Explore 6 Services</span>
                  </Link>

                  <Link
                    href="/vendor/onboard"
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-gray-500 hover:text-black py-2 px-3 transition"
                  >
                    <span>Vendor Hub →</span>
                  </Link>
                </div>

                {/* Micro-Features Checklist */}
                <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs text-gray-500 font-medium">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Recurring by default
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    1-Tap pause before cutoff
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Society gate pass verified
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Itemized digital khata
                  </span>
                </div>
              </div>

              {/* Right Column: Signature Clean Minimal Card Preview */}
              <div className="relative mx-auto w-full max-w-md lg:max-w-none">
                <div className="w-full bg-gradient-to-b from-sky-50/60 to-white rounded-3xl shadow-xl shadow-black/[0.04] p-6 sm:p-8 border border-blue-100 text-black">
                  {/* Card Header with Floating Squircle */}
                  <div className="flex items-center justify-between border-b border-gray-100 pb-5">
                    <div className="flex items-center gap-3.5">
                      <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white shadow-md shadow-black/[0.04] border border-blue-50/80">
                        <Repeat className="w-5 h-5 text-gray-800" />
                      </div>
                      <div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          AUTOPILOT RUN
                        </span>
                        <h2 className="text-sm font-semibold text-gray-900 mt-1">
                          Tower B-1402 • Prestige Falcon City
                        </h2>
                      </div>
                    </div>

                    <span className="text-[11px] font-mono text-gray-400">TODAY</span>
                  </div>

                  {/* Scheduled Items Timeline */}
                  <div className="mt-4 divide-y divide-gray-100">
                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-medium text-gray-400 w-12">06:00</span>
                        <div className="flex items-center gap-2">
                          <FlowersSvg size={24} className="shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-gray-900">Morning Puja Garland</p>
                            <p className="text-[11px] text-gray-500">1 Fresh Mandi Basket</p>
                          </div>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        <Check className="w-3 h-3" />
                        Delivered
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-medium text-gray-400 w-12">06:15</span>
                        <div className="flex items-center gap-2">
                          <MilkSvg size={24} className="shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-gray-900">Farm Fresh A2 Cow Milk</p>
                            <p className="text-[11px] text-gray-500">1L Pouch • Chilled</p>
                          </div>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        <Check className="w-3 h-3" />
                        Delivered
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-medium text-gray-400 w-12">07:00</span>
                        <div className="flex items-center gap-2">
                          <WaterCanSvg size={24} className="shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-gray-900">20L Mineral Water Can</p>
                            <p className="text-[11px] text-gray-500">2 Jars • Doorstep Exchange</p>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        Scheduled
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-medium text-gray-400 w-12">10:00</span>
                        <div className="flex items-center gap-2">
                          <ThaliSvg size={24} className="shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-gray-900">Homestyle Lunch Tiffin</p>
                            <p className="text-[11px] text-gray-500">1 Hot Dabba • Cutoff Locked</p>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                        Kitchen Prep
                      </span>
                    </div>
                  </div>

                  {/* Digital Khata Ledger Mini Box */}
                  <div className="mt-5 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-medium text-gray-700">Digital Khata Balance</span>
                      </div>
                      <span className="font-mono font-bold text-gray-900">₹124.00 due</span>
                    </div>
                    <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-gray-700 to-gray-900" />
                    </div>
                    <p className="mt-2 text-[11px] text-gray-500">
                      1-Tap pause tomorrow before 10:00 PM cutoff • Zero paper diaries
                    </p>
                  </div>

                  {/* Dashed Security Footer */}
                  <div className="mt-4 flex items-center justify-between border-t border-dashed border-gray-200 pt-3.5 text-[11px] text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-600" />
                      Security Gate Pass Verified
                    </span>
                    <span className="font-mono">QR Clearance</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            2. THE 6 RECURRING SERVICES SECTION
           ===================================================================== */}
        <section id="services" className="relative py-20 border-t border-blue-100/60 bg-white/70">
          <div className="ds-container">
            {/* Header */}
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-900">
                Daily Recurring Infrastructure
              </div>
              <h2 className="mt-4 text-3xl sm:text-5xl font-semibold tracking-tight text-gray-950">
                The 6 essential household routines.
                <span className="block text-gray-500 font-normal">One quiet operating layer.</span>
              </h2>
              <p className="mt-4 text-sm sm:text-base text-gray-600 leading-relaxed">
                Forget scattered WhatsApp messages, illegible paper calendars, and month-end friction.
                Each service runs on confirmed schedules with automatic pause/resume.
              </p>
            </div>

            {/* 6 Cards Grid */}
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {SERVICES.map((service) => {
                const IconComponent = service.Icon;
                return (
                  <div
                    key={service.id}
                    className="flex flex-col justify-between rounded-3xl border border-blue-100/80 bg-gradient-to-b from-sky-50/40 to-white p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition duration-200"
                  >
                    <div>
                      {/* Top Bar with Floating Squircle */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-md shadow-black/[0.04] border border-blue-50">
                          <IconComponent size={32} />
                        </div>
                        <span className="rounded-full bg-blue-50 border border-blue-100/80 px-2.5 py-1 text-[10px] font-semibold text-blue-900 uppercase tracking-wider">
                          {service.cutoff}
                        </span>
                      </div>

                      {/* Content */}
                      <p className="mt-5 text-[10px] font-mono font-semibold tracking-wider text-gray-400 uppercase">
                        {service.kicker}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-gray-900">{service.name}</h3>
                      <p className="mt-2 text-xs sm:text-sm leading-6 text-gray-600 font-normal">
                        {service.description}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 pt-4 border-t border-dashed border-gray-200">
                      <div className="flex items-center justify-between text-xs mb-3">
                        <span className="font-semibold text-gray-900">{service.price}</span>
                        <span className="text-[11px] text-gray-500">Auto-billed to Khata</span>
                      </div>

                      <Link
                        href={service.link}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 text-xs font-medium transition shadow-xs"
                      >
                        <span>Subscribe in App</span>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* =====================================================================
            3. HOW IT WORKS (THE 4 CLEAN RULES)
           ===================================================================== */}
        <section id="how-it-works" className="py-20 border-t border-blue-100/60 bg-gradient-to-b from-sky-50/30 to-white">
          <div className="ds-container">
            <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] items-start">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-900">
                  Operational Simplicity
                </div>
                <h2 className="mt-4 text-3xl sm:text-5xl font-semibold tracking-tight text-gray-950">
                  Quiet software for repetitive days.
                </h2>
                <p className="mt-5 text-sm sm:text-base text-gray-600 leading-relaxed">
                  RUXS is designed so households only touch the app when plans change,
                  not because the system demands attention every morning.
                </p>

                <div className="mt-8 p-6 rounded-3xl border border-blue-100 bg-white shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-900">Zero Morning Follow-up Guarantee</h3>
                  <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                    Vendors lock their dispatch runs at cutoff. Delivery teams see exact flats,
                    floors, and SKUs without waking you up.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-gray-700">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Protected by encrypted Khata ledger</span>
                  </div>
                </div>
              </div>

              {/* 4 Steps */}
              <div className="grid gap-5 sm:grid-cols-2">
                {PRINCIPLES.map((principle) => (
                  <div
                    key={principle.number}
                    className="flex flex-col rounded-3xl border border-blue-100/80 bg-white p-6 shadow-sm"
                  >
                    <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-b from-sky-50 to-white shadow-xs border border-blue-100 text-black font-mono font-bold text-sm">
                      {principle.number}
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-gray-900">{principle.title}</h3>
                    <p className="mt-2 text-xs sm:text-sm leading-6 text-gray-600 font-normal">
                      {principle.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            4. INTERACTIVE CLEAN MINIMAL ACCESS CARD SHOWCASE
           ===================================================================== */}
        <section className="py-20 border-t border-blue-100/60 bg-white">
          <div className="ds-container flex flex-col items-center">
            <div className="max-w-xl text-center mb-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-900">
                Instant Access
              </div>
              <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-gray-950">
                One account for your entire apartment.
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Join thousands of residents in Bangalore and Hyderabad living on autopilot.
              </p>
            </div>

            {/* Replicating clean-minimal-sign-in style card */}
            <div className="w-full max-w-sm bg-gradient-to-b from-sky-50/50 to-white rounded-3xl shadow-xl shadow-black/[0.04] p-8 flex flex-col items-center border border-blue-100 text-black">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white mb-6 shadow-md shadow-black/[0.04] border border-blue-50">
                <LogIn className="w-7 h-7 text-black" />
              </div>

              <h3 className="text-2xl font-semibold mb-2 text-center text-gray-950">
                Access your society hub
              </h3>
              <p className="text-gray-500 text-sm mb-6 text-center">
                Manage your daily deliveries, pause for vacations, or check your monthly Khata.
              </p>

              <div className="w-full flex flex-col gap-3 mb-2">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    placeholder="Enter your email"
                    type="email"
                    defaultValue=""
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50 text-black text-sm"
                  />
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    placeholder="Password / Passkey"
                    type="password"
                    defaultValue=""
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50 text-black text-sm"
                  />
                </div>
              </div>

              <Link
                href="/login"
                className="w-full bg-gradient-to-b from-gray-700 to-gray-900 text-white font-medium py-2.5 rounded-xl shadow hover:brightness-105 cursor-pointer transition mb-4 mt-2 text-center text-sm"
              >
                Sign In to Hub
              </Link>

              <div className="flex items-center w-full my-2">
                <div className="flex-grow border-t border-dashed border-gray-200" />
                <span className="mx-2 text-xs text-gray-400">Or launch web app</span>
                <div className="flex-grow border-t border-dashed border-gray-200" />
              </div>

              <Link
                href="/app"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 text-sm font-medium transition shadow-xs mt-2"
              >
                <span>Open Customer App</span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
            </div>
          </div>
        </section>

        {/* =====================================================================
            5. THE DIGITAL KHATA & COMPARISON
           ===================================================================== */}
        <section id="ledger" className="py-20 border-t border-blue-100/60 bg-gradient-to-b from-sky-50/20 to-white">
          <div className="ds-container">
            <div className="w-full rounded-3xl border border-blue-100 bg-gradient-to-b from-sky-50/40 to-white p-8 sm:p-12 shadow-md">
              <div className="grid gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-900">
                    Transparent Account
                  </div>
                  <h2 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight text-gray-950">
                    The account behind the routine.
                  </h2>
                  <p className="mt-4 text-sm sm:text-base text-gray-600 leading-relaxed">
                    RUXS records daily fulfillment, container returns, and paused days into a single
                    transparent Digital Khata. At the end of the month, settle with 1-tap NPCI UPI
                    without cross-referencing messy paper slips.
                  </p>

                  <div className="mt-8 grid gap-4 sm:grid-cols-3 text-xs">
                    <div className="p-4 rounded-2xl bg-white border border-blue-100/60 shadow-xs">
                      <p className="font-semibold text-gray-900">Fulfillment</p>
                      <p className="mt-1 text-gray-500">Every morning drop has a time-stamped log.</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-blue-100/60 shadow-xs">
                      <p className="font-semibold text-gray-900">Cutoff Control</p>
                      <p className="mt-1 text-gray-500">Clear operational windows prevent confusion.</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-blue-100/60 shadow-xs">
                      <p className="font-semibold text-gray-900">Settlement</p>
                      <p className="mt-1 text-gray-500">NPCI compliant UPI deep links and zero fees.</p>
                    </div>
                  </div>
                </div>

                {/* Khata vs Old Way Comparison */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Traditional vs RUXS
                  </h3>

                  <div className="mt-4 space-y-3.5 text-xs">
                    <div className="flex items-start gap-2.5">
                      <span className="text-red-500 font-bold">✕</span>
                      <p className="text-gray-500">
                        <strong className="text-gray-700">Paper Diaries:</strong> Missing marks, lost notes, and end-of-month arguments with vendors.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="text-red-500 font-bold">✕</span>
                      <p className="text-gray-500">
                        <strong className="text-gray-700">WhatsApp Messaging:</strong> Unread pause texts, late skips, and uncoordinated deliveries.
                      </p>
                    </div>
                    <div className="border-t border-dashed border-gray-200 pt-3 flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <p className="text-gray-700 font-medium">
                        <strong>RUXS Autopilot:</strong> Guaranteed cutoff enforcement, itemized audit ledger, and 100% verified drops.
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/app"
                    className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-gradient-to-b from-gray-700 to-gray-900 text-white font-medium py-2.5 rounded-xl shadow hover:brightness-105 transition text-xs text-center"
                  >
                    <span>View Your Digital Khata</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            6. GATED APARTMENT SOCIETIES BADGES
           ===================================================================== */}
        <section className="py-14 border-t border-blue-100/60 bg-white text-center">
          <div className="ds-container">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
              Trusted by households in premier residential communities
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              {SOCIETIES.map((soc) => (
                <span
                  key={soc}
                  className="rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-2 text-xs font-medium text-gray-700 shadow-xs"
                >
                  {soc}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================================
            7. FINAL CTA
           ===================================================================== */}
        <section className="py-20 border-t border-blue-100/60 bg-gradient-to-b from-sky-50/40 via-white to-sky-50/20">
          <div className="ds-container flex justify-center">
            <div className="w-full max-w-3xl rounded-3xl border border-blue-100 bg-gradient-to-b from-sky-50/60 to-white p-8 sm:p-14 text-center shadow-lg shadow-black/[0.03]">
              <div className="flex justify-center mb-5">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-md shadow-black/[0.04] border border-blue-50">
                  <Sparkles className="w-6 h-6 text-gray-800" />
                </div>
              </div>

              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-gray-950">
                Ready to put recurring life on autopilot?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-sm sm:text-base text-gray-600 leading-relaxed">
                Set up fresh morning milk, 20L water, homestyle tiffins, flowers, pet walks, or laundry
                passes in less than 2 minutes.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
                <Link
                  href="/app"
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-b from-gray-700 to-gray-900 text-white font-medium py-3 px-6 rounded-xl shadow hover:brightness-105 transition text-sm cursor-pointer"
                >
                  <span>Launch Customer App</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/vendor/onboard"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-medium py-3 px-5 transition shadow-sm text-sm cursor-pointer"
                >
                  <span>Partner as a Vendor</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
