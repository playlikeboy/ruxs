/**
 * Fixed enums used by forms and rules. Category data (labels, emoji, colours)
 * lives in the `categories` table and is managed from /admin.
 */

/** A category id, i.e. `products.kind` / `categories.id`. */
export type ServiceKind = string;

/** The colours a store or item cover needs, taken from its category row. */
export interface CoverStyle {
  emoji: string;
  coverFrom: string;
  coverTo: string;
}

export const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export const SLOT_LABEL: Record<string, string> = {
  asap: "As soon as possible",
  morning: "Morning (7–10 am)",
  lunch: "Lunch (12–2 pm)",
  evening: "Evening (4–7 pm)",
  dinner: "Dinner (7–9 pm)",
};
