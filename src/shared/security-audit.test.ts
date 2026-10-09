import { describe, expect, it } from "bun:test";
import { requestPhoneOtp, verifyPhoneOtp, DEMO_USERS, MASTER_DEMO_OTP } from "./auth/otp";
import { maskIndianPhone, normalizeIndianPhone } from "./auth/phone";
import { timingSafeEqual, safeJsonLdStringify } from "./utils/security";
import { checkRateLimit } from "./utils/rate-limit";
import { WhatsAppGateway } from "../modules/whatsapp/whatsapp-gateway";

describe("Security Audit & Vulnerability Hardening Suite", () => {
  describe("Authentication & Production Demo OTP Gating", () => {
    it("enforces strict non-production gating and rejects master OTP in production", async () => {
      const origNodeEnv = process.env.NODE_ENV;
      const origAppEnv = process.env.APP_ENV;

      try {
        (process.env as Record<string, string | undefined>).NODE_ENV = "production";
        process.env.APP_ENV = "production";

        const adminDemo = DEMO_USERS[0];
        // In production, debugCode must never be returned
        const req = await requestPhoneOtp(adminDemo.phone, { isDev: true }).catch(() => null);
        if (req) {
          expect(req.debugCode).toBeUndefined();
        }

        // In production, verifyPhoneOtp must never accept MASTER_DEMO_OTP
        const verified = await verifyPhoneOtp(adminDemo.phone, MASTER_DEMO_OTP, { isDev: true });
        expect(verified).toBe(false);
      } finally {
        (process.env as Record<string, string | undefined>).NODE_ENV = origNodeEnv;
        process.env.APP_ENV = origAppEnv;
      }
    });

    it("verifies constant-time string comparison behaves correctly and prevents timing attacks", () => {
      expect(timingSafeEqual("hello1234567890", "hello1234567890")).toBe(true);
      expect(timingSafeEqual("hello1234567890", "hello1234567891")).toBe(false);
      expect(timingSafeEqual("short", "longer_string")).toBe(false);
      expect(timingSafeEqual("", "")).toBe(true);
    });
  });

  describe("DPDP Act Compliance & PII Masking", () => {
    it("masks customer phone numbers while preserving edge verification digits", () => {
      const masked = maskIndianPhone("9876543210");
      expect(masked).toBe("+9198*****10");
      expect(masked).not.toContain("765432");

      const maskedWithPrefix = maskIndianPhone("+919123456789");
      expect(maskedWithPrefix).toBe("+9191*****89");

      const maskedFallback = maskIndianPhone("123456");
      expect(maskedFallback).toBe("123****56");
    });
  });

  describe("XSS Neutralization & Script Breakout Prevention", () => {
    it("escapes '<' characters in JSON-LD payloads to prevent HTML script termination", () => {
      const maliciousData = {
        name: "</script><script>alert('xss')</script>",
        description: "Fresh Organic Milk <img src=x onerror=alert(1)>",
      };

      const serialized = safeJsonLdStringify(maliciousData);
      expect(serialized).not.toContain("</script>");
      expect(serialized).toContain("\\u003c/script>");
      expect(serialized).toContain("\\u003cimg");

      // Verify that parsed JSON remains logically identical
      const parsed = JSON.parse(serialized);
      expect(parsed.name).toBe("</script><script>alert('xss')</script>");
    });
  });

  describe("Edge Rate Limiting & Bounded Storage", () => {
    it("enforces sliding-window request limits", async () => {
      const key = `test_security_rl_${Date.now()}`;
      const first = await checkRateLimit(key, 3, 10);
      expect(first.allowed).toBe(true);

      const second = await checkRateLimit(key, 3, 10);
      expect(second.allowed).toBe(true);

      const third = await checkRateLimit(key, 3, 10);
      expect(third.allowed).toBe(true);

      const fourth = await checkRateLimit(key, 3, 10);
      expect(fourth.allowed).toBe(false);
      expect(fourth.remaining).toBe(0);
    });
  });

  describe("Meta Webhook Signature Timing-Safe Verification", () => {
    it("verifies authentic signatures and rejects forged signatures", async () => {
      const payload = JSON.stringify({ entry: [{ id: "test", changes: [] }] });
      const secret = "test_meta_webhook_secret_key_12345";
      const validSig = await WhatsAppGateway.generateTestSignature(payload, secret);

      const isValid = await WhatsAppGateway.verifyMetaSignature(payload, validSig, secret);
      expect(isValid).toBe(true);

      const isInvalid = await WhatsAppGateway.verifyMetaSignature(payload, "sha256=0000000000000000000000000000000000000000000000000000000000000000", secret);
      expect(isInvalid).toBe(false);
    });
  });
});
