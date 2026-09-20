# Proposal: Agent-oriented development infrastructure

**Status:** Phase 1 and 2 implemented on `v10`
**Related:** this PR

WebdriverIO already has excellent human contributor docs. It does not yet have
the structured, executable context that coding agents need to move quickly
without burning CI time or violating package boundaries.

This proposal is based on a close reading of
[openclaw/openclaw](https://github.com/openclaw/openclaw), a TypeScript
monorepo that treats agent instructions as first-class infrastructure.

## What OpenClaw actually does

OpenClaw's agent stack is four layers. The interesting part is not "more AI" —
it is **structured context at the right depth**, plus **scope-aware commands**.

### 1. Hierarchical `AGENTS.md`

A short root file owns behavior and routes to ~30 scoped `AGENTS.md` files
next to the code they govern (plugins, gateway, channels, UI, scripts, tests).
Root answers "how do I behave?". Scoped files answer "what can I touch here?".

They keep one canonical policy and refuse to duplicate it into CLAUDE.md /
Cursor rules / Copilot instructions. Tool adapters stay thin.

### 2. Executable workflows (`.agents/`)

- `.agents/setup` and `.agents/resume` pin the same Node/pnpm contract as CI.
- `.agents/skills/*/SKILL.md` are composable playbooks with a "when to use"
  trigger, decision tables, and links to the owning docs.
- Skills that must be deterministic ship a script (`autoreview`, test lanes).

They started useful with a handful of skills. The 40+ catalog is a later
consequence of running the project *with* agents, not a day-one requirement.

### 3. Scope-aware tooling

The highest-leverage commands:

| Command | Purpose |
|---------|---------|
| `pnpm docs:list` | Index every doc with a one-line summary and "read when" hint |
| `pnpm changed:lanes --json` | Classify a diff into test/lint/typecheck lanes |
| `pnpm check:changed` | Run only the matching lanes |
| `pnpm test:extension <id>` | One plugin's tests without the full suite |

Agents default to `O(changed)` work instead of `O(repo)`.

### 4. Agent-fillable GitHub process

- PR template asks for **problem, user impact, why, evidence** — not just a
  checklist.
- CONTRIBUTING has a routing table (bug vs docs vs support vs feature).
- A dedicated review-flow doc tells agents how to interpret bot / maintainer
  feedback.
- CODEOWNERS and a security-review policy make "who decides" machine-readable.

They also run custom bots (Barnacle triage, ClawSweeper review) and an
isolated-execution harness (Crabbox) for untrusted fork code. Those are
expensive and only pay off at very high PR volume.

### What they deliberately split

| Doc | Audience | Job |
|-----|----------|-----|
| `VISION.md` | everyone | product scope |
| `CONTRIBUTING.md` | humans + agents | GitHub etiquette, routing |
| `AGENTS.md` | agents first | execution policy, test selection, authority |

## Where WebdriverIO stands today

| Area | Today | Agent friction |
|------|--------|----------------|
| Human docs | Strong `CONTRIBUTING.md`, flowcharts, per-package READMEs | Long prose; agents re-read 450 lines to find one command |
| Agent docs | None | Every session rediscovers compile-first, generated types, smoke vs unit |
| Setup | Gitpod uses pnpm; Codespaces still uses npm + Node 18 | Agents boot on the wrong toolchain |
| Tests | Vitest paths documented in prose; `pnpm test` runs everything | Agents over-test or skip typings / smoke |
| CI | Excellent path filters in `test.yml` (~25 vs ~70 jobs) | No local equivalent (`test:changed`, `test:package`) |
| Ownership | GOVERNANCE says "ping the committer who owns the area" | No CODEOWNERS, no package map an agent can load |
| PR template | Change-type checklist | No "how I tested" / evidence field |
| Generated code | Protocols, BiDi, API docs, `build/` | Easy to hand-edit and fail CI |

Typical wasted turns we already see in agent PRs:

1. Edit `src/`, run tests, wonder why nothing changed (no compile).
2. Hand-edit `packages/wdio-protocols/src/commands` or generated API docs.
3. Run `pnpm test` or `pnpm run ci` for a one-file reporter fix.
4. Miss `tests/typings/**` after adding a command.
5. Change a config key in one example and leave the other 15 copies.

## Recommendation: adopt the pattern, not the product

Copy OpenClaw's *shape*. Do not copy Crabbox, ClawSweeper, maturity
scorecards, or a 40-skill catalog. WebdriverIO is a test framework, not an
agent runtime; our agent infra should stay small and boring.

### Phase 1 — implemented (cheap, immediately useful)

1. **Root `AGENTS.md`** with a repo map, compile-first rule, test decision
   table, generated-file ban, and a routing index.
2. **Scoped `AGENTS.md`** on the hottest trees: `webdriverio`, `webdriver`,
   `wdio-protocols`, `wdio-cli`, `wdio-reporter`, `infra/compiler`,
   `scripts`, `tests`, `e2e`, `website`.
3. **`.agents/setup` + `.agents/resume`** so cloud agents match CI's Node /
   pnpm contract.
4. **Two skills:** `wdio-testing` (which suite to run) and `wdio-docs`
   (which source to edit).
5. **`pnpm run docs:list`** and **`pnpm run test:package <name>`** so agents
   do not have to invent discovery commands.
6. **Thin Copilot / Claude adapters** that point at `AGENTS.md` instead of
   forking policy.
7. **PR template** gains a "How you tested" field.
8. **CONTRIBUTING** points agents at `AGENTS.md` and keeps owning human
   process.

Expected effect: an agent fixing `getCSSProperty` reads ~200 lines instead of
the whole CONTRIBUTING + CI YAML, compiles the right package, and runs one
Vitest file plus typings.

### Phase 2 — implemented in this PR

| Item | What landed |
|------|-------------|
| `pnpm run test:changed` / `changed:lanes` | Same path filters as `test.yml`; `--dry-run`, `--smoke`, `--e2e` |
| Align Codespaces with pnpm + Node 24 | `.devcontainer` uses the Node 24 image, Corepack/pnpm, and `pnpm` scripts. Gitpod unit-coverage task no longer calls `npm`. |
| `CODEOWNERS` + `OWNERSHIP.md` | Review still routes to `@webdriverio/project-committers`; the map is for agents. |
| `pnpm run test:smoke:list` | Named suites without launching WDIO. |
| Type generation flowchart | `website/docs/flowcharts/TypeGeneration.md` |

Package README contributor footers were **not** added: those READMEs are published as user docs. Contributor commands stay in `AGENTS.md` / `OWNERSHIP.md`.

### Phase 3 — only if agent PR volume justifies it

- Deterministic PR triage (empty body, missing repro, support-on-GitHub).
- An optional maintainer review skill, not a custom review bot.
- Isolated execution of untrusted fork code.
- A docs-index `read_when` frontmatter convention like OpenClaw's `docs:list`.

Do **not** adopt: Crabbox, ClawSweeper, Barnacle, a skill-sync vendor repo,
`taxonomy.yaml` maturity scorecards, or security-review command comments —
unless we later have the maintainer time to operate them.

## Design rules for anything we add

1. **One owner.** `AGENTS.md` is canonical. Copilot / Claude / Cursor files
   are pointers, not copies.
2. **Scope over slogans.** A 20-line file next to `wdio-protocols` beats
   another paragraph in CONTRIBUTING.
3. **Commands beat prose.** If a rule is "run X for Y", expose `pnpm run X`.
4. **Keep it small.** New scoped files only where agents repeatedly violate a
   boundary. Skills only for workflows with a decision tree.
5. **Humans stay first.** CONTRIBUTING remains the contributor guide. Agent
   files must not invent process that humans are not expected to follow.

## Success criteria

Phase 1 is working when a new agent session can, without maintainer coaching:

- set up the repo with the CI toolchain
- pick the owning package for a command / reporter / protocol change
- compile that package
- run the matching unit (and typings / smoke) proof
- avoid editing generated artifacts
- open a PR that states how it was tested
