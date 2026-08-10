# Definition of Usable — `@wdio/deepagent`

> The checklist that deems the DeepAgent harness **usable**. Every criterion is
> tagged `[automated]` (covered by a test in `tests/`, run via the repo's
> vitest suite) or `[manual]` (needs a real model key / device). A release
> qualifies as usable when all `[automated]` criteria are green and the
> `[manual]` smoke checklist has been executed once on Linux and macOS.

## 1. Functional — the documented flows actually work

- **[automated]** `init` writes a `wdio.conf.ts` that loads through the wdio
  config parser and contains a valid `deepagent` block.
  → `tests/config.test.ts` ("quick start (init → repl config discovery)").
- **[automated]** `repl`/`run`/`diagnose`/`mcp` with **no `--config`** auto-
  discover `wdio.conf.{ts,js,mjs,cjs}` in the cwd and resolve the model from
  the `deepagent` block (only the API key env var is needed).
  → `tests/config.test.ts` (findDefaultConfigPath, quick-start regression).
- **[automated]** `run "<prompt>"` routes argv → flags → config → harness →
  mission and sets exit code 0 on success / 1 on failure.
  → `tests/cli-routing.test.ts`.
- **[automated]** The harness exposes traversal (MCP), trace and knowledge-base
  tools, and an agent turn executes a traversal tool over the wire.
  → `tests/agent.test.ts` (smoke), `tests/cli.test.ts` (processTurn).
- **[manual]** `wdio-deepagent repl` with a real key: streams tool calls and
  replies, exits cleanly on `exit`, shuts the MCP server down.
- **[automated]** `diagnose --heal propose` works **without any model** (read-only
  diagnosis builds no agent); agent modes still require a model.
  → `tests/config.test.ts` ("modelOptional allows a model-free config…").
- **[manual]** `wdio-deepagent diagnose <trace.zip> --spec <path>`: ingests,
  reproduces (bounded), diffs old/new, and heals per mode (`ask` prompts,
  `propose` emits diffs read-only, `auto` writes spec/page objects only).
- **[manual]** `wdio-deepagent mcp` serves the agent as an MCP server a client
  (Claude Desktop / Claude Code) can connect to.

## 2. Safety — the agent cannot touch what it must not

- **[automated]** In every heal mode the agent is confined to `projectRoot`:
  `read_file`/`write_file` outside the root are denied, inside are allowed and
  land on the **real** filesystem (backend is `FilesystemBackend`, not the
  in-memory sandbox).
  → `tests/agent.test.ts` ("filesystem scope enforcement (real backend)").
- **[automated]** `propose` mode denies writes **inside** the project root too
  (read-only healing).
  → `tests/agent.test.ts` ("propose mode denies writes inside the project root").
- **[automated]** Permission rules are explicit allow+deny per mode, relative /
  trailing-slash roots normalize to absolute globs, and `ask` gates
  `write_file`/`edit_file` via interrupts.
  → `tests/agent.test.ts` (permissionsForHeal / interruptsForHeal).
- **[automated]** The filesystem scope knob in the config (`deepagent
  .permissions.projectRoot`) is actually applied to the harness.
  → `tests/config.test.ts` (parseDeepAgentConfig), `tests/cli-routing.test.ts`.
- **[automated]** Reproduce refuses `--spec` paths that resolve outside the
  project root.
  → `tests/reproduce.test.ts` ("refuses a spec that resolves outside…").
- **[manual]** With a real key in `auto` mode, instruct the agent to read
  `~/.ssh/id_rsa` or write to `/tmp`; both must fail with a permission error.
- **[manual]** No shell execution exists: the harness backend exposes no
  `execute` tool (FilesystemBackend), so permission rules are the sole
  boundary.

## 3. Robustness — it cannot hang, OOM, or drift

- **[automated]** A hung `wdio run` reproduction is killed after the timeout
  (default 10 min, exit code 124, `timedOut` flag) instead of hanging CI.
  → `tests/reproduce.test.ts` ("kills a hung run after the timeout").
- **[automated]** A crafted `trace.zip` is rejected before memory exhaustion:
  entry-count cap, per-entry declared-size cap, total decompressed-size cap.
  → `tests/trace.test.ts` (3 cap tests).
- **[automated]** The spawned `@wdio/mcp` server is the locally installed
  (pinned) binary, not an unpinned `npx @latest`, so the tool surface cannot
  drift; explicit user `mcp.command` config is honored.
  → `tests/mcp.test.ts` (resolveLocalMcpBin / resolveMcpSpawn).

## 4. Platform — Linux + macOS, Windows documented

- **[automated]** Husky hooks are POSIX-portable (no GNU-only `xargs -r`, no
  unconditional NVM sourcing) so commits work on macOS and Linux.
  → verified by `sh -n` + staged-lint-error run (pre-commit blocks).
- **[manual]** Full smoke (init → repl → run → diagnose) on macOS.
- **[documented]** Windows: `npx` stdio spawn needs a `.cmd` wrapper; set
  `deepagent.mcp.command` (see README "Platform notes"). Known limitation.

## 5. Hygiene & packaging — it can ship

- **[automated]** `wdio deepagent` command is registered in wdio-cli with a
  lazy handler (core CLI stays free of langchain deps).
  → `packages/wdio-cli/tests/commands/index.test.ts`.
- **[automated]** eslint, typecheck and the vitest suite are green.
- **[verified]** The package builds through the monorepo compiler for all
  export entries (`./`, `./model`, `./agent`, `./config`); `@types/*` live in
  `devDependencies`; no unused dependencies; lockfile matches package.json.
- **[manual]** `npm pack` / publish dry-run produces a package whose `bin`
  (`wdio-deepagent`) and exports resolve from a clean consumer project.

## 6. Docs — behavior matches claims

- **[manual]** README quick start (`export OPENROUTER_API_KEY` → `init` →
  `repl`) works verbatim.
- **[manual]** `wdio-deepagent help` (USAGE) matches actual CLI behavior,
  including "default: wdio.conf.ts in cwd".
- **[manual]** e2e/wdio/deepagent/README.md's "Plan-vs-reality
  deviations" table matches shipped behavior.
