# Runner benchmark

A user pays for testrunner startup and per-spec cost. The benchmark proves a performance change with the mock driver, generated fixtures, and a baseline comparison.

## Sub-features

- `bench-record` writes a baseline JSON for the current `HEAD` before any performance edit.
- `bench-scenario` measures one scenario (`mocha-large-quiet` for loader, mock HTTP, and skip-path work).
- `bench-gate` compares a candidate to that baseline and prints `PASS` or `FAIL`.

## How to get to it (user POV)

- From the repo root: `pnpm run bench:runner`
- One scenario: `pnpm run bench:runner -- --scenario mocha-large-quiet --iterations 5`
- Compare: `pnpm run bench:runner -- --baseline tests/benchmark/results/<file>.json`

The prove-or-revert loop, scenario table, and 3% gate live in [wdio-perf](../../wdio-perf/SKILL.md). Follow that skill for the measurement. This file is the verification entry.

## Driving it with the WebdriverIO harness

Preconditions:

- `.agents/resume` prints `Ready.`
- No smoke suite is running.
- A performance claim has a baseline captured before the production edit.

- **Record baseline.** Before editing, run `pnpm run bench:runner -- --label baseline-$(git rev-parse --short HEAD)`. Exit 0. A JSON file appears in `tests/benchmark/results/`. This run alone does not prove a win.
- **Focused scenario.** Run `pnpm run bench:runner -- --scenario mocha-large-quiet --iterations 5 --label baseline-mocha-large-quiet`. Exit 0 and stdout prints median wall and execution numbers for `mocha-large-quiet`.
- **Gate.** After the candidate is compiled, run `pnpm run bench:runner -- --scenario mocha-large-quiet --iterations 5 --baseline tests/benchmark/results/<baseline-file>.json`. Stdout ends in `PASS` or `FAIL`. Exit 0 only on `PASS`. `FAIL` means no ≥3% win, a >3% regression, or a missing baseline row.
- **Proof.** Copy the `PASS` or `FAIL` block into `.agents/verify-artifacts/runner-benchmark/result.txt`. Leave the JSON in `tests/benchmark/results/`. Do not commit either.

## Gotchas

- A single run with no `--baseline` is a measurement, not proof of a win.
- Do not lower thresholds, drop scenarios, or delete baseline rows to turn `FAIL` into `PASS`.
- Real-browser examples are the wrong signal for testrunner hot path. Driver time swamps the runner.
- Results are gitignored. Cleanup must not delete them before you have copied the summary into the artifact directory.
