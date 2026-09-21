# GitHub Copilot — WebdriverIO

Follow [AGENTS.md](../../AGENTS.md). That file is the canonical agent guide.
Do not add policy here.

- Package manager: **pnpm** (see `package.json#packageManager`). Node: `.nvmrc`.
- Compile before tests: `pnpm run setup` or `pnpm run dev <package>`.
- Smallest tests: `pnpm run test:package <name>` or a single Vitest file.
- Do not hand-edit `packages/*/build`, `packages/wdio-protocols/src/commands`,
  or generated `website/docs/api` pages.
