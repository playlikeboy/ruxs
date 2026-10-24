import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { Glob } from "bun";

/**
 * Every export of a "use server" module is a public HTTP endpoint.
 * This test keeps internal helpers out of those modules and makes every
 * exported action call an auth guard. Add to PUBLIC only for deliberate,
 * read-only public endpoints.
 */
const GUARD = /\b(requireUser|requireVendorAccess|requireVendorModule|requireAdmin)\(|\bhexclave\.getUser\(/;
const PUBLIC = new Set(["src/features/reviews/actions.ts#fetchStoreReviewsPage"]);

function serverActionFiles() {
  return [...new Glob("src/**/*.{ts,tsx}").scanSync(".")].filter((f) => /^\s*["']use server["']/.test(readFileSync(f, "utf8")));
}

function exportedFunctions(src: string) {
  const re = /export\s+async\s+function\s+(\w+)/g;
  const starts: { name: string; at: number }[] = [];
  for (let m = re.exec(src); m; m = re.exec(src)) starts.push({ name: m[1]!, at: m.index });
  // A top-level function ends at the first line that is exactly "}" (formatted code).
  return starts.map((s) => {
    const close = /\n\}\r?(\n|$)/g;
    close.lastIndex = s.at;
    const end = close.exec(src)?.index ?? src.length;
    return { name: s.name, body: src.slice(s.at, end) };
  });
}

describe("server action boundary", () => {
  const files = serverActionFiles();

  it("finds the server action modules", () => {
    expect(files.length).toBeGreaterThan(5);
  });

  it("every exported server action calls an auth guard", () => {
    const unguarded = files.flatMap((f) =>
      exportedFunctions(readFileSync(f, "utf8"))
        .filter((fn) => !GUARD.test(fn.body) && !PUBLIC.has(`${f}#${fn.name}`))
        .map((fn) => `${f}#${fn.name}`)
    );
    expect(unguarded).toEqual([]);
  });

  it("server action modules export nothing but async functions", () => {
    const leaks = files.flatMap((f) =>
      [...readFileSync(f, "utf8").matchAll(/^export\s+(?!async\s+function|type\s|interface\s)(\w+)/gm)].map((m) => `${f}: export ${m[1]}`)
    );
    expect(leaks).toEqual([]);
  });

  it("no third-party API key is committed in source", () => {
    const hits = [...new Glob("src/**/*.{ts,tsx}").scanSync(".")].filter((f) =>
      /(API_KEY|SECRET|TOKEN)\s*=\s*["'][A-Za-z0-9_\-]{20,}["']/.test(readFileSync(f, "utf8"))
    );
    expect(hits).toEqual([]);
  });
});
