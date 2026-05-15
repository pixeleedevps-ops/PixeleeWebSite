import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const ignoredDirs = new Set([".git", "node_modules"]);
const htmlFiles = [];
const issues = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;

    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".html")) {
      htmlFiles.push(fullPath);
    }
  }
}

function isExternalReference(value) {
  return /^(https?:|mailto:|tel:|#|javascript:|data:)/.test(value);
}

function resolveHtmlTarget(target) {
  if (fs.existsSync(target)) return true;
  if (fs.existsSync(`${target}.html`)) return true;
  return fs.existsSync(path.join(target, "index.html"));
}

walk(root);

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const directory = path.dirname(file);
  const references = html.matchAll(/(?:href|src|data-src|data-faq-image)="([^"]+)"/g);

  for (const match of references) {
    const value = match[1];
    if (!value || isExternalReference(value)) continue;

    const cleanValue = value.split("#")[0].split("?")[0];
    if (!cleanValue || cleanValue === "./" || cleanValue === "../") continue;

    const target = path.resolve(directory, cleanValue);
    if (!resolveHtmlTarget(target)) {
      issues.push(`${path.relative(root, file)}: ${value} -> missing ${path.relative(root, target)}`);
    }
  }
}

if (issues.length) {
  console.error(issues.join("\n"));
  process.exit(1);
}

console.log(`Checked ${htmlFiles.length} HTML files. No local link or asset issues found.`);
