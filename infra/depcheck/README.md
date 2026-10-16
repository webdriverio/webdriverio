# Dependency Check

Internal package that runs [depcheck](https://github.com/depcheck/depcheck) against every package in `<root>/packages` and fails if any of them import a module that is not declared in `package.json`. It is not published to NPM.

## Workflow

Called from the repo root as part of static analysis (`.github/workflows/test-static.yml`):

```sh
pnpm run test:depcheck
# equivalent:
pnpm -r --filter=@wdio/depcheck run check
```

Known false positives can be added to `IGNORE_PACKAGES` in [`src/index.ts`](./src/index.ts).

The same command also checks the installed **direct production dependencies** of
published packages against the minimum Node.js version in each package's
`engines.node`. It includes installed optional dependencies and follows workspace
links; development dependencies and private tooling packages are excluded. Run
`pnpm install` first: a missing required dependency makes the check fail.

This catches an update requiring a newer Node.js version even when CI itself runs
on a newer development runtime. It checks the declared minimum, not every version
in a complex range or the engines of the entire transitive dependency graph.
`engineStrict` separately rejects unsupported engines for the runtime performing
an install.
