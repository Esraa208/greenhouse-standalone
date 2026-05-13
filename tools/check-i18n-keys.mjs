#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = path.join(import.meta.dirname, '..');
const enPath = path.join(projectRoot, 'src', 'assets', 'i18n', 'en.json');

/** @param {string} prefix @param {unknown} node @param {Array<[string, unknown]>} out */
function flatten(prefix, node, out = []) {
  if (typeof node !== 'object' || node === null || Array.isArray(node)) return out;
  for (const [k, v] of Object.entries(node)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      flatten(p, v, out);
    } else {
      out.push([p, v]);
    }
  }
  return out;
}

async function main() {
  let exit = 0;
  const raw = await readFile(enPath, 'utf8');
  const bundle = JSON.parse(raw);
  const pairs = flatten('', bundle);

  const empties = pairs.filter(([, v]) => v === '' || v === null);
  if (empties.length) {
    exit = 1;
    console.error(`i18n: empty/null values (${empties.length}):\n`);
    for (const [k] of empties) {
      console.error(`  - ${k}`);
    }
    console.error('');
  }

  const roots = new Map();
  for (const [key] of pairs) {
    const top = key.split('.')[0] ?? '';
    roots.set(top, (roots.get(top) ?? 0) + 1);
  }

  console.log('i18n: top-level namespaces (leaf count):');
  for (const [ns, n] of [...roots.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(`  ${ns}: ${n}`);
  }
  console.log('\ni18n: use a dotted prefix per domain (e.g. zones.*, customers.*). JSON cannot express duplicate keys — review merges in PRs.');

  process.exit(exit);
}

await main();
