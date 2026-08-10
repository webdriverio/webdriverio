# wdio-deepagent-e2e

Deterministic end-to-end suite for `@wdio/deepagent` — 26 cases across 5
tiers, every case with concrete pass/fail criteria. Plan and evaluation
checklist: [`packages/wdio-deepagent/docs/E2E.md`](../../../packages/wdio-deepagent/docs/E2E.md).

No real LLM, no external network (except the manual T0 tier): a scripted
`FakeToolCallingModel` (langchain) drives the real built harness, the real
`@wdio/mcp` stdio server, and a real Chrome process (T2). The CLI run case
(E2E-17) uses the real BYOK model via `DEEPAGENT_MODEL` in the manual T0
tier (T0-03) — there is no fake-model hook in the product.

## Layout

```
tests/live-llm.test.ts          T0-01..04   REAL LLM smoke: fs tools, MCP tool-calling,
                                            CLI BYOK run, heal loop (manual; NEVER CI)
tests/harness.test.ts           E2E-01..07  harness missions, fs scope, heal ask/propose/auto,
                                            exit-code contract, multi-turn memory   (CI-always)
tests/browser-tools.test.ts     E2E-08..11  real Chrome via @wdio/mcp (gated)      (Chrome CDP probe)
tests/cli-commands.test.ts      E2E-12..16  spawned bin: help, unknown cmd, no-model,
                                            init TTY regression, diagnose propose    (CI)
tests/wdio-cli-dispatch.test.ts E2E-18..19  `wdio deepagent` alias + optional-dep guard (wdio-cli built)
helpers.ts                 spawn w/ hard timeout, temp dirs, harness factory,
                           Chrome CDP gate + scoped group teardown, orphan checks
fixtures/                  loopback MCP server (fixture_* tools incl. fixture_crash),
                           fake `wdio` binary, T2 target page.html, trace.zip builder
```

## Prereqs

- The repo's packages are built: `pnpm --filter @wdio/compiler run build -p @wdio/deepagent`.
- T2 needs Chrome on PATH (`google-chrome` / `chromium`) **and** a working
  CDP probe — `launch_chrome` is not headless, so display-less environments
  self-skip via the live probe (binary alone is not enough).
- T4 needs `@wdio/cli` built (`packages/wdio-cli/build/index.js`, with
  `@wdio/deepagent` external in the bundle).

## Run

```sh
pnpm --filter wdio-deepagent-e2e test:harness   # harness tiers (CI-always)
pnpm --filter wdio-deepagent-e2e test:browser   # real browser (gated on Chrome CDP probe)
pnpm --filter wdio-deepagent-e2e test:cli       # spawned CLI process
pnpm --filter wdio-deepagent-e2e test:wdio-cli  # wdio-cli alias
pnpm --filter wdio-deepagent-e2e test           # everything
```

## Tier T0 — live LLM smoke (manual, human + key, never CI)

`tests/live-llm.test.ts` exercises the REAL agent capabilities against a live
Anthropic-compatible BYOK endpoint. It is skipped whenever no key/base URL is
present, so it can never fail CI.

```sh
export ANTHROPIC_BASE_URL="https://api.deepseek.com/anthropic"
export ANTHROPIC_AUTH_TOKEN="sk-…"        # token accepted by your endpoint
export ANTHROPIC_MODEL="deepseek-v4-flash" # any model your endpoint serves
pnpm --filter wdio-deepagent-e2e test:live-llm
```

- **T0-01** — real model plans + writes a file with exact content (fs tools / `write_file`).
- **T0-02** — real model calls an MCP tool (`fixture_navigate`) over the loopback server.
- **T0-03** — full CLI process (E2E-17): `DEEPAGENT_MODEL=anthropic:<model>` +
  BYOK env (`ANTHROPIC_API_KEY`/`ANTHROPIC_AUTH_TOKEN` + `ANTHROPIC_BASE_URL`)
  runs a mission and writes the target file (exit 0).
- **T0-04** — heal loop: a trace.zip with a faulty `transcript.md` (failing
  click on `#login-btn`) + a spec with a wrong selector (`#login`) is fixed by
  the live model — it reads the spec and writes the corrected selector, and
  the test asserts the spec now targets `#login-btn`. Retried up to 3 fresh
  attempts (150 s cap each).

Notes: the resolver and the installed `ChatAnthropic` read `ANTHROPIC_API_KEY`,
so the suite bridges `ANTHROPIC_AUTH_TOKEN` → `ANTHROPIC_API_KEY` when only the
token is set. Missions must run under `heal: 'auto'` (the default is `ask`,
which gates writes behind an interrupt — observed live: the write pauses for
approval and no file appears).

### Findings from the live runs (product gaps worth fixing)

1. **`DEFAULT_HEAL_PROMPT` omits the transcript.** The diagnose heal prompt
   only carries the failed-action/network summary; a live model with just
   "click #login-btn failed" stalls trying to explore the app. T0-04 injects
   the transcript via the engine's documented `healPrompt` hook — feeding
   `report.transcript` into the default prompt would improve real CLI heals.
2. **`maxTokens` default (1024) starves reasoning models.** deepseek-v4-flash
   emits a thinking block first; with the default cap the reply comes back
   thinking-only (no tool call, no text) and the heal silently does nothing.
   T0-04 uses `maxTokens: 8192` (observed: thinking-only → full read/fix cycle).
   **Fixed:** the default is now 8192; T0-04 keeps the explicit cap for
   determinism.
3. **CLI diagnose exposes the full browser surface.** The diagnose harness
   loads all 31 `@wdio/mcp` tools, so a live model detours into
   launch/attach/navigate instead of fixing the spec (one run hung 180 s+).
   T0-04 drives `runDiagnosis` in-process with `mcp: null` — fs + trace +
   knowledge-base tools only, no browser surface; the live model fixes the
   spec from the transcript. Restricting the diagnose toolset is a product
   consideration.

## Determinism

- **FakeToolCallingModel** (langchain) drives exact tool-call sequences via
  the harness's `modelOverride` hook; the final response is empty so the
  agent loop terminates.
- Fixture loopback MCP server returns scripted text and records every call
  to `FIXTURE_LOG` for exact-order assertions; `fixture_crash` exits(1)
  mid-call for the transport-failure path (E2E-06c).
- Every spawn has a hard timeout (default 60 s) — no hang ever.

## Product changes made in the repo (required by this plan)

1. **Checkpointer fix (bug found while building E2E-03)** —
   `packages/wdio-deepagent/src/agent.ts` now passes
   `checkpointer: new MemorySaver()` + a stable `thread_id`. Without it,
   heal `ask` interrupts threw `MISSING_CHECKPOINTER` at runtime — the whole
   human-in-the-loop gating was broken, and multi-turn state did not persist.
   New dep `@langchain/langgraph-checkpoint` (package.json + lockfile).
   Regression test: `agent.test.ts` "ask-mode human-in-the-loop gating".
2. **Rebuilt `packages/wdio-cli/build/index.js`** (esbuild, `@wdio/deepagent`
   external) so the committed optional-dep guard in
   `src/commands/deepagent.ts` is actually in the bundle T4 exercises.

## Plan-vs-reality deviations (assertions follow shipped behavior)

| Case | Plan said | Reality (asserted) |
|------|-----------|---------------------|
| E2E-01/06 | "final reply matches scripted text"; "FAILED: … text → exit 1" | langchain appends the system prompt last, so a FakeToolCallingModel reply always echoes it; scripted text is asserted on the **tool result the agent sees**. `runMission` exits 1 only when the turn **throws** — a throwing model is swallowed by the agent loop (exit 0, tracked gap); a transport crash (`fixture_crash` exits the MCP server mid-call) throws the turn and surfaces as exit 1. |
| E2E-04 | report `agentRan: true` for propose | `runDiagnosis` never invokes the agent for propose (engine.ts), so `agentRan: false` (consistent with E2E-16). |
| E2E-05 | "wdio.conf.* untouched (deny rule)" | `permissionsForHeal` has **no config deny rule**; auto allows any write under projectRoot. Test asserts the real boundary (root-scoped writes). |
| E2E-11 | "harness.close() leaves no orphan Chrome" | `launch_chrome` spawns a **detached** Chrome that survives the server by design (documented in @wdio/mcp). Since the fix, `WdioMcpClient.close()` kills every Chrome process that appeared while the session ran (PID diff snapshot); the test still tears Chrome down explicitly (process-group kill scoped to the case's own CDP port) and asserts none remain. |
| E2E-16 | fixture trace.zip, exit 0 | a failing trace exits 1 by design (exit mirrors failedActions); the case asserts exit 1 with `failedActions: 1`, `agentRan: false` (a no-failure trace → exit 0 with `actionCount > 0` is not asserted anywhere) |
| E2E-17 | `run` with fake model, deterministic | the fake-model env hook was **dropped** — the CLI run case lives in T0-03 with the real BYOK model (manual tier). |
| E2E-18 | `wdio deepagent help` prints deepagent usage | yargs intercepts the bare `help` positional and prints the deepagent command help; the desc lists repl/run/init/diagnose/mcp. `wdio deepagent` (bare) prints the full deepagent usage. |
| E2E-19 | guard via `… help` | yargs never calls the handler for `help`, so the optional-dep guard is exercised via `wdio deepagent run …` (exit 1 + install hint). |
| E2E-07b/16b | `mcp: null` not in plan | harness + CLI accept `deepagent.mcp: null` — heal works from spec + trace transcript without any browser tooling (local-LLM / headless-heal use case) |

## Flake policy & budget

- Hard 60 s timeouts on every spawn (no hang ever); Chrome-crash class
  (`session not created` / connection errors) retried once (vitest `retry: 1`).
- Chrome orphans re-checked with retried process-group kills until confirmed
  dead; the MCP-server orphan check is scoped to the suite's server path.
- T2 gates on a live CDP probe — display-less or overloaded environments
  skip instead of failing slowly.
- Observed: T1 ~2 s, T3 ~13 s, T2 ~21-27 s, T4 ~2 s; full suite ~24-28 s —
  well under the 4-min suite budget. 3 consecutive full-suite green runs
  verified on 2026-08-10.

## Concurrency warning

Do not run this suite concurrently with the legacy sibling harness
(`wdio-deepagent-e2e-tests`): `@wdio/mcp`'s `launch_chrome` uses a fixed
`os.tmpdir()/chrome-debug` profile, and the sibling's teardown sweeps ALL
`chrome[-]debug` processes machine-wide — the two suites actively kill each
other's Chrome. This suite's own teardown is scoped to its per-case CDP
ports for exactly that reason. The sibling is a donor (T0 tier, CDP gate,
group teardown, scoped orphan checks were ported from it) and should be
retired once this suite is merged.
