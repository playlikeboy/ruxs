import "server-only";
import { HexclaveClientApp, HexclaveServerApp } from "@hexclave/next";

export const hexclaveClient = new HexclaveClientApp({
  tokenStore: "nextjs-cookie",
  urls: {
    default: { type: "hosted" },
    afterSignIn: "/app",
    afterSignOut: "/",
  },
});

export const hexclave = new HexclaveServerApp({ inheritsFrom: hexclaveClient });
