import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const isDev = process.env.NODE_ENV === "development";
const hexclaveApi = process.env.NEXT_PUBLIC_HEXCLAVE_API_URL ?? "https://api.hexclave.com";

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Dev bundles evaluate source maps with eval(); production never needs it.
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://static.cloudflareinsights.com https://js.stripe.com`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      `connect-src 'self' ${hexclaveApi} https://*.hexclave.com https://cloudflareinsights.com https://static.cloudflareinsights.com https://api.stripe.com`,
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self' https://*.hexclave.com",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  typedRoutes: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/c/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Cache-Control", value: "private, no-store" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.ruxs.in" }],
        destination: "https://ruxs.in/:path*",
        permanent: true,
      },
      {
        source: "/app",
        has: [{ type: "query", key: "token", value: "(?<token>[a-f0-9]{16,128})" }],
        destination: "/c/:token",
        permanent: false,
      },
      {
        source: "/merchant",
        destination: "/merchant-panel",
        permanent: true,
      },
      {
        source: "/merchant/:path*",
        destination: "/merchant-panel/:path*",
        permanent: true,
      },
      {
        source: "/in/:path*",
        destination: "/app",
        permanent: false,
      },
    ];
  },
};

const createNextConfig = (phase: string): NextConfig => {
  if (phase === "phase-development-server") {
    initOpenNextCloudflareForDev().catch(() => {});
  }
  return nextConfig;
};

export default createNextConfig;




