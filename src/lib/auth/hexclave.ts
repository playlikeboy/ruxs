import "server-only";
import { HexclaveServerApp } from "@hexclave/next";
import { hexclaveClient } from "./client";

import { getCloudflareContext } from "@opennextjs/cloudflare";

function getSecretServerKey(): string | undefined {
  if (process.env.HEXCLAVE_SECRET_SERVER_KEY) {
    return process.env.HEXCLAVE_SECRET_SERVER_KEY;
  }
  try {
    const { env } = getCloudflareContext();
    return (env as CloudflareEnv).HEXCLAVE_SECRET_SERVER_KEY;
  } catch {
    return undefined;
  }
}

let serverAppInstance: HexclaveServerApp | null = null;
let lastUsedKey: string | undefined = undefined;

export function getHexclave(): HexclaveServerApp {
  const secretKey = getSecretServerKey();
  if (!serverAppInstance || (secretKey && secretKey !== lastUsedKey)) {
    lastUsedKey = secretKey;
    serverAppInstance = new HexclaveServerApp({
      inheritsFrom: hexclaveClient,
      ...(secretKey ? { secretServerKey: secretKey } : {}),
    });
  }
  return serverAppInstance;
}

export const hexclave = new Proxy({} as HexclaveServerApp, {
  get(_target, prop) {
    const app = getHexclave();
    const value = Reflect.get(app, prop);
    if (typeof value === "function") {
      return value.bind(app);
    }
    return value;
  },
});

export { hexclaveClient };
