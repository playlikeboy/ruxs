"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ticket, Clock } from "lucide-react";
import { formatINR } from "@/core/money";
import { purchasePassAction } from "../actions";

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
        setSuccessMsg("Pass purchased successfully! Your credits are now active.");
        router.refresh();
      }
    } catch (err: any) {
      setPurchasingId(null);
      setError(err?.message ?? "Failed to purchase pass.");
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border-2 border-rose-500 bg-rose-50 p-3 text-xs font-bold text-rose-800">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">
          {successMsg}
        </div>
      )}

      {/* Owned Passes Wallet (if user has any) */}
      {purchasedPasses.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-1.5 px-1">
            <Ticket className="h-4 w-4 text-amber-600" />
            <h2 className="text-base font-black text-slate-950">
              My Active Pass Credits ({purchasedPasses.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {purchasedPasses.map(({ purchase, pass }) => {
              const expiresDate = new Date(purchase.validUntil);
              const isExpired = expiresDate < new Date();

              return (
                <div
                  key={purchase.id}
                  className="rounded-3xl border-2 border-slate-900 bg-gradient-to-r from-amber-100 via-amber-50 to-orange-100 p-4 shadow-[3px_3px_0_0_#0f172a]"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="rounded-full border border-slate-900 bg-white px-2 py-0.5 text-[10px] font-black text-slate-900">
                        🎟️ ACTIVE WALLET
                      </span>
                      <h3 className="mt-1.5 text-base font-black text-slate-950">
                        {pass.name}
                      </h3>
                      {pass.description && (
                        <p className="mt-0.5 text-xs font-medium text-slate-600">
                          {pass.description}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="rounded-2xl border-2 border-slate-900 bg-white px-3 py-1.5 shadow-[1px_1px_0_0_#0f172a]">
                        <span className="block text-xl font-black text-slate-950">
                          {purchase.remainingCredits}
                        </span>
                        <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">
                          Credits Left
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2.5 text-[11px] font-semibold text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-500" />
                      <span>
                        {isExpired ? "Expired on" : "Valid until"} {expiresDate.toLocaleDateString()}
                      </span>
                    </span>
                    <Link
                      href="/app/kids/workshops"
                      className="text-xs font-black text-accent hover:underline"
                    >
                      Redeem against camps →
                    </Link>
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
          <h2 className="text-base font-black text-slate-950">
            Available Holiday & Weekend Passes
          </h2>
          <p className="text-xs font-semibold text-slate-500">
            Flexi-credits valid across robotics, pottery, chess and arts camps
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {availablePasses.map((pass) => (
            <div
              key={pass.id}
              className="rounded-3xl border-2 border-slate-900 bg-white p-5 shadow-[3px_3px_0_0_#0f172a]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="rounded-full border border-slate-900 bg-amber-200 px-2.5 py-0.5 text-[10px] font-black text-slate-950">
                    ⭐ {pass.creditsTotal} SESSIONS PASS
                  </span>
                  <h3 className="mt-2 text-lg font-black text-slate-950">
                    {pass.name}
                  </h3>
                  <p className="mt-1 text-xs font-medium text-slate-600">
                    {pass.description}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="block text-xl font-black text-slate-950">
                    {formatINR(pass.pricePaise)}
                  </span>
                  <span className="block text-[10px] font-semibold text-slate-400">
                    Valid {pass.validityDays} days
                  </span>
                </div>
              </div>

              {pass.terms && (
                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-[11px] font-medium text-slate-600">
                  <span className="font-bold text-slate-800">Terms: </span>
                  {pass.terms}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-[11px] font-bold text-emerald-700">
                  ✓ Instant activation · Priority booking
                </span>

                <button
                  type="button"
                  disabled={purchasingId === pass.id}
                  onClick={() => handlePurchase(pass.id)}
                  className="rounded-full border-2 border-slate-900 bg-amber-400 px-5 py-2 text-xs font-black text-slate-950 shadow-[2px_2px_0_0_#0f172a] transition active:translate-y-0.5 hover:bg-amber-300 disabled:opacity-50"
                >
                  {purchasingId === pass.id ? "Activating..." : "Get Pass →"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
