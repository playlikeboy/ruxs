import { VENDOR_TYPE_INFO, isKidsVendorType, type VendorType } from "./vendor-types";

/** The one thing a new merchant of this type should know first. */
export function merchantHint(type: VendorType): string {
  if (isKidsVendorType(type)) return "Parents send booking requests. Accept or decline each one from Calendar; they get an email either way.";
  if (VENDOR_TYPE_INFO[type].fulfilment === "booking") return "Bookings land in Calendar. Keep your weekly hours up to date so clients only see times you can do.";
  return "New orders show a badge on Orders. Accept them, then deliver from the run sheet, sorted floor by floor.";
}
