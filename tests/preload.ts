import { mock } from "bun:test";

mock.module("server-only", () => ({}));

// Bun auto-loads .env.local, whose DATABASE_URL is the live database.
// Tests may only ever touch a disposable database named by TEST_DATABASE_URL;
// without it, point at an unreachable address so integration suites skip.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || "postgres://skip:skip@127.0.0.1:1/no_test_database";
