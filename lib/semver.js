const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.]+))?(?:\+([a-zA-Z0-9.]+))?$/;

export function parse(version) {
  const m = SEMVER_RE.exec(version);
  if (!m) return null;
  return {
    major: Number(m[1]),
    minor: Number(m[2]),
    patch: Number(m[3]),
    prerelease: m[4] ?? null,
    build: m[5] ?? null,
  };
}

/**
 * Returns true if `current` is strictly greater than `base`.
 */
export function isGreater(current, base) {
  const a = parse(current);
  const b = parse(base);
  if (!a || !b) return false;

  if (a.major !== b.major) return a.major > b.major;
  if (a.minor !== b.minor) return a.minor > b.minor;
  return a.patch > b.patch;
}
