---
id: typegeneration
title: Type generation
description: "See how protocol specs are turned into TypeScript types, typings tests and API docs, and which source files to edit before regenerating."
---
How protocol specs become TypeScript types, typings tests, and API docs.
Agents: do not hand-edit generated files — change the source in this chart
and regenerate.

```mermaid
graph TD
    SPEC["Hand-authored specs<br>packages/wdio-protocols/src/protocols/*.ts"] --> AGG["scripts/protocols.ts<br>exports PROTOCOLS"]
    AGG --> COMP["@wdio/compiler<br>infra/compiler type-generation plugin"]
    COMP --> GEN["Generated types<br>packages/wdio-protocols/src/commands<br>gitignored — do not edit"]
    GEN --> WD["webdriver client<br>implements protocol HTTP / BiDi"]
    GEN --> WDIO["webdriverio commands<br>JSDoc on src/commands/**"]
    WD --> TYPWD["tests/typings/webdriver"]
    WDIO --> TYPWDIO["tests/typings/webdriverio<br>mocha / jasmine / cucumber"]
    TYPWD --> TSC["pnpm run test:typings"]
    TYPWDIO --> TSC
    WDIO --> DOCS["pnpm run docs:generate<br>website/docs/api command pages"]
    SPEC --> PROTODOCS["protocolDocs.ts<br>website protocol API pages"]
    CDDL["scripts/bidi CDDL pipeline"] --> BIDI["packages/webdriver/src/bidi<br>pnpm run generate:bidi"]
    BIDI --> WD
```

## What to edit

| You want to change | Edit this | Then run |
|--------------------|-----------|----------|
| A WebDriver / Appium / vendor command shape | `packages/wdio-protocols/src/protocols/*.ts` | `pnpm run compile:all` and `pnpm run test:typings:webdriver` |
| A user-facing `browser.*` / `$().*` command | `packages/webdriverio/src/commands/**` plus its unit test and typings snippet | `pnpm run test:package webdriverio` and `pnpm run test:typings:webdriverio` |
| BiDi types | `scripts/bidi/` | `pnpm run generate:bidi` |
| Command API docs text | JSDoc on the webdriverio command | `pnpm run docs:generate` |
| Protocol API docs text | the protocol spec `description` / `ref` | `pnpm run docs:generate` |

See also [High level overview](/docs/flowcharts/highleveloverview). Protocol specs are
owned by `packages/wdio-protocols`; the compiler plugin lives in
`infra/compiler/src/type-generation`.
