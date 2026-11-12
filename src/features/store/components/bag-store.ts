"use client";

import { useSyncExternalStore } from "react";
import { STORE_MAX_LINE_QTY, STORE_MAX_LINES } from "@/core/store";

/**
 * The RUXs Store bag lives in the browser, separate from the one-vendor cart
 * (`ruxs-cart-v1`). Names and prices here are for display only: the server
 * re-prices every line with quoteMyStoreBag before checkout.
 */

export interface BagItem {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  unitPricePaise: number;
  /** Most that could be bought when the item was added (stock-capped, ≤ 10). */
  maxQty: number;
  qty: number;
}

export interface Bag {
  items: BagItem[];
}

const KEY = "ruxs-store-bag-v1";
let state: Bag | null = null;
let loaded = false;
const listeners = new Set<() => void>();

function isBagItem(v: unknown): v is BagItem {
  const i = v as Partial<BagItem> | null;
  return (
    !!i &&
    typeof i.productId === "string" &&
    typeof i.slug === "string" &&
    typeof i.name === "string" &&
    Number.isInteger(i.unitPricePaise) &&
    Number.isInteger(i.qty) &&
    (i.qty ?? 0) > 0
  );
}

function load() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as { items?: unknown[] }) : null;
    const items = Array.isArray(parsed?.items) ? parsed.items.filter(isBagItem) : [];
    state = items.length ? { items } : null;
  } catch {
    state = null;
  }
}

function commit(next: Bag | null) {
  state = next && next.items.length > 0 ? next : null;
  try {
    if (state) window.localStorage.setItem(KEY, JSON.stringify(state));
    else window.localStorage.removeItem(KEY);
  } catch {
    // Private mode or blocked storage: the bag still works for this tab.
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

export function useStoreBag(): Bag | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

const noopSubscribe = () => () => {};

/** False during server render and hydration, true once the browser bag can be read. */
export function useStoreBagReady(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

function cap(qty: number, maxQty: number) {
  return Math.max(0, Math.min(STORE_MAX_LINE_QTY, maxQty, qty));
}

export const bagActions = {
  /** Adds one (or `qty`) of a product. Returns false when the bag is full or nothing more can be added. */
  add(item: Omit<BagItem, "qty">, qty = 1): boolean {
    load();
    const items = state?.items ?? [];
    const existing = items.find((i) => i.productId === item.productId);
    if (!existing && items.length >= STORE_MAX_LINES) return false;
    const nextQty = cap((existing?.qty ?? 0) + qty, item.maxQty);
    if (nextQty === 0 || nextQty === existing?.qty) return false;
    const next = existing
      ? items.map((i) => (i.productId === item.productId ? { ...i, ...item, qty: nextQty } : i))
      : [...items, { ...item, qty: nextQty }];
    commit({ items: next });
    return true;
  },
  setQty(productId: string, qty: number) {
    load();
    if (!state) return;
    const items =
      qty <= 0
        ? state.items.filter((i) => i.productId !== productId)
        : state.items.map((i) => (i.productId === productId ? { ...i, qty: cap(qty, i.maxQty) || i.qty } : i));
    commit({ items });
  },
  remove(productId: string) {
    bagActions.setQty(productId, 0);
  },
  /**
   * Applies a server quote: drops removed products, refreshes names, prices and
   * stock caps, and lowers quantities the store can no longer fill.
   */
  sync(
    removedProductIds: string[],
    lines: { productId: string; slug: string; name: string; image: string | null; unitPricePaise: number; qty: number; stock: { maxQty: number } }[]
  ) {
    load();
    if (!state) return;
    const removed = new Set(removedProductIds);
    const byId = new Map(lines.map((l) => [l.productId, l]));
    let changed = false;
    const items: BagItem[] = [];
    for (const i of state.items) {
      if (removed.has(i.productId)) {
        changed = true;
        continue;
      }
      const l = byId.get(i.productId);
      if (!l) {
        items.push(i);
        continue;
      }
      // Keep an out-of-stock line visible (qty stays) so the household sees why; the quote flags it.
      const qty = l.qty > 0 ? Math.min(i.qty, l.qty) : i.qty;
      const next: BagItem = {
        productId: i.productId,
        slug: l.slug,
        name: l.name,
        image: l.image,
        unitPricePaise: l.unitPricePaise,
        maxQty: l.stock.maxQty,
        qty,
      };
      if (
        next.qty !== i.qty ||
        next.unitPricePaise !== i.unitPricePaise ||
        next.maxQty !== i.maxQty ||
        next.name !== i.name ||
        next.slug !== i.slug ||
        next.image !== i.image
      ) {
        changed = true;
      }
      items.push(next);
    }
    if (changed) commit({ items });
  },
  clear() {
    commit(null);
  },
};

export function bagCount(bag: Bag | null): number {
  return bag ? bag.items.reduce((n, i) => n + i.qty, 0) : 0;
}

export function bagQty(bag: Bag | null, productId: string): number {
  return bag?.items.find((i) => i.productId === productId)?.qty ?? 0;
}
