# @wdio/repo-tools

Typed repo helpers. Do not add new loose scripts under `/scripts` for agent
or CI lane work — extend this package.

## Layout

- `src/types.ts` — shared types
- `src/workspace.ts` — repo root + `isMainModule`
- `src/docs-list.ts`
- `src/test-package.ts`
- `src/changed-lanes.ts`
- `src/check-changed.ts`
- `src/smoke-list.ts`

Root `package.json` scripts call these files through `tsx`. Tests live in
`tests/` and run via Vitest (`infra/**/*.test.ts`).

## Guardrails

- TypeScript only, with explicit annotations on exports.
- Resolve the workspace by walking to `pnpm-workspace.yaml`.
- Keep CI lane filters in sync with `.github/workflows/test.yml`.
