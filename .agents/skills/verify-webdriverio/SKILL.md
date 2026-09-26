---
name: verify-webdriverio
description: >-
  Prove a WebdriverIO change by driving this repo's harness: a named smoke
  suite (testrunner, mocked driver), an example script (real browser and
  driver), the runner benchmark, or typings. Use after a feature or bug fix,
  before claiming the work works, and when verifying testrunner, browser,
  session, performance, or public type behavior. A unit test is not this proof.
---

# Verify WebdriverIO

A user runs a spec or a standalone script. Prove the change by driving that
same path. Read [features/README.md](features/README.md) and the matching
feature file first.

A package unit test does not prove the feature. Do not run `pnpm test`,
`pnpm run ci`, or `pnpm run test:e2e` as the proof.

## Pick the harness

| The change affects | Drive | Not the proof |
|--------------------|-------|---------------|
| Testrunner, CLI, hooks, retries, spec filters, framework adapters, services, reporters | One named smoke suite | A unit test. The full smoke matrix. |
| A browser or element command, session, or protocol path the user hits with a real driver | One example script | A smoke suite. The driver there is mocked. |
| Hot-path speed, startup, loader, or skip cost | `pnpm run bench:runner` against a baseline | A real-browser example. |
| Exported types or command signatures | The matching `pnpm run test:typings:*` | A runtime smoke run. |

Drive every entry point in the feature file that this change can reach. If one
is unreachable, record the command and the missing precondition. Do not mark it
verified through a different path.

## Launch

There is no server to leave running. Prepare the checkout once, then start each
drive as its own process.

```sh
.agents/setup
```

`.agents/setup` installs, compiles, and writes the revision stamp that
`.agents/resume` checks. `pnpm run setup` compiles without that stamp, so
doctor fails afterward.

If doctor already prints `Ready.` and a watch compile is running for the
package you edited, `pnpm run dev <package>` is enough.

## Doctor

Run this first, and again whenever a drive fails for a reason that is not an assertion.

```sh
.agents/resume
```

Read-only. It checks Node, pnpm, `node_modules`, `packages/webdriverio/build`, and that the build stamp matches `HEAD`. Non-zero means do not drive: run `.agents/setup`, then doctor again.

## Drive

From the repo root unless the feature file says to change directory.

```sh
pnpm run test:smoke:list
pnpm run test:smoke standaloneTest
```

```sh
cd examples/standalone && node sample.js
cd examples/wdio && pnpm run test:mocha
cd examples/pageobject && pnpm run test
```

Benchmark and typings commands are in their feature files. The perf loop is [wdio-perf](../wdio-perf/SKILL.md).

Exit code 0 is required. It is not sufficient. The feature file names the output that must appear.

## Evidence

Write proof to `.agents/verify-artifacts/<feature-id>/`. That directory is gitignored. Cleanup must leave it in place.

- `command.txt` — the exact command
- `output.txt` — stdout and stderr
- `result.txt` — exit code, the feature id, the entry point, and the observable the feature file names

Smoke proof is the suite's own passed and skipped counts plus exit 0. Example proof is the script's own assertion (printed URL, spec reporter lines) plus exit 0. Benchmark proof is the printed `PASS` or `FAIL` and a copy of the summary; raw JSON stays in `tests/benchmark/results/`. Typings proof is `tsc` exit 0.

`@wdio/webdriver-mock-service` is the only mock this skill allows. It stubs the driver on port 4444 and refuses other traffic to that port. A smoke pass does not prove a real browser. An example pass does not prove testrunner plumbing the mock already covers.

## Cleanup

A drive is a short-lived process and exits on its own. If you backgrounded it, kill that PID only:

```sh
kill <pid>
```

Do not `pkill`, `killall node`, or `killall chrome`. Do not delete `.agents/verify-artifacts/` or `tests/benchmark/results/`.

One smoke launch and one benchmark at a time. Both use the in-process mock on `:4444`. One real-browser example at a time. Do not attach to a Chrome the user already has open.

## Feature map

- [Smoke testrunner](features/smoke-testrunner.md)
- [Example pipeline](features/example-pipeline.md)
- [Runner benchmark](features/runner-benchmark.md)
- [Typings](features/typings.md)

When a change adds a user-facing path, update the feature file in the same change.
