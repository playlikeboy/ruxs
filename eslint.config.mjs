import nextConfig from "eslint-config-next";
import tsPlugin from "@typescript-eslint/eslint-plugin";

const config = [
  ...nextConfig,
  {
    ignores: [".next/", ".open-next/", "node_modules/", "cloudflare-env.d.ts"],
  },
  {
    // Dead imports and variables fail the lint, so unused code doesn't pile up.
    files: ["**/*.{ts,tsx}"],
    plugins: { "@typescript-eslint": tsPlugin },
    rules: { "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }] },
  },
];

export default config;
