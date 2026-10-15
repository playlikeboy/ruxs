import { STATUS_LABEL, type ShopOrderStatus } from "@/core/shop";

const TONE: Record<ShopOrderStatus, string> = {
  awaiting_payment: "bg-neutral-100 text-neutral-600",
  placed: "bg-butter text-warn",
  accepted: "bg-sky text-[#1F5C99]",
  out_for_delivery: "bg-peach text-accent",
  delivered: "bg-mint text-good",
  cancelled: "bg-neutral-100 text-neutral-500",
  rejected: "bg-blush text-bad",
};

export function StatusPill({ status }: { status: string }) {
  const s = status as ShopOrderStatus;
  return (
    <span className={"inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold " + (TONE[s] ?? "bg-neutral-100 text-neutral-600")}>
      {STATUS_LABEL[s] ?? status}
    </span>
  );
}
