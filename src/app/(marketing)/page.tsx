import Link from "next/link";
import {
  ArrowRight,
  Check,
  Clock,
  Sparkles,
  MapPin,
  Compass,
  Package,
} from "lucide-react";
import {
  buildMetadata,
  organizationJsonLd,
  faqJsonLd,
} from "@/lib/seo";
import {
  TiffinDabbaIllustration,
  WaterCanIllustration,
  ScooterIllustration,
  KhataCheckIllustration,
} from "@/components/marketing/illustrations";
import {
  AnimateRocketIcon,
  AnimatePaletteIcon,
  AnimateMusicIcon,
  AnimateRobotIcon,
  AnimateCampIcon,
  AnimatePuzzleIcon,
  AnimateShieldCheckIcon,
  AnimateTeddyIcon,
  AnimateCertificateIcon,
} from "@/components/ui/animate-icons";

export const metadata = buildMetadata({
  title: "Local Services for Everyday Life, Kids & Home",
  description:
    "Daily tiffin subscriptions, 20L water cans, fresh dairy, and 10 verified Kids Zone categories with zero platform commission and private household links.",
  path: "",
});

const faqs = [
  {
    question: "How does RUXs work for daily meal and water subscriptions?",
    answer:
      "Your local kitchen or water supplier sets their daily service cutoff (e.g. 10:00 AM IST for lunch). You receive a private one-tap link (/c/[token]) or use the /app portal. Tap Deliver, Skip, or Extra before cutoff. At cutoff, the kitchen count locks and cooks prepare exact meals with zero food waste.",
  },
  {
    question: "What are the 10 categories available in RUXs Kids?",
    answer:
      "RUXs Kids features 10 distinct, independently verified provider types: (1) Academic Tutors & Phonics, (2) Science, STEM & Robotics, (3) Dance, Music & Performing Arts, (4) Art, Craft & Pottery, (5) School Projects & Competitions, (6) Holiday Camps & Workshops, (7) Sports, Fitness & Mind Skills, (8) Life Skills & Hobbies, (9) DIY Kits & Learning Supplies, and (10) Preschools & Learning Academies.",
  },
  {
    question: "What child safeguarding standards are enforced for home sessions?",
    answer:
      "For all private in-home classes and tutoring sessions, RUXs enforces a mandatory adult parent or guardian presence rule. In addition, providers undergo identity and credential verification, and physical activity kits are certified 100% non-toxic.",
  },
  {
    question: "Do households need to download a heavy mobile app?",
    answer:
      "No. RUXs runs directly as a fast web application on any smartphone or desktop. Vendors can send a zero-login private link (/c/[token]) allowing family members, bachelors, and seniors to manage deliveries without remembering passwords.",
  },
  {
    question: "Does RUXs charge commission on orders or subscriptions?",
    answer:
      "No. RUXs charges zero percent commission on transactions. Independent neighborhood providers keep 100% of their earnings. Monthly bills are calculated directly from append-only ledger entries and paid directly via merchant UPI.",
  },
  {
    question: "How do delivery drivers benefit from RUXs?",
    answer:
      "RUXs automatically sorts delivery run sheets by apartment society, tower, and descending floor (e.g., 14th floor down to 1st floor). Drivers complete their building deliveries systematically with zero stair backtracking and simple one-thumb confirmations.",
  },
];

const kidsCategories = [
  {
    title: "Home Tutors & Phonics",
    detail: "Nursery–Class 5, abacus, reading fluency, handwriting, and exam revision.",
    icon: <AnimateTeddyIcon size={24} />,
    tag: "ACADEMICS",
    href: "/app/kids/activities",
  },
  {
    title: "Science, STEM & Robotics",
    detail: "Electronics kits, science fair experiments, and hands-on beginner coding.",
    icon: <AnimateRobotIcon size={24} />,
    tag: "STEM",
    href: "/app/kids/activities",
  },
  {
    title: "Dance, Music & Theatre",
    detail: "Classical, Bollywood, western vocal, guitar, keyboard, and public speaking.",
    icon: <AnimateMusicIcon size={24} />,
    tag: "ARTS",
    href: "/app/kids/activities",
  },
  {
    title: "Art, Pottery & Calligraphy",
    detail: "Canvas painting, clay modelling, origami, and festival craft workshops.",
    icon: <AnimatePaletteIcon size={24} />,
    tag: "CREATIVE",
    href: "/app/kids/activities",
  },
  {
    title: "School Projects & Models",
    detail: "Science working models, scrapbooks, dioramas, and competition preparation.",
    icon: <AnimateRocketIcon size={24} />,
    tag: "PROJECTS",
    href: "/app/kids/activities",
  },
  {
    title: "Holiday Camps & Workshops",
    detail: "Summer & winter camps, weekend intensives, and multi-activity clubs.",
    icon: <AnimateCampIcon size={24} />,
    tag: "CAMPS",
    href: "/app/kids/workshops",
  },
  {
    title: "Chess, Mind Skills & Yoga",
    detail: "Chess coaching, Rubik's Cube mastery, logic puzzles, and children's fitness.",
    icon: <AnimatePuzzleIcon size={24} />,
    tag: "SPORTS",
    href: "/app/kids/activities",
  },
  {
    title: "Life Skills & Practical Hobbies",
    detail: "No-fire cooking, dining etiquette, nature gardening, and self-care skills.",
    icon: <Sparkles className="h-6 w-6 text-amber-600" aria-hidden="true" />,
    tag: "LIFE SKILLS",
    href: "/app/kids/workshops",
  },
  {
    title: "DIY Kits & Learning Boxes",
    detail: "Doorstep-delivered experiment boxes, art packs, and 100% non-toxic supplies.",
    icon: <Package className="h-6 w-6 text-sky-600" aria-hidden="true" />,
    tag: "DOORSTEP KIT",
    href: "/app/kids/kits",
  },
  {
    title: "Preschools & Learning Centres",
    detail: "Early childhood development, dance academies, and supervised hobby clubs.",
    icon: <Compass className="h-6 w-6 text-emerald-600" aria-hidden="true" />,
    tag: "CENTRES",
    href: "/app/kids/activities",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-24 pb-16 sm:space-y-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([organizationJsonLd(), faqJsonLd(faqs)]),
        }}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-line bg-[#FFF9F5] pt-12 pb-16 sm:pt-20 sm:pb-24">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-[#FFE8DD]/60 blur-2xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 left-1/3 h-56 w-56 rounded-full bg-[#E1F3E7]/50 blur-2xl" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div className="space-y-6">
            <h1 className="text-4xl font-semibold leading-[1.08] tracking-[-0.025em] text-ink sm:text-6xl lg:text-7xl">
              More of everyday life,
              <br />
              <span className="text-accent">sorted locally.</span>
            </h1>

            <p className="max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              The calm neighborhood operating system for Indian households. Daily tiffin meal plans, 20L water cans, fresh morning milk, and 10 verified Kids Zone categories—delivered directly to your apartment door without aggregator markups or chaotic WhatsApp chats.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/app"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] bg-accent px-6 py-3 text-sm font-semibold text-white shadow-xs transition hover:opacity-95 active:scale-[0.98]"
              >
                Explore local services <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/app/kids"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] border border-line bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:bg-bg active:scale-[0.98]"
              >
                <AnimateTeddyIcon size={18} />
                Visit Kids Zone
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-xs font-semibold text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-good" /> 0% Transaction Commission
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-good" /> Private Links (No App Required)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-good" /> Verified Child Safeguarding
              </span>
            </div>
          </div>

          {/* Authentic RUXs Multi-Surface Live Preview */}
          <div className="relative mx-auto w-full max-w-md">
            <div className="rounded-[20px] border border-line bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-6">
              {/* Surface Header */}
              <div className="flex items-center justify-between border-b border-line pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#FFE8DD]">
                    <TiffinDabbaIllustration className="h-7 w-7" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">Annapurna Home Kitchen</p>
                    <p className="text-xs text-muted">Green Glen Layout · Daily Tiffin</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-good">
                  ACTIVE PLAN
                </span>
              </div>

              {/* Household Deliver / Skip Mechanism */}
              <div className="mt-4 rounded-[14px] bg-bg p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted">Today&apos;s Lunch Delivery</span>
                  <span className="tabular-nums text-xs font-semibold text-warn">Cutoff 10:00 AM IST</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-ink">Standard Veg Thali (3 Rotis + Dal + Sabzi)</p>
                <div className="mt-3 flex gap-2">
                  <span className="flex-1 rounded-[8px] border border-good bg-good/10 py-1.5 text-center text-xs font-bold text-good">
                    ✓ Delivering
                  </span>
                  <span className="flex-1 rounded-[8px] border border-line bg-white py-1.5 text-center text-xs font-medium text-muted">
                    Skip
                  </span>
                  <span className="flex-1 rounded-[8px] border border-line bg-white py-1.5 text-center text-xs font-medium text-muted">
                    + Extra (₹90)
                  </span>
                </div>
              </div>

              {/* Kids Learning Verification Snippet */}
              <div className="mt-3 rounded-[14px] border border-line p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AnimateShieldCheckIcon size={18} />
                    <span className="text-xs font-semibold text-ink">RoboSparks STEM Lab</span>
                  </div>
                  <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-bold text-sky-700">
                    Ages 6–12
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">Saturday Robotics Workshop · 🏡 Guardian-Present</p>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-good">✓ Police &amp; ID Verified Mentor</span>
                  <span className="tabular-nums font-bold text-ink">₹450 / session</span>
                </div>
              </div>

              {/* Driver Run Sheet Micro-Feed */}
              <div className="mt-3 flex items-center justify-between rounded-[12px] bg-[#FFF3C9]/40 p-3 text-xs">
                <div className="flex items-center gap-2">
                  <ScooterIllustration className="h-6 w-9 shrink-0" />
                  <div>
                    <p className="font-semibold text-ink">Driver Run Sheet: Tower B</p>
                    <p className="text-xs text-muted">Floors 14 ↓ 1 (Zero stair backtrack)</p>
                  </div>
                </div>
                <span className="tabular-nums font-bold text-accent">18 / 18 Done</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The 4 Surfaces of RUXs */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl space-y-3">
          <h2 className="text-3xl font-semibold tracking-[-0.02em] text-ink sm:text-4xl">
            Four surfaces. One connected neighborhood.
          </h2>
          <p className="text-base text-muted">
            Designed around how Indian households and local merchants actually live and work, from high-rise corridors to early-morning prep kitchens.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {/* Surface 1: Household App */}
          <div className="flex flex-col justify-between rounded-[16px] border border-line bg-white p-6 sm:p-8">
            <div className="space-y-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#FFE8DD] text-sm font-bold text-accent">
                01
              </span>
              <h3 className="text-xl font-semibold text-ink">The Household Web App</h3>
              <p className="text-sm leading-relaxed text-muted">
                Browse nearby tiffin kitchens, water suppliers, fresh dairy, and Kids Zone classes. Add items to a single store cart, configure standing daily subscriptions, or choose cash-on-delivery.
              </p>
            </div>
            <div className="mt-6 border-t border-line pt-4">
              <Link href="/app" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
                Explore Household App <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* Surface 2: Zero-App Private Link */}
          <div className="flex flex-col justify-between rounded-[16px] border border-line bg-white p-6 sm:p-8">
            <div className="space-y-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#E1F3E7] text-sm font-bold text-good">
                02
              </span>
              <h3 className="text-xl font-semibold text-ink">Zero-App Private Household Link</h3>
              <p className="text-sm leading-relaxed text-muted">
                No passwords, no app store downloads. Each household receives their own private link (<code className="rounded bg-bg px-1.5 py-0.5 text-xs text-ink">/c/[token]</code>) to tap Deliver, Skip, or Extra in 2 seconds. Perfect for grandparents and busy families.
              </p>
            </div>
            <div className="mt-6 border-t border-line pt-4">
              <span className="text-xs font-semibold text-muted">Instant tokenized access · No authentication friction</span>
            </div>
          </div>

          {/* Surface 3: Merchant Operations Panel */}
          <div className="flex flex-col justify-between rounded-[16px] border border-line bg-white p-6 sm:p-8">
            <div className="space-y-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#FFF3C9] text-sm font-bold text-amber-800">
                03
              </span>
              <h3 className="text-xl font-semibold text-ink">Merchant Operations Panel</h3>
              <p className="text-sm leading-relaxed text-muted">
                Live morning and evening cutoff locks, automated kitchen count screens (48px font across a steamy room), mobile driver run sheets sorted by society and floor, and immutable customer ledgers.
              </p>
            </div>
            <div className="mt-6 border-t border-line pt-4">
              <Link href="/merchant-panel" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
                Open Merchant Panel <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* Surface 4: Admin & Trust Console */}
          <div className="flex flex-col justify-between rounded-[16px] border border-line bg-white p-6 sm:p-8">
            <div className="space-y-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#E2EEFA] text-sm font-bold text-sky-800">
                04
              </span>
              <h3 className="text-xl font-semibold text-ink">Community Governance &amp; Admin</h3>
              <p className="text-sm leading-relaxed text-muted">
                Automated multi-tenant onboarding, instant auto-approval for registered vendors, tutor credential and police verification management, dispute mediation, and child safeguarding audits.
              </p>
            </div>
            <div className="mt-6 border-t border-line pt-4">
              <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
                Admin Console <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Essentials Core: Subscriptions & Run Sheets */}
      <section className="border-y border-line bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="space-y-5">
              <h2 className="text-3xl font-semibold tracking-[-0.02em] text-ink sm:text-4xl">
                Daily essentials that run on clockwork.
              </h2>
              <p className="text-base leading-relaxed text-muted">
                Tiffins, water cans, and milk don&apos;t work like on-demand food delivery. They require reliable standing routines, clear morning cutoffs, and accountability for returnable containers.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#FFE8DD] text-accent">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">Strict IST Cutoff Locks</h3>
                    <p className="text-xs leading-relaxed text-muted">At 10:00 AM IST, kitchen counts lock automatically. Cooks know exactly how many dabbas to pack—no wasted food, no unrecorded cancellations.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#E2EEFA] text-sky-700">
                    <WaterCanIllustration className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">20L Returnable Can Tracking</h3>
                    <p className="text-xs leading-relaxed text-muted">Every can delivered and returned is logged in an immutable ledger. No lost deposits and no disputed bottle counts at month end.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#E1F3E7] text-good">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">Descending-Floor Driver Run Sheets</h3>
                    <p className="text-xs leading-relaxed text-muted">Delivery drivers see orders sorted by building society, tower, and top-to-bottom floor (14th down to 1st floor) for rapid delivery without elevator delays.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/for/tiffin-services"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
                >
                  Learn how tiffin kitchens operate on RUXs <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>

            {/* Visual Operational Snapshot */}
            <div className="rounded-[20px] border border-line bg-bg p-6 sm:p-8">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <div>
                  <p className="text-xs font-semibold text-muted">MORNING RUN SHEET PREVIEW</p>
                  <p className="mt-0.5 text-base font-semibold text-ink">Sobha Silicon Oasis · Tower 4</p>
                </div>
                <span className="tabular-nums rounded-[8px] bg-white px-3 py-1 text-xs font-bold text-accent shadow-2xs">
                  24 CANS · 18 MEALS
                </span>
              </div>

              <div className="mt-4 space-y-2.5">
                <div className="flex items-center justify-between rounded-[10px] bg-white p-3 border border-line">
                  <div className="flex items-center gap-2.5">
                    <span className="tabular-nums text-xs font-bold text-muted">#1402</span>
                    <div>
                      <p className="text-xs font-semibold text-ink">Sharma Residence (14th Floor)</p>
                      <p className="text-xs text-muted">2x 20L Water Can Refill</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-good">
                    DELIVERED
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-[10px] bg-white p-3 border border-line">
                  <div className="flex items-center gap-2.5">
                    <span className="tabular-nums text-xs font-bold text-muted">#1104</span>
                    <div>
                      <p className="text-xs font-semibold text-ink">Dr. Mukherjee (11th Floor)</p>
                      <p className="text-xs text-muted">1x Veg Lunch Thali (No Onion/Garlic)</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-good">
                    DELIVERED
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-[10px] bg-white p-3 border border-line">
                  <div className="flex items-center gap-2.5">
                    <span className="tabular-nums text-xs font-bold text-muted">#0701</span>
                    <div>
                      <p className="text-xs font-semibold text-ink">Ananya K. (7th Floor)</p>
                      <p className="text-xs text-muted">1x Standard Lunch Thali + 1x Extra Roti</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-warn">
                    NEXT STOP
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between pt-2 text-xs text-muted">
                <span>DPDP Act 2023 Compliant</span>
                <span>Zero phone numbers leaked to drivers</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RUXs Kids: All 10 Categories & Safeguarding */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-3xl font-semibold tracking-[-0.02em] text-ink sm:text-4xl">
              RUXs Kids: 10 specialized categories for growing minds.
            </h2>
            <p className="text-base text-muted">
              From academic tutoring to robotics, classical dance, and weekend camps. Every category runs on its own dedicated schema, custom schedule engine, and strict safety guidelines.
            </p>
          </div>
          <Link
            href="/app/kids"
            className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
          >
            Explore all Kids Zone activities <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {/* 10 Kids Categories Editorial Grid */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {kidsCategories.map((cat) => (
            <Link
              key={cat.title}
              href={cat.href}
              className="group flex flex-col justify-between rounded-[16px] border border-line bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#D7C9BF]"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-bg">
                    {cat.icon}
                  </span>
                  <span className="rounded-full bg-bg px-2 py-0.5 text-xs font-bold tracking-wider text-muted">
                    {cat.tag}
                  </span>
                </div>
                <h3 className="mt-3 text-sm font-semibold text-ink group-hover:text-accent">{cat.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{cat.detail}</p>
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-accent">
                View providers <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>

        {/* Child Safeguarding Policy Assurance Card */}
        <div className="mt-8 rounded-[18px] border border-line bg-[#FFF9F5] p-6 sm:p-8">
          <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr] md:items-center">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AnimateShieldCheckIcon size={24} />
                <h3 className="text-lg font-semibold text-ink">Built With Child Safeguarding First</h3>
              </div>
              <p className="text-xs leading-relaxed text-muted sm:text-sm">
                We treat vendors providing services directly to children with utmost responsibility and strict policy requirements.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[12px] border border-line bg-white p-3.5">
                <AnimateCertificateIcon size={20} />
                <p className="mt-2 text-xs font-semibold text-ink">Verified Mentors</p>
                <p className="mt-0.5 text-xs text-muted">Police and credential verification check before listing.</p>
              </div>
              <div className="rounded-[12px] border border-line bg-white p-3.5">
                <span className="text-base" aria-hidden="true">🏡</span>
                <p className="mt-2 text-xs font-semibold text-ink">Guardian-Present Rule</p>
                <p className="mt-0.5 text-xs text-muted">Mandatory adult presence required for all home sessions.</p>
              </div>
              <div className="rounded-[12px] border border-line bg-white p-3.5">
                <span className="text-base" aria-hidden="true">🧼</span>
                <p className="mt-2 text-xs font-semibold text-ink">100% Non-Toxic Kits</p>
                <p className="mt-0.5 text-xs text-muted">Certified child-safe, non-toxic materials for all DIY kits.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fair Economics: Zero Commission & Append-Only Ledger */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 rounded-[20px] border border-line bg-white p-6 sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold tracking-[-0.02em] text-ink sm:text-4xl">
              Zero commission. Honest local commerce.
            </h2>
            <p className="text-base leading-relaxed text-muted">
              Food delivery apps cut 25% to 35% out of local kitchens. RUXs charges 0% transaction commission. Your tiffin aunties, water suppliers, and tutors keep every single rupee they earn.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div className="rounded-[12px] border border-line bg-bg p-4">
                <p className="text-xs font-bold text-accent">APPEND-ONLY LEDGER</p>
                <p className="mt-1 text-sm font-semibold text-ink">Integer Paise Precision</p>
                <p className="mt-1 text-xs text-muted">Money is never stored as floating numbers. Every transaction is an immutable ledger entry with idempotency keys.</p>
              </div>
              <div className="rounded-[12px] border border-line bg-bg p-4">
                <p className="text-xs font-bold text-good">DIRECT UPI SETTLEMENT</p>
                <p className="mt-1 text-sm font-semibold text-ink">Direct To Merchant Bank</p>
                <p className="mt-1 text-xs text-muted">Monthly bills generate standard UPI payment links. Money flows directly from household to merchant without intermediary holds.</p>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/onboarding"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95"
              >
                Onboard your local business <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="rounded-[16px] bg-[#FFF3C9] p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <KhataCheckIllustration className="h-12 w-12 shrink-0" />
              <div>
                <h3 className="text-base font-semibold text-ink">The Monthly Khata You Can Trust</h3>
                <p className="text-xs text-muted">Computed automatically on the 1st of every month at 10:00 AM IST.</p>
              </div>
            </div>

            <div className="mt-5 space-y-2 rounded-[12px] bg-white p-4 border border-line/60">
              <div className="flex justify-between text-xs text-muted">
                <span>26 Lunches Delivered</span>
                <span className="tabular-nums font-semibold text-ink">₹2,340.00</span>
              </div>
              <div className="flex justify-between text-xs text-muted">
                <span>4 Returnable Cans Exchanged</span>
                <span className="tabular-nums font-semibold text-ink">₹360.00</span>
              </div>
              <div className="flex justify-between text-xs text-muted">
                <span>Platform Commission</span>
                <span className="tabular-nums font-bold text-good">₹0.00 (Free)</span>
              </div>
              <div className="border-t border-line pt-2 flex justify-between text-sm font-bold text-ink">
                <span>Net Total to Merchant</span>
                <span className="tabular-nums text-accent">₹2,700.00</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="space-y-2 text-center">
          <h2 className="text-3xl font-semibold tracking-[-0.02em] text-ink">Good to know</h2>
          <p className="text-sm text-muted">Straightforward answers about how RUXs works for households and merchants.</p>
        </div>

        <div className="mt-8 divide-y divide-line overflow-hidden rounded-[14px] border border-line bg-white">
          {faqs.map((faq) => (
            <details key={faq.question} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-ink">
                {faq.question}
                <span className="shrink-0 text-lg font-normal text-accent transition-transform group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Bottom Conversion Section */}
      <section className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[18px] bg-[#FFF3E9]">
          <KhataCheckIllustration className="h-14 w-14" />
        </div>
        <h2 className="mt-6 text-3xl font-semibold tracking-[-0.02em] text-ink sm:text-4xl">
          Your neighborhood has so much to offer.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted">
          Support the independent people who make everyday life work—from the morning tiffin aunties to passionate science mentors and dance teachers.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/app"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] bg-accent px-8 py-3 text-sm font-semibold text-white transition hover:opacity-95"
          >
            Explore local services <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href="/onboarding"
            className="inline-flex min-h-12 items-center justify-center rounded-[10px] border border-line bg-white px-8 py-3 text-sm font-semibold text-ink transition hover:bg-bg"
          >
            List your business
          </Link>
        </div>

        <p className="mt-6 text-xs text-muted">
          Active in Bangalore and growing neighborhood by neighborhood. All money transactions computed in integer paise.
        </p>
      </section>
    </div>
  );
}
