#!/usr/bin/env node

import { run } from '../lib/vertioner.js';
import { parseArgs } from 'node:util';

const { values, positionals } = parseArgs({
  options: {
    base: { type: 'string', short: 'b', description: 'Base branch to compare against (default: auto-detect main/master)' },
    strict: { type: 'boolean', short: 's', default: false, description: 'Require version to be strictly greater, not just different' },
    help: { type: 'boolean', short: 'h', default: false },
  },
  allowPositionals: true,
});

if (values.help) {
  console.log(`
  vertioner — verify package versions are bumped before merging

  Usage:
    vertioner [options] [path...]

  Options:
    -b, --base <branch>   Base branch to compare against (default: auto-detect)
    -s, --strict          Require version to be strictly greater (semver)
    -h, --help            Show this help message

  Examples:
    vertioner                     Check current directory
    vertioner packages/foo        Check a specific package
    vertioner packages/*          Check all packages (monorepo)
    vertioner --base develop -s   Compare against 'develop', strict mode
`);
  process.exit(0);
}

const result = run({
  baseBranch: values.base,
  paths: positionals.length > 0 ? positionals : undefined,
  strict: values.strict,
});

if (result.message) {
  console.error(`✗ ${result.message}`);
  process.exit(1);
}

const symbols = { ok: '✓', fail: '✗', skip: '⊘', unchanged: '—' };

for (const r of result.results) {
  const sym = symbols[r.status] ?? '?';
  console.log(`  ${sym} ${r.name}: ${r.message}`);
}

process.exit(result.ok ? 0 : 1);

