"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useUser } from "@hexclave/next";
import { HouseholdExpense } from "@/src/modules/expenses/expense-schema";
import { formatINR, Paise } from "@/src/shared/types/money";
import {
  ArrowRight,
  Check,
  CircleAlert,
  CreditCard,
  Receipt,
  Users,
  Wallet,
  X,
} from "@/components/icons/animated";

export default function HouseholdExpensesClient() {
  const user = useUser();
  const currentUserId = user?.id || "";
  const [expenses, setExpenses] = useState<HouseholdExpense[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/expenses?householdId=hh_sobha_b402");
      const data = (await response.json()) as { success: boolean; data?: HouseholdExpense[] };
      setExpenses(data.success && data.data ? data.data : []);
    } catch (error) {
      console.error(error);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) void fetchExpenses();
    else setLoading(false);
  }, [user]);

  const firstExpense = expenses[0];
  const myShare = firstExpense?.participants.find((participant) => participant.userId === currentUserId);
  const outstanding = myShare && !myShare.isSettled ? myShare.sharePaise : 0;
  const payeeUpi = firstExpense?.paidByUpi || "priya@okaxis";
  const payeeName = encodeURIComponent(firstExpense?.paidByName || "Priya Sundaram");
  const payLink = "upi://pay?pa=" + payeeUpi + "&pn=" + payeeName + "&am=" + (outstanding / 100).toFixed(2) + "&cu=INR&tn=Sobha%20B-402%20Expense%20Split";

  const totalHouseholdSpend = useMemo(
    () => expenses.reduce((total, expense) => total + expense.totalAmountPaise, 0),
    [expenses]
  );
  const myOutstanding = outstanding;

  const handleSettle = async (expenseId: string) => {
    if (!currentUserId) return;
    try {
      await fetch("/api/expenses/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expenseId, participantUserId: currentUserId }),
      });
      await fetchExpenses();
    } catch (error) {
      console.error(error);
    }
  };

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-xl items-center justify-center px-4 py-12">
        <div className="w-full rounded-[28px] border border-white/[0.08] bg-white/[0.025] p-7 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Wallet size={21} /></div>
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Shared expenses</p>
          <h1 className="mt-2 text-2xl font-semibold">See who owes what.</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">Sign in to view shared household bills, precise shares and settlement actions.</p>
          <Link href="/login?redirect=/customer/expenses" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground">
            Sign in <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-white/[0.03]" />)}
        </div>
        <div className="mt-5 h-72 animate-pulse rounded-3xl bg-white/[0.03]" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="space-y-5">
        <section className="rounded-[28px] border border-white/[0.08] bg-[radial-gradient(circle_at_top_right,rgba(159,197,143,0.09),transparent_36%),rgba(16,20,18,0.76)] p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Household ledger</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Shared expenses, without the spreadsheet.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">RUXS keeps roommate splits separate from vendor settlement so every person can see their own share clearly.</p>
            </div>
            <Link href="/customer/household" className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/[0.09] px-3.5 text-xs font-semibold text-muted-foreground hover:bg-white/[0.04] hover:text-foreground">
              <Users size={14} /> Household
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: "Household spend", value: formatINR(totalHouseholdSpend as Paise), detail: "Imported from RUXS invoices", icon: Receipt },
            { label: "Your outstanding", value: formatINR(myOutstanding as Paise), detail: myOutstanding > 0 ? "Ready to settle" : "Nothing due", icon: Wallet },
            { label: "Current payer", value: firstExpense?.paidByName || "—", detail: firstExpense?.paidByUpi || "No active bill", icon: CreditCard },
          ].map(({ label, value, detail, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
                <Icon size={15} className="text-subtle" />
              </div>
              <p className="mt-4 truncate text-xl font-semibold tracking-tight">{value}</p>
              <p className="mt-1 truncate text-[10px] uppercase tracking-[0.12em] text-subtle">{detail}</p>
            </div>
          ))}
        </section>

        {expenses.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-white/[0.1] bg-white/[0.02] px-6 py-16 text-center">
            <CircleAlert size={22} className="mx-auto text-subtle" />
            <h2 className="mt-4 text-sm font-semibold">No shared expenses yet.</h2>
            <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-muted-foreground">When a household invoice is ready to split, the members and exact shares will appear here.</p>
          </section>
        ) : (
          <div className="space-y-4">
            {expenses.map((expense) => (
              <section key={expense.id} className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.025]">
                <div className="flex flex-col gap-4 border-b border-white/[0.08] px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-primary">Verified invoice</span>
                      <span className="text-[10px] text-muted-foreground">{expense.invoiceId}</span>
                    </div>
                    <h2 className="mt-3 text-lg font-semibold">{expense.description}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Paid by <span className="font-medium text-foreground">{expense.paidByName}</span> · {expense.paidByUpi}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xl font-semibold">{formatINR(expense.totalAmountPaise as Paise)}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">Shared household amount</p>
                  </div>
                </div>

                <div className="divide-y divide-white/[0.07]">
                  {expense.participants.map((participant) => {
                    const isMe = participant.userId === currentUserId;
                    const isPayer = participant.userId === expense.paidByUserId;
                    return (
                      <div key={participant.userId} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className={isMe ? "flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary" : "flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-subtle"}>
                            <Users size={14} />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-xs font-semibold">{participant.name}</p>
                              {isMe && <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[8px] font-semibold text-primary">You</span>}
                              {isPayer && <span className="rounded-full border border-white/[0.08] px-2 py-0.5 text-[8px] text-muted-foreground">Payer</span>}
                            </div>
                            <p className="mt-1 text-[10px] text-muted-foreground">{participant.phone}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-4 sm:justify-end">
                          <div className="text-right">
                            <p className="text-sm font-semibold">{formatINR(participant.sharePaise as Paise)}</p>
                            <p className={participant.isSettled ? "mt-1 text-[9px] font-semibold text-primary" : "mt-1 text-[9px] text-amber-300"}>
                              {participant.isSettled ? "Settled" : "Pending"}
                            </p>
                          </div>

                          {!participant.isSettled && isMe && (
                            <div className="flex gap-2">
                              <a href={payLink} className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-3 text-[10px] font-semibold text-primary-foreground">
                                Pay via UPI <ArrowRight size={12} />
                              </a>
                              <button type="button" onClick={() => void handleSettle(expense.id)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/[0.09] px-3 text-[10px] font-semibold text-muted-foreground hover:bg-white/[0.04] hover:text-foreground">
                                <Check size={12} /> Mark paid
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-white/[0.08] bg-black/10 px-5 py-4 text-[10px] leading-5 text-muted-foreground sm:px-6">
                  <span className="font-semibold text-foreground">Ledger separation:</span> the vendor is already settled. This page tracks only the household's internal peer-to-peer split.
                </div>
              </section>
            ))}
          </div>
        )}

        <section className="grid gap-3 sm:grid-cols-2">
          <Link href="/customer/dashboard" className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 transition hover:bg-white/[0.04]">
            <Wallet size={16} className="text-primary" />
            <p className="mt-3 text-xs font-semibold">Back to your balance</p>
            <p className="mt-1 text-[10px] text-muted-foreground">See the main RUXS Khata.</p>
          </Link>
          <Link href="/customer/subscribe" className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 transition hover:bg-white/[0.04]">
            <Receipt size={16} className="text-primary" />
            <p className="mt-3 text-xs font-semibold">Manage recurring services</p>
            <p className="mt-1 text-[10px] text-muted-foreground">Change your everyday routine.</p>
          </Link>
        </section>
      </div>
    </div>
  );
}
