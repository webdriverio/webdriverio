# Package ownership

Use this map to pick the existing owner for a change. Do not add a parallel
helper in another package to work around a missing export. GitHub review
still routes through [CODEOWNERS](CODEOWNERS) to `@webdriverio/project-committers`;
named people are not assigned per file.

Contributor commands (`pnpm run test:package`, compile, typings) live in
[AGENTS.md](../AGENTS.md) and scoped `AGENTS.md` files. Package READMEs are
published as user docs — do not add developer footers there.

## Layers

```
@wdio/protocols  →  webdriver  →  webdriverio
@wdio/types, @wdio/utils, @wdio/config, @wdio/logger
@wdio/cli  →  @wdio/local-runner  →  @wdio/runner
                 →  *-framework / *-reporter / *-service
```

## Concern → package

| Concern | Package | Notes |
|---------|---------|--------|
| Shared TS types (capabilities, options) | `@wdio/types` | `packages/wdio-types` |
| Protocol command specs | `@wdio/protocols` | Hand-edit `src/protocols/`, never `src/commands/` |
| HTTP / BiDi transport | `webdriver` | Generated BiDi files come from `pnpm run generate:bidi` |
| User-facing `$` / element / browser API | `webdriverio` | JSDoc here feeds the command API docs |
| Config parsing | `@wdio/config` | |
| Shared utils | `@wdio/utils` | |
| Logs | `@wdio/logger` | |
| Globals | `@wdio/globals` | |
| CLI / launcher | `@wdio/cli` | EJS templates are linted by `test:ejslint` |
| Worker process | `@wdio/local-runner` | Also in the CI display-server path filter |
| Test worker / hooks | `@wdio/runner` | |
| Reporter base class | `@wdio/reporter` | Concrete reporters extend this |
| Mocha / Jasmine / Cucumber | `@wdio/*-framework` | |
| Browser component tests | `@wdio/browser-runner` | CI `component` lane |
| Display server (Wayland / Xvfb) | `@wdio/display-server` | CI `display_server` lane |
| Type generation / esbuild | `@wdio/compiler` | `infra/compiler` |
| Docs index / scoped tests / CI lanes | `@wdio/repo-tools` | `infra/repo-tools` |
| Mock driver for smoke tests | `@wdio/webdriver-mock-service` | Not `@wdio/smoke-test-service` |
| Docs site | `website/` + `scripts/docs-generation/` | See [website/AGENTS.md](../website/AGENTS.md) |

## Developing a package

```sh
pnpm run dev <package-name-or-dir>
pnpm run test:package <package-name-or-dir>
pnpm run test:changed --dry-run    # which CI lanes this diff maps to
```

New package: `pnpm run create`. See [packages/AGENTS.md](../packages/AGENTS.md).
