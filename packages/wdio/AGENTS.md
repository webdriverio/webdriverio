# wdio

Unscoped package that `npx wdio` installs. The bin delegates to `@wdio/cli`.
User docs are this package's `README.md`.

## Tests

`tests/bin.test.ts` is the only suite.

Keepers:

- Package metadata (`name` `wdio`, public access, lerna version, `workspace:*`,
  bin-only) is the publish contract.
- Spawning `bin/wdio.js --help` is the CLI contract (`run` and `session`,
  exit 0).
- `pnpm pack` is the release artifact (published bin, semver `@wdio/cli`,
  `import('@wdio/cli')`). When `npm_execpath` is not pnpm's script, that test
  also runs Corepack discovery against this Node.

Helper tests cover branches the pack does not hit on the current OS: an npm
`npm_execpath`, a `pnpm.cmd` shim, Corepack directory layouts, a missing
Corepack, and Windows `tar` argv (`C:` must not be a remote host). A helper
test has to fail when the branch it names is broken. Do not treat "script
found" and "Corepack missing" as the same success.

## Commands

```sh
pnpm run test:package wdio
```
