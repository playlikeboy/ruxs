"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@hexclave/next";
import type {
  CatalogProduct,
  CartItem,
  ServiceCategoryId,
  GeofenceArea,
  NotificationItem,
  ActiveRoutine,
  ProductOption,
  ProductAddOn,
} from "../types";
import { CUSTOMER_ROUTES, CUSTOMER_TAB_ROUTES } from "../routes";
import type { NavTabId } from "@/src/design-system/components/DSBottomNav";

interface CustomerUIContextType {
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;
  activeCategory: ServiceCategoryId;
  setActiveCategory: (cat: ServiceCategoryId) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  navigateTo: (url: string) => void;

  selectedProduct: CatalogProduct | null;
  openProductModal: (prod: CatalogProduct) => void;
  closeProductModal: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;
  isGeofenceModalOpen: boolean;
  setIsGeofenceModalOpen: (open: boolean) => void;

  currentGeofence: GeofenceArea;
  geofenceList: GeofenceArea[];
  selectGeofence: (id: string) => void;

  cart: CartItem[];
  addToCart: (
    product: CatalogProduct,
    quantity?: number,
    selectedSize?: ProductOption,
    selectedAddOns?: ProductAddOn[]
  ) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  subtotalPaise: number;
  deliveryFeePaise: number;
  discountPaise: number;
  totalPaise: number;
  promoCode: string;
  applyPromoCode: (code: string) => { success: boolean; message: string };

  notifications: NotificationItem[];
  unreadNotifCount: number;
  markNotificationRead: (id: string) => void;

  routines: ActiveRoutine[];
  toggleRoutinePause: (id: string) => void;
}

const CustomerUIContext = createContext<CustomerUIContextType | undefined>(undefined);

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
};

async function readApiEnvelope<T>(response: Response): Promise<ApiEnvelope<T>> {
  const payload: unknown = await response.json();
  if (typeof payload === "object" && payload !== null) {
    return payload as ApiEnvelope<T>;
  }
  return {};
}

const DEFAULT_SOCIETIES: GeofenceArea[] = [
  {
    id: "sobha-classic",
    name: "Sobha Classic",
    societyName: "Sobha Classic, Bellandur",
    city: "Bangalore",
    lat: 12.926,
    lng: 77.6762,
    radiusMeters: 500,
    isInside: true,
    distanceMeters: 0,
    deliveryGuarantee: "Pre-cleared Gate Pass · 7:00 AM doorstep delivery guaranteed.",
  },
  {
    id: "green-glen",
    name: "Green Glen Layout",
    societyName: "Green Glen Layout, Bellandur",
    city: "Bangalore",
    lat: 12.928,
    lng: 77.674,
    radiusMeters: 600,
    isInside: true,
    distanceMeters: 0,
    deliveryGuarantee: "Pre-cleared Gate Pass · 7:00 AM doorstep delivery guaranteed.",
  },
  {
    id: "prestige-sunnyside",
    name: "Prestige Sunnyside",
    societyName: "Prestige Sunnyside, Marathahalli-ORR",
    city: "Bangalore",
    lat: 12.934,
    lng: 77.689,
    radiusMeters: 750,
    isInside: true,
    distanceMeters: 0,
    deliveryGuarantee: "Pre-cleared Gate Pass · 7:00 AM doorstep delivery guaranteed.",
  },
];

const EMPTY_GEOFENCE = DEFAULT_SOCIETIES[0];

function tabForPath(pathname: string): NavTabId {
  if (pathname.startsWith(CUSTOMER_ROUTES.services)) return "favorites";
  if (pathname.startsWith(CUSTOMER_ROUTES.tracking)) return "tracking";
  if (pathname.startsWith(CUSTOMER_ROUTES.khata)) return "profile";
  if (pathname.startsWith(CUSTOMER_ROUTES.cart)) return "cart";
  return "home";
}

function parseCart(value: string | null): CartItem[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter(
          (item) =>
            item &&
            typeof item === "object" &&
            item.product &&
            typeof item.quantity === "number" &&
            typeof item.unitPricePaise === "number"
        )
      : [];
  } catch {
    return [];
  }
}

export function CustomerUIProvider({
  children,
  initialTab,
}: {
  children: React.ReactNode;
  initialTab?: NavTabId;
}) {
  const router = useRouter();
  const pathname = usePathname();
  let user = null;
  try {
    user = useUser();
  } catch {
    user = null;
  }
  const customerId = user?.id;
  const [activeTabState, setActiveTabState] = useState<NavTabId>(
    initialTab || tabForPath(pathname)
  );
  const [activeCategory, setActiveCategoryState] = useState<ServiceCategoryId>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isGeofenceModalOpen, setIsGeofenceModalOpen] = useState(false);

  const [geofenceList, setGeofenceList] = useState<GeofenceArea[]>(DEFAULT_SOCIETIES);
  const [currentGeofenceId, setCurrentGeofenceId] = useState(DEFAULT_SOCIETIES[0].id);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [promoCode, setPromoCode] = useState("");
  const [discountPaise, setDiscountPaise] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [routines, setRoutines] = useState<ActiveRoutine[]>([]);

  const currentGeofence =
    geofenceList.find((item) => item.id === currentGeofenceId) ||
    geofenceList[0] ||
    EMPTY_GEOFENCE;

  const activeTab = tabForPath(pathname) || activeTabState;

  useEffect(() => {
    setActiveTabState(tabForPath(pathname));
    const rawCategory = new URLSearchParams(window.location.search).get("category");
    if (rawCategory) setActiveCategoryState(rawCategory.toUpperCase() as ServiceCategoryId);
  }, [pathname]);

  useEffect(() => {
    const stored = window.localStorage.getItem("ruxs.cart.v2");
    setCart(parseCart(stored));
  }, []);

  useEffect(() => {
    window.localStorage.setItem("ruxs.cart.v2", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (!customerId) {
      setGeofenceList(DEFAULT_SOCIETIES);
      setCurrentGeofenceId(DEFAULT_SOCIETIES[0].id);
      setNotifications([]);
      setRoutines([]);
      return;
    }

    const resolvedCustomerId = customerId;
    let cancelled = false;

    async function loadCustomerState() {
      try {
        const [householdResponse, notificationsResponse, routinesResponse] = await Promise.all([
          fetch(`/api/households?userId=${encodeURIComponent(resolvedCustomerId)}`),
          fetch(`/api/notifications?customerId=${encodeURIComponent(resolvedCustomerId)}`),
          fetch(`/api/subscriptions?customerId=${encodeURIComponent(resolvedCustomerId)}`),
        ]);

        if (!cancelled && householdResponse.ok) {
          const householdPayload = await readApiEnvelope<Record<string, unknown>>(householdResponse);
          const household = householdPayload?.success ? householdPayload.data : null;
          if (household) {
            const geofence: GeofenceArea = {
              id: String(household.id || "household"),
              name: String(household.name || household.societyName || "Delivery location"),
              societyName: String(household.societyName || household.name || "Household"),
              city: String(household.city || ""),
              lat: 0,
              lng: 0,
              radiusMeters: 0,
              isInside: false,
              distanceMeters: 0,
              deliveryGuarantee: "Household location linked. Service coverage is checked against the selected merchant.",
            };
            setGeofenceList([geofence]);
            setCurrentGeofenceId(geofence.id);
          }
        }

        if (!cancelled && notificationsResponse.ok) {
          const payload = await readApiEnvelope<unknown[]>(notificationsResponse);
          const raw = payload?.success && Array.isArray(payload.data) ? payload.data : [];
          setNotifications(
            raw.map((item: any) => ({
              id: String(item.id),
              title: String(item.title || "RUXS update"),
              message: String(item.message || ""),
              timestamp: String(item.timestamp || item.createdAt || ""),
              type: ["ORDER", "ROUTINE", "OFFER", "SYSTEM"].includes(item.type)
                ? item.type
                : "SYSTEM",
              read: Boolean(item.read),
              vendorAvatar: item.vendorAvatar ? String(item.vendorAvatar) : undefined,
              actionLabel: item.actionLabel ? String(item.actionLabel) : undefined,
            }))
          );
        }

        if (!cancelled && routinesResponse.ok) {
          const payload = await readApiEnvelope<unknown[]>(routinesResponse);
          const raw = payload?.success && Array.isArray(payload.data) ? payload.data : [];
          setRoutines(
            raw.map((item: any) => ({
              id: String(item.id),
              productName: String(item.productName || item.serviceName || "Recurring service"),
              vendorName: String(item.vendorName || item.businessName || "Local merchant"),
              quantity: Number(item.defaultQuantity || item.quantity || 1),
              cadence:
                item.cadence === "WEEKDAYS" || item.cadence === "ALTERNATE_DAYS"
                  ? item.cadence
                  : "DAILY",
              shift: String(item.shift || ""),
              status: item.status === "PAUSED" ? "PAUSED" : "ACTIVE",
              nextDelivery: String(item.nextDelivery || item.startDate || ""),
              unitPricePaise: Number(item.unitPricePaise || 0),
              image: "/icon.svg",
            }))
          );
        }
      } catch (error) {
        console.warn("RUXS customer state request failed:", error);
      }
    }

    void loadCustomerState();
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  const setActiveCategory = (category: ServiceCategoryId) => {
    setActiveCategoryState(category);
  };

  const setActiveTab = (tab: NavTabId) => {
    setActiveTabState(tab);
    const destination = CUSTOMER_TAB_ROUTES[tab];
    if (pathname !== destination) router.push(destination);
  };

  const navigateTo = (url: string) => router.push(url);

  const selectGeofence = (id: string) => {
    setCurrentGeofenceId(id);
  };

  const addToCart = (
    product: CatalogProduct,
    quantity = 1,
    selectedSize?: ProductOption,
    selectedAddOns: ProductAddOn[] = []
  ) => {
    const sizeDelta = selectedSize?.priceDeltaPaise || 0;
    const addOnTotal = selectedAddOns.reduce((sum, addon) => sum + addon.pricePaise, 0);
    const unitPrice = product.pricePaise + sizeDelta + addOnTotal;

    setCart((previous) => {
      const existingIndex = previous.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.selectedSize?.id === selectedSize?.id &&
          item.selectedAddOns
            .map((addon) => addon.id)
            .sort()
            .join(",") === selectedAddOns.map((addon) => addon.id).sort().join(",")
      );

      if (existingIndex >= 0) {
        return previous.map((item, index) =>
          index === existingIndex
            ? {
                ...item,
                quantity: item.quantity + quantity,
                unitPricePaise: unitPrice,
                totalPricePaise: (item.quantity + quantity) * unitPrice,
              }
            : item
        );
      }

      return [
        ...previous,
        {
          id: `cart_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          product,
          selectedSize,
          selectedAddOns,
          quantity,
          unitPricePaise: unitPrice,
          totalPricePaise: unitPrice * quantity,
        },
      ];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((previous) => previous.filter((item) => item.id !== itemId));
  };

  const updateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((previous) =>
      previous.map((item) =>
        item.id === itemId
          ? { ...item, quantity, totalPricePaise: item.unitPricePaise * quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setPromoCode("");
    setDiscountPaise(0);
  };

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );
  const subtotalPaise = useMemo(
    () => cart.reduce((sum, item) => sum + item.totalPricePaise, 0),
    [cart]
  );
  const deliveryFeePaise = 0;
  const totalPaise = Math.max(0, subtotalPaise + deliveryFeePaise - discountPaise);

  const applyPromoCode = (_code: string) => ({
    success: false,
    message: "Promo validation is handled at checkout and no active code is available.",
  });

  const markNotificationRead = (id: string) => {
    setNotifications((previous) =>
      previous.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
  };

  const toggleRoutinePause = async (id: string) => {
    const current = routines.find((routine) => routine.id === id);
    if (!current) return;

    setRoutines((previous) =>
      previous.map((routine) =>
        routine.id === id
          ? { ...routine, status: routine.status === "ACTIVE" ? "PAUSED" : "ACTIVE" }
          : routine
      )
    );

    try {
      await fetch(`/api/subscriptions/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: current.status === "ACTIVE" ? "PAUSED" : "ACTIVE",
        }),
      });
    } catch {
      // The optimistic UI is intentionally kept responsive; the next refresh reconciles state.
    }
  };

  return (
    <CustomerUIContext.Provider
      value={{
        activeTab,
        setActiveTab,
        activeCategory,
        setActiveCategory,
        searchQuery,
        setSearchQuery,
        navigateTo,
        selectedProduct,
        openProductModal: setSelectedProduct,
        closeProductModal: () => setSelectedProduct(null),
        isCartOpen,
        setIsCartOpen,
        isNotificationsOpen,
        setIsNotificationsOpen,
        isGeofenceModalOpen,
        setIsGeofenceModalOpen,
        currentGeofence,
        geofenceList,
        selectGeofence,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartCount,
        subtotalPaise,
        deliveryFeePaise,
        discountPaise,
        totalPaise,
        promoCode,
        applyPromoCode,
        notifications,
        unreadNotifCount: notifications.filter((item) => !item.read).length,
        markNotificationRead,
        routines,
        toggleRoutinePause,
      }}
    >
      {children}
    </CustomerUIContext.Provider>
  );
}

export function useCustomerUI() {
  const context = useContext(CustomerUIContext);
  if (!context) {
    throw new Error("useCustomerUI must be used within CustomerUIProvider");
  }
  return context;
}
