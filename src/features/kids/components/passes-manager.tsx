"use client";

import { UiIcon } from "@/components/ui/app-icon";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ticket, Clock } from "lucide-react";
import { formatINR } from "@/core/money";
import { cn } from "@/components/ui/cn";
import { purchasePassAction } from "../actions";
import { kidsSecondaryButton } from "./kids-ui";

const validFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

interface AvailablePass {
  id: string;
  name: string;
  description: string | null;
  creditsTotal: number;
  pricePaise: number;
  validityDays: number;
  terms: string | null;
}

interface PurchasedPass {
  purchase: {
    id: string;
    purchasedCredits: number;
    remainingCredits: number;
    validUntil: Date;
    paymentStatus: string;
    createdAt: Date;
  };
  pass: {
    name: string;
    description: string | null;
  };
}

export function PassesManager({
  availablePasses,
  purchasedPasses,
  isLoggedIn,
}: {
  availablePasses: AvailablePass[];
  purchasedPasses: PurchasedPass[];
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handlePurchase = async (passId: string) => {
    if (!isLoggedIn) {
      router.push(`/sign-in?next=/app/kids/passes`);
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setPurchasingId(passId);

    try {
      const res = await purchasePassAction({ passId });

      setPurchasingId(null);
      if (!res.ok) {
        setError(res.error);
      } else {
        setSuccessMsg("Pass added. Your credits are ready to use.");
        router.refresh();
      }
    } catch {
      setPurchasingId(null);
      setError("Could not reach RUXs. Check your connection and try again.");
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="rounded-[16px] border border-bad/25 bg-bad/5 p-3 text-sm font-medium text-bad">
          {error}
        </p>
      )}

      {successMsg && (
        <p role="status" className="rounded-[16px] border border-good/25 bg-kids-mint/40 p-3 text-sm font-medium text-good">
          {successMsg}
        </p>
      )}

      {/* Owned Passes Wallet (if user has any) */}
      {purchasedPasses.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-1.5 px-1">
            <Ticket className="h-4 w-4 text-kids-ink" aria-hidden="true" />
            <h2 className="text-base font-semibold text-kids-ink">
              My passes ({purchasedPasses.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {purchasedPasses.map(({ purchase, pass }) => {
              const expiresDate = new Date(purchase.validUntil);
              const isExpired = expiresDate < new Date();

              return (
                <div
                  key={purchase.id}
                  className="rounded-[20px] border border-kids-ink/10 bg-kids-sunny/40 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-flex items-center gap-1 rounded-full border border-kids-ink/15 bg-white px-2 py-0.5 text-xs font-semibold text-kids-ink">
                        <UiIcon name="pass" /> {isExpired ? "Expired" : "Active"}
                      </span>
                      <h3 className="mt-1.5 text-base font-semibold text-kids-ink">
                        {pass.name}
                      </h3>
                      {pass.description && (
                        <p className="mt-0.5 text-sm text-kids-ink/70">
                          {pass.description}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="rounded-[20px] border border-kids-ink/10 bg-white px-3 py-1.5">
                        <span className="block text-xl font-semibold tabular-nums text-kids-ink">
                          {purchase.remainingCredits}
                        </span>
                        <span className="block text-xs text-kids-ink/55">
                          credits left
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-kids-ink/10 pt-2.5 text-sm text-kids-ink/75">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-4 w-4" aria-hidden="true" />
                      <span>
                        {isExpired ? "Expired on" : "Valid until"} {validFmt.format(expiresDate)}
                      </span>
                    </span>
                    {!isExpired && purchase.remainingCredits > 0 && (
                      <Link
                        href="/app/kids/workshops"
                        className="inline-flex min-h-10 items-center text-sm font-semibold text-accent underline-offset-4 hover:underline"
                      >
                        Use on a workshop
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Available Passes Catalog */}
      <section className="space-y-3">
        <div className="px-1">
          <h2 className="text-base font-semibold text-kids-ink">
            Holiday and weekend passes
          </h2>
          <p className="text-sm text-kids-ink/65">
            Prepaid session credits. Terms are shown on each pass.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {availablePasses.map((pass) => (
            <div
              key={pass.id}
              className="rounded-[20px] border border-kids-ink/10 bg-white p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-kids-sunny/70 px-2.5 py-0.5 text-xs font-semibold text-kids-ink">
                    <UiIcon name="star" /> {pass.creditsTotal} {pass.creditsTotal === 1 ? "session" : "sessions"}
                  </span>
                  <h3 className="mt-2 text-lg font-semibold text-kids-ink">
                    {pass.name}
                  </h3>
                  {pass.description && <p className="mt-1 text-sm text-kids-ink/70">{pass.description}</p>}
                </div>

                <div className="text-right shrink-0">
                  <span className="block text-xl font-semibold tabular-nums text-kids-ink">
                    {formatINR(pass.pricePaise)}
                  </span>
                  <span className="block text-xs text-kids-ink/60">
                    Valid {pass.validityDays} days
                  </span>
                </div>
              </div>

              {pass.terms && (
                <div className="mt-3 rounded-[12px] bg-kids-ink/[0.04] p-3 text-sm text-kids-ink/75">
                  <span className="font-semibold text-kids-ink">Terms: </span>
                  {pass.terms}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-kids-ink/10 pt-3">
                <span className="text-sm text-kids-ink/70">
                  Online checkout opening soon
                </span>

                <button
                  type="button"
                  disabled={purchasingId === pass.id}
                  onClick={() => handlePurchase(pass.id)}
                  className={cn(kidsSecondaryButton, "shrink-0 disabled:opacity-50")}
                >
                  {purchasingId === pass.id ? "Checking…" : "Coming soon"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
