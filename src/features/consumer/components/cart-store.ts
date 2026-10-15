"use client";

import { useSyncExternalStore } from "react";

/**
 * The cart lives in the browser like any food app. It holds one store at a
 * time; prices here are for display only and are re-read on the server.
 */
export interface CartItem {
  productId: string;
  name: string;
  unitPricePaise: number;
  qty: number;
  isVeg: boolean | null;
}

export interface Cart {
  vendorSlug: string;
  vendorName: string;
  deliveryFeePaise: number;
  minOrderPaise: number;
  items: CartItem[];
}

const KEY = "ruxs-cart-v1";
let state: Cart | null = null;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    state = raw ? (JSON.parse(raw) as Cart) : null;
  } catch {
    state = null;
  }
}

function commit(next: Cart | null) {
  state = next && next.items.length > 0 ? next : null;
  try {
    if (state) window.localStorage.setItem(KEY, JSON.stringify(state));
    else window.localStorage.removeItem(KEY);
  } catch {
    // Private mode or blocked storage: the cart still works for this tab.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      loaded = false;
      load();
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  load();
  return state;
}

export function useCart(): Cart | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

export type StoreInfo = Omit<Cart, "items">;

export const cartActions = {
  /** Returns false when the cart holds another store's items; the caller asks before replacing. */
  add(store: StoreInfo, item: Omit<CartItem, "qty">, force = false): boolean {
    load();
    if (state && state.vendorSlug !== store.vendorSlug && !force) return false;
    const base: Cart = state && state.vendorSlug === store.vendorSlug ? state : { ...store, items: [] };
    const existing = base.items.find((i) => i.productId === item.productId);
    const items = existing
      ? base.items.map((i) => (i.productId === item.productId ? { ...i, qty: Math.min(20, i.qty + 1) } : i))
      : [...base.items, { ...item, qty: 1 }];
    commit({ ...base, ...store, items });
    return true;
  },
  setQty(productId: string, qty: number) {
    load();
    if (!state) return;
    const items =
      qty <= 0
        ? state.items.filter((i) => i.productId !== productId)
        : state.items.map((i) => (i.productId === productId ? { ...i, qty: Math.min(20, qty) } : i));
    commit({ ...state, items });
  },
  clear() {
    commit(null);
  },
};

export function cartCount(cart: Cart | null): number {
  return cart ? cart.items.reduce((n, i) => n + i.qty, 0) : 0;
}

export function cartSubtotal(cart: Cart | null): number {
  return cart ? cart.items.reduce((n, i) => n + i.qty * i.unitPricePaise, 0) : 0;
}
