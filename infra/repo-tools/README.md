# @wdio/repo-tools

Internal helpers for working on this monorepo. Not published to npm.

Prefer the root `pnpm run` entry points:

| Command | Purpose |
|---------|---------|
| `pnpm run docs:list` | Path + title index of contributor docs |
| `pnpm run test:package <name>` | Vitest for one workspace package |
| `pnpm run changed:lanes` | Classify a diff with the same filters as CI |
| `pnpm run test:changed` | Run the local proof for those lanes |
| `pnpm run test:smoke:list` | Named smoke suites without launching WDIO |
