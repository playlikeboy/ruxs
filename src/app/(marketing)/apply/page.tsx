import { buildMetadata } from "@/lib/seo";
import { getCategories } from "@/features/platform/queries";
import { ApplyForm } from "@/features/applications/components/apply-form";

export const metadata = buildMetadata({
  title: "List your business on RUXs",
  description: "Kitchens, water depots, dairies, shops and kids' classes: apply in two minutes. We call to verify, then send your merchant login.",
  path: "/apply",
});

export const revalidate = 3600;

export default async function ApplyPage() {
  const categories = (await getCategories()).map((c) => ({ id: c.id, label: c.label, blurb: c.blurb }));
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-20 pt-10 sm:px-6 sm:pt-16 lg:grid-cols-[1fr_minmax(0,560px)] lg:gap-20">
      <div className="max-w-md">
        <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-[-0.03em] text-ink sm:text-5xl">List your business on RUXs.</h1>
        <p className="mt-5 text-lg leading-relaxed text-[#4A463F]">Tell us what you run and where. We call you to verify, then send a login for your merchant panel.</p>
        <ol className="mt-8 space-y-4 text-base text-ink">
          {["Fill this form (two minutes)", "We call to verify your business", "You get your login ID and password", "Add your items and start taking orders"].map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-ink text-sm font-bold tabular-nums">{i + 1}</span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="relative">
        <ApplyForm categories={categories} />
      </div>
    </div>
  );
}
