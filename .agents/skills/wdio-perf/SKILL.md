---
name: wdio-perf
description: >-
  Measure and prove WebdriverIO testrunner hot-path improvements with the mock
  runner benchmark (baseline, ≥3% gate, no >3% regression). Use when working on
  performance, latency, startup time, skip-path cost, tsx/loader overhead,
  mock-driver wall-clock, or when the user asks to bench, profile, or verify a
  perf win.
---

# WDIO hot-path performance

Use this skill to **find** testrunner cost and **prove** a change is a real win.
Do not ship a "perf" commit on vibes — the mock bench gate is the proof.

Read [tests/AGENTS.md](../../../tests/AGENTS.md) (Runner benchmark section) and
keep production edits out of generated `build/` / `cjs/`.

## What we measure

`pnpm run bench:runner` runs `tests/benchmark/runner.js`:

- Reuses smoke `launch()` + `@wdio/webdriver-mock-service` (no real browser).
- Generated Mocha / Jasmine / Cucumber fixtures (size × log profile).
- Metrics from wall clock **and** worker `TimingTracker` phases (`setup`,
  `execution`, `teardown`). Prefer **median** over mean.
- Default scenarios: all `*-large-*` plus `mocha-skips-quiet`.

| Scenario intent | Example id | Use when |
|-----------------|------------|----------|
| Framework / worker cost, low log noise | `mocha-large-quiet` | Loader, preload, mock HTTP, skip path |
| Realistic reporter / log cost | `mocha-large-info` | Logging, reporter wiring |
| Skip-heavy path | `mocha-skips-quiet` | Skip detection, empty hooks |
| Cross-framework check | `jasmine-large-quiet`, `cucumber-large-quiet` | Shared runner / utils changes |

Gate thresholds (in the runner): **≥3%** improvement on wall **or** execution
median for the targeted scenario; **no >3%** regression on wall or execution
anywhere in the measured set. Missing baseline rows and a failed gate must
exit non-zero.

## Prove-or-revert loop

Copy this checklist and keep it updated:

```
Perf Progress:
- [ ] Branch from a clean base; note HEAD sha
- [ ] Record baseline (no production edits yet)
- [ ] Pick one candidate; implement the smallest change
- [ ] Rebuild touched packages (`pnpm run dev <pkg>` or scoped compile)
- [ ] Re-bench vs baseline; gate must PASS
- [ ] Keep commit only if gate PASS; else revert and try next candidate
- [ ] Repeat until the requested number of wins (or backlog exhausted)
- [ ] PR body: before/after table per kept change
```

### 1. Baseline (mandatory)

```sh
pnpm run bench:runner -- --label baseline-$(git rev-parse --short HEAD)
# Results: tests/benchmark/results/<label-or-sha>.json (gitignored)
```

For a focused candidate, also capture the primary scenario:

```sh
pnpm run bench:runner -- --scenario mocha-large-quiet --iterations 5 \
  --label baseline-mocha-large-quiet
```

### 2. One candidate at a time

Change **one** suspected hot path. Rebuild. Do not batch unrelated wins into
one measurement — you will not know which change paid.

### 3. Compare

```sh
pnpm run bench:runner -- --scenario mocha-large-quiet --iterations 5 \
  --baseline tests/benchmark/results/<baseline-file>.json
```

Bare filenames resolve under `tests/benchmark/results/`. Paths with a directory
must point at the real file (no basename rewrite).

- **PASS** → commit that candidate alone (`perf(<scope>): …`).
- **FAIL** (no ≥3% win, or any >3% regression, or missing baseline row) →
  revert the candidate; do not weaken the gate.

### 4. Blast-radius check

After a keep, spot-check at least one other default scenario (e.g. quiet → also
run `mocha-large-info` or the matching jasmine/cucumber quiet) so a win in one
profile did not regress another. Use the same baseline file.

### 5. Correctness proof

Perf does not replace [wdio-testing](../wdio-testing/SKILL.md). After a keep,
run the smallest functional proof for the touched package (usually
`pnpm run test:package <name>` and/or a named `pnpm run test:smoke <suite>`).

## Where to look (hot-path map)

Work from measured cost, not guesses. Typical owners:

| Symptom / phase | Likely owner | Examples that have paid off |
|-----------------|--------------|------------------------------|
| Config / worker boot, TS loader | `@wdio/cli`, `@wdio/local-runner` | Skip `tsx` for JS-only runs; skip worker source maps unless debugging |
| Framework file load | `@wdio/mocha-framework`, jasmine/cucumber pkgs | Skip empty Mocha preload before `addFile` |
| Skip / pending handling | `@wdio/utils`, framework adapters | Detect skips via `error.message` without heavy inspect |
| Per-command HTTP in smoke/bench | `@wdio/webdriver-mock-service`, `webdriver` | undici `MockAgent` instead of heavier mocks; keep `:4444` fail-closed, allow other localhost for shared-store |
| Hook / reporter chatter | `@wdio/runner`, reporters | Quiet vs info scenarios isolate this |

Instrument with existing `TimingTracker` (`@wdio/utils`) marks — do not invent a
parallel profiler. Bench results already aggregate worker timings from launch.

## Candidate hygiene

- Prefer removing work on the common path over adding caches that must be
  invalidated.
- Lazy-load only when the import is off the default path and the win clears
  the gate; measure, do not assume.
- Keep mock isolation: WebDriver mock on `:4444` must not fall through to a
  live driver; other localhost ports (shared-store) must still connect.
- Never hand-edit `packages/*/build` or generated protocol/docs files.

## PR expectations

- One topic; Conventional Commit scopes matching the packages you changed.
- Body includes a **before → after** median table (wall + execution) per kept
  win, with scenario id and baseline label/sha.
- Stage only source + tests; leave `tests/benchmark/results/*.json` untracked.

## Anti-patterns

- Shipping without `--baseline` / ignoring a FAIL gate.
- Claiming a win from a single iteration or noisy laptop comparison without
  the harness medians.
- Mixing several candidates then attributing the delta to one of them.
- Using real-browser e2e as the primary perf signal for testrunner hot path
  (too much driver noise). Use mock bench first; e2e only if the change is
  specifically in the real WebDriver path.
- "Fixing" a miss by lowering thresholds, dropping scenarios, or deleting
  baseline rows.
