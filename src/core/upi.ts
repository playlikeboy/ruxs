export interface UpiPaymentParams {
  vpa: string;
  payeeName: string;
  amountPaise: number;
  billNumber: string;
}

/**
 * Builds a universal deep link for UPI apps:
 * upi://pay?pa={vpa}&pn={payeeName}&am={rupees}&cu=INR&tn={billNumber}
 * (PRD §10 Rule 6)
 */
export function buildUpiUrl(params: {
  vpa: string;
  payeeName: string;
  amountPaise: number;
  billNumber: string;
}): string {
  const rupees = (params.amountPaise / 100).toFixed(2);
  const searchParams = new URLSearchParams({
    pa: params.vpa,
    pn: params.payeeName,
    am: rupees,
    cu: "INR",
    tn: params.billNumber,
  });

  return `upi://pay?${searchParams.toString()}`;
}
