# @wdio/session

Shell session for browsers, mobile apps, and desktop apps. Unit tests live in
`packages/wdio-session/tests/` and follow the production owner (targets,
snapshot, actions, exec, export, daemon, cli).

## Commands

```sh
pnpm run test:package wdio-session
pnpm run test:e2e:session
```

`test:e2e:session` is for a change a user can see in a real session. A unit
test is not that proof.

## Guardrails

- Do not export a helper whose only caller is a test. `transform` persists
  bindings by rewriting the submitted code; assert that with `run()`, not a
  hand-built syntax tree.
- Native selector order is `nativeCandidates`. Two controls that share an
  accessibility id stay distinct in `takeNativeSnapshot`, which is the
  uniqueness contract.
- `refId` accepts `e12` and `@e12`. `get count` on a ref must not call `$$`.
- `generateSpec` always emits `describe` / `it`. `--framework` is recorded on
  the export result and does not change the file.
- Every command reference in output goes through
  `session.cmd(command, args, cliText)`; the CLI text is the default and must
  stay byte-identical.
- The agent's static import graph is allowlisted in
  `tests/agent-imports.test.ts`; load CLI-only packages with
  `await import('<pkg>')` or keep them out of the agent's graph.
- Agent-only result fields come from `dispatch(req, { detail: true })`; never
  add fields to `data` for the agent, since `data` is CLI `--json` output.
