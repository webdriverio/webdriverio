WDIO
====

> WebdriverIO command line. `npx wdio` runs `@wdio/cli` without a local install.

`npx wdio` installs this package. The `wdio` bin starts the same CLI as
[`@wdio/cli`](https://www.npmjs.com/package/@wdio/cli), including `run`,
`config`, `repl`, and `session`.

```sh
npx wdio --help
npx wdio session open chrome http://localhost:3000
npx wdio run wdio.conf.ts
```

Projects that already depend on `@wdio/cli` keep using that package's `wdio`
bin. This package is what npm resolves when the CLI is not installed yet.

Scaffold a new project with [`create-wdio`](https://www.npmjs.com/package/create-wdio):

```sh
npm init wdio@latest
```

Versions of `wdio` before 7 were that scaffolder. They are deprecated. Use
`npm init wdio@latest` to create a project.

## Release

This package is part of the WebdriverIO monorepo. It is public, it lives in
`packages/*`, and it uses the same version as every other package. The
[Manual NPM Publish](https://github.com/webdriverio/webdriverio/blob/main/.github/workflows/publish.yml)
workflow runs `pnpm lerna publish`, which publishes it with the rest of the
release. Lerna rewrites the `workspace:*` dependency on `@wdio/cli` to the
exact version it publishes.
