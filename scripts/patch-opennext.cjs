const fs = require("fs");
const path = require("path");

const target = path.join(
  __dirname,
  "../node_modules/@opennextjs/cloudflare/dist/cli/build/patches/plugins/load-manifest.js"
);

if (fs.existsSync(target)) {
  let content = fs.readFileSync(target, "utf-8");
  let changed = false;

  if (content.includes("**/{*-manifest,required-server-files,prefetch-hints}.json")) {
    content = content.replace(
      "**/{*-manifest,required-server-files,prefetch-hints}.json",
      "**/{*-manifest,required-server-files,prefetch-hints,preview-props}.json"
    );
    changed = true;
  }

  if (!content.includes('p.endsWith("preview-props")')) {
    content = content.replace(
      'p.endsWith("prefetch-hints")) {',
      'p.endsWith("prefetch-hints") ||\n        p.endsWith("preview-props")) {'
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(target, content, "utf-8");
    console.log("Successfully applied preview-props patch to @opennextjs/cloudflare");
  }
}
