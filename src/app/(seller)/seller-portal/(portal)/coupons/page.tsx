import { requireSeller } from "@/features/store/seller-auth";
import { getAdminStoreCoupons } from "@/features/store/admin-queries";
import { CouponManager } from "@/features/store/seller-components/coupon-manager";
import { PAGE, PageHeader } from "@/features/store/seller-components/seller-ui";

export const metadata = { title: "Coupons" };

export default async function SellerCouponsPage() {
  await requireSeller();
  const coupons = await getAdminStoreCoupons();
  return (
    <div className={PAGE}>
      <PageHeader
        title="Coupons"
        description="Codes households type at checkout. A discount comes off the items, never off delivery, and free delivery is judged on the subtotal before the discount."
      />
      <CouponManager coupons={coupons} />
    </div>
  );
}
