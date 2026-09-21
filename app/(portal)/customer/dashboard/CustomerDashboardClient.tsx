"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useHexclaveApp, useUser } from "@hexclave/next";
import {
  ArrowRight,
  Calendar,
  CalendarDays,
  Check,
  ChefHat,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Dog,
  Droplet,
  Filter,
  Flower2,
  MapPin,
  Milk,
  Minus,
  Pause,
  Play,
  Plus,
  ReceiptText,
  Search,
  ShieldCheck,
  Shirt,
  Sparkles,
  Star,
  Utensils,
  WalletCards,
  X,
} from "lucide-react";
import { formatINR, Paise } from "@/src/shared/types/money";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { RuxsDashboardSkeleton } from "@/components/ui/LoadingState";

type ApiEnvelope<T> = { success?: boolean; data?: T; error?: unknown };

async function safeJsonFetch<T>(input: RequestInfo | URL, init?: RequestInit): Promise<{ ok: boolean; payload: ApiEnvelope<T> }> {
  try {
    const response = await fetch(input, init);
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return { ok: false, payload: {} };
    }
    const payload = (await response.json()) as ApiEnvelope<T>;
    return { ok: response.ok, payload };
  } catch (error) {
    console.warn("RUXS dashboard request failed:", error);
    return { ok: false, payload: {} };
  }
}

interface FulfillmentItem {
  id: string;
  subscriptionId: string;
  serviceId: string;
  serviceDate: string;
  quantity: number;
  unitPricePaise: number;
  totalPricePaise: number;
  status: string;
  cutoffTime?: string;
  notes?: string;
}

interface SubscriptionItem {
  id: string;
  tenantId: string;
  serviceId: string;
  status: "ACTIVE" | "PAUSED" | "CANCELLED";
  quantity: number;
  unitPricePaise: number;
  cadence: string;
  shift?: string;
  startDate: string;
}

interface KhataStatement {
  tenantId: string;
  customerId: string;
  runningBalancePaise: number;
  entries: Array<{
    id: string;
    entryType: string;
    direction: "DEBIT" | "CREDIT";
    amountPaise: number;
    runningBalancePaise: number;
    description: string;
    createdAt: string;
  }>;
}

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  billingMonth: string;
  totalAmountPaise: number;
  paidAmountPaise: number;
  status: "DRAFT" | "ISSUED" | "PAID" | "OVERDUE";
  dueDate: string;
}

interface MarketVendor {
  id: string;
  businessName: string;
  slug: string;
  upiId?: string;
  vendorType: "MILKMAN" | "WATER_SERVICE" | "TIFFIN" | "FLOWERS" | "PET_SERVICES" | "LAUNDRY";
  locality: string;
  city: string;
  coveredSocieties: string[];
  rating: number;
  reviewCount: number;
  deliverySlots: string[];
  shifts?: Array<{
    id: string;
    name?: string;
    label?: string;
    timing: string;
    cutoff?: string;
    cutoffTime?: string;
    menuToday?: string;
    pricePaise: number;
    menu?: {
      title?: string;
      items?: string[];
      diet?: string;
    };
  }>;
  varieties?: Array<{
    id: string;
    name: string;
    unit: string;
    pricePaise: number;
    fatPercentage?: string;
    container?: string;
    depositPaise?: number;
  }>;
  services?: Array<{
    id: string;
    category: string;
    name: string;
    description: string;
    cutoffTimeStr: string;
    products: Array<{
      id: string;
      name: string;
      unitType: string;
      basePricePaise: number;
    }>;
  }>;
  products?: Array<{
    id: string;
    name: string;
    unitType: string;
    basePricePaise: number;
  }>;
}

function normalizeVendor(raw: any): MarketVendor | null {
  if (!raw || typeof raw !== "object" || !raw.id) return null;
  return {
    ...raw,
    id: String(raw.id),
    businessName: String(raw.businessName || "Local merchant"),
    slug: String(raw.slug || raw.id),
    vendorType: raw.vendorType || "TIFFIN",
    locality: String(raw.locality || raw.city || "Local area"),
    city: String(raw.city || ""),
    coveredSocieties: Array.isArray(raw.coveredSocieties) ? raw.coveredSocieties.map(String) : [],
    rating: Number.isFinite(Number(raw.rating)) ? Number(raw.rating) : 4.8,
    reviewCount: Number.isFinite(Number(raw.reviewCount)) ? Number(raw.reviewCount) : 120,
    deliverySlots: Array.isArray(raw.deliverySlots) ? raw.deliverySlots.map(String) : ["Morning Drop"],
    shifts: Array.isArray(raw.shifts) ? raw.shifts.filter(Boolean) : [],
    varieties: Array.isArray(raw.varieties) ? raw.varieties.filter(Boolean) : [],
    services: Array.isArray(raw.services) ? raw.services.filter(Boolean) : [],
    products: Array.isArray(raw.products) ? raw.products.filter(Boolean) : [],
  } as MarketVendor;
}

// 6 Circular Service Categories (Zomato UI Round Avatars)
const SERVICE_CIRCLES = [
  {
    id: "ALL",
    name: "All Services",
    sublabel: "Explore all",
    icon: Sparkles,
    bgClass: "from-white/10 to-white/5 border-white/20 text-white",
    activeClass: "ring-2 ring-primary border-primary text-primary",
  },
  {
    id: "WATER",
    name: "Water Cans",
    sublabel: "20L & RO",
    icon: Droplet,
    bgClass: "from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-400",
    activeClass: "ring-2 ring-blue-400 border-blue-400 text-blue-400 shadow-lg shadow-blue-500/20",
  },
  {
    id: "MILK",
    name: "Fresh Milk",
    sublabel: "A2 & Buffalo",
    icon: Milk,
    bgClass: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400",
    activeClass: "ring-2 ring-emerald-400 border-emerald-400 text-emerald-400 shadow-lg shadow-emerald-500/20",
  },
  {
    id: "TIFFIN",
    name: "Tiffin Meals",
    sublabel: "Daily Dabbas",
    icon: Utensils,
    bgClass: "from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400",
    activeClass: "ring-2 ring-amber-400 border-amber-400 text-amber-400 shadow-lg shadow-amber-500/20",
  },
  {
    id: "FLOWERS",
    name: "Pooja Flowers",
    sublabel: "Daily Pushpa",
    icon: Flower2,
    bgClass: "from-rose-500/20 to-pink-500/10 border-rose-500/30 text-rose-400",
    activeClass: "ring-2 ring-rose-400 border-rose-400 text-rose-400 shadow-lg shadow-rose-500/20",
  },
  {
    id: "PETS",
    name: "Pet Services",
    sublabel: "Walks & Bowls",
    icon: Dog,
    bgClass: "from-purple-500/20 to-indigo-500/10 border-purple-500/30 text-purple-400",
    activeClass: "ring-2 ring-purple-400 border-purple-400 text-purple-400 shadow-lg shadow-purple-500/20",
  },
  {
    id: "LAUNDRY",
    name: "Wash & Iron",
    sublabel: "Steam Press",
    icon: Shirt,
    bgClass: "from-teal-500/20 to-emerald-500/10 border-teal-500/30 text-teal-400",
    activeClass: "ring-2 ring-teal-400 border-teal-400 text-teal-400 shadow-lg shadow-teal-500/20",
  },
];

// Zomato Promotional Hero Ad Flyers
const AD_FLYERS = [
  {
    id: "flyer_milk",
    badge: "EARLY BIRD · BY 6:00 AM",
    title: "Pure Desi Gir Cow A2 Milk",
    subtitle: "Chilled raw milk in sanitized glass bottles before you wake up. Zero preservatives.",
    tag: "Free Bottle Exchange",
    category: "MILK",
    cta: "Order Milk Routine",
    gradient: "from-[#082218] via-[#051710] to-[#0b0d0c]",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    accentColor: "text-emerald-400",
    icon: Milk,
  },
  {
    id: "flyer_tiffin",
    badge: "TAWA FRESH · ZERO PREP",
    title: "Ghar Jaisa Homestyle Tiffin",
    subtitle: "Warm wheat phulkas, dal tadka & seasonal sabzi in insulated steel dabbas. Skip before 10 AM.",
    tag: "Autopilot Cutoff",
    category: "TIFFIN",
    cta: "Explore Meals",
    gradient: "from-[#261708] via-[#1a0f05] to-[#0b0d0c]",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    accentColor: "text-amber-400",
    icon: Utensils,
  },
  {
    id: "flyer_water",
    badge: "100% SEALED & TESTED",
    title: "20L Mineral & RO Water Cans",
    subtitle: "Doorstep delivery right outside your apartment. Zero security deposit for society members.",
    tag: "Zero Can Deposit",
    category: "WATER",
    cta: "Subscribe Water",
    gradient: "from-[#08182b] via-[#05101c] to-[#0b0d0c]",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    accentColor: "text-blue-400",
    icon: Droplet,
  },
  {
    id: "flyer_flowers",
    badge: "DIRECT FROM MANDI · 5:30 AM",
    title: "Fresh Pooja Pushpa Baskets",
    subtitle: "Sacred marigold, fresh jasmine mogra veni & tulsi delivered before your morning prayers.",
    tag: "Eco Banana Leaf Pack",
    category: "FLOWERS",
    cta: "Get Pooja Flowers",
    gradient: "from-[#290818] via-[#1a0510] to-[#0b0d0c]",
    badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    accentColor: "text-rose-400",
    icon: Flower2,
  },
  {
    id: "flyer_pets",
    badge: "KCI CERTIFIED · GPS TRACKED",
    title: "Daily Walks & Canine Stew Bowls",
    subtitle: "Professional morning & evening dog walks with GPS tracking + slow-cooked warm pet meals.",
    tag: "Doorstep Pickup",
    category: "PETS",
    cta: "Book Pet Routine",
    gradient: "from-[#1d0829] via-[#13051b] to-[#0b0d0c]",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    accentColor: "text-purple-400",
    icon: Dog,
  },
  {
    id: "flyer_laundry",
    badge: "24-HR DOORSTEP TURNAROUND",
    title: "Steam Press & Laundry Autopilot",
    subtitle: "Professional high-pressure steam press delivered on hangers. 60 clothes pass or per piece.",
    tag: "Hanger Return",
    category: "LAUNDRY",
    cta: "Subscribe Ironing",
    gradient: "from-[#082024] via-[#051517] to-[#0b0d0c]",
    badgeColor: "bg-teal-500/10 text-teal-400 border-teal-500/20",
    accentColor: "text-teal-400",
    icon: Shirt,
  },
];

export default function CustomerDashboardClient() {
  const user = useUser();
  const hexclaveApp = useHexclaveApp();

  const [loading, setLoading] = useState(true);
  const [todayFulfillment, setTodayFulfillment] = useState<FulfillmentItem | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [khataStatement, setKhataStatement] = useState<KhataStatement>({
    tenantId: "",
    customerId: user?.id || "",
    runningBalancePaise: 0,
    entries: [],
  });
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Marketplace & Zomato Layout States
  const [marketVendors, setMarketVendors] = useState<MarketVendor[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<
    "ALL" | "WATER" | "MILK" | "TIFFIN" | "FLOWERS" | "PETS" | "LAUNDRY"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSociety, setSelectedSociety] = useState("Sobha Classic, HSR Layout");
  const [activeFlyerIndex, setActiveFlyerIndex] = useState(0);

  // Quick Subscribe In-Card Modal State
  const [subscribeModal, setSubscribeModal] = useState<{
    open: boolean;
    vendor: MarketVendor | null;
    item: {
      id: string;
      name: string;
      unitType?: string;
      pricePaise: number;
      shiftId?: string;
    } | null;
    cadence: "DAILY" | "WEEKDAYS" | "ALTERNATE_DAYS";
    quantity: number;
    instructions: string;
    submitting: boolean;
    successMessage: string | null;
  }>({
    open: false,
    vendor: null,
    item: null,
    cadence: "DAILY",
    quantity: 1,
    instructions: "",
    submitting: false,
    successMessage: null,
  });

  const [upiModal, setUpiModal] = useState({
    open: false,
    intentUri: "",
    amountPaise: 0,
  });

  // Auto-advance Ad Flyers
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFlyerIndex((prev) => (prev + 1) % AD_FLYERS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);

      const [vendorsResult, subResult, fulResult, invResult] = await Promise.all([
        safeJsonFetch<unknown[]>("/api/marketplace/vendors"),
        safeJsonFetch<any[]>(`/api/subscriptions?customerId=${encodeURIComponent(user.id)}`),
        safeJsonFetch<any[]>(`/api/fulfillments?customerId=${encodeURIComponent(user.id)}`),
        safeJsonFetch<any[]>(`/api/billing/invoices?customerId=${encodeURIComponent(user.id)}`),
      ]);

      const loadedVendors = Array.isArray(vendorsResult.payload.data)
        ? vendorsResult.payload.data.map(normalizeVendor).filter((v): v is MarketVendor => Boolean(v))
        : [];
      setMarketVendors(loadedVendors);

      let activeTenantId = loadedVendors[0]?.id || "";

      const subData = subResult.payload;
      if (Array.isArray(subData.data)) {
        const normalizedSubscriptions = subData.data
          .filter((s) => s && s.id)
          .map((s: any) => ({
            id: String(s.id),
            tenantId: String(s.tenantId || ""),
            serviceId: String(s.productName || "Recurring Service"),
            status: s.status === "PAUSED" || s.status === "CANCELLED" ? s.status : "ACTIVE",
            quantity: Number(s.defaultQuantity) || 1,
            unitPricePaise: Number(s.unitPricePaise) || 0,
            cadence: String(s.cadence || "DAILY"),
            shift: s.shift ? String(s.shift) : "MORNING",
            startDate: String(s.startDate || ""),
          }));
        setSubscriptions(normalizedSubscriptions);

        if (normalizedSubscriptions[0]?.tenantId) {
          activeTenantId = normalizedSubscriptions[0].tenantId;
        }
      } else {
        setSubscriptions([]);
      }

      if (activeTenantId) {
        const khataResult = await safeJsonFetch<any>(
          `/api/khata?tenantId=${encodeURIComponent(activeTenantId)}&customerId=${encodeURIComponent(user.id)}`
        );
        const statement = khataResult.payload.data;
        if (statement && typeof statement === "object") {
          setKhataStatement({
            tenantId: String(statement.tenantId || activeTenantId),
            customerId: String(statement.customerId || user.id),
            runningBalancePaise: Number(statement.runningBalancePaise) || 0,
            entries: Array.isArray(statement.entries) ? statement.entries.filter(Boolean) : [],
          });
        }
      }

      const fulData = fulResult.payload;
      if (Array.isArray(fulData.data) && fulData.data.length > 0) {
        const todayStr = new Date().toISOString().split("T")[0];
        const match = fulData.data.find((f: any) => f?.serviceDate === todayStr) || fulData.data[0];
        if (match) {
          setTodayFulfillment({
            id: String(match.id || ""),
            subscriptionId: String(match.subscriptionId || ""),
            serviceId: String(match.items?.[0]?.productName || "Standard Daily Delivery"),
            serviceDate: String(match.serviceDate || todayStr),
            quantity: Number(match.items?.[0]?.quantity) || 1,
            unitPricePaise: Number(match.items?.[0]?.unitPricePaise || match.totalPricePaise) || 0,
            totalPricePaise: Number(match.totalPricePaise) || 0,
            status: String(match.status || "PENDING"),
            cutoffTime: String(match.cutoffTime || "10:00 AM"),
            notes: match.notes ? String(match.notes) : undefined,
          });
        }
      } else {
        setTodayFulfillment(null);
      }

      const invData = invResult.payload;
      if (Array.isArray(invData.data)) {
        setInvoices(
          invData.data
            .filter((i) => i && i.id)
            .map((i: any) => ({
              id: String(i.id),
              invoiceNumber: String(i.invoiceNumber || "Invoice"),
              billingMonth: String(i.periodStart || "").slice(0, 7) || new Date().toISOString().slice(0, 7),
              totalAmountPaise: Number(i.totalAmountDuePaise || i.subtotalPaise) || 0,
              paidAmountPaise: Number(i.amountPaidPaise) || 0,
              status: i.status,
              dueDate: String(i.dueDate || ""),
            }))
        );
      } else {
        setInvoices([]);
      }
    } catch (error) {
      console.error("Failed to load customer portal data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      void loadData();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Filtered vendors for Zomato-style marketplace
  const filteredVendors = useMemo(() => {
    return marketVendors.filter((v) => {
      // Category filter across 6 verticals
      if (categoryFilter === "TIFFIN" && v.vendorType !== "TIFFIN") return false;
      if (categoryFilter === "MILK" && v.vendorType !== "MILKMAN") return false;
      if (categoryFilter === "WATER" && v.vendorType !== "WATER_SERVICE") return false;
      if (categoryFilter === "FLOWERS" && v.vendorType !== "FLOWERS") return false;
      if (categoryFilter === "PETS" && v.vendorType !== "PET_SERVICES") return false;
      if (categoryFilter === "LAUNDRY" && v.vendorType !== "LAUNDRY") return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = v.businessName.toLowerCase().includes(q);
        const matchesLocality = v.locality.toLowerCase().includes(q);
        const matchesSocieties = v.coveredSocieties.some((s) => String(s).toLowerCase().includes(q));
        const matchesCategory = v.vendorType.toLowerCase().includes(q);
        const matchesProducts =
          v.products?.some((p) => p.name.toLowerCase().includes(q)) ||
          v.varieties?.some((va) => va.name.toLowerCase().includes(q));
        const matchesMenu = v.shifts?.some((s) => {
          const menuText = s.menuToday || (s.menu?.items ? s.menu.items.join(", ") : "");
          return menuText ? menuText.toLowerCase().includes(q) : false;
        });
        if (!matchesName && !matchesLocality && !matchesSocieties && !matchesMenu && !matchesCategory && !matchesProducts) {
          return false;
        }
      }

      return true;
    });
  }, [marketVendors, categoryFilter, searchQuery]);

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-xl items-center justify-center px-6 py-12">
        <div className="w-full rounded-[28px] border border-white/[0.08] bg-white/[0.025] p-8 text-center shadow-2xl space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            <CreditCard className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-primary">
              Hexclave Auth Required
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Domestic Account Portal</h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Sign in with your Hexclave account to access your household recurring deliveries, manage daily autopilot cutoffs, and review digital khata statements.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/login?redirect=/customer/dashboard"
              className={buttonVariants({ variant: "default", size: "lg", className: "w-full shadow-lg font-bold gap-2" })}
            >
              Sign In with Hexclave
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleTodayAction = async (action: "CONFIRM" | "SKIP") => {
    if (!todayFulfillment) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/fulfillments/${todayFulfillment.id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json()) as { success: boolean; data?: { status: string } };
      if (data.success && data.data) {
        setTodayFulfillment((prev) => (prev ? { ...prev, status: data.data!.status } : null));
      } else {
        setTodayFulfillment((prev) => (prev ? { ...prev, status: action === "SKIP" ? "SKIPPED" : "CONFIRMED" } : null));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleSubscription = async (subscription: SubscriptionItem) => {
    const action = subscription.status === "ACTIVE" ? "pause" : "resume";
    try {
      const res = await fetch(`/api/subscriptions/${subscription.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json()) as { success: boolean; data?: { status: SubscriptionItem["status"] } };
      setSubscriptions((current) =>
        current.map((item) =>
          item.id === subscription.id
            ? { ...item, status: data.success && data.data ? data.data.status : action === "pause" ? "PAUSED" : "ACTIVE" }
            : item
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handlePayUPI = async (amountPaise: number) => {
    if (!user) return;
    setActionLoading(true);
    try {
      const activeTenant = marketVendors.find((v) => v.id === khataStatement.tenantId) || marketVendors[0];
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: activeTenant?.id || "",
          customerId: user.id,
          amountPaise,
          upiId: activeTenant?.upiId || "merchant@upi",
          merchantName: activeTenant?.businessName || "RUXS Merchant",
        }),
      });
      const data = (await res.json()) as { success: boolean; data?: { upiIntentUri: string; amountPaise: number } };
      const amount = data.data?.amountPaise ?? amountPaise;
      const intent =
        data.data?.upiIntentUri ||
        `upi://pay?pa=merchant@upi&pn=RUXS+Merchant&am=${amount / 100}&cu=INR`;
      setUpiModal({ open: true, intentUri: intent, amountPaise: amount });
    } catch {
      setUpiModal({
        open: true,
        intentUri: `upi://pay?pa=merchant@upi&pn=RUXS+Merchant&am=${amountPaise / 100}&cu=INR`,
        amountPaise,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Quick In-Card Routine Subscription
  const handleQuickSubscribeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscribeModal.vendor || !subscribeModal.item || !user) return;
    setSubscribeModal((prev) => ({ ...prev, submitting: true, successMessage: null }));

    try {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: subscribeModal.vendor.id,
          customerId: user.id,
          productId: subscribeModal.item.id,
          productName: `${subscribeModal.item.name} (${subscribeModal.vendor.businessName})`,
          unitPricePaise: subscribeModal.item.pricePaise,
          cadence: subscribeModal.cadence,
          shift: subscribeModal.item.shiftId || "MORNING",
          defaultQuantity: Number(subscribeModal.quantity) || 1,
          autopilotDefault: "CONFIRMED",
          instructions: subscribeModal.instructions.trim() || undefined,
          startDate: tomorrow,
        }),
      });

      const data = (await res.json()) as { success: boolean; error?: { message: string } };
      if (data.success) {
        setSubscribeModal((prev) => ({
          ...prev,
          submitting: false,
          successMessage: `Subscribed! Your daily routine for "${subscribeModal.item?.name}" is active on autopilot.`,
        }));
        void loadData();
        setTimeout(() => {
          setSubscribeModal({
            open: false,
            vendor: null,
            item: null,
            cadence: "DAILY",
            quantity: 1,
            instructions: "",
            submitting: false,
            successMessage: null,
          });
        }, 1600);
      } else {
        throw new Error(data.error?.message || "Failed to create subscription routine");
      }
    } catch (err: any) {
      alert(err.message || "Could not activate subscription");
      setSubscribeModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const dueAmountPaise = Number.isFinite(Number(khataStatement.runningBalancePaise))
    ? Math.max(Number(khataStatement.runningBalancePaise), 0)
    : 0;
  const activePlans = subscriptions.filter((item) => item.status === "ACTIVE").length;
  const displayName = String(
    (user as any)?.name ||
      (user as any)?.displayName ||
      user?.primaryEmail ||
      (user as any)?.email ||
      "Household member"
  );

  if (loading) {
    return (
      <div className="py-4">
        <RuxsDashboardSkeleton />
      </div>
    );
  }

  const currentFlyer = AD_FLYERS[activeFlyerIndex];

  return (
    <>
      <div className="mx-auto w-full max-w-[1280px] px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="flex flex-col gap-6">

          {/* ========================================================================= */}
          {/* 1. ZOMATO-STYLE LOCATION & STATUS HEADER                                  */}
          {/* ========================================================================= */}
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-white/[0.08] bg-white/[0.025] px-5 py-4 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary shadow-sm">
                <MapPin className="h-5 w-5 text-primary animate-bounce-subtle" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-foreground tracking-tight">{selectedSociety}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Autopilot Live
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate max-w-sm">
                  Tower 3 · Flat 402 · Doorstep Drop Active
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePayUPI(dueAmountPaise || 12000)}
                disabled={actionLoading}
                className="flex items-center gap-2 rounded-2xl border border-white/[0.09] bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-foreground transition hover:bg-white/[0.06] hover:border-primary/40 shadow-sm"
              >
                <WalletCards className="h-3.5 w-3.5 text-primary" />
                <span>Khata: <strong className="text-primary">{formatINR(dueAmountPaise as Paise)}</strong></span>
                <span className="rounded-lg bg-primary/20 px-1.5 py-0.5 text-[9px] font-bold text-primary">Settle</span>
              </button>

              <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-xs">
                <span className="text-muted-foreground">Hi,</span>
                <span className="font-semibold text-foreground">{displayName.split(" ")[0] || "there"}</span>
              </div>
            </div>
          </header>

          {/* ========================================================================= */}
          {/* 2. PROMINENT ZOMATO SEARCH BAR                                           */}
          {/* ========================================================================= */}
          <div className="relative">
            <div className="relative flex items-center">
              <Search className="absolute left-4 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for farm milk, lunch thali, 20L water can, pooja flowers, steam press, pet meals..."
                className="h-13 w-full rounded-2xl border border-white/[0.1] bg-[#121614] pl-11 pr-10 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-lg transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 rounded-full p-1 text-muted-foreground hover:bg-white/[0.08] hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. TODAY'S FULFILLMENT OR ACTIVE ROUTINES DECK                             */}
          {/* ========================================================================= */}
          <section className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-bold tracking-tight text-foreground">Your Active Household Routines</h2>
                <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {subscriptions.length} active
                </span>
              </div>
              <Link href="/customer/subscribe" className="text-xs font-semibold text-primary hover:underline">
                + Add Routine
              </Link>
            </div>

            {subscriptions.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5 text-center">
                <p className="text-xs font-medium text-foreground">No recurring routines active yet.</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Browse local verified vendors below to start silent milk drops, water jars, or lunch on autopilot.
                </p>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {subscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    className="min-w-[280px] max-w-[320px] shrink-0 rounded-2xl border border-white/[0.08] bg-[#121614] p-4 shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                          {sub.shift || "DAILY"}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[9px] rounded-md ${
                            sub.status === "ACTIVE"
                              ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                              : "border-white/10 text-muted-foreground"
                          }`}
                        >
                          {sub.status}
                        </Badge>
                      </div>
                      <h4 className="mt-2 text-xs font-bold text-foreground line-clamp-1">{sub.serviceId}</h4>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {sub.cadence} · {sub.quantity} unit{sub.quantity > 1 ? "s" : ""} · {formatINR(sub.unitPricePaise as Paise)}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between">
                      <span className="text-[10px] text-subtle">Cutoff applies</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleSubscription(sub)}
                        className="h-7 rounded-lg px-2 text-[10px] font-semibold hover:bg-white/[0.08]"
                      >
                        {sub.status === "ACTIVE" ? (
                          <>
                            <Pause className="mr-1 h-3 w-3" /> Pause
                          </>
                        ) : (
                          <>
                            <Play className="mr-1 h-3 w-3" /> Resume
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ========================================================================= */}
          {/* 4. AD FLYER SLIDER LIKE ZOMATO                                            */}
          {/* ========================================================================= */}
          <section className="relative overflow-hidden rounded-3xl border border-white/[0.09] shadow-2xl">
            <div
              className={`relative flex min-h-[190px] sm:min-h-[210px] flex-col justify-between bg-gradient-to-r ${currentFlyer.gradient} p-6 sm:p-7 transition-all duration-700`}
            >
              <div className="relative z-10 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${currentFlyer.badgeColor}`}>
                    {currentFlyer.badge}
                  </span>
                  <span className="rounded-full border border-white/[0.1] bg-black/30 px-2 py-0.5 text-[9px] text-muted-foreground">
                    {currentFlyer.tag}
                  </span>
                </div>

                <h3 className="mt-3 text-xl font-bold tracking-tight text-white sm:text-2xl">
                  {currentFlyer.title}
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm text-white/80 leading-relaxed max-w-md">
                  {currentFlyer.subtitle}
                </p>
              </div>

              <div className="relative z-10 mt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter(currentFlyer.category as any);
                    document.getElementById("marketplace-vendors-section")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-black shadow-lg transition hover:bg-white/90 active:scale-95"
                >
                  <span>{currentFlyer.cta}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>

                {/* Slider pagination dots & arrows */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Previous flyer"
                    onClick={() => setActiveFlyerIndex((prev) => (prev - 1 + AD_FLYERS.length) % AD_FLYERS.length)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white hover:bg-black/60"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <div className="flex gap-1">
                    {AD_FLYERS.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        aria-label={`Slide ${idx + 1}`}
                        onClick={() => setActiveFlyerIndex(idx)}
                        className={`h-1.5 rounded-full transition-all ${
                          idx === activeFlyerIndex ? "w-5 bg-white" : "w-1.5 bg-white/30"
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    aria-label="Next flyer"
                    onClick={() => setActiveFlyerIndex((prev) => (prev + 1) % AD_FLYERS.length)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white hover:bg-black/60"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 5. CIRCLES OF ALL TYPES OF SERVICES (ZOMATO ROUND STORY AVATARS)          */}
          {/* ========================================================================= */}
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-subtle">Category Explorer</p>
                <h3 className="text-base font-bold text-foreground">What do you need daily on autopilot?</h3>
              </div>
              {categoryFilter !== "ALL" && (
                <button
                  type="button"
                  onClick={() => setCategoryFilter("ALL")}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  View All
                </button>
              )}
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {SERVICE_CIRCLES.map((circle) => {
                const isActive = categoryFilter === circle.id;
                const IconComponent = circle.icon;
                return (
                  <button
                    key={circle.id}
                    type="button"
                    onClick={() => {
                      setCategoryFilter(circle.id as any);
                      document.getElementById("marketplace-vendors-section")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="flex flex-col items-center gap-2 shrink-0 group focus:outline-none transition active:scale-95"
                  >
                    <div
                      className={`relative flex h-16 w-16 sm:h-18 sm:w-18 items-center justify-center rounded-full border bg-gradient-to-b ${circle.bgClass} transition shadow-md group-hover:scale-105 ${
                        isActive ? circle.activeClass : "border-white/[0.08]"
                      }`}
                    >
                      <IconComponent className="h-6 w-6 sm:h-7 sm:w-7 transition group-hover:rotate-6" />
                    </div>
                    <div className="text-center">
                      <p className={`text-xs font-bold leading-tight ${isActive ? "text-primary" : "text-foreground"}`}>
                        {circle.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{circle.sublabel}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 6. VENDORS LIST WITH IN-CARD PRODUCTS & QUICK SUBSCRIBE                  */}
          {/* ========================================================================= */}
          <section id="marketplace-vendors-section" className="space-y-4 pt-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.07] pb-3">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <span>Verified Society Merchants</span>
                  <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-xs text-muted-foreground font-mono">
                    {filteredVendors.length}
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Doorstep deliveries with live GPS runs and zero morning doorbell ring.
                </p>
              </div>

              {/* Category selector pills */}
              <div className="flex flex-wrap gap-1.5">
                {(["ALL", "MILK", "WATER", "TIFFIN", "FLOWERS", "PETS", "LAUNDRY"] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`rounded-xl px-2.5 py-1 text-[11px] font-semibold transition ${
                      categoryFilter === cat
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "border border-white/[0.08] bg-white/[0.02] text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
                    }`}
                  >
                    {cat === "ALL"
                      ? "All"
                      : cat === "MILK"
                      ? "Milk"
                      : cat === "WATER"
                      ? "Water"
                      : cat === "TIFFIN"
                      ? "Tiffin"
                      : cat === "FLOWERS"
                      ? "Flowers"
                      : cat === "PETS"
                      ? "Pets"
                      : "Laundry"}
                  </button>
                ))}
              </div>
            </div>

            {/* Vendor Cards Grid */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {filteredVendors.length === 0 ? (
                <div className="col-span-full rounded-3xl border border-white/[0.07] bg-white/[0.02] p-12 text-center">
                  <p className="text-sm font-semibold text-foreground">No merchants match your selection.</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Try switching categories or clearing search filters.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryFilter("ALL");
                      setSearchQuery("");
                    }}
                    className="mt-4 rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold hover:bg-white/5"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                filteredVendors.map((vendor) => {
                  return (
                    <div
                      key={vendor.id}
                      className="group flex flex-col justify-between rounded-3xl border border-white/[0.08] bg-[#111513] p-5 shadow-lg transition hover:border-primary/40 hover:shadow-primary/5"
                    >
                      <div>
                        {/* Card Header with Rating & Badge */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                              {vendor.vendorType.replace("_", " ")}
                            </span>
                            <span className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-black/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                              <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
                              {vendor.rating} ({vendor.reviewCount})
                            </span>
                          </div>

                          <span className="text-[10px] font-mono text-muted-foreground rounded-lg border border-white/[0.06] bg-black/20 px-2 py-1">
                            {vendor.deliverySlots[0] || "Early Morning"}
                          </span>
                        </div>

                        <h3 className="mt-3 text-base font-bold text-foreground group-hover:text-primary transition">
                          {vendor.businessName}
                        </h3>

                        <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <MapPin size={12} className="shrink-0 text-subtle" />
                          <span className="truncate">{vendor.locality}</span>
                        </div>

                        <p className="mt-1.5 text-[10px] text-subtle leading-tight line-clamp-1">
                          Servicing: {vendor.coveredSocieties.slice(0, 3).join(", ") || "Sobha Classic, Purva Fairmont"}
                          {vendor.coveredSocieties.length > 3 ? ` +${vendor.coveredSocieties.length - 3} more` : ""}
                        </p>

                        <div className="my-3.5 h-px bg-white/[0.06]" />

                        {/* IN-CARD PRODUCTS & VARIETIES WITH DIRECT 1-TAP SUBSCRIBE */}
                        <div className="space-y-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-subtle">
                            Products & Varieties Available:
                          </p>

                          {/* 1. Varieties (Milk, Water, Flowers, Pets, Laundry) */}
                          {vendor.varieties && vendor.varieties.length > 0 && (
                            <div className="space-y-2">
                              {vendor.varieties.map((v) => (
                                <div
                                  key={v.id}
                                  className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2 text-xs"
                                >
                                  <div className="min-w-0 pr-2">
                                    <p className="font-semibold text-foreground truncate">{v.name}</p>
                                    <p className="text-[10px] text-muted-foreground">
                                      {v.fatPercentage ? `${v.fatPercentage} · ` : ""}
                                      {v.container || v.unit}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="font-bold text-primary text-xs">
                                      {formatINR(v.pricePaise as Paise)}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setSubscribeModal({
                                          open: true,
                                          vendor,
                                          item: {
                                            id: v.id,
                                            name: v.name,
                                            unitType: v.unit,
                                            pricePaise: v.pricePaise,
                                          },
                                          cadence: "DAILY",
                                          quantity: 1,
                                          instructions: "",
                                          submitting: false,
                                          successMessage: null,
                                        })
                                      }
                                      className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500 hover:text-black transition"
                                    >
                                      + SUBSCRIBE
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* 2. Shifts & Detailed Menus (for Tiffin & Meals) */}
                          {vendor.shifts && vendor.shifts.length > 0 && (
                            <div className="space-y-2.5">
                              {vendor.shifts.map((shift) => {
                                const shiftName = shift.name || shift.label || shift.id || "Meal";
                                const cutoffStr = shift.cutoffTime || shift.cutoff || "Before Delivery";
                                const menuStr =
                                  shift.menuToday || (shift.menu?.items ? shift.menu.items.join(", ") : "");

                                return (
                                  <div
                                    key={shift.id}
                                    className="rounded-2xl border border-white/[0.06] bg-black/20 p-3 text-xs"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-foreground flex items-center gap-1">
                                        <Clock size={12} className="text-primary" />
                                        {shiftName}
                                      </span>
                                      {shift.pricePaise > 0 && (
                                        <span className="font-semibold text-primary">
                                          {formatINR(shift.pricePaise as Paise)}
                                        </span>
                                      )}
                                    </div>
                                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                                      {shift.timing} · Cutoff {cutoffStr}
                                    </p>
                                    {menuStr && (
                                      <div className="mt-2 rounded-xl bg-white/[0.025] border border-white/[0.04] p-2 text-[11px] leading-relaxed text-foreground">
                                        <span className="font-semibold text-primary mr-1">Today&apos;s Menu:</span>
                                        {menuStr}
                                      </div>
                                    )}
                                    <div className="mt-2 flex justify-end">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setSubscribeModal({
                                            open: true,
                                            vendor,
                                            item: {
                                              id: `shift_${shift.id.toLowerCase()}`,
                                              name: `${vendor.businessName} (${shiftName})`,
                                              unitType: "MEAL",
                                              pricePaise: shift.pricePaise,
                                              shiftId: shift.id,
                                            },
                                            cadence: "DAILY",
                                            quantity: 1,
                                            instructions: "",
                                            submitting: false,
                                            successMessage: null,
                                          })
                                        }
                                        className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500 hover:text-black transition"
                                      >
                                        + SUBSCRIBE TO {shiftName.toUpperCase()}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Customize Button */}
                      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">Doorstep autopilot routine</span>
                        <Link
                          href={`/customer/subscribe?vendor=${vendor.slug}`}
                          className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                        >
                          Full Customize
                          <ArrowRight size={12} />
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 7. BILLING & INVOICES STATEMENT SECTION                                   */}
          {/* ========================================================================= */}
          <section className="rounded-3xl border border-white/[0.08] bg-white/[0.025]">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4 sm:px-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-subtle">Digital Khata</p>
                <h3 className="mt-1 text-base font-bold text-foreground">Monthly Invoices & Statements</h3>
              </div>
              <ReceiptText className="h-5 w-5 text-subtle" />
            </div>

            <div className="divide-y divide-white/[0.07]">
              {invoices.length === 0 ? (
                <div className="px-6 py-8 text-center text-xs text-muted-foreground">
                  No billing statements generated yet. Active daily fulfillments accumulate on your Digital Khata.
                </div>
              ) : (
                invoices.map((invoice) => {
                  const outstanding = Math.max(invoice.totalAmountPaise - invoice.paidAmountPaise, 0);
                  return (
                    <div
                      key={invoice.id}
                      className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{invoice.invoiceNumber}</p>
                          <Badge variant="outline" className="rounded-full border-white/[0.1] bg-white/[0.02] text-[10px]">
                            {invoice.status}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {invoice.billingMonth} · Due {invoice.dueDate}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-4 sm:justify-end">
                        <div className="text-right">
                          <p className="text-sm font-semibold">{formatINR(invoice.totalAmountPaise as Paise)}</p>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                            {outstanding > 0 ? `${formatINR(outstanding as Paise)} outstanding` : "Settled"}
                          </p>
                        </div>
                        {outstanding > 0 && (
                          <Button size="sm" className="h-8 rounded-xl text-xs" onClick={() => handlePayUPI(outstanding)}>
                            Pay UPI
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 8. QUICK SUBSCRIBE MODAL (1-TAP IN-CARD ROUTINE CREATION)                 */}
      {/* ========================================================================= */}
      {subscribeModal.open && subscribeModal.item && subscribeModal.vendor && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/[0.1] bg-[#111512] p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-white/[0.07] pb-3">
              <div>
                <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                  1-Tap Routine Setup
                </span>
                <h3 className="mt-1.5 text-base font-bold text-foreground">{subscribeModal.item.name}</h3>
                <p className="text-xs text-muted-foreground">{subscribeModal.vendor.businessName}</p>
              </div>
              <button
                type="button"
                onClick={() => setSubscribeModal((prev) => ({ ...prev, open: false }))}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {subscribeModal.successMessage ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center space-y-2">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <Check className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-bold text-foreground">Routine Activated!</h4>
                <p className="text-xs text-muted-foreground">{subscribeModal.successMessage}</p>
              </div>
            ) : (
              <form onSubmit={handleQuickSubscribeSubmit} className="space-y-4">
                {/* Cadence selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Delivery Cadence</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "DAILY", label: "Daily", sub: "Every day" },
                      { id: "WEEKDAYS", label: "Weekdays", sub: "Mon – Fri" },
                      { id: "ALTERNATE_DAYS", label: "Alternate", sub: "Every 2nd day" },
                    ].map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSubscribeModal((prev) => ({ ...prev, cadence: c.id as any }))}
                        className={`rounded-xl border p-2.5 text-center transition ${
                          subscribeModal.cadence === c.id
                            ? "border-primary bg-primary/10 text-primary font-bold"
                            : "border-white/[0.08] bg-white/[0.02] text-muted-foreground hover:bg-white/[0.05]"
                        }`}
                      >
                        <p className="text-xs">{c.label}</p>
                        <p className="text-[9px] text-subtle">{c.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity and Price Summary */}
                <div className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-black/20 p-3.5">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Daily Quantity</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatINR(subscribeModal.item.pricePaise as Paise)} / unit
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={subscribeModal.quantity <= 1}
                      onClick={() => setSubscribeModal((prev) => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.03] text-foreground hover:bg-white/[0.08] disabled:opacity-30"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="font-bold text-sm text-foreground w-4 text-center">{subscribeModal.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setSubscribeModal((prev) => ({ ...prev, quantity: prev.quantity + 1 }))}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.03] text-foreground hover:bg-white/[0.08]"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Delivery Notes */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Delivery Instructions (Optional)</label>
                  <input
                    type="text"
                    value={subscribeModal.instructions}
                    onChange={(e) => setSubscribeModal((prev) => ({ ...prev, instructions: e.target.value }))}
                    placeholder="e.g. Leave in bag at doorstep / Ring bell"
                    className="h-10 w-full rounded-xl border border-white/[0.09] bg-black/30 px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Action button */}
                <Button
                  type="submit"
                  disabled={subscribeModal.submitting}
                  className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg"
                >
                  {subscribeModal.submitting ? "Activating Routine..." : "Confirm & Start Daily Routine"}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* UPI Payment Modal */}
      {upiModal.open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-white/[0.1] bg-[#111512] p-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary">UPI payment</p>
                <h3 className="mt-2 text-lg font-semibold">Settle your balance</h3>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setUpiModal({ open: false, intentUri: "", amountPaise: 0 })}
                className="rounded-full p-2 text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 rounded-2xl border border-primary/15 bg-primary/[0.045] p-5 text-center">
              <p className="text-xs text-muted-foreground">Payable</p>
              <p className="mt-2 text-3xl font-semibold text-primary">{formatINR(upiModal.amountPaise as Paise)}</p>
            </div>
            <a
              href={upiModal.intentUri}
              className="mt-5 flex h-11 w-full items-center justify-center rounded-xl bg-primary text-xs font-semibold text-primary-foreground"
            >
              Open UPI app
            </a>
            <button
              type="button"
              onClick={() => setUpiModal({ open: false, intentUri: "", amountPaise: 0 })}
              className="mt-2 h-10 w-full rounded-xl border border-white/[0.09] text-xs text-muted-foreground hover:bg-white/[0.03] hover:text-foreground"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}