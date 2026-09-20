# Agent toolchain

- [`setup`](setup) — install and compile so this checkout matches CI.
- [`resume`](resume) — fail fast if Node, pnpm, or `packages/*/build` are missing.
- [`skills/`](skills) — optional playbooks. Read `SKILL.md` only when the
  trigger matches; do not load every skill into context.

Canonical policy lives in [`/AGENTS.md`](../AGENTS.md). Do not fork it here.
