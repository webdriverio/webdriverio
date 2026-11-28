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
| Install and start an app | capability `mobilecli:app` | Added to the slice on request. Session start: `device.apps.install`, then `device.apps.launch` with the `app.packageName` of the install result |
| Find | `$`, `$$` | `device.dump.ui`, matched in the driver |
| Click / tap | `click()`, `tap()` on an element | mobilecli has no click: both are one driver command, `device.io.tap` in the middle of the element |
| Set a value | `setValue`, `addValue`, `clearValue` | tap + `device.io.fill ''` (clear), tap + `device.io.text` (type) |
| Get text and value | `getText()`, `getValue()` | read from the node in `device.dump.ui` |
| Get source | `getPageSource()` | the `device.dump.ui` JSON result as a string, untranslated |
| Assert on text | `expect(el).toHaveText()` | works through `getText`, no driver work |
| Disconnect | `deleteSession()` | drop the session and element registry. The device, the app and the server keep running |

Selectors in this slice: `~accessibility id`, `id=`, class name. XPath waits for the XML page source (next slice), since it needs XML to run on. Any other strategy throws an `invalid selector` error that lists what is supported.

Out of this slice on purpose: starting the mobilecli server or detecting the binary (if the server is not reachable, the error says to install mobilecli and run `mobilecli server start`), app launch and stop during a test, uninstall, gestures, screenshots, `reloadSession`, multi-remote attach, webviews.

### Protocol commands the driver implements
Read from the WDIO command sources (`packages/webdriverio/src/commands/element/*.ts`, `utils/index.ts:1211-1290`, `session/context.ts:590-637`):
The slice was cut back to the basics on request (2026-11-17): only what the list above needs, and only what mobilecli has a call for. The order of thinking is Mobilewright first (it also runs on mobilecli, source in `mobilewright-core/src/locator.ts` and `driver-mobilecli/src/driver.ts`), then the WebdriverIO API: a WDIO command does what its Mobilewright counterpart does, with the same calls. How WDIO itself sends a command (for example `tap()` as an Appium script) is not followed. The commands are split the way WebdriverIO splits its own, one file per command:
- Browser commands (`src/commands/browser`), about the device and its screen: `findElement`, `findElements`, `getPageSource`, `hideKeyboard`, `isKeyboardShown`, `deleteSession`
- Element commands (`src/commands/element`), with an element id as first parameter: `elementClick`, `elementClear`, `elementSendKeys`, `getElementText`, `getElementProperty` (only `value`, for `getValue()`), `isElementDisplayed`, `isElementEnabled` (both for the wait commands), and `setElementValue`, which is not a WebDriver command and not a command of the session
- WDIO API commands that the driver replaces on elements (`getApiCommands` in `src/commands/index.ts`, set with `overwriteCommand`): only `tap` and `setValue`. `tap()` is `click()` (it goes through `click()` and not `elementClick`, because WDIO waits for a missing element in `click()` and skips that wait in `tap()`), and `setValue()` is one `setElementValue` (tap + `device.io.fill` with the text, as `locator.fill()`) in place of `elementClear` + `elementSendKeys`. `setElementValue` is internal on request (2026-11-17): it is not on the prototype of the session, so a test can not call it. The replaced `setValue()` calls it through `wrapCommand`, so it is logged and emitted to reporters as `setElementValue` like a command. There is no `executeScript`
- Settings (`src/settings.ts`, defaults in `DEFAULT_SETTINGS` of `src/constants.ts`, types in `MobilecliOptions` of `@wdio/types`): every tunable value of the driver is a setting of the capability `mobilecli:options`, no value lives as a constant in another file. Rule for later: a new timeout, interval or limit goes in `DEFAULT_SETTINGS` and `MobilecliOptions`, Timeouts map to Mobilewright (`docs/src/test/timeouts.md`): action timeout is `actionTimeout` (else `waitforTimeout`), changed in a test with `browser.setTimeout({ implicit })` (`setTimeouts`: `pageLoad` and `script` do nothing and are not an error, as WDIO sets the script timeout itself when an iOS session starts), install timeout is `installTimeout`, app launch timeout is `appLaunchTimeout`, test and expect timeout are those of WDIO
- App start (`launchApp` in `src/apps.ts`) is `device.launchApp()` of Mobilewright with the steps of its mobilecli driver: on iOS one `device.apps.foreground` before `device.apps.launch` (it starts the agent of mobilecli, which otherwise sends the fresh app to the background), then `device.apps.foreground` every 100 ms until it is the app, for `appLaunchTimeout` (20000, as in Mobilewright). The error `could not determine foreground app` gives a warning and the session goes on, as in Mobilewright: a known problem of mobilecli on some Android devices
- No timeout per command (`$(selector).click({ timeout })`, as `locator.tap({ timeout })` of Mobilewright). Built and taken out again on 2026-11-17, for three measured reasons: (1) the element types of `webdriverio` do not have the option, and a type augmentation from this package does not reach `$(selector).click()`, so TypeScript rejects it. (2) To pass the option on, the driver has to replace `click`, `getText` and the others with `overwriteCommand`, and a replaced command does not get the wait of WDIO for an element that is not on the screen yet: the login test read the screen 4 more times (iOS 1.08x, Android 1.16x against Mobilewright, where it is 1.01x and 0.97x), and a command on a late element was sent with the element id `undefined`. (3) WDIO waits for a missing element for `waitforTimeout` before the driver sees the command, so the option would only count from when the element exists. It needs a change in `webdriverio`, see section 4
- Rule for a WDIO API command that the driver replaces: it runs without the wait of WDIO for a missing element, so `this.elementId` can be `undefined`. Go through a command of WDIO that waits (`tap()` calls `click()`), or wait first (`setValue()` calls `waitForExist()` if there is no element id). Found with `setValue()` on an element that came 1.5 s later: it failed with `The element with the id "undefined" is not known in this session`
- Web views: `getWindowHandle` returns `NATIVE_APP`, the only context for now. Web views are a later slice, with `page.ts` of Mobilewright as the reference
- Auto-waiting as in Mobilewright (`src/screen.ts`): an action waits until the element is visible, enabled and has stable bounds, a read until it is visible. Timeout and interval come from the settings above (5000 and 100 if nothing is set, the defaults of Mobilewright). A timeout throws `MobilecliTimeoutError`, on purpose not a WebDriver error name: for `stale element reference` and `element not interactable` WDIO waits a second time
- Speed: a look at the screen is the slow part (100 to 250 ms). The driver remembers what it saw of an element (`Observation` in `src/elements.ts`): the find of WDIO right before a command counts as one of the two looks for stable bounds, and what was seen under 100 ms ago is not looked up again. Every action forgets it. Measured with the `compare` script of the demo project, 5 runs, login test, median: iOS simulator 9518 ms against 9691 ms for Mobilewright (0.98x), Android emulator 8324 ms against 8048 ms (1.03x), all 20 runs passed. The run before it had 1.01x and 0.97x: the difference between two runs is larger than between the two tools. Before the waits and the shared looks: 1.11x and 1.20x
- Taken out again, to come back when they are asked for: chained finds, a tap on coordinates, `getElementTagName`, `getElementAttribute`, `getElementRect`, `isElementSelected`, `installApp`
- Rule for every command, now and later: Mobilewright is the reference. Before a command is written, read its counterpart in `mobilewright-core/src/locator.ts` (or `screen.ts`, `keyboard.ts`, `device.ts`) and in `driver-mobilecli/src/driver.ts`, and take over its logic: what it waits for, the calls to mobilecli and their order, the checks after the call, the defaults and the error. Share the steps the way Mobilewright does (`tapElement` in `src/screen.ts` is its `_resolveAndTap`, `waitForActionable` its `resolveActionable`, `waitForVisible` its `resolveVisible`). Say in the JSDoc of the command which Mobilewright function it is. Differ only where the WDIO API asks for it, and write the difference down here
- Rule for every command that does something on the screen (tap, type, swipe, press a button, start or stop an app, change the orientation): call mobilecli through `act()` in `src/screen.ts`, never through `session.rpc.call` directly. `act()` forgets what the driver saw of the screen. A command that skips it leaves an old look in place, and the next find or read can answer from the screen of before the action. Only calls that change nothing on the screen (`device.dump.ui`, `device.io.keyboard.status`) call `session.rpc.call` directly
- Taken over so far: the waits, `tap()`, `fill()`, `clear()` with its check after the clear (reads the element again and fails if it still has a value), `keyboard.hide()` with its 60 s, `keyboard.isVisible()`, `isVisible()`, `isEnabled()`, `waitFor()`, `getText()` (text, else label, else value) and `getValue()` (value, else an empty string), the same on both platforms
- Differences, each because of the WDIO API or a measured problem:
  - `setValue()` and `clearValue()` do not tap an element that has the focus (`focusForFill` in `src/screen.ts`), Mobilewright always taps. On iOS a tap on a field that has the focus and text opens the edit menu, the field loses the focus and `device.io.fill` changes nothing. Measured on the iOS 27 simulator with calls to mobilecli only, no driver: a second fill of the same field 2 s after the first kept the old text in 3 of 4 tries with the tap, 0 of 4 without. Right after typing (under 1 s) the tap does no harm, which is why the login test never showed it. Mobilewright has the same problem: worth a report to mobilewright or mobilecli
  - `addValue()` has no counterpart, Mobilewright always replaces. It uses `device.io.text` and waits for the focus first, as text that is sent right after the tap is lost
  - selectors are those of WDIO (`~`, `id=`, class name) with the matching of Appium, not the `getBy...` locators, and `$` is strict as in WDIO: Mobilewright takes the first match
  - a find does not wait, because WDIO waits for an element that is not there yet. Finds share a look at the screen (`findElementReferences` in `src/screen.ts`): a find uses the last look if it is less than 100 ms old (`screenFreshTime`), nothing was done on the screen since, the selector matches in it (a miss always looks again, so a wait for an element is never answered from an old look) and the selector was searched in it at most once before (`maxSearchesPerScreen`, WDIO searches a second time right after its wait found the element, more often is a wait until the element is gone). Reading from several elements in a row then costs one look, where Mobilewright looks once per read. Measured on the home screen of the demo app, `getText()` of four elements: 1 look where it was 4
- Session start needs: `getWindowHandle` (returns `NATIVE_APP`)
- Every other WebDriver and Appium command exists as a function that throws `The command "<name>" is not supported by @wdio/mobilecli-driver`, so a missing command is not a `this.<name> is not a function`

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

Dependencies: `@wdio/utils`, `@wdio/types`, `@wdio/logger`, `@wdio/protocols`, `webdriver` (all `workspace:*`). No new third-party dependency.

Changes outside the package:
- `infra/createPackage/src/templates.ts`: add `driver` to `PACKAGE_TYPES`, then scaffold with it (repo rule: no hand-made package layout).
- No change in `packages/webdriverio`. A fallback that resolves `automationProtocol` from the project was built and dropped, see "How users load it".
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
- In a normal project `webdriverio` sits inside the project's `node_modules`, so by Node's lookup rules the plain name is found. That also holds for pnpm's `.pnpm` layout, checked with a mock package in that layout.
- It is not found when `webdriverio` lives outside the project's `node_modules` tree. That is the case in this monorepo (the repo root `node_modules/@wdio` only links `config` and `repl`), and for global installs.
- Service and reporter names do not have this problem: `safeImport` (`packages/wdio-utils/src/utils.ts:235`) first resolves from the package and then falls back to the project's `node_modules`.

Decision: the core is not changed for this. A fallback like the one of services was built as PR 2 and dropped: it needs the `import-meta-resolve` package in `webdriverio` (Node only resolves from another directory behind an experimental flag), and a normal install does not need it. Where `webdriverio` is linked or global, the config can use `automationProtocol: import.meta.resolve('@wdio/mobilecli-driver')`.

### Branches and small PRs
- One long-lived integration branch, `feat/mobilecli-driver`, cut from `main`. Nothing goes to `main` until the driver is ready to show.
- Each piece is a short topic branch cut from the integration branch, with a PR that targets the integration branch. One topic per PR, each with its own tests, each reviewable on its own.
- Each PR is verified before review. The next topic branch is cut from the integration branch after the previous PR is merged.

| PR | Topic branch | Content | Proof |
|---|---|---|---|
| 1 | `mobilecli/01-scaffold` | `driver` type in `infra/createPackage`, the scaffolded empty package, `PLAN.md` | package compiles, createPackage tests pass |
| 2 | `mobilecli/02-protocol-resolution` | Dropped, see "How users load it" | |
| 3 | `mobilecli/03-session` | `rpc` client, `newSession` (connect to a running server and device), `deleteSession`, a clear error for every command that is not supported yet | unit tests, a testrunner run that connects and disconnects |
| 4 | `mobilecli/04-find-and-source` | `tree`, element registry, `findElement`, `findElements`, `getPageSource`. Also `mobilecli:app` (install and start at session start), a second call when the server closes the connection, and from PR 5 on request: `click` / `tap` (one command, `device.io.tap`), `setValue` / `addValue` / `clearValue`, `getText`, `getValue`, auto-waiting as in Mobilewright, the wait commands, `hideKeyboard`, `isKeyboardShown`. Commands in `src/commands/browser` and `src/commands/element`. The Android fixture tree is written from the mobilecli source, not recorded from a device | unit tests on iOS and Android fixture trees, the login spec on a simulator and an emulator |
| 5 | `mobilecli/05-interactions` | Done in PR 4 on request | |
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
- No server-side element finding. Only `device.dump.ui` (full tree, JSON). The result is `{ elements: [...] }`, without `elements` for an empty screen. Element shape: `mobilecli/types/screen.go:21-40` (`type`, `label`, `text`, `name`, `value`, `placeholder`, `identifier`, `rect`, `enabled`, `checked`, `selected`, `focused`, `clickable`, `children`). The `@eN` refs are CLI only, the RPC tap takes `x`,`y` only.
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
| A timeout per element command (`click({ timeout })` and the others), if wanted | `webdriverio` (element commands and their types) | The driver can not add it on its own, see "No timeout per command" in section 0. Not done, to be decided: it changes the public API of `webdriverio` |
| Docs: `automationProtocol` text says "only webdriver is supported" | `website/docs/Configuration.md:258`, package README, `.github/OWNERSHIP.md` | Docs and ownership |
| Test lanes for the new package | `infra/repo-tools`, `.github/workflows/test.yml` | Scoped tests and CI |

Not planned: a spec file in `@wdio/protocols`. Those specs describe HTTP endpoint + method pairs, and mobilecli is JSON-RPC. The RPC method types stay inside the driver package.

To verify in a spike before building (these are unknowns, not assumptions):
1. Module resolution: answered. The plain name resolves in a normal install, and `webdriverio` is not changed for the other cases (see "How users load it" in section 0).
2. Session start calls: `ContextManager.initialize()` (`packages/webdriverio/src/session/context.ts:590-637`) calls `getWindowHandle()` when no mobile context is known. The driver must answer `getWindowHandle` and `getContext` (for example with `NATIVE_APP`).
3. Which protocol command each native code path of `getValue`, `isDisplayed`, `scrollIntoView` and `swipe` really calls, to fix the minimal command list.
4. Parallel workers: several workers probing and starting one server on port 12000, and two workers picking the same device. mobilecli has no local device pool (only cloud `remote allocate`). v1 proposal: require an explicit `deviceId` per capability when more than one device is online.
5. How reporters and services behave with a synthetic session id and no `hostname`/`port`.

## 5. Risks and limits to state up front

- Feature parity with Appium is not reachable: no engine selectors, no alerts API, no biometrics/network toggles, filtered UI tree (elements without a label can be missing on iOS).
- Stale handling is emulated; a re-dump per command costs time (`device.dump.ui` has a 60 s server deadline).
- The HTTP server of mobilecli has a write timeout of 10 s (`server/server.go`, longer for a few methods in `extendedWriteDeadline`: install 3 min, `device.dump.ui` 60 s). A call that takes longer gets no JSON-RPC error: the connection is closed. Seen with `device.info` when the agent on the device has to start (about 10 s), and with `device.apps.launch`. The work goes on in the daemon, so a second call is fast. The driver reports this as "closed the connection" and sends `device.info` and `device.apps.launch` again, up to two times. To report to mobilecli: an error response in place of a closed connection.
- Typing needs the focus first. mobilecli types into the field that has the focus, and `device.io.text` right after `device.io.tap` is lost now and then (seen on an Android 17 emulator: about 1 run in 3). The driver waits until the UI tree reports `focused` for the element, 3 s at most. Both platforms report it.
- The on-screen keyboard is not in the UI tree (only with `full: true`), so the driver can not know that an element is behind it: the tap hits the keyboard. Seen on Android with the login button of the demo app. The test closes the keyboard with `hideKeyboard()`, as a Mobilewright test does with `screen.keyboard.hide()`.
- `getText` follows Appium per platform and not the first plan ("text, else label, else value"): on Android the `content-desc` is not the text, on iOS the value goes before the label.
- Seen on an iOS 27.0 simulator with mobilecli 1.0.23: with SpringBoard (the home screen) in front, `device.dump.ui` did not answer and the server closed the connection at its 60 s deadline, without a JSON-RPC error. With an app in front the dump took 0.4 s. The driver then reports "Could not reach the mobilecli server", which is misleading. To report to mobilecli, and to look at again when app launch lands.
- Find commands look at the screen once, the implicit wait timeout is only stored. WDIO waits for an element that is not there yet, and the commands of the driver wait until it can be used.
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
