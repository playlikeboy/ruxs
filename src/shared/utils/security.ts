/**
 * Security & Sanitization Utilities
 */

/**
 * Escapes characters that can terminate HTML <script> contexts to prevent script-breakout XSS.
 * Specifically replaces '<' with unicode escape '\u003c'.
 */
export function safeJsonLdStringify(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/**
 * Constant-time string equality check to prevent side-channel timing attacks.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
