import { readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { hasGit, detectBaseBranch, hasDiff, getFileFromBranch, git } from './git.js';
import { isGreater, parse } from './semver.js';

export function run({ baseBranch, paths, strict = false, cwd = process.cwd() }) {
  if (!hasGit()) {
    return { ok: false, message: 'git is not installed' };
  }

  const resolved = baseBranch ?? detectBaseBranch(cwd);
  if (!resolved) {
    return { ok: false, message: 'Could not detect base branch. Use --base to specify one.' };
  }

  // If no paths given, treat cwd as the single package root
  const targets = paths && paths.length > 0 ? paths : ['.'];
  const results = [];

  for (const target of targets) {
    const pkgPath = join(target, 'package.json');
    const fullPkgPath = join(cwd, pkgPath);

    if (!existsSync(fullPkgPath)) {
      results.push({ name: target, status: 'skip', message: `No package.json found at ${pkgPath}` });
      continue;
    }

    const pkg = JSON.parse(readFileSync(fullPkgPath, 'utf-8'));
    const name = pkg.name ?? target;
    const currentVersion = pkg.version;

    if (!hasDiff(resolved, target, cwd)) {
      results.push({ name, status: 'unchanged', message: 'No differences with base branch' });
      continue;
    }

    const baseContent = getFileFromBranch(resolved, pkgPath, cwd);
    if (!baseContent) {
      // New package — no base to compare
      results.push({ name, status: 'ok', message: `New package (v${currentVersion})` });
      continue;
    }

    let basePkg;
    try {
      basePkg = JSON.parse(baseContent);
    } catch {
      results.push({ name, status: 'ok', message: 'Could not parse base package.json — treating as new' });
      continue;
    }

    const baseVersion = basePkg.version;

    if (currentVersion === baseVersion) {
      results.push({
        name,
        status: 'fail',
        message: `Version ${currentVersion} is the same as ${resolved}. Please bump it.`,
      });
      continue;
    }

    if (strict && !isGreater(currentVersion, baseVersion)) {
      results.push({
        name,
        status: 'fail',
        message: `Version ${currentVersion} is not greater than ${resolved} (${baseVersion}). Please bump it higher.`,
      });
      continue;
    }

    if (!parse(currentVersion)) {
      results.push({
        name,
        status: 'fail',
        message: `Version "${currentVersion}" is not valid semver.`,
      });
      continue;
    }

    results.push({
      name,
      status: 'ok',
      message: `${baseVersion} → ${currentVersion}`,
    });
  }

  return { ok: results.every(r => r.status !== 'fail'), results };
}
