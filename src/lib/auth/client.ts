import { HexclaveClientApp } from "@hexclave/next";

export const hexclaveClient = new HexclaveClientApp({
  tokenStore: "nextjs-cookie",
  urls: {
    signIn: "/sign-in",
    signUp: "/sign-up",
    afterSignIn: "/app",
    afterSignUp: "/app",
    afterSignOut: "/",
  },
});
