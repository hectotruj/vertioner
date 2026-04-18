import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';
import { run } from '../lib/vertioner.js';

function setupRepo(baseBranch = 'main') {
  const dir = mkdtempSync(join(tmpdir(), 'vertioner-test-'));
  execSync(`git init -b ${baseBranch}`, { cwd: dir, stdio: 'pipe' });
  execSync('git config user.email "test@test.com"', { cwd: dir, stdio: 'pipe' });
  execSync('git config user.name "Test"', { cwd: dir, stdio: 'pipe' });

  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'test-pkg', version: '1.0.0' }));
  execSync('git add -A && git commit -m "init"', { cwd: dir, stdio: 'pipe' });
  return dir;
}

describe('vertioner.run', () => {
  let dir;

  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  it('reports unchanged when no diff', () => {
    dir = setupRepo();
    const result = run({ cwd: dir });
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.results[0].status, 'unchanged');
  });

  it('fails when version is not bumped', () => {
    dir = setupRepo();
    // make a change but don't bump version
    writeFileSync(join(dir, 'index.js'), 'console.log("hello")');
    execSync('git checkout -b feature', { cwd: dir, stdio: 'pipe' });
    execSync('git add -A && git commit -m "change"', { cwd: dir, stdio: 'pipe' });

    const result = run({ cwd: dir });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.results[0].status, 'fail');
  });

  it('passes when version is bumped', () => {
    dir = setupRepo();
    execSync('git checkout -b feature', { cwd: dir, stdio: 'pipe' });
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'test-pkg', version: '1.1.0' }));
    execSync('git add -A && git commit -m "bump"', { cwd: dir, stdio: 'pipe' });

    const result = run({ cwd: dir });
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.results[0].status, 'ok');
  });

  it('fails in strict mode when version is lower', () => {
    dir = setupRepo();
    execSync('git checkout -b feature', { cwd: dir, stdio: 'pipe' });
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'test-pkg', version: '0.9.0' }));
    execSync('git add -A && git commit -m "downgrade"', { cwd: dir, stdio: 'pipe' });

    const result = run({ cwd: dir, strict: true });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.results[0].status, 'fail');
  });

  it('detects master as base branch', () => {
    dir = setupRepo('master');
    execSync('git checkout -b feature', { cwd: dir, stdio: 'pipe' });
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'test-pkg', version: '2.0.0' }));
    execSync('git add -A && git commit -m "bump"', { cwd: dir, stdio: 'pipe' });

    const result = run({ cwd: dir });
    assert.strictEqual(result.ok, true);
  });

  it('supports monorepo paths', () => {
    dir = setupRepo();
    execSync('mkdir -p packages/a packages/b', { cwd: dir, stdio: 'pipe' });
    writeFileSync(join(dir, 'packages/a/package.json'), JSON.stringify({ name: '@mono/a', version: '1.0.0' }));
    writeFileSync(join(dir, 'packages/b/package.json'), JSON.stringify({ name: '@mono/b', version: '1.0.0' }));
    execSync('git add -A && git commit -m "add packages"', { cwd: dir, stdio: 'pipe' });

    execSync('git checkout -b feature', { cwd: dir, stdio: 'pipe' });
    writeFileSync(join(dir, 'packages/a/package.json'), JSON.stringify({ name: '@mono/a', version: '1.1.0' }));
    writeFileSync(join(dir, 'packages/a/index.js'), 'export default 1');
    execSync('git add -A && git commit -m "update a"', { cwd: dir, stdio: 'pipe' });

    const result = run({ cwd: dir, paths: ['packages/a', 'packages/b'] });
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.results[0].status, 'ok'); // a bumped
    assert.strictEqual(result.results[1].status, 'unchanged'); // b unchanged
  });

  it('allows explicit base branch', () => {
    dir = setupRepo('develop');
    execSync('git checkout -b feature', { cwd: dir, stdio: 'pipe' });
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'test-pkg', version: '1.1.0' }));
    execSync('git add -A && git commit -m "bump"', { cwd: dir, stdio: 'pipe' });

    const result = run({ cwd: dir, baseBranch: 'develop' });
    assert.strictEqual(result.ok, true);
  });
});
