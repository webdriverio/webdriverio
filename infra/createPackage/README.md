# Create Package

Internal package that scaffolds a new WebdriverIO sub-package (reporter, service, runner, framework, driver, or tool) with the boilerplate files the monorepo expects. It is not published to NPM. A driver is a package that the `automationProtocol` option loads in place of `webdriver`. Tools omit the type suffix, so a tool named `session` becomes `@wdio/session`.

## Workflow

From the repo root:

```sh
pnpm run create
# equivalent:
pnpm -r --filter=@wdio/create-package run create
```

The CLI asks for the package type and name, then writes `packages/wdio-<name>-<type>/` (or `packages/wdio-<name>/` for a tool) with `package.json`, TypeScript configs, a stub `src/index.js`, and an example unit test.

See [CONTRIBUTING.md](../../CONTRIBUTING.md#create-new-package).
