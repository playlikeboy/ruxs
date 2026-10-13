import { istDateTime } from "./time";

export interface LedgerEntryForInvoice {
  type: string;
  amountPaise: number;
  createdAt: Date;
}

export interface ComputedInvoice {
  openingPaise: number;
  chargesPaise: number;
  paymentsPaise: number;
  closingPaise: number;
}

/**
 * Computes monthly invoice opening balance, charges, payments, and closing balance
 * from ledger entries in integer paise.
 * (PRD §10 Rule 6)
 */
export function computeInvoice(
  entries: LedgerEntryForInvoice[],
  period: string // YYYY-MM
): ComputedInvoice {
  const [yearStr, monthStr] = period.split("-");
  const year = parseInt(yearStr!, 10);
  const month = parseInt(monthStr!, 10);

  // Month starts on YYYY-MM-01 00:00:00 IST
  const monthStart = istDateTime(`${period}-01`, "00:00:00");

  // Calculate next month start for upper boundary
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextMonthStr = nextMonth.toString().padStart(2, "0");
  const monthEnd = istDateTime(`${nextYear}-${nextMonthStr}-01`, "00:00:00");

  let openingPaise = 0;
  let chargesPaise = 0;
  let paymentsPaise = 0;

  for (const entry of entries) {
    const time = entry.createdAt.getTime();
    if (time < monthStart.getTime()) {
      openingPaise += entry.amountPaise;
    } else if (time < monthEnd.getTime()) {
      if (entry.amountPaise > 0) {
        chargesPaise += entry.amountPaise;
      } else {
        paymentsPaise += Math.abs(entry.amountPaise);
      }
    }
  }

  const closingPaise = openingPaise + chargesPaise - paymentsPaise;

  return {
    openingPaise,
    chargesPaise,
    paymentsPaise,
    closingPaise,
  };
}

/**
 * Generates an invoice number in the standard format RX-{YYYYMM}-{seq}.
 */
export function formatInvoiceNumber(period: string, seq: number): string {
  const yyyymm = period.replace("-", "");
  const seqStr = seq.toString().padStart(3, "0");
  return `RX-${yyyymm}-${seqStr}`;
}
