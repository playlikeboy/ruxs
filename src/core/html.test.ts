import { describe, expect, it } from "bun:test";
import { escapeHtml, safeHttpUrl } from "./html";

describe("escapeHtml", () => {
  it("escapes markup, quotes and ampersands", () => {
    expect(escapeHtml(`<script>alert("x")</script> & 'y'`)).toBe("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;y&#39;");
  });
  it("leaves plain text alone", () => {
    expect(escapeHtml("Dance Workshop · ₹500")).toBe("Dance Workshop · ₹500");
  });
});

describe("safeHttpUrl", () => {
  it("allows https and http links", () => {
    expect(safeHttpUrl("https://ruxs.in/app/orders/1")).toBe("https://ruxs.in/app/orders/1");
    expect(safeHttpUrl("http://localhost:3000/x")).toBe("http://localhost:3000/x");
  });
  it("rejects script and data urls and garbage", () => {
    expect(safeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpUrl("data:text/html,hi")).toBeNull();
    expect(safeHttpUrl("not a url")).toBeNull();
  });
});
