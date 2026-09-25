# AGENTS.md

This is the agent entry point for the WebdriverIO monorepo. Humans should start
with [CONTRIBUTING.md](CONTRIBUTING.md). Agents should read this file first,
then the nearest scoped `AGENTS.md` in the tree they are changing.

Do not copy policy into tool-specific files. Cursor, Claude Code, Copilot, and
Codex should follow this document. Tool adapters stay thin and point here.

## Repo map

pnpm + Lerna workspace. Source lives in `packages/*/src`. Runtime and tests
consume compiled `packages/*/build` (and CJS under `packages/*/cjs`).

```
packages/wdio-protocols  protocol command specs (source of generated types)
packages/webdriver       raw WebDriver / BiDi / Appium client
packages/webdriverio     user-facing `$`, element/browser commands
packages/@wdio/cli       testrunner CLI + launcher
packages/@wdio/runner    worker that runs one capability
packages/@wdio/local-runner
packages/@wdio/*-framework | *-reporter | *-service
infra/compiler           esbuild + protocol type generation
infra/repo-tools         docs index, scoped tests, CI lane helpers
scripts/                 docs generation, BiDi CDDL, release helpers
tests/                   smoke suites (mock driver, no real browser)
e2e/                     real-browser / component / display-server suites
website/                 Docusaurus site (many pages are generated)
```

Architecture sketches: [High-level overview](website/docs/flowcharts/HighLevelOverview.md),
[test execution](website/docs/flowcharts/TestExecution.md),
[worker creation](website/docs/flowcharts/CreateLocalWorkerProcess.md),
[CLI commands](website/docs/flowcharts/WDIOCommands.md),
[type generation](website/docs/flowcharts/TypeGeneration.md).
Ownership: [.github/OWNERSHIP.md](.github/OWNERSHIP.md).

## Setup

Use the Node version in [`.nvmrc`](.nvmrc) (currently 24) and the pnpm version
pinned in `package.json#packageManager`. Do not switch the package manager.

```sh
pnpm install
pnpm run setup          # clean + generate + compile all packages
```

Cloud / Codespaces agents: run [`.agents/setup`](.agents/setup) once, then
[`.agents/resume`](.agents/resume) to confirm the toolchain before editing.

Edits to `src/` are invisible to tests until the compiler runs:

```sh
pnpm run dev                      # watch all packages
pnpm run dev webdriverio          # watch one package (dir or npm name)
```

## Do not hand-edit

| Path | Owner |
|------|--------|
| `packages/*/build`, `packages/*/cjs` | `@wdio/compiler` |
| `packages/wdio-protocols/src/commands` | compiler type-generation plugin |
| `packages/webdriver/src/bidi/` generated files | `pnpm run generate:bidi` |
| `website/docs/api/**` (except a few hand-written pages) | `pnpm run docs:generate` |
| `website/docs/_*.md`, `website/sidebars.json` | docs generation |
| `CHANGELOG.md` | release process |

Protocol *specs* are hand-authored in `packages/wdio-protocols/src/protocols/`.
The generated command types next to them are not.

## Test selection

Prefer the smallest proof that covers the touched contract. Do not start with
`pnpm test` or `pnpm run ci` — those run the full unit + smoke + component
(+ e2e) pipeline and waste time.

| Change | Minimum local proof |
|--------|---------------------|
| Mixed / unsure | `pnpm run test:changed --dry-run` then `pnpm run test:changed` |
| One command / util in a package | `pnpm run test:package <name>` or `npx vitest packages/<pkg>/tests/.../<file>.test.ts` |
| Public command / interface shape | package unit tests **and** `pnpm run test:typings` (or the matching `test:typings:*`) |
| Testrunner, CLI, reporter, service, framework wiring | `pnpm run test:smoke:list` then `pnpm run test:smoke <suite>` (see [tests/AGENTS.md](tests/AGENTS.md)) |
| `@wdio/browser-runner` / `e2e/browser-runner` | `pnpm run test:component` |
| `@wdio/display-server` / display-server e2e | `pnpm run test:e2e:display-server` |
| Docs-only (`website/docs`, JSDoc, package README) | `pnpm run docs:list` then `pnpm run docs:generate` |
| Root CI / toolchain files | treat as `run-all`; run `pnpm run test:local` |

Unit tests mirror source: `src/commands/element/getCSSProperty.ts` →
`tests/commands/element/getCSSProperty.test.ts`. Mock other packages; do not
spin up a browser in unit tests.

`pnpm run changed:lanes --json` classifies a diff with the same filters as
[`.github/workflows/test.yml`](.github/workflows/test.yml). `pnpm run test:changed`
runs the local equivalent (package unit tests + typings; pass `--smoke` or
`--e2e` for those lanes). Pushes to `main` still run the full matrix.

## Package ownership

Put a change in the existing owner. Do not add a parallel helper in another
package to work around a missing export — extend the owner and update callers.

| Concern | Owner |
|---------|--------|
| Shared TS types (capabilities, options) | `@wdio/types` |
| Protocol command specs | `@wdio/protocols` |
| HTTP / BiDi transport | `webdriver` |
| User-facing browser/element API | `webdriverio` |
| Config parsing | `@wdio/config` |
| Shared utils | `@wdio/utils` |
| Reporter base class | `@wdio/reporter` |
| Worker / hooks | `@wdio/runner` |
| CLI / launcher | `@wdio/cli` |
| Build + type generation | `infra/compiler` |
| Docs index / scoped tests / CI lanes | `infra/repo-tools` |

New packages: `pnpm run create`. Do not invent a package layout by hand.

## Docs

User docs come from several sources. Update the source, then regenerate:

- Guidelines: `website/docs/**/*.md`
- Service / reporter pages: that package's `README.md`
- Protocol API: `@wdio/protocols` specs
- WDIO command API: JSDoc on the command implementation
- Third-party plugins: `scripts/docs-generation/3rd-party/`

`pnpm run docs:list` prints a path + title index. Config examples are copied
through the repo; search for every occurrence before renaming a key.

## Working agreement

- Inspect `git status -sb` before editing. Do not switch branches or rewrite
  history that another process is using.
- Follow through on the requested change. A plan is a checkpoint, not done.
- Resolve routine choices; ask only when the request cannot decide a
  user-visible or breaking contract.
- Keep PRs to one topic. Conventional Commits (`fix(webdriverio): ...`).
- Stage only intended files. Do not commit `node_modules`, build output, or
  generated docs.
- Tests must fail on the original defect. Do not hide flakes with retries,
  longer timeouts, or weaker assertions — fix the cause.
- UI / docs-site visual changes need a before/after screenshot in the PR.
- American English. Match existing code style; do not reformat unrelated files.

## Read when relevant

Read the matching guide in full before editing that tree.

- **Contributor / GitHub process:** [CONTRIBUTING.md](CONTRIBUTING.md)
- **Product direction:** [ROADMAP.md](ROADMAP.md)
- **webdriverio commands:** [packages/webdriverio/AGENTS.md](packages/webdriverio/AGENTS.md)
- **webdriver client / BiDi:** [packages/webdriver/AGENTS.md](packages/webdriver/AGENTS.md)
- **Protocol specs:** [packages/wdio-protocols/AGENTS.md](packages/wdio-protocols/AGENTS.md)
- **CLI / launcher:** [packages/wdio-cli/AGENTS.md](packages/wdio-cli/AGENTS.md)
- **Reporters:** [packages/wdio-reporter/AGENTS.md](packages/wdio-reporter/AGENTS.md)
- **Compiler / types:** [infra/compiler/AGENTS.md](infra/compiler/AGENTS.md)
- **Repo helpers:** [infra/repo-tools/AGENTS.md](infra/repo-tools/AGENTS.md)
- **Scripts:** [scripts/AGENTS.md](scripts/AGENTS.md)
- **Smoke tests:** [tests/AGENTS.md](tests/AGENTS.md)
- **E2E / component:** [e2e/AGENTS.md](e2e/AGENTS.md)
- **Docs site:** [website/AGENTS.md](website/AGENTS.md)
- **Testing skill:** [.agents/skills/wdio-testing/SKILL.md](.agents/skills/wdio-testing/SKILL.md)
- **Hot-path perf skill:** [.agents/skills/wdio-perf/SKILL.md](.agents/skills/wdio-perf/SKILL.md)
- **Ownership map:** [.github/OWNERSHIP.md](.github/OWNERSHIP.md)
- **Docs skill:** [.agents/skills/wdio-docs/SKILL.md](.agents/skills/wdio-docs/SKILL.md)
