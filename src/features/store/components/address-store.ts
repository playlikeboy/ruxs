import { INDIAN_STATES, isValidPincode, normalizeIndianMobile, normalizeIndianState } from "@/core/store";

/**
 * The ship-to address typed at RUXs Store checkout, remembered in this browser
 * so the next order starts filled in. The server validates it again when the
 * order is placed.
 */
export interface CheckoutAddress {
  name: string;
  phone: string;
  line1: string;
  line2: string;
  landmark: string;
  city: string;
  /** One of INDIAN_STATES, or "" until chosen. */
  state: string;
  pincode: string;
}

export type AddressField = keyof CheckoutAddress;

export const ADDRESS_FIELDS: AddressField[] = ["name", "phone", "line1", "line2", "landmark", "city", "state", "pincode"];

const KEY = "ruxs-store-address-v1";
const MAX: Record<AddressField, number> = { name: 80, phone: 16, line1: 120, line2: 120, landmark: 80, city: 60, state: 60, pincode: 6 };

/** Shows a saved "+91XXXXXXXXXX" as the ten digits people type. */
export function displayPhone(phone: string): string {
  const normal = normalizeIndianMobile(phone);
  return normal ? normal.slice(-10) : phone;
}

/** The address last used on this device, or null. Call in the browser only. */
export function loadSavedAddress(): CheckoutAddress | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<Record<AddressField, unknown>> | null;
    if (!v || typeof v !== "object") return null;
    const text = (f: AddressField) => (typeof v[f] === "string" ? (v[f] as string).slice(0, MAX[f]) : "");
    const address: CheckoutAddress = {
      name: text("name"),
      phone: displayPhone(text("phone")),
      line1: text("line1"),
      line2: text("line2"),
      landmark: text("landmark"),
      city: text("city"),
      state: normalizeIndianState(text("state")) ?? "",
      pincode: text("pincode").replace(/\D/g, ""),
    };
    return address.line1 || address.pincode ? address : null;
  } catch {
    return null;
  }
}

export function saveAddress(address: CheckoutAddress) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(address));
  } catch {
    // Private mode or blocked storage: checkout still works, it just won't be remembered.
  }
}

/** Per-field problems in plain words; an empty object means the address can be sent. */
export function addressErrors(a: CheckoutAddress): Partial<Record<AddressField, string>> {
  const e: Partial<Record<AddressField, string>> = {};
  if (a.name.trim().length < 2) e.name = "Enter the receiver's name";
  if (!normalizeIndianMobile(a.phone)) e.phone = "Enter a 10-digit mobile number";
  if (a.line1.trim().length < 5) e.line1 = "Enter your house or flat and street";
  if (a.city.trim().length < 2) e.city = "Enter your city";
  if (!(INDIAN_STATES as readonly string[]).includes(a.state)) e.state = "Choose your state";
  if (!isValidPincode(a.pincode)) e.pincode = "Enter a valid 6-digit PIN code";
  return e;
}
