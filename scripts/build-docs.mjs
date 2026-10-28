#!/usr/bin/env node
/**
 * Build the GitHub Pages demo in docs/.
 *
 * examples/basic.html is the development entry (it loads main.ts through Vite).
 * GitHub Pages cannot run Vite, so we reuse the same markup and swap the module
 * script for the UMD bundle + the plain-JS demo script.
 *
 * The generated docs/index.html keeps every asset path relative, so it works
 * from https://<user>.github.io/CanvasTable/ without extra configuration.
 */
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceHtml = resolve(root, "examples/basic.html");
const docsDir = resolve(root, "docs");
const docsHtml = resolve(docsDir, "index.html");

const DEV_SCRIPT = '<script type="module" src="./main.ts"></script>';
const PAGES_SCRIPTS = `<!-- Canvas Table UMD bundle (copied from dist) -->
    <script src="./canvas-table.umd.min.js"></script>
    <!-- Demo script -->
    <script src="./demo.js"></script>`;

const BUNDLE_CANDIDATES = [
  "dist/canvas-table.umd.min.js",
  "dist/canvas-table.umd.cjs",
];

async function copyBundle() {
  const bundle = BUNDLE_CANDIDATES.map((file) => resolve(root, file)).find(
    existsSync,
  );

  if (!bundle) {
    console.warn(
      "[build-docs] No UMD bundle found in dist/. Run `pnpm build:lib` first; docs/index.html will reference the bundle anyway.",
    );
    return;
  }

  await copyFile(bundle, resolve(docsDir, "canvas-table.umd.min.js"));
  console.log(`[build-docs] Copied ${bundle.slice(root.length + 1)} -> docs/canvas-table.umd.min.js`);
}

async function buildHtml() {
  const html = await readFile(sourceHtml, "utf8");

  if (!html.includes(DEV_SCRIPT)) {
    throw new Error(
      `[build-docs] Could not find "${DEV_SCRIPT}" in examples/basic.html. Update the dev script tag or this build script.`,
    );
  }

  const pagesHtml = html.replace(DEV_SCRIPT, PAGES_SCRIPTS);
  await writeFile(docsHtml, pagesHtml, "utf8");
  console.log("[build-docs] Generated docs/index.html from examples/basic.html");
}

await mkdir(docsDir, { recursive: true });
await buildHtml();
await copyBundle();

// Keep GitHub Pages from running Jekyll over the demo directory.
await writeFile(resolve(docsDir, ".nojekyll"), "", "utf8");
console.log("[build-docs] Wrote docs/.nojekyll");
