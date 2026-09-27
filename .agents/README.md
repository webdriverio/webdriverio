# Agent toolchain

- [`setup`](setup) — install and compile so this checkout matches CI. Re-runs
  after `HEAD` changes so a reused checkout does not keep stale `node_modules`
  or `packages/*/build`.
- [`resume`](resume) — fail fast if Node, pnpm, `packages/*/build`, or the
  setup stamp are missing or stale.
- [`skills/`](skills) — playbooks. Read `SKILL.md` only when the trigger
  matches; do not load every skill into context. After a feature or bug fix,
  follow [`skills/verify-webdriverio/SKILL.md`](skills/verify-webdriverio/SKILL.md)
  before claiming the work is done.

Canonical policy lives in [`/AGENTS.md`](../AGENTS.md). Do not fork it here.
