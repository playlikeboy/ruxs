import { notFound } from "next/navigation";
import { formatINR } from "@/core/money";
import { addDaysIST, todayIST } from "@/core/time";
import { getMyProfile, getSubscribableProduct } from "@/features/consumer/queries";
import { PageHeader } from "@/features/consumer/components/page-header";
import { StoreCover } from "@/features/consumer/components/store-cover";
import { SubscribeForm } from "@/features/consumer/components/subscribe-form";
import { getCategoryMap } from "@/features/platform/queries";

export const metadata = { title: "Subscribe" };

export default async function SubscribePage({ params }: { params: Promise<{ slug: string; productId: string }> }) {
  const { slug, productId } = await params;
  const [{ profile }, row, category] = await Promise.all([getMyProfile(), getSubscribableProduct(productId), getCategoryMap()]);
  if (!row || row.vendor.slug !== slug) notFound();
  const { product, vendor } = row;

  return (
    <div className="pb-40">
      <PageHeader title="Start a plan" subtitle={vendor.name} back={`/app/store/${slug}`} />
      <div className="px-4 pt-4">
        <div className="flex items-center gap-4">
          <StoreCover cover={category(product.kind)} alt="" className="h-20 w-20 shrink-0 rounded-2xl" />
          <div>
            <h2 className="text-lg font-semibold text-ink">{product.name}</h2>
            <p className="text-sm text-neutral-500">
              <span className="font-semibold text-ink tabular-nums">{formatINR(product.pricePaise)}</span> per delivery · {product.shift}
            </p>
            <p className="text-xs text-neutral-500">Change or skip a day until {product.cutoffAt} on that day</p>
          </div>
        </div>
        <div className="mt-6">
          <SubscribeForm
            productId={product.id}
            pricePaise={product.pricePaise}
            depositPaise={product.depositPaise}
            assetName={product.assetName}
            minStart={addDaysIST(todayIST(), 1)}
            hasAddress={!!profile}
            unit={product.assetName ?? (product.kind === "tiffin" ? "tiffin" : "unit")}
          />
        </div>
      </div>
    </div>
  );
}
