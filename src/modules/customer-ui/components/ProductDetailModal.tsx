"use client";

import { formatINR, Paise } from "@/src/shared/types/money";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Heart,
  Share2,
  ArrowLeft,
  Check,
  Star,
  Store,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { useCustomerUI } from "../context/CustomerUIContext";
import { ProductOption, ProductAddOn } from "../types";
import {
  DSBottomSheet,
  DSButton,
  DSQuantityStepper,
} from "@/src/design-system";

export function ProductDetailModal() {
  const { selectedProduct, closeProductModal, addToCart, setIsCartOpen } = useCustomerUI();

  const [selectedSize, setSelectedSize] = useState<ProductOption | undefined>(undefined);
  const [selectedAddOns, setSelectedAddOns] = useState<ProductAddOn[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  // Initialize size and add-ons when modal opens
  useEffect(() => {
    if (selectedProduct) {
      const defaultSize =
        selectedProduct.sizes?.find((s) => s.isDefault) || selectedProduct.sizes?.[0];
      setSelectedSize(defaultSize);
      setSelectedAddOns([]);
      setQuantity(1);
    }
  }, [selectedProduct]);

  if (!selectedProduct) return null;

  const toggleAddOn = (addon: ProductAddOn) => {
    if (selectedAddOns.some((a) => a.id === addon.id)) {
      setSelectedAddOns(selectedAddOns.filter((a) => a.id !== addon.id));
    } else {
      setSelectedAddOns([...selectedAddOns, addon]);
    }
  };

  const basePrice = selectedProduct.pricePaise;
  const sizeDelta = selectedSize?.priceDeltaPaise || 0;
  const addOnsTotal = selectedAddOns.reduce((sum, a) => sum + a.pricePaise, 0);
  const unitPrice = basePrice + sizeDelta + addOnsTotal;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    addToCart(selectedProduct, quantity, selectedSize, selectedAddOns);
    closeProductModal();
    setIsCartOpen(true);
  };

  return (
    <DSBottomSheet
      isOpen={Boolean(selectedProduct)}
      onClose={closeProductModal}
      showCloseButton={false}
      maxWidth="max-w-xl"
      className="p-0 overflow-hidden"
    >
      <div className="relative text-ink font-sans bg-surface-raised">
        {/* Top Floating Actions (Back, Favorite, Share) */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          <button
            type="button"
            onClick={closeProductModal}
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-surface-raised/95 border border-border text-ink shadow-sm hover:bg-surface-band transition-colors backdrop-blur-md cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={() => setIsFavorite(!isFavorite)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-raised/95 border border-border text-ink shadow-sm hover:bg-surface-band transition-colors backdrop-blur-md cursor-pointer"
              aria-label="Favorite"
            >
              <Heart
                size={18}
                className={isFavorite ? "fill-[#F2A4A4] text-action" : "text-ink"}
              />
            </button>
            <button
              type="button"
              onClick={() => {
                if (navigator.share) {
                  navigator
                    .share({
                      title: selectedProduct.name,
                      text: selectedProduct.description,
                      url: window.location.href,
                    })
                    .catch(() => {});
                }
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-raised/95 border border-border text-ink shadow-sm hover:bg-surface-band transition-colors backdrop-blur-md cursor-pointer"
              aria-label="Share"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>

        {/* Product Image Hero Container */}
        <div className="relative flex justify-center items-center pt-8 pb-4 bg-surface-band">
          <div className="relative h-56 w-56 sm:h-64 sm:w-64 flex items-center justify-center">
            <img
              src={selectedProduct.image}
              alt={selectedProduct.name}
              className="relative z-10 h-full w-full rounded-3xl object-cover shadow-soft border border-border"
            />
          </div>
        </div>

        {/* Title, Vendor Tag & Rating Row */}
        <div className="px-6 pt-4">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-ink font-display">
              {selectedProduct.name}
            </h2>
            <Link
              href={`/app/product/${selectedProduct.id}`}
              onClick={closeProductModal}
              className="flex items-center gap-1 text-[11px] font-bold text-action hover:underline shrink-0 mt-1"
            >
              <span>Full Page</span>
              <ExternalLink size={12} />
            </Link>
          </div>

          <div className="mt-1.5 flex items-center gap-3">
            <Link
              href={`/app/vendor/${selectedProduct.vendorId}`}
              onClick={closeProductModal}
              className="flex items-center gap-1.5 text-xs text-ink-muted font-medium hover:text-action transition-colors"
            >
              <Store size={14} className="text-coral" />
              <span className="hover:underline">{selectedProduct.vendorName}</span>
            </Link>
            <span className="text-ink-subtle">·</span>
            <div className="flex items-center gap-1 text-xs font-bold text-[#B45309]">
              <Star size={13} className="fill-[#F59E0B] text-[#F59E0B]" />
              <span>{selectedProduct.rating.toFixed(1)}</span>
              <span className="text-ink-muted font-normal">
                ({selectedProduct.reviewCount})
              </span>
            </div>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-ink-muted">
            {selectedProduct.description}
          </p>

          <div className="mt-3 flex items-center gap-2 text-xs text-ink-muted font-medium">
            <Clock size={13} className="text-coral" />
            <span>Delivery: {selectedProduct.deliveryWindow || "Scheduled Daily"}</span>
          </div>
        </div>

        {/* Size / Cadence Selector Pills */}
        {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
          <div className="px-6 mt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">
              Select Variant
            </h3>
            <div className="grid grid-cols-3 gap-2.5">
              {selectedProduct.sizes.map((size) => {
                const isSelected = selectedSize?.id === size.id;
                const sizePricePaise = basePrice + size.priceDeltaPaise;
                return (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`flex flex-col items-center justify-center rounded-2xl p-3 border select-none transition-all cursor-pointer ${
                      isSelected
                        ? "border-action bg-coral/10 shadow-xs"
                        : "border-border bg-surface-raised hover:border-border-strong hover:bg-surface-band"
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded-full border flex items-center justify-center mb-1.5 ${
                        isSelected
                          ? "border-action bg-action"
                          : "border-ink-muted/40 bg-transparent"
                      }`}
                    >
                      {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>
                    <span className="text-xs font-bold text-ink">
                      {size.name}
                    </span>
                    <span
                      className={`text-xs mt-0.5 font-bold ${
                        isSelected ? "text-action" : "text-ink-muted"
                      }`}
                    >
                      {formatINR(sizePricePaise as Paise)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Add-ons Checklist */}
        {selectedProduct.addOns && selectedProduct.addOns.length > 0 && (
          <div className="px-6 mt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">
              Customizations & Extras
            </h3>
            <div className="space-y-2">
              {selectedProduct.addOns.map((addon) => {
                const isChecked = selectedAddOns.some((a) => a.id === addon.id);
                return (
                  <button
                    key={addon.id}
                    type="button"
                    onClick={() => toggleAddOn(addon)}
                    className={`flex w-full items-center justify-between rounded-2xl border p-3 text-left select-none transition-all cursor-pointer ${
                      isChecked
                        ? "border-action bg-coral/10"
                        : "border-border bg-surface-raised hover:border-border-strong hover:bg-surface-band"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-band text-coral shadow-xs">
                        <Sparkles size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-ink">{addon.name}</p>
                        <p className="text-[11px] text-ink-muted">
                          {addon.subtitle ? `${addon.subtitle} · ` : ""}
                          +{formatINR(addon.pricePaise as Paise)}
                        </p>
                      </div>
                    </div>

                    {/* Checkbox */}
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-lg border ${
                        isChecked
                          ? "border-action bg-action text-white"
                          : "border-border bg-transparent"
                      }`}
                    >
                      {isChecked && <Check size={12} className="stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Sticky Action Bar */}
        <div className="sticky bottom-0 mt-8 flex items-center gap-3 border-t border-border bg-surface-raised p-4 sm:p-6 shadow-soft">
          <DSQuantityStepper
            value={quantity}
            onChange={setQuantity}
            min={1}
            size="lg"
            variant="coral-pill"
          />

          <DSButton
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleAddToCart}
            className="flex-1 font-bold text-base"
          >
            Add to Cart · {formatINR(totalPrice as Paise)}
          </DSButton>
        </div>
      </div>
    </DSBottomSheet>
  );
}
