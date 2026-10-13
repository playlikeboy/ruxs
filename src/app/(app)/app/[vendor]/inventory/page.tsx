import Link from "next/link";
import { getVendorAssetOverview } from "@/features/assets/queries";

export default async function InventoryPage({
  params,
}: {
  params: Promise<{ vendor: string }>;
}) {
  const { vendor: slug } = await params;
  const { assets, householdBalances } = await getVendorAssetOverview(slug);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">Operations</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Inventory & returnables</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">Track cans, dabbas and other configured returnable assets using delivery and return movements. Positive balances represent items currently out with households.</p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {assets.length === 0 ? (
          <div className="rounded-[12px] border border-line bg-surface p-5 sm:col-span-2 xl:col-span-3">
            <h2 className="font-semibold text-ink">No tracked assets configured</h2>
            <p className="mt-1 text-sm leading-6 text-muted">Add an asset name to a product in Products. Delivery runs will then record out/in movements.</p>
            <Link href={"/app/" + slug + "/products"} className="mt-3 inline-flex text-sm font-semibold text-accent hover:underline">Open products →</Link>
          </div>
        ) : assets.map((asset) => (
          <article key={asset.asset} className="rounded-[12px] border border-line bg-surface p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{asset.asset}</p>
            <p className="mt-2 text-4xl font-semibold tabular-nums text-ink">{asset.outstanding.toLocaleString("en-IN")}</p>
            <p className="mt-1 text-sm text-muted">{asset.outstanding < 0 ? "Net extra returns recorded" : "Net units with households"}</p>
            <div className="mt-4 border-t border-line pt-3 text-sm text-ink">
              <span className="font-semibold tabular-nums">{asset.households.toLocaleString("en-IN")}</span> households with a non-zero balance
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-[12px] border border-line bg-surface p-4 sm:p-5">
        <div>
          <h2 className="text-base font-semibold text-ink">Household asset balances</h2>
          <p className="mt-1 text-sm text-muted">Balances are summed from the existing movement ledger; zero balances are hidden.</p>
        </div>
        {householdBalances.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No non-zero household balances found. Asset movements will appear here after tracked deliveries or returns.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs text-muted">
                  <th className="py-3 pr-4 font-medium">Household</th>
                  <th className="py-3 pr-4 font-medium">Asset</th>
                  <th className="py-3 text-right font-medium">Net out</th>
                </tr>
              </thead>
              <tbody>
                {householdBalances.map((row) => (
                  <tr key={row.asset + "-" + row.customerId} className="border-b border-line last:border-0">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-ink">{row.customerName}</p>
                      <p className="text-xs text-muted">{row.society}{row.tower ? ", " + row.tower : ""}{row.floor ? " · Floor " + row.floor : ""}{row.flat ? " · Flat " + row.flat : ""}</p>
                    </td>
                    <td className="py-3 pr-4 text-muted">{row.asset}</td>
                    <td className="py-3 text-right font-semibold tabular-nums text-ink">{Number(row.balance).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
