# Dependency Check

Internal package that runs [depcheck](https://github.com/depcheck/depcheck) against every package in `<root>/packages` and fails if any of them import a module that is not declared in `package.json`. It is not published to NPM.

It also fails if a `peerDependencies` entry of a package is in no `dependencies` or `devDependencies` of the root, `e2e`, `tests` or `packages/*` manifests (a `*` or `latest` range does not count): Dependabot only updates those ranges, so such a peer stays at the version it was locked at. Add it to `devDependencies`.

## Workflow

Called from the repo root as part of static analysis (`.github/workflows/test-static.yml`):

```sh
pnpm run test:depcheck
# equivalent:
pnpm -r --filter=@wdio/depcheck run check
```

Known false positives can be added to `IGNORE_PACKAGES` in [`src/index.ts`](./src/index.ts).
