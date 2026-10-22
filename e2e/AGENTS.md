# e2e/

Real-browser and component-test suites. Expensive. Run only when the change
can affect `wdio session`, session launch, browser-runner, display-server, or a live WebDriver path
that smoke tests cannot see.

## Commands

```sh
pnpm run test:e2e:standalone   # vitest standalone examples
pnpm run test:e2e:launch       # vitest launch helpers
pnpm run test:e2e:testrunner   # headless wdio testrunner
pnpm run test:e2e:webdriver    # local webdriver conf
pnpm run test:e2e:classic
pnpm run test:e2e:parallel     # parallel mode (contexts) in Chrome (also in the CI testrunner lane)
pnpm run test:e2e:jasmine      # Jasmine framework: sync and async expect
pnpm run test:e2e:multi-remote
pnpm run test:component        # e2e/browser-runner (needs @wdio/browser-runner)
pnpm run test:e2e:session      # @wdio/session (Chrome, Firefox, Electron)
pnpm run test:e2e:display-server # @wdio/display-server
pnpm run test:e2e:chromedriver # Chromedriver setup; needs CHROMIUM_130_BINARY (see test-chromedriver.yml)
pnpm run test:e2e:cucumberjs-json-reporter # @wdio/cucumberjs-json-reporter in Chrome, with its multiple-cucumber-html-reporter report (local only)
pnpm run test:e2e:video-reporter # @wdio/video-reporter + Allure in Chrome; needs ffmpeg on PATH (also in the CI testrunner lane)
pnpm run test:e2e:html-reporter # @wdio/html-reporter in Chrome (local only)
pnpm run test:e2e:cloud        # Sauce — needs credentials, main-branch CI
pnpm run test:ios:local        # iOS Safari Simulator with Appium — local only, not in CI
pnpm run test:android:local    # Android emulator Chrome with Appium — local only, not in CI
```

`pnpm run test:e2e` runs every `test:e2e:*` script, including cloud. Do not
use it in routine agent work. `pnpm run test:changed --e2e` runs component,
session, display-server, or Chromedriver only when those CI lanes are in the
diff.

## When CI already skips these

`.github/workflows/test.yml` path filters:

- `e2e/browser-runner` + `packages/wdio-browser-runner` → component
- `packages/wdio-session` + `e2e/session` → session e2e (ubuntu, parallel with component)
- `packages/wdio-display-server`, `wdio-local-runner`, `e2e/wdio/display-server` → display-server
- Chromedriver setup in `packages/wdio-utils` (`utils.ts`, `electronChromedriverProvider.ts`, `startWebDriver.ts`, `manager.ts`, `package.json`) + `e2e/wdio/chromedriver` → Chromedriver (Linux ARM64, macOS, Windows)
- most other `packages/**` / `e2e/**` → core e2e + unit + smoke

Match that locally. A reporter-only change does not need this folder, except the
reporters with a real-browser suite in `e2e/wdio/reporters/` (run its `test:e2e:*` script).

## Guardrails

- Requires Chrome / Firefox / Edge as in CONTRIBUTING. Headless configs live
  under `e2e/wdio/headless/`.
- `test:e2e:webdriver` runs a browser matrix. Locally it skips Edge when it is
  not installed and Safari (needs "Allow remote automation"); CI runs all of
  them. Pick browsers with `WDIO_E2E_BROWSERS=chrome,firefox`.
- `pnpm run test:typings:e2e` type-checks the testrunner specs in `e2e/wdio`.
- `test:ios:local` and `test:android:local` (`e2e/wdio/mobile`) need a global
  Appium 3 with the XCUITest or UiAutomator2 driver, and Xcode with an iOS
  runtime or the Android SDK with an AVD (see CONTRIBUTING, "Mobile e2e
  Tests"). Run them when a change can affect Appium: `execute`, the session
  start (`session/`, `utils/scriptTimeout.ts`), mobile commands. They are not
  named `test:e2e:*`, so `pnpm run test:e2e` does not run them.
- Do not commit screenshots (`e2e/screenshot.png`, `e2e/wdio/headless/*.png`).
- Framework-specific browser-runner scripts are in `e2e/package.json`
  (`test:browser:react`, …).
