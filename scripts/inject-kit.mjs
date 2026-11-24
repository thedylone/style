#!/usr/bin/env node
/*
 * inject-kit.mjs
 * Writes the kit's shared header and footer into every HTML page of a built site,
 * so the deployed pages carry the current markup without any client-side JS.
 *
 *   node scripts/inject-kit.mjs <site-dir> [--repo owner/name] [--kit v1]
 *
 * In each .html file under <site-dir> it replaces:
 *   - the existing <header class="pk-header">…</header>, or a <!-- pk:header --> placeholder
 *   - the existing <footer class="pk-footer">…</footer>, or a <!-- pk:footer --> placeholder
 * with v1/partials/header.html and footer.html. {{repo}} becomes the repository
 * (default: $GITHUB_REPOSITORY) and {{year}} the current year.
 * Exits with an error if no page in the site got a header, which usually means a wrong path.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const [value] = args.splice(i, 2).slice(1);
  return value;
};
const repo = opt("repo", process.env.GITHUB_REPOSITORY);
const kit = opt("kit", "v1");
const siteDir = args[0];

if (!siteDir || !repo) {
  console.error("usage: inject-kit.mjs <site-dir> [--repo owner/name] [--kit v1]");
  console.error("(--repo defaults to $GITHUB_REPOSITORY)");
  process.exit(2);
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const fill = (s) =>
  s.trim().replaceAll("{{repo}}", repo).replaceAll("{{year}}", String(new Date().getFullYear()));
const partials = {
  header: fill(readFileSync(join(root, kit, "partials", "header.html"), "utf8")),
  footer: fill(readFileSync(join(root, kit, "partials", "footer.html"), "utf8")),
};

const patterns = {
  header: /([ \t]*)(?:<header\b[^>]*\bclass="[^"]*\bpk-header\b[^"]*"[^>]*>[\s\S]*?<\/header>|<!--\s*pk:header\s*-->)/,
  footer: /([ \t]*)(?:<footer\b[^>]*\bclass="[^"]*\bpk-footer\b[^"]*"[^>]*>[\s\S]*?<\/footer>|<!--\s*pk:footer\s*-->)/,
};

// Re-indent a partial to match the line it replaces.
const indent = (block, pad) => block.split("\n").map((line, i) => (i === 0 ? line : pad + line)).join("\n");

function* htmlFiles(dir) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".git") continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* htmlFiles(path);
    else if (name.endsWith(".html")) yield path;
  }
}

let headers = 0;
for (const file of htmlFiles(siteDir)) {
  const before = readFileSync(file, "utf8");
  let html = before;
  const done = [];
  for (const part of ["header", "footer"]) {
    if (patterns[part].test(html)) {
      // A function replacement, so "$" in the markup is never treated as a pattern.
      html = html.replace(patterns[part], (_, pad) => pad + indent(partials[part], pad));
      done.push(part);
    }
  }
  if (done.includes("header")) headers++;
  if (html !== before) writeFileSync(file, html);
  console.log(`${relative(siteDir, file) || file}: ${done.length ? done.join(" + ") : "no kit markup, left as is"}`);
}

if (!headers) {
  console.error(`No page under ${siteDir} has a .pk-header or <!-- pk:header --> to replace.`);
  process.exit(1);
}
console.log(`Injected the ${kit} kit header into ${headers} page(s) for ${repo}.`);
