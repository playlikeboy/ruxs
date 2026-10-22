import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Dumbbell,
  FlaskConical,
  Gift,
  GraduationCap,
  HeartPulse,
  Milk,
  Music,
  Palette,
  School,
  ShoppingBasket,
  Sparkles,
  Trophy,
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

export const metadata = buildMetadata({
  title: "Local Services for Everyday Life, Kids & Home",
  description:
    "Discover tiffin and meal plans, 20L water cans, dairy, neighbourhood stores, kids' classes and camps, DIY learning kits, gifts, mehndi, fitness and physiotherapy with RUXs.",
  path: "",
});

const faqs = [
  {
    question: "What can I discover on RUXs?",
    answer:
      "RUXs brings together local everyday services, including tiffin and meal subscriptions, 20L water-can delivery, milk and dairy, neighbourhood stores, kids' learning and activities, DIY kits, gifts, mehndi artists, fitness coaches and physiotherapists. Available options depend on your area.",
  },
  {
    question: "What can children do in the Kids Zone?",
    answer:
      "Explore tutoring and academic support, robotics and coding, science and STEM, dance and music, art and pottery, school projects, holiday camps, chess and sports, life-skills workshops, preschools and DIY learning kits. Listings and age groups vary by neighbourhood and provider.",
  },
  {
    question: "Are all services available everywhere?",
    answer:
      "No. RUXs is growing neighbourhood by neighbourhood. You may see different providers, service areas and booking or ordering options depending on your location and the service.",
  },
  {
    question: "Who sets the prices and terms?",
    answer:
      "Each independent provider sets their own prices, schedules, service area, deposits and cancellation terms. Review the provider's details before placing an order or booking.",
  },
  {
    question: "Can I subscribe or book a service?",
    answer:
      "Recurring plans, delivery changes and bookings depend on the provider and the feature available for that service. Use the supported ordering, subscription or booking path shown for the offer.",
  },
  {
    question: "I run a local business. Can I join?",
    answer:
      "Yes. Local kitchens, water and dairy suppliers, stores, tutors, academies, coaches, studios, gift makers and other eligible providers can start through the business onboarding page. The merchant workspace supports the workflows available for each provider type.",
  },
];

const everydayServices = [
  {
    title: "Tiffin & daily meals",
    detail: "Lunch plans, dinner plans and recurring home-style meals.",
    href: "/for/tiffin-services",
    icon: <TiffinDabbaIllustration className="h-12 w-12" />,
    tag: "MEALS",
  },
  {
    title: "20L water-can delivery",
    detail: "Local suppliers, repeat refills and returnable cans.",
    href: "/for/water-suppliers",
    icon: <WaterCanIllustration className="h-12 w-12" />,
    tag: "WATER",
  },
  {
    title: "Milk & dairy",
    detail: "Fresh dairy products and regular household delivery.",
    href: "/app/category/milk",
    icon: <Milk className="h-7 w-7" aria-hidden="true" />,
    tag: "DAILY",
  },
  {
    title: "Neighbourhood stores",
    detail: "Groceries, household supplies and useful everyday finds.",
    href: "/app",
    icon: <ShoppingBasket className="h-7 w-7" aria-hidden="true" />,
    tag: "LOCAL",
  },
];

const specialistServices = [
  {
    title: "Kids' learning & activities",
    detail: "Tutoring, robotics, arts, dance, camps, chess, sports and DIY kits.",
    href: "/app/kids",
    icon: <GraduationCap className="h-7 w-7" aria-hidden="true" />,
    tag: "KIDS",
  },
  {
    title: "Custom gifts & hampers",
    detail: "Personalised gifts, celebration boxes and handmade creations.",
    href: "/app/category/gifts",
    icon: <Gift className="h-7 w-7" aria-hidden="true" />,
    tag: "GIFTS",
  },
  {
    title: "Mehndi & henna artists",
    detail: "Bridal, Arabic and festive designs with provider-led bookings.",
    href: "/app/category/mehndi",
    icon: <Sparkles className="h-7 w-7" aria-hidden="true" />,
    tag: "ARTISTS",
  },
  {
    title: "Fitness coaching",
    detail: "Local trainers and fitness sessions, where available.",
    href: "/app",
    icon: <Dumbbell className="h-7 w-7" aria-hidden="true" />,
    tag: "WELLNESS",
  },
  {
    title: "Physiotherapy",
    detail: "Find local clinics and therapists offering supported appointments.",
    href: "/app",
    icon: <HeartPulse className="h-7 w-7" aria-hidden="true" />,
    tag: "CARE",
  },
];

const kidsPrograms = [
  {
    title: "Tutoring & academics",
    detail: "Subject support, homework help and school preparation.",
    href: "/app/kids/activities",
    icon: <BookOpen className="h-5 w-5" aria-hidden="true" />,
  },
  {
    title: "Robotics, coding & STEM",
    detail: "Science experiments, coding clubs and hands-on robotics.",
    href: "/app/kids/activities",
    icon: <Brain className="h-5 w-5" aria-hidden="true" />,
  },
  {
    title: "Dance, music & performance",
    detail: "Lessons and spaces for young performers.",
    href: "/app/kids/activities",
    icon: <Music className="h-5 w-5" aria-hidden="true" />,
  },
  {
    title: "Art, craft & pottery",
    detail: "Painting, making, creative projects and pottery classes.",
    href: "/app/kids/activities",
    icon: <Palette className="h-5 w-5" aria-hidden="true" />,
  },
  {
    title: "School projects & models",
    detail: "Project guidance, model-making and learning materials.",
    href: "/app/kids/activities",
    icon: <School className="h-5 w-5" aria-hidden="true" />,
  },
  {
    title: "Chess, sports & movement",
    detail: "Chess coaching, yoga, sports and age-appropriate fitness.",
    href: "/app/kids/activities",
    icon: <Trophy className="h-5 w-5" aria-hidden="true" />,
  },
  {
    title: "Holiday camps & workshops",
    detail: "Weekend clubs, creative camps and guided activities.",
    href: "/app/kids/workshops",
    icon: <Sparkles className="h-5 w-5" aria-hidden="true" />,
  },
  {
    title: "DIY kits & activity boxes",
    detail: "Science, craft and learning kits delivered by local providers.",
    href: "/app/kids/kits",
    icon: <FlaskConical className="h-5 w-5" aria-hidden="true" />,
  },
];

function ServiceCard({
  title,
  detail,
  href,
  icon,
  tag,
}: {
  title: string;
  detail: string;
  href: string;
  icon: React.ReactNode;
  tag: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-full flex-col rounded-[16px] border border-line bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#D7C9BF]  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-[14px] bg-bg text-ink">
          {icon}
        </span>
        <span className="rounded-full border border-line px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] text-muted">
          {tag}
        </span>
      </div>
      <h3 className="mt-5 text-base font-semibold tracking-tight text-ink">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-muted">{detail}</p>
      <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent">
        Explore <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </span>
    </Link>
  );
}

export default function HomePage() {
  return (
    <div className="space-y-20 pb-10 sm:space-y-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([organizationJsonLd(), faqJsonLd(faqs)]),
        }}
      />

      <section className="relative overflow-hidden border-b border-line bg-[#FFF8F2]">
        <div aria-hidden="true" className="pointer-events-none absolute -right-6 -top-6 h-40 w-40 rounded-full bg-[#FFE8DD]/70" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-10 left-1/4 h-36 w-36 rounded-full bg-[#E1F3E7]/80" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 md:grid-cols-[1.02fr_0.98fr] md:gap-14 lg:py-24">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#F2D4C4] bg-white/85 px-3 py-1.5 text-xs font-semibold text-ink">
              <span className="h-2 w-2 rounded-full bg-good" />
              Local services for the whole family
            </div>
            <h1 className="max-w-2xl text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-7xl">
              More of everyday life,
              <br />
              <span className="text-accent">sorted locally.</span>
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
              From the tiffin at your door to the class your child loves, discover neighbourhood services, independent makers and helpful specialists in one place.
            </p>

            <div className="flex max-w-xl flex-col gap-3 sm:flex-row">
              <Link href="/app" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[11px] bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98]">
                Explore local services <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/app/kids" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[11px] border border-line bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-bg active:scale-[0.98]">
                Visit Kids Zone
              </Link>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1 text-xs font-medium text-muted">
              <span><span className="mr-1 text-good">✓</span>Daily essentials</span>
              <span><span className="mr-1 text-good">✓</span>Learning &amp; family activities</span>
              <span><span className="mr-1 text-good">✓</span>Independent local providers</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div aria-hidden="true" className="absolute inset-5 rotate-2 rounded-[30px] bg-[#FFE8DD]" />
            <div className="relative rounded-[24px] border border-line bg-white p-4 shadow-none sm:p-6">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <div>
                  <p className="text-xs font-semibold tracking-wide text-muted">YOUR NEIGHBOURHOOD</p>
                  <p className="mt-1 text-lg font-semibold tracking-tight text-ink">Good things, close by.</p>
                </div>
                <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#FFF3E9]">
                  <KhataCheckIllustration className="h-10 w-10" />
                </span>
              </div>
              <div className="mt-4 rounded-[16px] bg-bg p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">A little bit of everything</p>
                <p className="mt-1 text-xl font-semibold tracking-tight text-ink">The little things, sorted.</p>
                <p className="mt-1 text-sm leading-5 text-muted">Useful services from independent people nearby.</p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-[14px] border border-line p-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-bg"><TiffinDabbaIllustration className="h-10 w-10" /></div>
                  <p className="mt-3 text-sm font-semibold text-ink">Meals &amp; tiffins</p>
                  <p className="mt-1 text-xs leading-5 text-muted">A plan for your day</p>
                </div>
                <div className="rounded-[14px] border border-line p-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-bg"><WaterCanIllustration className="h-10 w-10" /></div>
                  <p className="mt-3 text-sm font-semibold text-ink">Water &amp; dairy</p>
                  <p className="mt-1 text-xs leading-5 text-muted">Everyday essentials</p>
                </div>
                <div className="rounded-[14px] border border-line p-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-bg"><GraduationCap className="h-6 w-6 text-ink" aria-hidden="true" /></div>
                  <p className="mt-3 text-sm font-semibold text-ink">Kids &amp; learning</p>
                  <p className="mt-1 text-xs leading-5 text-muted">Classes, camps &amp; kits</p>
                </div>
                <div className="rounded-[14px] border border-line p-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-bg"><Gift className="h-6 w-6 text-ink" aria-hidden="true" /></div>
                  <p className="mt-3 text-sm font-semibold text-ink">Gifts &amp; specialists</p>
                  <p className="mt-1 text-xs leading-5 text-muted">For people and occasions</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 rounded-[13px] border border-dashed border-line p-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-[#E1F3E7]">
                  <KhataCheckIllustration className="h-9 w-9" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">Local, personal, practical</p>
                  <p className="text-xs leading-5 text-muted">Each provider sets their own offer, price and terms.</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              </div>
            </div>
            <div className="absolute -bottom-5 -left-4 hidden rounded-[12px] border border-line bg-white p-3 sm:block">
              <ScooterIllustration className="h-10 w-14" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Start with the everyday</p>
            <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">What does your home need?</h2>
            <p className="max-w-2xl text-sm leading-6 text-muted sm:text-base">Discover the essentials that keep a household running, from regular deliveries to neighbourhood stores.</p>
          </div>
          <Link href="/app" className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline">
            Browse all services <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {everydayServices.map((service) => (
            <ServiceCard key={service.title} {...service} />
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-18">
          <div className="grid gap-8 md:grid-cols-[0.75fr_1.25fr] md:items-start">
            <div className="space-y-4">
              <span className="inline-flex rounded-full bg-[#FCE4EC] px-3 py-1.5 text-xs font-semibold text-ink">A dedicated Kids Zone</span>
              <h2 className="text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">Big ideas for little minds.</h2>
              <p className="text-sm leading-7 text-muted sm:text-base">
                Go beyond tuition. Discover people and places that help children explore what they love—from robots and reading to music, movement and making things with their hands.
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <Link href="/app/kids" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">
                  Explore Kids Zone <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link href="/app/kids/activities" className="inline-flex min-h-11 items-center justify-center rounded-[10px] border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink hover:bg-bg">
                  Browse activities
                </Link>
              </div>
              <p className="text-xs leading-5 text-muted">Age ranges, schedules and availability are set by each provider.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {kidsPrograms.map((program) => (
                <Link key={program.title} href={program.href} className="group flex gap-3 rounded-[14px] border border-line bg-bg p-4 transition hover:border-[#D7C9BF] hover:bg-white">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-white text-accent">{program.icon}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-ink">{program.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-muted">{program.detail}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">More for your everyday</p>
          <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Local specialists, makers &amp; care.</h2>
          <p className="max-w-2xl text-sm leading-6 text-muted sm:text-base">Find creative services, thoughtful gifts and wellness providers alongside your daily essentials.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {specialistServices.map((service) => (
            <ServiceCard key={service.title} {...service} />
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 sm:py-16 md:grid-cols-[0.8fr_1.2fr] md:items-center">
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">How RUXs works</p>
            <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Find a service that fits your life.</h2>
            <p className="text-sm leading-7 text-muted sm:text-base">Explore local providers, compare their details, and use the order, subscription or booking options available for that service.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <article className="rounded-[15px] border border-line bg-bg p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-[#FFE8DD] text-sm font-bold text-ink">1</span>
              <h3 className="mt-4 text-sm font-semibold text-ink">Explore nearby</h3>
              <p className="mt-2 text-xs leading-5 text-muted">Browse meals, learning, household essentials and local specialists.</p>
            </article>
            <article className="rounded-[15px] border border-line bg-bg p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-[#E2EEFA] text-sm font-bold text-ink">2</span>
              <h3 className="mt-4 text-sm font-semibold text-ink">Review the details</h3>
              <p className="mt-2 text-xs leading-5 text-muted">Check the provider's prices, service area, schedule and terms.</p>
            </article>
            <article className="rounded-[15px] border border-line bg-bg p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-[#FFE8DD] text-sm font-bold text-ink">3</span>
              <h3 className="mt-4 text-sm font-semibold text-ink">Choose your next step</h3>
              <p className="mt-2 text-xs leading-5 text-muted">Continue through the supported order, subscription or booking flow.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 md:grid-cols-[1fr_0.9fr] md:items-center">
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">For local businesses</p>
          <h2 className="max-w-xl text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Good local businesses deserve better tools.</h2>
          <p className="max-w-xl text-sm leading-7 text-muted sm:text-base">
            Run a tiffin kitchen, supply water or dairy, teach a class, coach a team, offer appointments, or make gifts? RUXs provides a dedicated merchant workspace for the orders, bookings, recurring plans, customers and billing supported by your business type.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link href="/onboarding" className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">
              List your business <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/merchant-panel" className="inline-flex min-h-11 items-center justify-center rounded-[10px] border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink hover:bg-bg">
              Merchant workspace
            </Link>
          </div>
        </div>
        <div className="rounded-[20px] bg-[#FFF3C9] p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[15px] bg-white">
              <ScooterIllustration className="h-12 w-12" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-ink">Built around how local services work.</h3>
              <p className="text-sm leading-6 text-muted">Providers keep control of their own prices and service terms. The tools available in the workspace depend on the type of business.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-7 space-y-2 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Good to know</h2>
          <p className="text-sm text-muted">A few answers before you get started.</p>
        </div>
        <div className="divide-y divide-line overflow-hidden rounded-[14px] border border-line bg-white">
          {faqs.map((faq) => (
            <details key={faq.question} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-ink">
                {faq.question}
                <span className="shrink-0 text-lg font-normal text-accent transition-transform group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[18px] bg-[#FFF3E9]">
          <KhataCheckIllustration className="h-14 w-14" />
        </div>
        <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Your neighbourhood has a lot to offer.</h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted sm:text-base">Start with what you need today, discover a new favourite, and support the local people who make everyday life work.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/app" className="inline-flex min-h-12 items-center justify-center rounded-[10px] bg-accent px-7 py-3 text-sm font-semibold text-white transition hover:opacity-90">
            Explore local services <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
          <Link href="/app/kids" className="inline-flex min-h-12 items-center justify-center rounded-[10px] border border-line bg-white px-7 py-3 text-sm font-semibold text-ink transition hover:bg-bg">
            Open Kids Zone
          </Link>
        </div>
        <p className="mx-auto mt-5 max-w-2xl text-xs leading-5 text-muted">
          Service coverage, live offers and online ordering or booking options vary by neighbourhood and provider. Prices and terms are set by each provider.
        </p>
      </section>
    </div>
  );
}
