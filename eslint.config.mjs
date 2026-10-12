import nextConfig from "eslint-config-next";

const config = [
  ...nextConfig,
  {
    ignores: [".next/", ".open-next/", "node_modules/", "cloudflare-env.d.ts"],
  },
];

export default config;
