const fs = require("fs");
const path = require("path");

const target = path.join(
  __dirname,
  "../node_modules/@opennextjs/cloudflare/dist/cli/build/patches/plugins/load-manifest.js"
);

/** Replaces `from` with `to` once; warns instead of silently skipping when the upstream code moved. */
function patchOnce(content, { done, from, to, label }) {
  if (content.includes(done)) return content;
  if (!content.includes(from)) {
    console.warn(`patch-opennext: "${label}" anchor not found; @opennextjs/cloudflare changed, re-check this patch`);
    return content;
  }
  return content.replace(from, to);
}

if (!fs.existsSync(target)) {
  console.warn(`patch-opennext: ${path.relative(process.cwd(), target)} not found, skipped`);
} else {
  const original = fs.readFileSync(target, "utf-8");
  let content = patchOnce(original, {
    label: "manifest glob",
    done: "**/{*-manifest,required-server-files,prefetch-hints,preview-props}.json",
    from: "**/{*-manifest,required-server-files,prefetch-hints}.json",
    to: "**/{*-manifest,required-server-files,prefetch-hints,preview-props}.json",
  });
  content = patchOnce(content, {
    label: "preview-props check",
    done: 'p.endsWith("preview-props")',
    from: 'p.endsWith("prefetch-hints")) {',
    to: 'p.endsWith("prefetch-hints") ||\n        p.endsWith("preview-props")) {',
  });

  if (content !== original) {
    fs.writeFileSync(target, content, "utf-8");
    console.log("Successfully applied preview-props patch to @opennextjs/cloudflare");
  }
}
