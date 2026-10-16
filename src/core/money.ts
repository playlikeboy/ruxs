/**
 * Money calculations in RUXs are strictly in integer paise.
 * Never store or compute balances with floating point numbers.
 */

/**
 * Formats integer paise into an Indian Rupee string (e.g. ₹1,23,450 or ₹90.50).
 */
export function formatINR(paise: number): string {
  const isNegative = paise < 0;
  const absPaise = Math.abs(paise);
  const rupees = Math.floor(absPaise / 100);
  const remPaise = absPaise % 100;

  const formattedRupees = new Intl.NumberFormat("en-IN").format(rupees);
  const prefix = isNegative ? "-₹" : "₹";

  if (remPaise === 0) {
    return `${prefix}${formattedRupees}`;
  }

  const paddedPaise = remPaise.toString().padStart(2, "0");
  return `${prefix}${formattedRupees}.${paddedPaise}`;
}

/**
 * Converts a rupee number or string into integer paise safely.
 */
export function rupeesToPaise(rupees: number | string): number {
  const val = typeof rupees === "string" ? parseFloat(rupees) : rupees;
  if (isNaN(val)) return 0;
  return Math.round(val * 100);
}

/**
 * Converts integer paise to rupees (for display or UPI query string).
 */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}
