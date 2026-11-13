import { describe, expect, it } from "bun:test";
import { buildPartnerOrderEmail } from "./fulfilment";

const base = {
  orderNumber: "RS-2611-0042",
  partnerName: "Test Logistics",
  placedAt: new Date("2026-11-13T06:30:00Z"),
  customerName: "Test Parent",
  phone: "+919876543210",
  address: "Flat 1, Test Society, Ranchi, Jharkhand 834001",
  city: "Ranchi",
  state: "Jharkhand",
  pincode: "834001",
  items: [
    { name: "Solar robot kit", sku: "RS-ROB-001", qty: 2 },
    { name: "Clay set", sku: null, qty: 1 },
  ],
  codToCollectPaise: 43800,
  customerNotes: null,
  note: null,
};

describe("buildPartnerOrderEmail", () => {
  it("lists items, quantities, the address, phone and the COD amount", () => {
    const e = buildPartnerOrderEmail(base);
    expect(e.subject).toContain("RS-2611-0042");
    expect(e.subject).toContain("3 units");
    expect(e.subject).toContain("834001");
    for (const part of [e.html, e.text]) {
      expect(part).toContain("Solar robot kit");
      expect(part).toContain("RS-ROB-001");
      expect(part).toContain("+919876543210");
      expect(part).toContain("834001");
      expect(part).toContain("₹438");
      expect(part).toContain("Cash on delivery");
    }
    expect(e.text).toContain("- 2 x Solar robot kit (RS-ROB-001)");
    expect(e.text).toContain("Total units: 3");
  });

  it("says prepaid orders need no cash", () => {
    const e = buildPartnerOrderEmail({ ...base, codToCollectPaise: 0 });
    expect(e.html).toContain("Prepaid: collect nothing");
    expect(e.subject).toContain("(prepaid)");
    expect(e.html).not.toContain("Cash on delivery");
  });

  it("escapes every customer-supplied value", () => {
    const evil = '<img src=x onerror="alert(1)">';
    const e = buildPartnerOrderEmail({
      ...base,
      customerName: evil,
      address: `${evil} & Sons`,
      items: [{ name: `<script>alert('x')</script>`, sku: evil, qty: 1 }],
      customerNotes: evil,
      note: "<b>urgent</b>",
      orderNumber: "RS-<1>",
    });
    expect(e.html).not.toContain("<img");
    expect(e.html).not.toContain("<script");
    expect(e.html).not.toContain("<b>urgent");
    expect(e.html).not.toContain("RS-<1>");
    expect(e.html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(e.html).toContain("&amp; Sons");
    expect(e.html).toContain("&lt;b&gt;urgent&lt;/b&gt;");
  });
});
