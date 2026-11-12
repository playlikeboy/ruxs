/**
 * Public origin of the app. Client-safe: NEXT_PUBLIC_* is inlined at build time.
 * Kept out of src/lib/env.ts because that module imports the Cloudflare runtime.
 */
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://ruxs.in";
