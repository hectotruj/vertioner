import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parse, isGreater } from '../lib/semver.js';

describe('semver.parse', () => {
  it('parses a simple version', () => {
    assert.deepStrictEqual(parse('1.2.3'), {
      major: 1, minor: 2, patch: 3, prerelease: null, build: null,
    });
  });

  it('parses a version with prerelease', () => {
    const v = parse('1.0.0-beta.1');
    assert.strictEqual(v.major, 1);
    assert.strictEqual(v.prerelease, 'beta.1');
  });

  it('parses a version with build metadata', () => {
    const v = parse('2.0.0+build.42');
    assert.strictEqual(v.build, 'build.42');
  });

  it('returns null for invalid versions', () => {
    assert.strictEqual(parse('not-a-version'), null);
    assert.strictEqual(parse(''), null);
    assert.strictEqual(parse('1.2'), null);
  });
});

describe('semver.isGreater', () => {
  it('detects major bump', () => {
    assert.strictEqual(isGreater('2.0.0', '1.9.9'), true);
  });

  it('detects minor bump', () => {
    assert.strictEqual(isGreater('1.3.0', '1.2.9'), true);
  });

  it('detects patch bump', () => {
    assert.strictEqual(isGreater('1.0.1', '1.0.0'), true);
  });

  it('returns false for same version', () => {
    assert.strictEqual(isGreater('1.0.0', '1.0.0'), false);
  });

  it('returns false for lower version', () => {
    assert.strictEqual(isGreater('1.0.0', '2.0.0'), false);
  });

  it('returns false for invalid input', () => {
    assert.strictEqual(isGreater('bad', '1.0.0'), false);
  });
});
