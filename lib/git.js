import { execSync } from 'node:child_process';

/**
 * Run a git command and return trimmed stdout.
 * Returns null if the command fails.
 */
export function git(args, { cwd = process.cwd(), silent = false } = {}) {
  try {
    return execSync(`git ${args}`, { cwd, encoding: 'utf-8', stdio: silent ? 'pipe' : ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

export function hasGit() {
  try {
    execSync('git --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

export function detectBaseBranch(cwd) {
  const branches = git('branch -a', { cwd, silent: true }) ?? '';
  if (branches.includes('main')) return 'main';
  if (branches.includes('master')) return 'master';
  return null;
}

export function hasDiff(baseBranch, path, cwd) {
  const result = git(`diff --quiet ${baseBranch} -- ${path}`, { cwd, silent: true });
  // git diff --quiet exits 1 if there are differences (result is null on failure)
  return result === null;
}

export function getFileFromBranch(branch, filePath, cwd) {
  return git(`show ${branch}:${filePath}`, { cwd, silent: true });
}
