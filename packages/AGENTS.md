# packages/

Default rules for workspace packages that do not have their own `AGENTS.md`.
Read the package-specific file when it exists (`webdriverio`, `webdriver`,
`wdio-protocols`, `wdio-cli`, `wdio-reporter`).

## Layers

```
@wdio/protocols → webdriver → webdriverio
@wdio/types, @wdio/utils, @wdio/config, @wdio/logger   (shared)
@wdio/cli → @wdio/local-runner → @wdio/runner → frameworks / reporters / services
```

- `wdio-*-reporter` extends `@wdio/reporter`
- `wdio-*-service` hooks the launcher / worker
- `wdio-*-framework` adapts Mocha / Jasmine / Cucumber
- Internal-only: `wdio-webdriver-mock-service`, `wdio-smoke-test-*`

## Commands

```sh
pnpm run dev <package-name-or-dir>
pnpm run test:package <package-name-or-dir>
```

`<package-name-or-dir>` accepts `webdriverio`, `@wdio/cli`, or `wdio-cli`.

## Guardrails

- Import other workspace packages by their npm name, not via relative
  `../../other-package/src` paths.
- Declare every import in that package's `package.json`. `pnpm run test:depcheck`
  enforces this.
- User docs for a reporter/service are its `README.md`.
- New package: `pnpm run create` from the repo root.
