import { build } from 'esbuild';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const LOADTEST_DIR = path.join(ROOT, 'test', 'loadTest');
const OUT_DIR = path.join(LOADTEST_DIR, 'dist');
const EXCLUDED_DIR_NAMES = new Set(['helpers', 'config']);

function findEntryPoints(dir) {
  /** @type {string[]} */
  const entries = [];

  /** @param {string} current */
  function walk(current) {
    const stats = fs.statSync(current);
    if (stats.isDirectory()) {
      const base = path.basename(current);
      if (EXCLUDED_DIR_NAMES.has(base)) return;
      for (const child of fs.readdirSync(current)) {
        walk(path.join(current, child));
      }
      return;
    }

    if (!current.endsWith('.ts')) return;
    if (current.endsWith('.d.ts')) return;
    entries.push(current);
  }

  walk(dir);
  return entries;
}

async function main() {
  const entryPoints = findEntryPoints(LOADTEST_DIR);
  if (entryPoints.length === 0) {
    console.warn('[load:build] No entry points found.');
    return;
  }

  await build({
    entryPoints,
    outdir: OUT_DIR,
    bundle: true,
    platform: 'browser',
    format: 'esm',
    target: 'es2020',
    external: ['k6', 'k6/*'],
    logLevel: 'info',
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


