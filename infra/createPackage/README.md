# Create Package

Internal package that scaffolds a new WebdriverIO sub-package (reporter, service, runner, or framework) with the boilerplate files the monorepo expects. It is not published to NPM.

## Workflow

From the repo root:

```sh
pnpm run create
# equivalent:
pnpm -r --filter=@wdio/create-package run create
```

The CLI asks for the package type and name, then writes `packages/wdio-<name>-<type>/` with `package.json`, TypeScript configs, a stub `src/index.js`, and an example unit test.

See [CONTRIBUTING.md](../../CONTRIBUTING.md#create-new-package).
