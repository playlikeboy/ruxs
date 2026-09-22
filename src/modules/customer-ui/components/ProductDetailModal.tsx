"use client";

import { formatINR, Paise } from "@/src/shared/types/money";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, Share2, ArrowLeft, Check, Star, Store, ExternalLink, Sparkles } from "lucide-react";
import { useCustomerUI } from "../context/CustomerUIContext";
import { ProductOption, ProductAddOn } from "../types";
import {
  DSBottomSheet,
  DSButton,
  DSQuantityStepper,
  DSRatingPill,
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
      <div className="relative text-gray-900 font-sans">
        {/* Top Floating Actions (Back, Favorite, Share) */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          <button
            type="button"
            onClick={closeProductModal}
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/90 border border-gray-200 text-gray-700 shadow-sm hover:bg-white"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={() => setIsFavorite(!isFavorite)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 border border-gray-200 text-gray-700 shadow-sm hover:bg-white"
              aria-label="Favorite"
            >
              <Heart
                size={18}
                className={isFavorite ? "fill-red-500 text-red-500" : "text-gray-700"}
              />
            </button>
            <button
              type="button"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: selectedProduct.name,
                    text: selectedProduct.description,
                    url: window.location.href,
                  }).catch(() => {});
                }
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 border border-gray-200 text-gray-700 shadow-sm hover:bg-white"
              aria-label="Share"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>

        {/* Product Image Hero */}
        <div className="relative flex justify-center items-center pt-8 pb-4 bg-gray-50/70">
          <div className="relative h-56 w-56 sm:h-64 sm:w-64 flex items-center justify-center">
            <img
              src={selectedProduct.image}
              alt={selectedProduct.name}
              className="relative z-10 h-full w-full rounded-3xl object-cover shadow-sm"
            />
          </div>
        </div>

        {/* Title, Vendor Tag & Rating Row */}
        <div className="px-6 pt-3">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-gray-950">
              {selectedProduct.name}
            </h2>
            <Link
              href={`/app/product/${selectedProduct.id}`}
              onClick={closeProductModal}
              className="flex items-center gap-1 text-[11px] font-semibold text-red-500 hover:text-red-600 hover:underline shrink-0 mt-1"
            >
              <span>Full Page</span>
              <ExternalLink size={12} />
            </Link>
          </div>
          <div className="mt-1.5 flex items-center gap-3">
            <Link
              href={`/app/vendor/${selectedProduct.vendorId}`}
              onClick={closeProductModal}
              className="flex items-center gap-1.5 text-xs text-gray-500 font-medium hover:text-red-500"
            >
              <Store size={14} className="text-red-500" />
              <span className="hover:underline">{selectedProduct.vendorName}</span>
            </Link>
            <span className="text-gray-300">·</span>
            <div className="flex items-center gap-1 text-xs font-bold text-gray-800">
              <Star size={13} className="fill-amber-400 text-amber-400" />
              <span>{selectedProduct.rating}</span>
              <span className="text-gray-400 font-normal">({selectedProduct.reviewCount})</span>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-gray-600">
            {selectedProduct.description}
          </p>
        </div>

        {/* Size / Cadence Selector Pills */}
        {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
          <div className="px-6 mt-6">
            <div className="grid grid-cols-3 gap-2.5">
              {selectedProduct.sizes.map((size) => {
                const isSelected = selectedSize?.id === size.id;
                const sizePrice = (basePrice + size.priceDeltaPaise) / 100;
                return (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`flex flex-col items-center justify-center rounded-2xl p-3 border select-none ${
                      isSelected
                        ? "border-red-300 bg-red-50/60 shadow-xs"
                        : "border-gray-100 bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded-full border flex items-center justify-center mb-1.5 ${
                        isSelected
                          ? "border-red-500 bg-red-500"
                          : "border-gray-300 bg-transparent"
                      }`}
                    >
                      {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>
                    <span className="text-xs font-bold text-gray-900">
                      {size.name}
                    </span>
                    <span
                      className={`text-xs mt-0.5 font-semibold ${
                        isSelected ? "text-red-600" : "text-gray-400"
                      }`}
                    >
                      ${sizePrice.toFixed(2)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Add Ingredients / Add-ons Checklist */}
        {selectedProduct.addOns && selectedProduct.addOns.length > 0 && (
          <div className="px-6 mt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              Add Ingredients & Extras
            </h3>
            <div className="space-y-2">
              {selectedProduct.addOns.map((addon) => {
                const isChecked = selectedAddOns.some((a) => a.id === addon.id);
                return (
                  <button
                    key={addon.id}
                    type="button"
                    onClick={() => toggleAddOn(addon)}
                    className={`flex w-full items-center justify-between rounded-2xl border p-3 text-left select-none ${
                      isChecked
                        ? "border-red-300 bg-red-50/60"
                        : "border-gray-100 bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-gray-700 shadow-xs">
                        <Sparkles size={16} className="text-red-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">{addon.name}</p>
                        <p className="text-[11px] text-gray-400">
                          {addon.subtitle ? `${addon.subtitle} · ` : ""}
                          +{formatINR(addon.pricePaise as Paise)}
                        </p>
                      </div>
                    </div>

                    {/* Red Checkbox */}
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-lg border ${
                        isChecked
                          ? "border-red-500 bg-red-500 text-white"
                          : "border-gray-300 bg-transparent"
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

        {/* Bottom Sticky Action Bar: Quantity Stepper + Add to Cart Button */}
        <div className="sticky bottom-0 mt-8 flex items-center gap-3 border-t border-gray-100 bg-white p-4 sm:p-6 shadow-sm">
          <DSQuantityStepper
            value={quantity}
            onChange={setQuantity}
            min={1}
            size="lg"
            variant="pill"
          />

          <DSButton
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleAddToCart}
            className="flex-1"
          >
            Add to Cart · {formatINR(totalPrice as Paise)}
          </DSButton>
        </div>
      </div>
    </DSBottomSheet>
  );
}
