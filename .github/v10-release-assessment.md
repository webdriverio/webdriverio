# WebdriverIO v10 Housekeeping Release Assessment

Maintainer tracking document for the v10 major. v9 shipped 15 August 2024; majors land about once a year, so everything that needs a breaking cut should be decided here.

Scope: this monorepo (`webdriverio`, `@wdio/*`, `create-wdio`, `eslint-plugin-wdio`). Ecosystem packages (`expect-webdriverio`, `@wdio/visual-service`, third-party services) are called out only where they block or follow the cut.

Current baseline: **v9.31.x**, `engines.node: ">=18.20.0"`, CI matrix `20 / 22 / 24 / 26`.

---

## Recommended Node.js floor

**Require Node.js `>=22.19.0`. Test `22`, `24`, and `26`. Drop `18` and `20`.**

| Version | Status (20 Sep 2026) | EOL |
| --- | --- | --- |
| 18 | EOL | 30 Apr 2025 |
| 20 | EOL | 30 Apr 2026 |
| 22 | Maintenance LTS | 30 Apr 2027 |
| 24 | Active LTS | 30 Apr 2028 |
| 26 | Current → LTS 28 Oct 2026 | 30 Apr 2029 |

Why `22.19.0` and not a looser `>=22`:

- [`@puppeteer/browsers@3`](https://github.com/webdriverio/webdriverio/pull/15553) needs `>=22.12.0` (CVE-2026-19693 / `extract-zip`).
- [Lighthouse 13](https://github.com/webdriverio/webdriverio/pull/15635) needs `>=22.19.0`.
- Mocha 12 needs `>=20.19.0 || >=22.12.0`.
- Cucumber 13 dropped Node 20.

v9 required `>=18.20.0` while Node 18 had ~8 months of support left at release. Requiring 22 with ~7 months of Maintenance LTS left is the same policy. Requiring **24+ only** would be more aggressive than previous majors and is not recommended unless the team wants to drop `urlpattern-polyfill` and lean on Node 24 globals.

Existing work: [#15136](https://github.com/webdriverio/webdriverio/pull/15136) (Node 22/24/26), closed duplicate [#15236](https://github.com/webdriverio/webdriverio/pull/15236). Rebase 15136 onto current `main` and raise the floor from `>=22` to `>=22.19.0` so Lighthouse 13 and puppeteer/browsers 3 can land in the same cut.

Align these at the same time (they currently disagree):

| Surface | Today |
| --- | --- |
| Every published `engines.node` | `>=18.20.0` (`@wdio/protocols` has none) |
| Root `package.json` | no `engines.node` |
| `create-wdio` semver gate | `>=18.18.0` |
| `create-wdio` error copy | “update to Node.js v20” |
| `@types/node` | `^20.x` across the monorepo |
| CLI `--import` vs `--loader` | still branches for Node 18/20 (`packages/wdio-cli/src/launcher.ts`) |
| Docs mentioning Node 18 | `website/docs/CloudServices.md`, `website/docs/devtools/Selenium.md` |

---

## Priority 0 — already scheduled or blocked on v10

These have in-tree `TODO in v10` markers, a `v10` label, or cannot ship on v9.

### 0.1 Drop Node 18 and 20

See above. Also drop the `--loader` path and `nodeVersion()` helper in `@wdio/cli` once `--import` is universal.

### 0.2 Upgrade `@puppeteer/browsers` to v3

Open PR: [#15553](https://github.com/webdriverio/webdriverio/pull/15553) (`v10` + `PR: Breaking Change`). Fixes CVE-2026-19693. Maintainers already said this cannot land on v9.

### 0.3 Browser build target: Safari 12 → Safari 14.1

`infra/compiler/src/index.ts` still targets `['es2021', 'chrome90', 'edge90', 'firefox90', 'safari12']`. esbuild 0.28.1 cannot emit valid destructuring for Safari 12; [#15324](https://github.com/webdriverio/webdriverio/pull/15324) kept Safari 12 by setting `supported.destructuring = true` and marked both the target bump and the shim as **TODO in v10**.

v10 should:

- target `safari14.1` (and consider bumping Chrome/Edge/Firefox floors)
- remove the `destructuring` workaround

### 0.4 Make MultiRemote `$$` return an ElementArray

`process.env.WDIO_ENABLE_MULTI_REMOTE_ELEMENT_ARRAY` is a v9 beta gate. Comments in `packages/webdriverio/src/multiremote.ts` say **remove the flag in v10** and introduce a real `MultiRemoteElementArray` type (also `packages/webdriverio/src/types.ts`). Merged precursor: [#15532](https://github.com/webdriverio/webdriverio/pull/15532).

Default the new behavior, delete the env var, stop casting.

### 0.5 Remove runner shims marked “remove in v10”

| Shim | File |
| --- | --- |
| `LegacyCustomStubCommand` positional `addCommand` tuple | `packages/wdio-runner/src/types.ts` |
| `setupExpect` Map overload (`wdioMatchers.entries()`) | `packages/wdio-runner/src/types.ts`, shim in `src/index.ts` |

Framework adapters that still pass a `Map` of matchers must switch to `Object.entries(wdioMatchers)`.

### 0.6 Rename `WebdriverIO.MultiremoteConfig`

`packages/wdio-types/src/index.ts` is already annotated: rename to `MultiRemoteConfig` in v10 (camelCase, match `MultiRemoteBrowser`). Keep a deprecated alias for one major only if ecosystem types still import the old name.

### 0.7 Replace `@wdio/xvfb` with `@wdio/display-server`

Open PR: [#15088](https://github.com/webdriverio/webdriverio/pull/15088) (`PR: Breaking Change`, WIP). Hard cut, no xvfb back-compat:

- `autoXvfb` / `xvfbAutoInstall` / `xvfbAutoInstallMode` / `xvfbAutoInstallCommand` / `xvfbMaxRetries` / `xvfbRetryDelay` → `displayServer*`
- `XvfbManager` → `DisplayServerManager`
- package rename

Types already live in `packages/wdio-types/src/Options.ts`. This is the last chance to land it without another major.

---

## Priority 1 — deprecated public APIs promised for the next major

Ship these in v10 or they sit another year.

### Commands to delete

| Command | Replacement | Notes |
| --- | --- | --- |
| `browser.executeAsync` / `element.executeAsync` | `execute` | Docs already say “removed in a future version”. `scrollIntoView` still calls it internally — rewrite first. |
| `browser.touchAction` / `element.touchAction` | `browser.action('pointer', …)` | Same “future version” wording. |
| `browser.throttle` | `throttleNetwork` | Explicitly “next major version release”. |

Keep `switchToFrame` as an **internal** protocol call (`switchFrame.ts` still needs it). Do not keep it as a user-facing command; it is already deprecated in `packages/wdio-protocols/src/protocols/webdriver.ts`.

### Legacy command signatures

| Legacy | Replacement |
| --- | --- |
| `addCommand(name, fn, attachToElement, proto?, instances?)` | options object as 3rd argument (`packages/webdriverio/src/types.ts`, `wdio-utils/src/monad.ts`, runner stub replay) |
| `overwriteCommand(..., attachToElement, …)` positional | same options object (not tagged `@deprecated` but the same API) |
| `getCookies(name \| string[])` / `getCookie(string)` | BiDi / classic object filter (`getCookies.ts` already warns) |
| `getHTML(includeSelectorTag: boolean)` | `getHTML({ includeSelectorTag })` |
| `newWindow(url, { windowName, windowFeatures })` | drop Classic-only options (already warned) |
| `startActivity` positional args | object form (`commands/mobile/startActivity.ts`) |

### Config, globals, reporter APIs

| Deprecated | Replacement | Location |
| --- | --- | --- |
| global `multiremotebrowser` | `multiRemoteBrowser` | `@wdio/globals`, `webdriverio` async types, eslint globals |
| `cucumberOpts.tagExpression` | `cucumberOpts.tags` | `@wdio/cucumber-framework` |
| `jasmineOpts.failFast` | `stopOnSpecFailure` | `@wdio/jasmine-framework` |
| top-level `jasmineNodeOpts` | `jasmineOpts` | `@wdio/jasmine-framework` (`@ts-expect-error` today) |
| Allure `addEnvironment(name, value)` | `reportedEnvironmentVars` | already a no-op that only warns |
| `AfterCommandArgs.name` | `command` | `@wdio/reporter` — comment in `wdio-utils/src/monad.ts`: “To remove one day!” |
| capability `specs` / `exclude` | `wdio:specs` / `wdio:exclude` | `@wdio/cli` launcher |
| Sauce `tunnelIdentifier` / `parentTunnel` | `tunnelName` / `tunnelOwner` | `@wdio/types` Capabilities |
| exported `Element` / `MultiRemoteBrowser` / `MultiRemoteElement` interfaces | `WebdriverIO.*` | `packages/webdriverio/src/types.ts` |

### MultiRemote instance attachment

`packages/webdriverio/src/multiremote.ts` still copies each browser onto the wrapper as `client[identifier]` with `ToDo(Christian): deprecate and remove`. v10 should stop attaching instances as enumerable own properties and require `select(...)` / `getInstance(...)` instead. That is a real user-facing break for `browser.chrome.$('…')`-style access — land it now or it waits another year.

`WDIO_ENABLE_MULTI_REMOTE_SELECT` should become the default (or the only path) in the same cut. `select()` is still `@experimental (Beta)` in types.

---

## Priority 2 — dependency majors unlocked by the Node bump

v9 is stuck on old majors because of Node 18/20. Once the floor is 22.19, take the upgrades in the same release.

| Dependency | In tree | Target | Why it is a v10 item |
| --- | --- | --- | --- |
| `@puppeteer/browsers` | 2.x | 3.x | [#15553](https://github.com/webdriverio/webdriverio/pull/15553), CVE |
| `lighthouse` | **8.6.0** (pinned) | **13.x** | [#15635](https://github.com/webdriverio/webdriverio/pull/15635) ready for merge; LH 12 removed the PWA category (`checkPWA` rewritten via CDP) |
| `mocha` | **10.8.2** | **12.x** (or 11.x first) | [#15566](https://github.com/webdriverio/webdriverio/pull/15566) landed Mocha 11 and was reverted ([#15593](https://github.com/webdriverio/webdriverio/pull/15593)) because it broke `expect-webdriverio` playgrounds ([#15589](https://github.com/webdriverio/webdriverio/issues/15589)). Mocha 12 also drops Node 18 and is ESM-first. **Coordinate with `expect-webdriverio` before the cut.** Also drop leftover `mochaOpts.compilers` if Mocha 12 no longer supports it. |
| `@cucumber/cucumber` | **10.3.1** | **12 or 13** | Cucumber 13 drops Node 20 and removes deprecated `Cli` / ambiguous formats. Adapter + formatter will need a dedicated PR. |
| `jasmine` | ^5.0.0 | latest 5.x / 6 if released | Confirm whether Jasmine 6 exists and what it breaks. |
| `yargs` | ^17.7.2 | 18.x | CLI + `create-wdio`. |
| `vite` | ^6.4.3 | 7.x if stable | `@wdio/browser-runner`. Closed attempt: [#15407](https://github.com/webdriverio/webdriverio/pull/15407). |
| `puppeteer-core` peer | `>=22.x <=24.x` | include 25+ if current | `webdriverio` + lighthouse-service. |
| `@types/node` | ^20.x | ^22.x (or ^24.x) | Matches the new engine. |
| `typeScriptVersion` field | **3.8.3** on ~38 packages | current supported TS (5.8+ / 6 if ready) | Published API floor is a decade behind the compiler used in-repo (`typescript@^5.8.3`). |
| `eslint-plugin-wdio` | ESLint 9 + peer 10 allowed | drop ESLint 8/legacy `recommended` if unused | [#15165](https://github.com/webdriverio/webdriverio/pull/15165) already allows ESLint 10. v10 can drop the eslintrc `recommended` export and keep `flat/recommended` only. |
| `vitest` (dev) | 3.x | 4.x | [#15581](https://github.com/webdriverio/webdriverio/pull/15581) closed; retry after the Node bump. |
| `deepmerge-ts` | 8.x just landed | keep | [#15509](https://github.com/webdriverio/webdriverio/pull/15509); revert attempt [#15590](https://github.com/webdriverio/webdriverio/pull/15590). |

Do **not** treat Lighthouse 13 as optional. The service is still on Lighthouse 8 internals (`lighthouse-core`, Driver, gatherer paths). That is the largest dependency debt in the repo.

---

## Priority 3 — worth deciding now (not already marked v10)

### 3.1 CJS dual-publish

v8 moved the project to ESM and kept CJS wrappers. Dual-publish is still on:

`webdriver`, `webdriverio`, `@wdio/cli`, `@wdio/cucumber-framework`, `@wdio/shared-store-service`, `@wdio/globals`, `@wdio/logger`, `@wdio/reporter`, `@wdio/allure-reporter`, `@wdio/junit-reporter`, `@wdio/json-reporter` (partial), `eslint-plugin-wdio`.

Plus `index.cts` shims, `tests/interop`, and `@wdio/smoke-test-cjs-service`.

**Recommendation:** keep CJS for the user-facing entrypoints (`webdriverio`, `@wdio/cli`, reporters that people `require()`). Dropping CJS is a larger migration than a housekeeping major and is not required by the Node bump. Revisit only if CJS wrappers are actively broken (see closed [#14854](https://github.com/webdriverio/webdriverio/pull/14854)).

### 3.2 Polyfills

| Polyfill | Drop in v10? |
| --- | --- |
| `AbortSignal.any` (`packages/webdriver/src/request/polyfill.ts`) | **Yes** if min Node is 22.19 (`AbortSignal.any` exists since 20.3 / 22). |
| `urlpattern-polyfill` | **No** if min Node is 22. Native `URLPattern` is a global only from Node 24 and is still experimental. Keep the polyfill. |
| Session / execute `__name` polyfill | Keep — esbuild/tsx, not Node-version related. |
| Browser-runner Node built-in polyfills | Keep — browser environment. |

### 3.3 JSONWP / MJSONWP leftovers

v9 removed JSON Wire Protocol commands and pointed leftovers at `@wdio/jsonwp-service`. The monorepo still has:

- `packages/wdio-protocols/src/protocols/mjsonwp.ts`
- mobile sessions merging MJSONWP + Appium (`packages/webdriver/src/utils.ts`)
- JSONWP `status` / `ELEMENT` response parsing
- reporter reads of `browser_version` / `platform`
- mobile commands falling back to deprecated Appium 2 HTTP endpoints (`packages/webdriverio/src/utils/mobile.ts`)

**Recommendation:** do not delete MJSONWP wholesale — Appium still uses pieces of it. Do remove WDIO-owned fallbacks that already have `mobile:` execute replacements, and stop advertising JSONWP in `packages/webdriver/README.md`. Appium 3 command renames already landed ([#15141](https://github.com/webdriverio/webdriverio/pull/15141)).

### 3.4 ElementArray rewrite

Open PR: [#14285](https://github.com/webdriverio/webdriverio/pull/14285) (`for await` of `$$`, class instead of shim). Not labelled breaking, but changing `$$` identity is easy to get wrong. If it changes `instanceof`, spread, or matcher iteration, it belongs in v10 next to MultiRemote ElementArray. If it is purely additive, it can still land on v9.

### 3.5 Firefox profile `legacy: true`

`@wdio/firefox-profile-service` still documents `legacy` for Firefox ≤55. Safe to delete.

### 3.6 Stabilize or drop beta MultiRemote `select()`

`select()` is env-gated and `@experimental`. Either promote it (with `WDIO_ENABLE_MULTI_REMOTE_SELECT` default-on) or remove the beta before people depend on it. Related: [#15538](https://github.com/webdriverio/webdriverio/pull/15538), [#15571](https://github.com/webdriverio/webdriverio/pull/15571), [#15459](https://github.com/webdriverio/webdriverio/pull/15459).

---

## Open PRs that look breaking but are not v10-required

| PR | Notes |
| --- | --- |
| [#15506](https://github.com/webdriverio/webdriverio/pull/15506) | macOS `url()` Classic fast-path; return type becomes `undefined` without BiDi options. Breaking only on darwin. Can ship in v9 if documented, or ride along with v10. |
| [#15635](https://github.com/webdriverio/webdriverio/pull/15635) | Lighthouse 13 — public WDIO commands stay the same, but `engines.node` becomes `>=22.19.0` on that package only. Fold into the monorepo-wide engine bump rather than shipping a split engine graph. |
| [#15618](https://github.com/webdriverio/webdriverio/pull/15618) | Expose Appium commands on non-mobile Appium sessions. Additive; not a v10 blocker. |
| [#15487](https://github.com/webdriverio/webdriverio/pull/15487) | `@wdio/deepagent`. New package; not housekeeping. |
| [#14352](https://github.com/webdriverio/webdriverio/pull/14352) | `defineConfig` UX. Additive. |
| [#13220](https://github.com/webdriverio/webdriverio/pull/13220) | Parallel tests in one process. Feature, not a cleanup break. |
| [#14964](https://github.com/webdriverio/webdriverio/pull/14964) | `accessibility/` selector. Additive. |
| [#15015](https://github.com/webdriverio/webdriverio/pull/15015) | linux-arm64 Chromedriver. Additive. |

---

## Packages: keep vs extract vs ignore

Internal-only packages (`@wdio/smoke-test-*`, `@wdio/webdriver-mock-service`) are not user-facing and do not need a major. Do not spend the v10 cut on extracting them.

Niche but public: `@wdio/sumologic-reporter`, `@wdio/testingbot-service`, `@wdio/static-server-service`, `@wdio/concise-reporter`, `@wdio/dot-reporter`, `@wdio/firefox-profile-service`, `@wdio/repl`. No removal request found. Leave them unless a committer wants a dedicated extraction RFC.

`@wdio/visual-service` already shipped its own v10 (Pixelmatch) in the visual-testing repo. Docs in this repo already describe that break. No further visual engine change is required here.

---

## Ecosystem coordination

1. **`expect-webdriverio`** — Mocha 11 already broke playgrounds ([#15589](https://github.com/webdriverio/webdriverio/issues/15589)). Fix or pin that repo before Mocha 11/12 lands here. Matcher `featureFlags` used in e2e (`useToHaveTextStrictMultiElementsCompareStrategy`) should become default or be removed in the same release train.
2. **`@wdio/codemod`** — add transforms for deleted commands, `tagExpression` → `tags`, `addCommand` positional → options, `multiremotebrowser` → `multiRemoteBrowser`, `getHTML(boolean)`, `getCookies(string[])`, xvfb config keys.
3. **Third-party services** (BrowserStack, LambdaTest, etc. live outside this monorepo) — they consume `engines.node` and custom-command shims. Announce the Node floor early.
4. **`@wdio/visual-service`** — already on v10; no action.

---

## Suggested implementation order

1. Rebase and land [#15136](https://github.com/webdriverio/webdriverio/pull/15136) with `engines.node: ">=22.19.0"`, `@types/node@^22`, CI `['22','24','26']`, `create-wdio` gate + copy, CLI `--import` only.
2. Land [#15553](https://github.com/webdriverio/webdriverio/pull/15553) and [#15635](https://github.com/webdriverio/webdriverio/pull/15635) immediately after.
3. Compiler Safari 14.1 + drop destructuring shim.
4. Delete P1 commands and signatures; update docs + codemod.
5. MultiRemote: default ElementArray + `select()`, rename `MultiremoteConfig`, decide on `client[identifier]`.
6. Runner shim removal (`LegacyCustomStubCommand`, matcher `Map`).
7. Framework/reporter deprecations (`tagExpression`, `failFast`, `jasmineNodeOpts`, Allure `addEnvironment`, reporter `name`).
8. Mocha 12 + Cucumber 12/13 + yargs 18, after `expect-webdriverio` is green.
9. [#15088](https://github.com/webdriverio/webdriverio/pull/15088) display-server / drop `@wdio/xvfb`.
10. Docs: v10 blog post + `website/docs/v10Migration.md` (same shape as `v7-migration`).
11. Cut `v9` maintenance branch before publishing 10.0.0.

---

## Checklist (copy into the v10 tracking issue)

### Runtime and build

- [ ] `engines.node: ">=22.19.0"` on every published package (including `@wdio/protocols`)
- [ ] Root + website engines aligned
- [ ] `@types/node@^22`
- [ ] `create-wdio` version gate and error message
- [ ] CI / e2e / smoke / component / interop / Devcontainer Node matrices
- [ ] Remove CLI `--loader` branch
- [ ] `@puppeteer/browsers@3`
- [ ] Lighthouse 13
- [ ] esbuild target `safari14.1`; remove `supported.destructuring`
- [ ] Drop `AbortSignal.any` polyfill
- [ ] Bump published `typeScriptVersion`

### Deleted / changed public API

- [ ] Remove `executeAsync`, `touchAction`, `throttle`
- [ ] Remove positional `addCommand` / `overwriteCommand` / `LegacyCustomStubCommand`
- [ ] Remove `getCookies`/`getCookie` string filters
- [ ] Remove `getHTML(boolean)`
- [ ] Remove `newWindow` Classic-only options
- [ ] Remove `multiremotebrowser` global
- [ ] Remove `cucumberOpts.tagExpression`
- [ ] Remove `jasmineOpts.failFast` and `jasmineNodeOpts`
- [ ] Remove Allure `addEnvironment`
- [ ] Remove reporter `AfterCommandArgs.name`
- [ ] Remove capability `specs` / `exclude`
- [ ] Remove Sauce `tunnelIdentifier` / `parentTunnel`
- [ ] Remove deprecated `Element` / `MultiRemote*` type exports
- [ ] Rename `MultiremoteConfig` → `MultiRemoteConfig`
- [ ] Default MultiRemote ElementArray; delete `WDIO_ENABLE_MULTI_REMOTE_ELEMENT_ARRAY`
- [ ] Default or remove `WDIO_ENABLE_MULTI_REMOTE_SELECT`; stabilize `select()`
- [ ] Decide: remove `client[identifier]` MultiRemote attachment
- [ ] Remove `setupExpect` Map overload
- [ ] Hide `switchToFrame` from the public command list
- [ ] Drop Firefox profile `legacy`
- [ ] Drop eslint-plugin-wdio eslintrc `recommended` (optional)

### Dependencies

- [ ] Mocha 12 (after expect-webdriverio)
- [ ] Cucumber 12 or 13
- [ ] yargs 18
- [ ] Vite 7 (if ready)
- [ ] puppeteer-core peer range
- [ ] Jasmine latest

### Platform

- [ ] `@wdio/display-server` replaces `@wdio/xvfb` ([#15088](https://github.com/webdriverio/webdriverio/pull/15088))

### Docs / release

- [ ] `website/docs/v10Migration.md`
- [ ] v10 blog post
- [ ] `@wdio/codemod` transforms
- [ ] `v9` maintenance branch
- [ ] Node 18 mentions in docs (`CloudServices.md`, `devtools/Selenium.md`, `MocksAndSpies.md`)

---

## Out of scope for this major

- New product features that do not require a break (`@wdio/deepagent`, `defineConfig` UX, accessibility selector, single-process parallel, linux-arm64 chromedriver).
- Dropping CJS (see 3.1).
- Dropping `urlpattern-polyfill` while Node 22 is supported.
- Deleting MJSONWP / Appium HTTP fallbacks that still have no `mobile:` equivalent.
- Extracting internal smoke-test packages.
- Visual-testing engine work (already shipped as `@wdio/visual-service` v10).
