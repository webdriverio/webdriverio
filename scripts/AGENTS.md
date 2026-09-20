# scripts/

Repo tooling. Prefer the root `pnpm run` entry points over calling these
files with raw `node` / `tsx` unless you are changing the script itself.

| Task | Command | Owner |
|------|---------|--------|
| Docs index | `pnpm run docs:list` | `docs-list.mjs` |
| One package of unit tests | `pnpm run test:package <name>` | `test-package.mjs` |
| Diff → CI lanes | `pnpm run changed:lanes --json` | `changed-lanes.mjs` |
| Local proof for a diff | `pnpm run test:changed` | `check-changed.mjs` |
| Smoke suite names | `pnpm run test:smoke:list` | `smoke-list.mjs` |
| Lane-script unit tests | `pnpm run test:scripts` | `changed-lanes.test.mjs` |
| API / protocol / package docs | `pnpm run docs:generate` | `docs-generation/` |
| BiDi types | `pnpm run generate:bidi` | `bidi/` |
| New workspace package | `pnpm run create` | `generateSubPackage.ts` |
| Backport labeled PRs | `pnpm run backport` | `backport.ts` (maintainers) |
| Depcheck | `pnpm run test:depcheck` | `depcheck.ts` |
| Protocol aggregator | imported by the compiler | `protocols.ts` |

## Guardrails

- Docs generation mutates `website/sidebars.json` and writes `_*.md` API
  pages. Those outputs are gitignored; do not commit them.
- `docs-generation/3rd-party/` is the source for community plugin docs.
- Release / changelog / tag scripts are maintainer-only. Do not run
  `docs:deploy`, `pushReleaseTag`, or `publish` workflows without explicit
  TSC approval.
- Keep scripts ESM (`type: module` at the repo root). Use `tsx` for TypeScript.
