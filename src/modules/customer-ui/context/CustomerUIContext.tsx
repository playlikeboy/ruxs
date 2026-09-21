"use client";

import React, { createContext, useContext, useState, useMemo } from "react";
import {
  CatalogProduct,
  CartItem,
  ServiceCategoryId,
  GeofenceArea,
  NotificationItem,
  ActiveRoutine,
  ProductOption,
  ProductAddOn,
} from "../types";
import {
  MOCK_PRODUCTS,
  MOCK_GEOFENCES,
  MOCK_NOTIFICATIONS,
  MOCK_ACTIVE_ROUTINES,
} from "../mock-data";
import { NavTabId } from "@/src/design-system";

interface CustomerUIContextType {
  // Navigation
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;
  activeCategory: ServiceCategoryId;
  setActiveCategory: (cat: ServiceCategoryId) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Modals & Drawers
  selectedProduct: CatalogProduct | null;
  openProductModal: (prod: CatalogProduct) => void;
  closeProductModal: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;
  isGeofenceModalOpen: boolean;
  setIsGeofenceModalOpen: (open: boolean) => void;

  // Geofence
  currentGeofence: GeofenceArea;
  geofenceList: GeofenceArea[];
  selectGeofence: (id: string) => void;

  // Cart
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

  // Notifications
  notifications: NotificationItem[];
  unreadNotifCount: number;
  markNotificationRead: (id: string) => void;

  // Active Routines
  routines: ActiveRoutine[];
  toggleRoutinePause: (id: string) => void;
}

const CustomerUIContext = createContext<CustomerUIContextType | undefined>(undefined);

export function CustomerUIProvider({ children }: { children: React.ReactNode }) {
  // Navigation
  const [activeTab, setActiveTab] = useState<NavTabId>("home");
  const [activeCategory, setActiveCategory] = useState<ServiceCategoryId>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isGeofenceModalOpen, setIsGeofenceModalOpen] = useState(false);

  // Geofence state
  const [geofenceList, setGeofenceList] = useState<GeofenceArea[]>(MOCK_GEOFENCES);
  const [currentGeofenceId, setCurrentGeofenceId] = useState<string>("geo_sobha");

  const currentGeofence = useMemo(() => {
    return geofenceList.find((g) => g.id === currentGeofenceId) || geofenceList[0];
  }, [geofenceList, currentGeofenceId]);

  const selectGeofence = (id: string) => {
    setCurrentGeofenceId(id);
  };

  // Cart State (Initialized with the reference items: Melting Cheese Pizza & Chicken Salad)
  const [cart, setCart] = useState<CartItem[]>([
    {
      id: "cart_item_1",
      product: MOCK_PRODUCTS[0],
      selectedSize: MOCK_PRODUCTS[0].sizes?.[1],
      selectedAddOns: [],
      quantity: 1,
      unitPricePaise: 1188,
      totalPricePaise: 1188,
    },
    {
      id: "cart_item_2",
      product: MOCK_PRODUCTS[2],
      selectedSize: MOCK_PRODUCTS[2].sizes?.[0],
      selectedAddOns: [],
      quantity: 1,
      unitPricePaise: 456,
      totalPricePaise: 456,
    },
  ]);

  const [promoCode, setPromoCode] = useState("");
  const [discountPaise, setDiscountPaise] = useState(0);

  // Cart operations
  const addToCart = (
    product: CatalogProduct,
    quantity = 1,
    selectedSize?: ProductOption,
    selectedAddOns: ProductAddOn[] = []
  ) => {
    const sizeDelta = selectedSize?.priceDeltaPaise || 0;
    const addOnTotal = selectedAddOns.reduce((sum, a) => sum + a.pricePaise, 0);
    const unitPrice = product.pricePaise + sizeDelta + addOnTotal;

    const existingIdx = cart.findIndex(
      (c) =>
        c.product.id === product.id &&
        c.selectedSize?.id === selectedSize?.id &&
        c.selectedAddOns.length === selectedAddOns.length
    );

    if (existingIdx > -1) {
      const updated = [...cart];
      updated[existingIdx].quantity += quantity;
      updated[existingIdx].totalPricePaise = updated[existingIdx].quantity * unitPrice;
      setCart(updated);
    } else {
      const newItem: CartItem = {
        id: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        product,
        selectedSize,
        selectedAddOns,
        quantity,
        unitPricePaise: unitPrice,
        totalPricePaise: unitPrice * quantity,
      };
      setCart([...cart, newItem]);
    }
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter((c) => c.id !== itemId));
  };

  const updateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(
      cart.map((c) =>
        c.id === itemId
          ? {
              ...c,
              quantity,
              totalPricePaise: c.unitPricePaise * quantity,
            }
          : c
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setPromoCode("");
    setDiscountPaise(0);
  };

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const subtotalPaise = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.totalPricePaise, 0);
  }, [cart]);

  // Geofenced delivery fee: $0.00 if inside geofence! Otherwise 500 cents ($5.00)
  const deliveryFeePaise = useMemo(() => {
    if (cart.length === 0) return 0;
    return currentGeofence.isInside ? 0 : 500;
  }, [cart.length, currentGeofence.isInside]);

  const totalPaise = Math.max(0, subtotalPaise + deliveryFeePaise - discountPaise);

  const applyPromoCode = (code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed === "RUXS30" || trimmed === "NEWYEAR30") {
      const discount = Math.round(subtotalPaise * 0.3);
      setDiscountPaise(discount);
      setPromoCode(trimmed);
      return { success: true, message: "30% OFF New Year discount applied!" };
    }
    if (trimmed === "FREESHIP") {
      setPromoCode(trimmed);
      return { success: true, message: "Free Doorstep Delivery applied!" };
    }
    return { success: false, message: "Invalid promo code. Try 'RUXS30'" };
  };

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);
  const unreadNotifCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // Routines
  const [routines, setRoutines] = useState<ActiveRoutine[]>(MOCK_ACTIVE_ROUTINES);
  const toggleRoutinePause = (id: string) => {
    setRoutines((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: r.status === "ACTIVE" ? "PAUSED" : "ACTIVE",
            }
          : r
      )
    );
  };

  const openProductModal = (prod: CatalogProduct) => {
    setSelectedProduct(prod);
  };

  const closeProductModal = () => {
    setSelectedProduct(null);
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
        selectedProduct,
        openProductModal,
        closeProductModal,
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
        unreadNotifCount,
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
