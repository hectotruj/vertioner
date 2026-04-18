# Vertioner

[![Tests](https://github.com/hectotruj/vertioner/actions/workflows/test.yml/badge.svg)](https://github.com/hectotruj/vertioner/actions/workflows/test.yml)

Verify that packages with changes have bumped their `package.json` version before merging. Zero dependencies. Supports monorepos.

## Install

```sh
npm install -g vertioner
```

## Usage

```sh
# Check the current directory
vertioner

# Check specific packages (monorepo)
vertioner packages/foo packages/bar

# Compare against a specific base branch
vertioner --base develop

# Strict mode — require version to be strictly greater (not just different)
vertioner --strict
```

## Options

| Flag | Short | Description |
|------|-------|-------------|
| `--base <branch>` | `-b` | Base branch to compare against (auto-detects `main`/`master`) |
| `--strict` | `-s` | Require the version to be semver-greater, not just different |
| `--help` | `-h` | Show help |

## Exit codes

- `0` — all checked packages have bumped versions (or are unchanged)
- `1` — at least one package needs a version bump

## Using in CI

```yaml
# GitHub Actions example
- uses: actions/checkout@v4
  with:
    fetch-depth: 0  # full history needed for branch comparison
- run: npx vertioner --strict
```