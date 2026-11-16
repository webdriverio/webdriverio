# mobilecli as an extra automation protocol in WebdriverIO: investigation and plan

## Context

Goal: let users drive mobile devices through mobilecli (Mobile Next) with the normal WDIO API (`$`, `$$`, `click`, `getText`, `getPageSource`, the `wdio` testrunner), next to Appium. It must be pluggable and live in its own package folder, on a branch.

This file is the working plan and the investigation behind it. It is not published with the package. Update it when a slice lands or a decision changes.

Sources read: mobilecli at HEAD `1103a33` (CHANGELOG 1.0.23), WebdriverIO `main` at `4ef7adc33` (v10.2.0). mobilewright (0.0.69) was only used as a reference for how a client talks to mobilecli. Where mobilecli docs and code disagree, the code is used.

Decisions:
- Shape: a driver package `@wdio/mobilecli-driver` in `packages/wdio-mobilecli-driver`, loaded through `automationProtocol`.
- Selectors v1: portable set (`~accessibility id`, `id=`, class name, XPath). Appium-engine selectors throw "not supported".
- Binary: the user installs mobilecli. The driver detects it (config path, local package, global on PATH) and, if missing, fails with a clear install hint (warning or a small check command). No dependency on mobilecli in WDIO.
- Start small. First slice: connect to an already running device, find an element, click/tap, set a value, get text, get the source (the original mobilecli dump, no XML yet), assert on text, disconnect. Plus a README, and how to develop and test it.

Section 0 is what gets built now. Sections 1 to 6 are the investigation and stay as the reference.

## 0. First slice: what gets built now

### Scope
| Need | WDIO API | How |
|---|---|---|
| Connect to a running device | `remote({ automationProtocol, capabilities })` | Connect to an already running `mobilecli server` (default `http://localhost:12000`), `device.resolve` + `device.info`. Synthetic session id. `platformName` is filled from the resolved device |
| Find | `$`, `$$`, chained `$` | `device.dump.ui`, matched in the driver |
| Click / tap | `click()`, `tap()` | `device.io.tap` at the rect center |
| Set a value | `setValue`, `addValue`, `clearValue` | tap + `device.io.fill ''` (clear), tap + `device.io.text` (type) |
| Get text | `getText()` | node `text`, else `label`, else `value` |
| Get source | `getPageSource()` | the `device.dump.ui` JSON result as a string, untranslated |
| Assert on text | `expect(el).toHaveText()` | works through `getText`, no driver work |
| Disconnect | `deleteSession()` | drop the session and element registry. The device, the app and the server keep running |

Selectors in this slice: `~accessibility id`, `id=`, class name. XPath waits for the XML page source (next slice), since it needs XML to run on. Any other strategy throws an `invalid selector` error that lists what is supported.

Out of this slice on purpose: starting the mobilecli server or detecting the binary (if the server is not reachable, the error says to install mobilecli and run `mobilecli server start`), app install/launch, gestures, screenshots, `reloadSession`, multi-remote attach, webviews.

### Protocol commands the driver implements
Read from the WDIO command sources (`packages/webdriverio/src/commands/element/*.ts`, `utils/index.ts:1211-1290`, `session/context.ts:590-637`):
- Find: `findElement`, `findElements`, `findElementFromElement`, `findElementsFromElement`
- Element: `elementClick`, `getElementText`, `elementClear`, `elementSendKeys`, `getElementTagName` (used by `isExisting` and waits), `isElementDisplayed`, `isElementEnabled`, `getElementRect`, `getElementAttribute`
- Browser: `getPageSource`, `executeScript` (only `mobile: tap` and `mobile: clickGesture`, which is what `tap()` calls), `deleteSession`
- Session start needs: `getWindowHandle` (returns `NATIVE_APP`), `setTimeouts` (stores the value)

Not found returns the `{ error: 'no such element', message }` shape. A registered element that is gone throws an error named `stale element reference`, so WDIO finds it again.

### Files
New package `packages/wdio-mobilecli-driver` (`@wdio/mobilecli-driver`), TypeScript, ESM, MIT, same layout as `packages/wdio-dot-reporter`:

| File | Content |
|---|---|
| `src/index.ts` | default class with static `newSession` (and `attachToSession` / `reloadSession` that throw "not supported yet"). Builds the client like `packages/wdio-browser-runner/src/browser/driver.ts:63-143`: `sessionEnvironmentDetector` + `getEnvironmentVars` + `webdriverMonad`, spreading `userPrototype` |
| `src/rpc.ts` | JSON-RPC 2.0 client over `POST /rpc` with global `fetch`. Turns `error.data` into the error message |
| `src/tree.ts` | types for the dump (`mobilecli/types/screen.go:21-40`), flatten, match by strategy |
| `src/elements.ts` | element registry: id to `{ using, value, index, parentId }`, re-resolved on each command |
| `src/commands.ts` | the protocol commands listed above |
| `src/types.ts`, `src/constants.ts` | options, defaults (`http://localhost:12000`), supported strategies |
| `tests/*.test.ts` | vitest unit tests with a mocked `fetch`: rpc envelope and errors, matching per strategy on iOS and Android fixture trees, each command, not-found and stale paths |
| `README.md` | user docs: what it is, prerequisites, config example, the supported commands and selectors table, known limits |
| `AGENTS.md` | how to develop it and how to test it. The repo rule (`packages/AGENTS.md`) keeps contributor commands out of READMEs, so they go here |
| `PLAN.md` | this plan and the investigation, excluded from the npm package |

Dependencies: `@wdio/utils`, `@wdio/types`, `@wdio/logger`, `webdriver` (all `workspace:*`). No new third-party dependency.

Changes outside the package:
- `infra/createPackage/src/templates.ts`: add `driver` to `PACKAGE_TYPES`, then scaffold with it (repo rule: no hand-made package layout).
- `packages/webdriverio/src/utils/driver.ts` and `src/constants.ts`: resolve `automationProtocol` with the project fallback that services already have (see "How users load it").
- `@wdio/types`: add the `mobilecli:*` capability types (first `mobilecli:udid`), next to the Appium capabilities. See "Capabilities" in section 2.
- An example for the testrunner in `examples/` (next to the existing `examples/wdio` and `examples/appium`): a `wdio.conf.ts` plus one Mocha spec that runs the eight steps of the scope table against a real device.

How users load it: through the testrunner config file. Everything lives in `wdio.conf.ts`, tests stay normal WDIO specs:

```ts
// wdio.conf.ts
export const config: WebdriverIO.Config = {
    runner: 'local',
    framework: 'mocha',
    specs: ['./test/**/*.ts'],
    automationProtocol: '@wdio/mobilecli-driver',
    hostname: 'localhost', // where `mobilecli server start` runs
    port: 12000,
    capabilities: [{
        platformName: 'iOS',
        'mobilecli:udid': '<id from `mobilecli devices`>' // optional when one device is online
    }]
}
```

```ts
// test/login.ts
it('logs in', async () => {
    await $('~username').setValue('alice')
    await $('~login').click()
    await expect($('~welcome')).toHaveText('Welcome alice')
    console.log(await browser.getPageSource())
})
```

Checked in the code that the testrunner allows this:
- The worker passes the whole config, including `automationProtocol`, to `remote()` (`packages/wdio-runner/src/index.ts:333`, `packages/wdio-runner/src/utils.ts:89-99`).
- The launcher only sets up browser drivers for capabilities with a `browserName` (`packages/wdio-utils/src/node/manager.ts:57-70`), so a mobilecli capability is left alone.
- Connect and disconnect are the testrunner's own session start and end, so `deleteSession` is called for the user.

The plain package name is the intended, permanent form. `import.meta.resolve('@wdio/mobilecli-driver')` is only a workaround and should not be what users write. What the code does today:
- `automationProtocol` is imported from inside the `webdriverio` package with plain Node resolution and no fallback (`packages/webdriverio/src/utils/driver.ts:39`, validation in `packages/webdriverio/src/constants.ts:30`).
- In a normal project `webdriverio` sits inside the project's `node_modules`, so by Node's lookup rules the plain name should be found. Not run yet.
- It is not found when `webdriverio` lives outside the project's `node_modules` tree. That is the case in this monorepo (the repo root `node_modules/@wdio` only links `config` and `repl`), and for global installs.
- Service and reporter names do not have this problem: `safeImport` (`packages/wdio-utils/src/utils.ts:235`) first resolves from the package and then falls back to the project's `node_modules`.

So this slice includes one small change in `webdriverio`: load and validate `automationProtocol` with the same resolution fallback that services use (`safeImport`), with a unit test. Then the plain name works everywhere, including the example in this repo.

### Branches and small PRs
- One long-lived integration branch, `feat/mobilecli-driver`, cut from `main`. Nothing goes to `main` until the driver is ready to show.
- Each piece is a short topic branch cut from the integration branch, with a PR that targets the integration branch. One topic per PR, each with its own tests, each reviewable on its own.
- Each PR is verified before review. The next topic branch is cut from the integration branch after the previous PR is merged.

| PR | Topic branch | Content | Proof |
|---|---|---|---|
| 1 | `mobilecli/01-scaffold` | `driver` type in `infra/createPackage`, the scaffolded empty package, `PLAN.md` | package compiles, createPackage tests pass |
| 2 | `mobilecli/02-protocol-resolution` | `automationProtocol` resolves like services do (`webdriverio`). Independent of mobilecli, so it could also go straight to `main` as its own fix | `webdriverio` unit tests |
| 3 | `mobilecli/03-session` | `rpc` client, `newSession` (connect to a running server and device), `deleteSession`, the `mobilecli:udid` capability | unit tests, typings, a testrunner run that connects and disconnects |
| 4 | `mobilecli/04-find-and-source` | `tree`, element registry, the four find commands, `getPageSource` | unit tests on iOS and Android fixture trees, `$`/`$$` on a real device |
| 5 | `mobilecli/05-interactions` | `click`/`tap`, `setValue`/`addValue`/`clearValue`, `getText`, the state commands | unit tests, the full flow with a text assertion on a real device |
| 6 | `mobilecli/06-docs-example` | `README.md`, `AGENTS.md` (develop and test), the testrunner example | example runs end to end with `wdio run` |

Later slices (section 6) continue the same way: one small PR at a time into the integration branch.

### Verification
- `pnpm run dev @wdio/mobilecli-driver` compiles, `pnpm run test:package @wdio/mobilecli-driver` passes, `pnpm run test:typings` passes for the new capability type, `pnpm run test:depcheck` passes.
- Real proof, per `.agents/skills/verify-webdriverio/SKILL.md`: with `mobilecli server start` running and a booted simulator or emulator, run the example with the testrunner (`wdio run` on the example `wdio.conf.ts`) and record the output of each step (find, click, setValue, getText, getPageSource, assertion, session end). This needs mobilecli installed and a device running on the machine. Without that proof a slice is not reported as working.
- The multi-remote spelling check from AGENTS.md prints nothing.

## 1. Key facts

### mobilecli
- Go binary. `mobilecli server start` serves JSON-RPC 2.0 on `localhost:12000`: HTTP `POST /rpc` and WebSocket `/ws`. Registry: `mobilecli/server/dispatch.go:13-82` (66 methods).
- No session concept and no auth. Every call takes `deviceId`. A per-user daemon keeps device and agent state.
- No server-side element finding. Only `device.dump.ui` (full tree, JSON). Element shape: `mobilecli/types/screen.go:21-40` (`type`, `label`, `text`, `name`, `value`, `placeholder`, `identifier`, `rect`, `enabled`, `checked`, `selected`, `focused`, `clickable`, `children`). The `@eN` refs are CLI only, the RPC tap takes `x`,`y` only.
- The dump is already filtered: iOS keeps a whitelist of types that are visible and labelled, Android keeps labelled or clickable nodes. There is no `visible` field and no XML page source (raw uiautomator XML only on an Android fallback path).
- Coordinates: iOS points, Android pixels (same convention as Appium).
- Errors: every device failure is code `-32000` with the detail as a string in `error.data`. No typed error codes.
- Own agents (DeviceKit XCUITest runner on iOS, DeviceServer over adb on Android). Appium cannot run on the same Android device at the same time.
- License: FSL-1.1-ALv2. npm package `mobilecli` with per-platform binaries.

### WebdriverIO
- `automationProtocol` is live on main: `packages/webdriverio/src/utils/driver.ts:39` does `import(options.automationProtocol || 'webdriver')` and calls static `newSession` / `attachToSession` / `reloadSession` (contract: `packages/wdio-types/src/Automation.ts`, documented in `website/docs/Configuration.md:254-308`).
- Precedent of a non-WebDriver driver: `packages/wdio-browser-runner/src/browser/driver.ts` (`ProxyDriver`). It builds its own protocol command functions, spreads `userPrototype`, and reuses `webdriverMonad` + `sessionEnvironmentDetector` + `getEnvironmentVars`.
- All webdriverio commands call protocol commands by name on the client (`elementClick`, `findElement`, ...). A driver that provides functions with those names gets `$`, `click`, waits, reporters and services for free.
- Flags come from capabilities: `platformName: 'iOS' | 'Android'` gives `isMobile`/`isIOS`/`isAndroid`. With no `browserName`, `isNativeContext` is true, so native code paths are used (no JS injection).

## 2. Recommended architecture

One package, `@wdio/mobilecli-driver`, default export a class with static `newSession`, `attachToSession`, `reloadSession`.

```
wdio.conf / remote()            automationProtocol: '@wdio/mobilecli-driver'
        |
webdriverio  getProtocolDriver -> Driver.newSession(options, modifier, userPrototype, wrapCommand)
        |
@wdio/mobilecli-driver
  session      synthetic sessionId, device resolve, app install/launch, teardown
  binary       detect mobilecli, start `server start` if local and not reachable
  rpc          JSON-RPC client over HTTP POST /rpc (global fetch, no extra dependency)
  tree         dump.ui -> node model, element registry, XML page source
  locators     accessibility id / id / class name / xpath, matched client-side
  commands     WebDriver + Appium command NAMES implemented on top of rpc + tree
  execute      `mobile: *` dispatcher and `mobilecli: <method>` raw passthrough
        |
mobilecli server (JSON-RPC) -> daemon -> device agents
```

Why a driver and not a service or plugin: a service runs on top of an existing session, and with mobilecli there is no WebDriver session to create. `overwriteCommand` in a service could replace commands one by one, but `remote()` would still try to start a WebDriver session first. The driver hook is the only existing extension point that replaces session creation, and it needs no change in `webdriverio` to load.

Design choices inside the driver:
- **Transport**: HTTP `/rpc`. Stateless, matches mobilecli's own tests (`mobilecli/test/server.spec.ts`), no `ws` dependency, no 4-concurrent-requests limit.
- **Element ids**: the driver keeps a registry `elementId -> { using, value, index, parentId, last node }`. Each element command re-dumps the tree and re-resolves. Gone means a `stale element reference` error (WDIO's middleware re-finds on that name). Not found returns the `{ error: 'no such element' }` shape WDIO expects.
- **Page source**: generate XML from the JSON tree (tag = `type`, attributes = the element fields plus `x`/`y`/`width`/`height`). XPath runs on this XML. `@xmldom/xmldom` and `xpath` are already used in `packages/wdio-appium-service/package.json`, so the same libraries can be used.
- **Capabilities**: standard ones first. `platformName` (W3C) for the platform, and the server address from the WebdriverIO connection options `hostname`, `port`, `protocol` and `path`. Everything specific to the device or the app uses the `mobilecli:` prefix with the same names as the Appium capabilities: `mobilecli:udid` (first slice), later `mobilecli:deviceName`, `mobilecli:platformVersion`, `mobilecli:app`, `mobilecli:bundleId`, `mobilecli:appPackage`, `mobilecli:appActivity`, `mobilecli:noReset`. The `appium:` prefix is not used, since it is Appium's namespace. Reporters read `appium:deviceName`, `appium:platformVersion` and `appium:udid` by name, so `@wdio/reporter` needs a small change to also read the `mobilecli:` ones.
- **Binary**: lookup order `binaryPath` option, local `mobilecli` npm package, `mobilecli` on PATH. Missing: throw an error with the install command. `server.info` gives the version, compared against a tested range with a warning. A small check command can come later.
- **Escape hatch**: `browser.execute('mobilecli: device.fold.set', { state: 'open' })` forwards any RPC method, same idea as Appium's `mobile:`.

## 3. Command map: WDIO to mobilecli

Legend: OK = works, PART = works with limits, NO = no mobilecli equivalent, P3 = webview phase.

### Session and device
| WDIO | mobilecli | Status |
|---|---|---|
| `remote()` / new session | `devices.list` or `device.resolve`, `device.info`, optional `device.apps.install` + `device.apps.launch` | OK (session is synthetic) |
| `deleteSession` | optional `device.apps.terminate`, stop server if the driver started it | OK |
| `reloadSession` | terminate + launch, new synthetic id | OK |
| `attach` / multi-remote | `attachToSession` reconnects by device id | OK |
| `getWindowSize` | `device.info` (`screenSize`) | OK |
| `getOrientation` / `setOrientation` | `device.io.orientation.get/set` | OK (portrait, landscape only) |
| `setTimeout` / implicit wait | client-side value | OK |
| `status` | `server.info` | OK |

### Finding elements
| WDIO | mobilecli | Status |
|---|---|---|
| `$('~id')`, `$('id=x')`, class name, XPath, `$$`, chained `$` | `device.dump.ui` + client-side match | OK |
| `-ios predicate string`, `-ios class chain`, `-android uiautomator`, datamatcher, viewmatcher, `-image` | none | NO (clear error) |
| CSS (the default for plain strings) | none in native | NO (clear error), P3 in webviews |
| `getPageSource` | `device.dump.ui` converted to XML | PART (not the Appium XML; tree is pre-filtered) |

### Element commands
| WDIO | mobilecli | Status |
|---|---|---|
| `click` | dump + `device.io.tap` at rect center | OK |
| `click({ duration })`, `longPress` | `device.io.longpress` | OK |
| `doubleClick` | `device.io.gesture` | PART (mobilecli docs: timing trick is iOS only) |
| `getText` | node `text`, else `label`, else `value` | OK |
| `getAttribute` | node fields, with Appium names mapped (`content-desc`, `resource-id`, `label`, `name`, `value`, ...) | PART (only the fields in the dump) |
| `getTagName`, `isExisting` | node `type` | OK |
| `isDisplayed` | in dump with non-zero rect inside the screen | PART (no real `visible` flag) |
| `isEnabled`, `isSelected` | `enabled`, `selected` / `checked` | OK |
| `setValue`, `clearValue` | tap + `device.io.fill` (`''` clears) | OK |
| `addValue` | tap + `device.io.text` | OK |
| `getValue` | node `value` | OK |
| `getLocation`, `getSize` | node `rect` | OK |
| `saveScreenshot` (element) | `device.screenshot` with `clip` | OK |
| `scrollIntoView`, `swipe`, `dragAndDrop` | `device.io.swipe` / `device.io.gesture` | OK |
| `getCSSProperty`, `getHTML`, `shadow$` | none | NO (web only) |

### Browser and mobile commands
| WDIO | mobilecli | Status |
|---|---|---|
| `takeScreenshot`, `saveScreenshot` | `device.screenshot` | OK |
| `action('pointer')` / `actions` | `device.io.gesture` (multi-finger supported) | OK |
| `keys`, key actions | `device.io.text`, `device.io.keys` | PART |
| wheel actions | none | NO |
| `tap` (`mobile: tap` / `clickGesture`) | `device.io.tap` | OK |
| `pinch`, `zoom` | `device.io.pinch` | OK |
| `url`, `deepLink` | `device.url` | OK |
| `launchApp` / `activateApp` | `device.apps.launch` | OK |
| `closeApp` / `terminateApp` | `device.apps.terminate` | OK |
| `installApp`, `removeApp`, `isAppInstalled` | `device.apps.install`, `.uninstall`, `.list` | OK (install path is on the server host) |
| `getCurrentPackage`, `getCurrentActivity`, `mobile: activeAppInfo` | `device.apps.foreground` | OK |
| `queryAppState` | `device.apps.foreground` + `.list` | PART (foreground / not running / not installed only) |
| `relaunchActiveApp` | foreground + terminate + launch | OK |
| `background(seconds)` | `device.io.button HOME` + launch | PART |
| `startActivity` | `device.apps.launch` with `activity` | PART (Android) |
| `getClipboard`, `setClipboard` | `device.clipboard.get/set` | OK (text only) |
| `hideKeyboard`, `isKeyboardShown` | `device.io.keyboard.hide/status` | PART (real iOS: debuggable apps only) |
| `pressKeyCode`, `sendKeyEvent` | `device.io.button` for mapped codes (HOME, BACK, ENTER, volume, dpad, APP_SWITCH) | PART |
| `back` | `device.io.button BACK` | PART (Android only, iOS has no back button) |
| `lock` | `device.io.button` LOCK (iOS) / POWER (Android) | PART |
| `setGeoLocation` | `device.location.set` | OK |
| `pushFile`, `pullFile` | `device.fs.push/pull` | PART (1 MB limit, not on real iOS) |
| `startRecordingScreen`, `stopRecordingScreen` | `device.screenrecord`, `.stop` | PART (writes an MP4 on the host; driver reads it back) |
| `getLogs` | `device.logs` (NDJSON stream) | PART (later phase) |
| `acceptAlert`, `dismissAlert`, `getAlertText`, `acceptDialog` | none; possible with tree heuristics like mobilewright does | NO in v1 |
| `unlock`, `isLocked`, `shake`, `touchId`, `fingerPrint`, `toggleEnrollTouchId` | none (biometrics and shake are "Planned" in mobilecli ROADMAP) | NO |
| `toggleAirplaneMode`, `toggleWiFi`, `toggleData`, `toggleLocationServices`, `toggleNetworkSpeed`, `gsm*`, `sendSms`, `power*` | none | NO |
| `openNotifications`, `getSystemBars`, `getDisplayDensity`, `getStrings`, `getPerformanceData*`, `longPressKeyCode`, `getDeviceTime`, `getSettings`/`updateSettings` | none | NO |
| `getContexts`, `switchContext`, `getContext` | `device.webview.list` | P3 (v1 returns only `NATIVE_APP`) |
| `execute` (JS), `getTitle`, `getUrl`, `back`/`forward`/`refresh` in a webview | `device.webview.evaluate/title/url/goBack/goForward/reload/goto` | P3 (debuggable apps, visible tab only) |
| `$` with CSS inside a webview | only via `device.webview.evaluate` | P3 (largest single item) |
| cookies, windows, frames, mocks, BiDi, `savePDF`, `emulate` | none | NO |

### mobilecli methods with no WDIO command today
Reachable through the `mobilecli:` passthrough: `device.boot`, `device.shutdown`, `device.reboot`, `device.fold.set`, `device.voiceover.*`, `device.settings.apply` (animations, appearance), `device.apps.clear`, `device.apps.path`, `device.crashes.list/get`, `device.fs.ls/mkdir/rm`, `device.location.clear`, `device.screencapture` (live MJPEG/AVC stream).

## 4. What WDIO needs to change

Nothing in `webdriverio` is required to load the driver. Needed work, by owner:

| Change | Owner | Why |
|---|---|---|
| New package `@wdio/mobilecli-driver` | `packages/wdio-mobilecli-driver` | The driver itself |
| Add a `driver` package type | `infra/createPackage/src/templates.ts` (`PACKAGE_TYPES`) | `pnpm run create` only knows reporter, service, runner, framework, tool. AGENTS.md forbids hand-made layouts |
| Types for the `mobilecli:*` capabilities | `@wdio/types` (capabilities) | Shared capability types live there |
| Docs: `automationProtocol` text says "only webdriver is supported" | `website/docs/Configuration.md:258`, package README, `.github/OWNERSHIP.md` | Docs and ownership |
| Test lanes for the new package | `infra/repo-tools`, `.github/workflows/test.yml` | Scoped tests and CI |

Not planned: a spec file in `@wdio/protocols`. Those specs describe HTTP endpoint + method pairs, and mobilecli is JSON-RPC. The RPC method types stay inside the driver package.

To verify in a spike before building (these are unknowns, not assumptions):
1. Module resolution: `import('@wdio/mobilecli-driver')` runs from inside the `webdriverio` package (`driver.ts:39`, `constants.ts:30`). With pnpm's strict layout a bare name may not resolve from there. If it fails, either users pass an absolute path or `webdriverio` needs a small change to resolve from the project root.
2. Session start calls: `ContextManager.initialize()` (`packages/webdriverio/src/session/context.ts:590-637`) calls `getWindowHandle()` when no mobile context is known. The driver must answer `getWindowHandle` and `getContext` (for example with `NATIVE_APP`).
3. Which protocol command each native code path of `getValue`, `isDisplayed`, `scrollIntoView` and `swipe` really calls, to fix the minimal command list.
4. Parallel workers: several workers probing and starting one server on port 12000, and two workers picking the same device. mobilecli has no local device pool (only cloud `remote allocate`). v1 proposal: require an explicit `deviceId` per capability when more than one device is online.
5. How reporters and services behave with a synthetic session id and no `hostname`/`port`.

## 5. Risks and limits to state up front

- Feature parity with Appium is not reachable: no engine selectors, no alerts API, no biometrics/network toggles, filtered UI tree (elements without a label can be missing on iOS).
- Stale handling is emulated; a re-dump per command costs time (`device.dump.ui` has a 60 s server deadline).
- Error mapping depends on message strings, since mobilecli returns `-32000` for everything.
- mobilecli moves fast (1.0.23, docs and OpenRPC already drift from the code). Pin a tested version range.
- License FSL-1.1-ALv2: handled by "user installs it", but worth a heads-up to the WDIO TSC before a PR.
- Real iOS devices need a signed agent (`mobilecli agent install` with a provisioning profile). Webviews need debuggable apps.

## 6. Phases (for later, after the investigation is accepted)

0. First slice (section 0, built now).
1. Rest of the native MVP: XML page source and XPath, binary detection with the install hint and server auto-start, app install/launch/terminate, screenshots, orientation, gestures, `reloadSession`, attach.
2. Mobile commands: full `mobile:` dispatcher, `mobilecli:` passthrough, clipboard, keyboard, files, location, recording, key codes.
3. Webviews: contexts from `device.webview.list`, JS execute, navigation, DOM finding.
4. Testrunner polish: device allocation across workers, optional launcher service, `create-wdio` wizard entry, docs site.
