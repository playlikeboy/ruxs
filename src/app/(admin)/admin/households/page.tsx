import { getAdminHouseholds } from "@/features/admin/queries";

export const metadata = { title: "Households" };

const dateFmt = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });

export default async function AdminHouseholdsPage() {
  const people = await getAdminHouseholds();
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Households</h1>
        <p className="mt-1 text-sm text-muted">{people.length} people have set up the RUXS app.</p>
      </div>
      {people.length === 0 ? (
        <p className="rounded-[12px] border border-line bg-surface p-8 text-center text-sm text-muted">No households yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-[12px] border border-line bg-surface">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line bg-bg text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Address</th>
                <th className="px-4 py-3 text-right font-semibold">Stores</th>
                <th className="px-4 py-3 text-right font-semibold">Orders</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {people.map((p) => (
                <tr key={p.userId}>
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-muted"><span className="font-mono">{p.phone}</span><br />{p.email}</td>
                  <td className="px-4 py-3 text-muted">{p.flat}, {p.society}<br />{p.area}, {p.city}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{p.stores}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{p.orders}</td>
                  <td className="px-4 py-3 text-muted">{dateFmt.format(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
