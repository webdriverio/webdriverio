# DeepAgent e2e test plan

End-to-end cases for `@wdio/deepagent`, runnable and **evaluable against**:
every case has concrete setup, steps, and pass/fail assertions. The suite
is deterministic — no real LLM, no external network (except the optional
T0 tier) — via `FakeToolCallingModel` (from `langchain`) driving the real
harness, the real `@wdio/mcp` stdio server, and a real Chrome process.

## Placement & runner

- The suite is its own package, `e2e/wdio/deepagent` (monorepo `e2e/**`
  workspace glob), so it is excluded from the root unit suite
  (`packages/**/*.test.ts` include in `vitest.config.ts` + explicit
  `e2e/wdio/deepagent/**` exclude) and runs on its own config with its own
  deps:
  - `e2e/wdio/deepagent/vitest.config.ts` — `include: tests/**`,
    `testTimeout` 3 min, `retry: 1` (Chrome-crash flake policy).
  - Per-tier scripts: `pnpm --filter wdio-deepagent-e2e test:live-llm|test:harness|test:browser|test:cli|test:wdio-cli`
    (full suite via `test`).
- Shared fixtures: `e2e/wdio/deepagent/fixtures/` —
  - `mcp-server.mjs` — fixture MCP server that appends every call to
    `$FIXTURE_LOG` (call-order assertions)
  - `page.html` + `server.mjs` (tiny `node:http` static server, T2 target,
    no external network)
  - `trace-builder.ts` (adm-zip layout from `tests/trace.test.ts:5-25`)
  - `wdio.conf.ts` + `fake-wdio.mjs` for reproduce-path cases (pattern from
    `packages/wdio-deepagent/tests/fixtures/`)
- Chrome gating: `describe.runIf(chromeAvailable)` where `chromeAvailable`
  is a **live CDP probe** (binary on PATH + `launch_chrome`-style spawn with
  a random remote-debugging port, polling `/json/version` up to 12 s).
  `launch_chrome` is not headless, so a display-less environment would pass
  a binary-only gate and then flake — the probe self-skips it.
  No chromedriver — `@wdio/mcp` launches Chrome via remote debugging
  (`launch_chrome` tool, temp profile per call).
- Deterministic model: `FakeToolCallingModel({ toolCalls: [[...]],
  toolStyle: 'openai' })` injected via `modelOverride` (existing harness
  hook, `src/agent.ts:37`).
- Chrome teardown is a process-group SIGKILL scoped to each case's own CDP
  port (zygote/gpu/utility children die with the browser; no machine-wide
  chrome sweep — that would kill other suites' Chrome).
- Flake policy: each case wrapped with a hard timeout (60 s); Chrome
  crash-class failures retried once (vitest `retry: 1`), then failed.
- Harness prerequisites discovered while building the suite (shipped in
  `src/agent.ts`): `ask`-mode interrupts and multi-turn memory need an
  in-memory checkpointer (`MemorySaver`) plus a stable thread id — the
  harness now wires both (`checkpointer` + `.withConfig({ configurable:
  { thread_id: 'default' } })`). Without it, `interrupt()` throws
  `GraphValueError: No checkpointer set` on every gated write and REPL
  turns do not share state.

## Documented deviations (plan assumptions vs shipped behavior)

Verified empirically while building the suite; cases assert the shipped
behavior, not the plan's assumptions:

- **E2E-06 exit-code contract is error-based, not text-based.** `run.ts`
  has no `"FAILED:"` reply contract — `runMission` exits 1 only when the
  turn throws. Through the agent loop, model errors and unknown tools are
  converted to reply content (exit 0, tracked gap, asserted in E2E-06b). A
  **transport crash** (`fixture_crash` exits the MCP server mid-call)
  throws the turn and surfaces as exit 1 (E2E-06c). CLI-level exit-1 paths:
  no model (E2E-14), unknown command (E2E-13), failing trace (E2E-16).
- **E2E-05: auto mode has no config-file deny rule.** `permissionsForHeal`
  scopes writes to `projectRoot` only; a root-scoped `wdio.conf.ts` write
  is allowed. Open product question: should `auto` protect config files?
- **E2E-16 diagnose exit code.** `index.ts` exits `1` when
  `report.failedActions > 0` — the case asserts that contract (a failing
  trace exits 1 with `agentRan: false`), not the plan's "exit 0".
- **E2E-08 screenshot.** `get_screenshot` returns base64 in the tool
  result (no file) — the case asserts the decoded bytes are > 0.
- **E2E-11 Chrome lifecycle.** `launch_chrome` spawns a detached Chrome
  that is documented to outlive the MCP server; the suite guarantees no
  orphans by killing debug-port processes in teardown, and asserts
  `close()` resolves (MCP child transport closed) without hanging.
- **`execute` tool is present but inert.** deepagents exposes `execute`
  in the tool surface; the harness backend is not a SandboxBackend, so it
  returns "Execution not available" — asserted in E2E-02 (no shell hole).
- **T0 found and fixed a real reply-extraction bug.** Anthropic-style
  models return content as block arrays (`[{type:'thinking'}, {type:'text',
  text}]`); `processTurn`/`runDiagnosis` only accepted string content, so
  a real-LLM mission printed an empty reply. Fixed with
  `extractAgentReply` (`src/commands/turn.ts`, shared with
  `src/heal/engine.ts`, unit-tested in `tests/turn.test.ts`).
- **The manual heal eval exposed a real-trace parsing gap, fixed.**
  `parseTraceArchive` only understood the fixture format (`id`/`action`/
  `ts`/string `error`); current `@wdio/devtools-service` v8 traces use
  `callId`/`params`/`startTime`/`endTime` and `error.message` objects,
  plus interleave `screencast-frame`/`network` records. Real traces parsed
  to nameless actions with `failedActions: 0` — the failing click never
  reached the report (the agent healed anyway by reading snapshots +
  spec). The reader now accepts both shapes, filters non-action records,
  and derives names from `apiName`/`method` (unit-tested). Verified
  end-to-end: real failing spec → trace → diagnose (failedActions: 1) →
  spec healed by real LLM → re-run passes.
- **`mcp: null` — heal without any browser tooling (E2E-07b/16b).** The
  harness + CLI accept `deepagent.mcp: null`, running the agent with fs +
  trace + knowledge-base tools only. Rationale: T0 finding #3 (the 31-tool
  browser surface makes live models roam) and the local-LLM / headless-heal
  use case — the heal works from the spec + trace transcript with no browser
  tooling.

## Tier T1 — harness e2e, no browser, CI-always

| ID | Case | Steps | Pass criteria |
|----|------|-------|---------------|
| E2E-01 | Mission executes scripted traversal | Harness (fake model + fixture MCP loopback) runs `runMission("explore the app")`; model script: `fixture_navigate` → `fixture_get_title` → reply | Fixture MCP server records the exact call order; final reply matches scripted text; `runMission` resolves exit 0 |
| E2E-02 | fs toolchain + scope enforcement | Temp projectRoot; model script: `write_file` (in-root) → `write_file` (outside root) | In-root file exists with exact content; outside-root call surfaces permission error to the agent (no throw, no file); no stray writes anywhere |
| E2E-03 | heal `ask` — interrupt gating | Fixture `trace.zip` → `runDiagnosis` with fake-wdio runner (exit 1) → model calls `edit_file` | First `edit_file` fires the `interrupt_on` gate (no file change until approval); after approval file changed; JSON report `heal` reflects the fix |
| E2E-04 | heal `propose` — read-only | Same trace; model calls `edit_file` | Permission denial surfaces to agent; file unchanged; agent emits diff text; report `agentRan: true`, no writes (verify fs mtime) |
| E2E-05 | heal `auto` — unattended, config protected | Same trace; model writes spec fix + attempts config write | Spec file changed; `wdio.conf.*` untouched (deny rule); report exit per failed-action count |
| E2E-06 | `runMission` exit-code contract | Model script replies success vs "FAILED: ..." | Success → exit 0; failure text → exit 1 (matches `run` CLI contract) |
| E2E-07 | Multi-turn memory | Two `processTurn` calls on one agent | Second turn's tool calls reflect first turn's todo state (todo list persisted across turns) |

## Tier T2 — real browser via @wdio/mcp (gated on Chrome)

Harness: fake model + real `WdiMcpClient` (spawns `@wdio/mcp` stdio server)
+ real Chrome (temp profile). Target: local static page served by the
fixture server.

| ID | Case | Steps | Pass criteria |
|----|------|-------|---------------|
| E2E-08 | Launch + navigate + title | Script: `launch_chrome` → `start_session` (attach) → `navigate` → `get title` → `screenshot` | Chrome process alive during run; title matches fixture `<title>`; screenshot file exists, > 0 bytes |
| E2E-09 | Interact + assert state | Script: navigate → find element → click → title read-back | Final title reflects the click (fixture page swaps title on click) |
| E2E-10 | Cookies + script execution | Script: `set_cookie` → read back; `execute script` returns value | Cookie value round-trips; script return value matches |
| E2E-11 | Clean shutdown | `harness.close()` after E2E-08 run | No orphan Chrome process with the temp profile remains (pgrep by profile path); MCP child exited |

## Tier T3 — CLI process e2e (spawn real bin, temp cwd)

Spawn `node packages/wdio-deepagent/bin/wdio-deepagent.js` (built pkg) with
controlled env. Timeout-guarded; assert on exit code + stdout/stderr.

| ID | Case | Steps | Pass criteria |
|----|------|-------|---------------|
| E2E-12 | `help` | Run `help` | Exit 0; usage lists `repl`, `run`, `init`, `diagnose`, `mcp` |
| E2E-13 | Unknown command | Run `bogus` | Exit 1; stderr contains `Unknown command` |
| E2E-14 | `run` without model | `run "x"` in dir with no config/key | Exit 1; stderr contains the BYOK hint (`set OPENROUTER_API_KEY` / `DEFAULT_MODEL_HINT`); returns in < 10 s (no hang) |
| E2E-15 | `init` non-TTY regression | Pipe answers into `init` | Exit 1; stderr `interactive terminal`; no `wdio.conf.ts` written |
| E2E-16 | `diagnose --heal propose` ingest-only | Fixture trace.zip + `--heal propose` | Exit 0; stdout JSON has `agentRan: false`, `actionCount > 0`; no files touched |
| E2E-17 | `run` with a real model (T0-03) | `DEEPAGENT_MODEL=anthropic:<model>` + BYOK env; temp project with minimal config | Exit 0; target file written (manual tier — no fake-model hook in the product) |

## Tier T4 — wdio-cli alias (gate: wdio-cli built)

| ID | Case | Steps | Pass criteria |
|----|------|-------|---------------|
| E2E-18 | `wdio deepagent help` | Spawn `node packages/wdio-cli/build/index.js deepagent help` (or bin) | Exit 0; usage text; proves lazy registration + optional dep resolution |
| E2E-19 | `wdio deepagent run` with package absent | Simulate missing optional dep (spawn with `@wdio/deepagent` unresolvable via temp node_modules layout) | Exit 1; stderr `npm install @wdio/deepagent` hint — proves the optional-dependency guard |

## Tier T0 — real-LLM smoke (manual, not CI)

| ID | Case | Steps | Pass criteria |
|----|------|-------|---------------|
| E2E-20 | Real mission (BYOK) | `ANTHROPIC_API_KEY=… ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic wdio-deepagent run "launch_chrome … start_session attach … navigate <fixture page> … execute_script 'return document.title' … report TITLE: <title>"` against the fixture page (real Chrome) | Exit 0, coherent reply (TITLE: Fixture Page); no crash; Chrome cleaned up. Run by a human with a key — never in CI. Manual record only — superseded by T0-01..04; no automated case drives launch_chrome. Verified 2026-08-10 against deepseek-v4-flash |
| T0-04 | In-process heal with `mcp: null` (no browser) | `runDiagnosis` on a fixture trace.zip whose `transcript.md` records a failing click on `#login-btn`, plus a spec with a wrong selector (`#login`); harness with `mcp: null` — fs + trace + knowledge-base tools only, no browser surface — so the live model fixes the spec from the transcript. Retried up to 3 fresh attempts (150 s cap each) | Spec now targets `#login-btn`; report `agentRan: true` |

## Evaluation checklist (how to judge a run)

1. Each case exits with its documented code; no case times out silently.
2. Assertions are on observable state (files, process table, JSON report,
   MCP call log, Chrome title) — not on "did not crash".
3. Deterministic tiers (T1-T4) pass 3 consecutive local runs with zero
   flakes (Chrome-crash retry policy above).
4. T2 run once with real Chrome verifies the traversal surface the agent
   actually ships (`launch_chrome`/`start_session` attach flow).
5. Suite time budget: T1 < 60 s, T2 < 120 s, T3 < 30 s, T4 < 30 s.

## Implementation order (as executed)

1. Checkpointer + stable thread id in `src/agent.ts` (probe-driven: HITL
   interrupts and multi-turn memory both require them).
2. `e2e/wdio/deepagent/` package + fixtures (page server, trace builder,
   fake-wdio, fixture MCP server).
3. T1 cases (no new infra beyond temp dirs).
4. T3 cases (reuse T1 fixtures; no model required for the error paths).
5. T2 cases (CDP-probe gate) — iterate on the real browser path.
6. T4 cases (needs wdio-cli built).
7. T0 cases (manual, ported from the standalone harness; CLI run = E2E-17).
8. Root vitest exclude + per-tier scripts; full suite locally; three
   consecutive green runs for the flake check.
