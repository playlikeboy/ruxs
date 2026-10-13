import { HexclaveClientApp } from "@hexclave/next";

export const hexclaveClient = new HexclaveClientApp({
  tokenStore: "nextjs-cookie",
  urls: {
    default: { type: "hosted" },
    afterSignIn: "/app",
    afterSignOut: "/",
  },
});
