"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";
import { adminUpdateVendor } from "@/features/admin/actions";

export interface AdminVendor {
  id: string;
  name: string;
  phone: string;
  upiVpa: string;
  city: string;
  area: string;
  latitude: number | null;
  longitude: number | null;
  serviceRadiusKm: number;
  deliveryFeePaise: number;
  plan: string;
  acceptingOrders: boolean;
}

const input =
  "w-full rounded-[10px] border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent";

export function EditVendorSheet({ vendor }: { vendor: AdminVendor }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [f, setF] = useState({
    name: vendor.name,
    phone: vendor.phone,
    upiVpa: vendor.upiVpa,
    city: vendor.city,
    area: vendor.area,
    latitude: vendor.latitude?.toString() ?? "",
    longitude: vendor.longitude?.toString() ?? "",
    serviceRadiusKm: String(vendor.serviceRadiusKm),
    deliveryFee: String(vendor.deliveryFeePaise / 100),
    plan: vendor.plan,
    acceptingOrders: vendor.acceptingOrders,
  });
  const set =
    (k: keyof typeof f) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setF({ ...f, [k]: e.target.value });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-ink text-sm font-semibold underline-offset-4 hover:underline"
      >
        Edit details
      </button>
      {open &&
        createPortal(
          <div
            className="bg-ink/40 fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-label={`Edit ${vendor.name}`}
          >
            <form
              className="bg-surface max-h-[92dvh] w-full max-w-lg space-y-3 overflow-y-auto rounded-t-[20px] p-5 sm:rounded-[16px]"
              onSubmit={(e) => {
                e.preventDefault();
                startTransition(async () => {
                  const res = await adminUpdateVendor({
                    vendorId: vendor.id,
                    name: f.name,
                    phone: f.phone,
                    upiVpa: f.upiVpa,
                    city: f.city,
                    area: f.area,
                    latitude: f.latitude === "" ? null : Number(f.latitude),
                    longitude: f.longitude === "" ? null : Number(f.longitude),
                    serviceRadiusKm: Math.round(Number(f.serviceRadiusKm)),
                    deliveryFeeRupees: Number(f.deliveryFee || 0),
                    plan: f.plan,
                    acceptingOrders: f.acceptingOrders,
                  });
                  if (!res.ok) toast.error(res.error);
                  else {
                    toast.success("Vendor updated");
                    setOpen(false);
                    router.refresh();
                  }
                });
              }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Edit {vendor.name}</h3>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                  className="text-muted p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="col-span-2 text-xs font-medium">
                  Business name
                  <input
                    className={input + " mt-1"}
                    value={f.name}
                    onChange={set("name")}
                  />
                </label>
                <label className="text-xs font-medium">
                  Phone (+91…)
                  <input
                    className={input + " mt-1 font-mono"}
                    value={f.phone}
                    onChange={set("phone")}
                  />
                </label>
                <label className="text-xs font-medium">
                  UPI ID
                  <input
                    className={input + " mt-1 font-mono"}
                    value={f.upiVpa}
                    onChange={set("upiVpa")}
                  />
                </label>
                <label className="text-xs font-medium">
                  Area
                  <input
                    className={input + " mt-1"}
                    value={f.area}
                    onChange={set("area")}
                  />
                </label>
                <label className="text-xs font-medium">
                  City
                  <input
                    className={input + " mt-1"}
                    value={f.city}
                    onChange={set("city")}
                  />
                </label>
                <label className="text-xs font-medium">
                  Latitude
                  <input
                    className={input + " mt-1 font-mono"}
                    inputMode="decimal"
                    value={f.latitude}
                    onChange={set("latitude")}
                  />
                </label>
                <label className="text-xs font-medium">
                  Longitude
                  <input
                    className={input + " mt-1 font-mono"}
                    inputMode="decimal"
                    value={f.longitude}
                    onChange={set("longitude")}
                  />
                </label>
                <label className="text-xs font-medium">
                  Radius km
                  <input
                    className={input + " mt-1"}
                    inputMode="numeric"
                    value={f.serviceRadiusKm}
                    onChange={set("serviceRadiusKm")}
                  />
                </label>
                <label className="text-xs font-medium">
                  Delivery fee ₹
                  <input
                    className={input + " mt-1"}
                    inputMode="decimal"
                    value={f.deliveryFee}
                    onChange={set("deliveryFee")}
                  />
                </label>
                <label className="text-xs font-medium">
                  Plan
                  <select
                    className={input + " mt-1"}
                    value={f.plan}
                    onChange={set("plan")}
                  >
                    <option value="free">Free</option>
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={f.acceptingOrders}
                    onChange={(e) =>
                      setF({ ...f, acceptingOrders: e.target.checked })
                    }
                    className="h-4 w-4 accent-[#BD4B2A]"
                  />
                  Taking orders
                </label>
              </div>
              <button
                type="submit"
                disabled={pending}
                className="bg-accent w-full rounded-[12px] py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {pending ? "Saving…" : "Save vendor"}
              </button>
            </form>
          </div>,
          document.body
        )}
    </>
  );
}
