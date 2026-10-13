import "server-only";
import { HexclaveServerApp } from "@hexclave/next";
import { hexclaveClient } from "./client";

export const hexclave = new HexclaveServerApp({ inheritsFrom: hexclaveClient });
export { hexclaveClient };
