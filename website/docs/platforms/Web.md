---
id: web
title: Web Browsers
description: Set up and run WebdriverIO end-to-end, component, visual and accessibility tests in Chrome, Firefox, Microsoft Edge and Safari.
---

WebdriverIO automates desktop browsers (Chrome, Chromium, Firefox, Microsoft Edge and Safari) through standard browser drivers. By default it tries to open a [WebDriver BiDi](/docs/automationProtocols) session, the bi-directional successor of the classic WebDriver protocol. BiDi powers features such as network mocking and Web API emulation. Set `wdio:enforceWebDriverClassic: true` in your capabilities to opt out. You don't need to install drivers yourself: set a `browserName` and WebdriverIO downloads and starts the matching Chromedriver, Geckodriver or Edgedriver. It also installs Chrome, Chromium or Firefox when no local installation is found. Microsoft Edge must already be installed, and Safaridriver ships with macOS. The same testrunner can also run tests inside the browser with the Browser Runner. This covers unit and component tests for React, Vue, Svelte, SolidJS, Preact, Lit and Stencil.

## Quick start

Scaffold a project interactively with `npm init wdio@latest .`. Passing `--yes` picks the defaults: Mocha, Chrome and page objects. To set a project up by hand, install the testrunner, a framework adapter, a reporter and `tsx` for TypeScript:

```sh
npm install --save-dev @wdio/cli @wdio/local-runner @wdio/mocha-framework @wdio/spec-reporter tsx
```

```json title="tsconfig.json"
{
    "compilerOptions": {
        "types": ["node", "@wdio/globals/types", "@wdio/mocha-framework"]
    }
}
```

```ts title="wdio.conf.ts"
export const config: WebdriverIO.Config = {
    runner: 'local',
    specs: ['./test/specs/**/*.ts'],
    maxInstances: 10,
    capabilities: [{
        browserName: 'chrome'
    }, {
        browserName: 'firefox'
    }],
    logLevel: 'info',
    waitforTimeout: 10000,
    framework: 'mocha',
    reporters: ['spec'],
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    }
}
```

```ts title="test/specs/login.e2e.ts"
import { expect, browser, $ } from '@wdio/globals'

describe('My Login application', () => {
    it('should login with valid credentials', async () => {
        await browser.url('https://the-internet.herokuapp.com/login')

        await $('#username').setValue('tomsmith')
        await $('#password').setValue('SuperSecretPassword!')
        await $('button[type="submit"]').click()

        await expect($('#flash')).toBeExisting()
        await expect($('#flash')).toHaveText(
            expect.stringContaining('You logged into a secure area!'))
    })
})
```

```sh
npx wdio run ./wdio.conf.ts
```

Each capability gets its own worker processes, so this runs the spec in both Chrome and Firefox. Other valid `browserName` values are `chromium`, `msedge` and `safari`. To run headless, add browser arguments such as `'goog:chromeOptions': { args: ['headless', 'disable-gpu'] }`. See [Run Browser Headless](/docs/capabilities#run-browser-headless) for Firefox and Edge; Safari has no headless mode.

## Choose your path

End-to-end testing across browsers:

- [Capabilities](/docs/capabilities): browser options, headless mode, browser channels (Canary, Nightly, Safari Technology Preview) and `wdio:*` driver options.
- [Driver Binaries](/docs/driverbinaries): how automatic browser and driver setup works, and how to point at custom binaries.
- [Automation Protocols](/docs/automationProtocols): WebDriver vs. WebDriver BiDi.
- [WebDriver BiDi commands](/docs/api/webdriverBidi): raw BiDi protocol commands available on the `browser` object.
- [Selectors](/docs/selectors): CSS, text, ARIA, deep (shadow DOM) and React selectors.
- [Auto-waiting](/docs/autowait) and [Timeouts](/docs/timeouts): how WebdriverIO waits for elements and what to tune.
- [Multi-remote](/docs/multiremote): control several browsers in one test, e.g. for chat or WebRTC apps.

Browser capabilities that need WebDriver BiDi (Chrome, Edge and Firefox; not Safari):

- [Request Mocks and Spies](/docs/mocksandspies): intercept, modify or stub network requests with `browser.mock()`. See also the [Mock object](/docs/api/mock).
- [Emulation](/docs/emulation): emulate geolocation, color scheme, user agent, `navigator.onLine`, the clock and device viewports with `browser.emulate()`.

Component and unit testing in a real browser:

- [Component Testing](/docs/component-testing): how the Vite-based [Browser Runner](/docs/runner#browser-runner) works and how to set it up.
- Framework guides: [React](/docs/component-testing/react), [Vue.js](/docs/component-testing/vue), [Svelte](/docs/component-testing/svelte), [SolidJS](/docs/component-testing/solid), [Preact](/docs/component-testing/preact), [Lit](/docs/component-testing/lit), [Stencil](/docs/component-testing/stencil).
- [Mocking](/docs/component-testing/mocking) and [Coverage](/docs/component-testing/coverage) for component tests.

Visual and accessibility testing:

- [Visual Testing](/docs/visual-testing): screen, element and full-page image comparison with `@wdio/visual-service`.
- [Snapshot](/docs/snapshot): DOM and object snapshot assertions.
- [Axe Core](/docs/accessibility-testing/axe-core): run Deque axe accessibility scans from your tests.

Scaling out:

- [Selenium Grid](/docs/seleniumgrid), [Cloud Services](/docs/cloudservices) and [Docker](/docs/docker): run browsers remotely.
- [Sharding](/docs/sharding): split a suite across CI machines.

A component test uses the same config file with a different runner. For example, to use the React preset:

```ts title="wdio.conf.ts"
export const config: WebdriverIO.Config = {
    runner: ['browser', {
        preset: 'react'
    }],
    specs: ['./src/**/*.test.tsx'],
    capabilities: [{
        browserName: 'chrome'
    }],
    framework: 'mocha',
    reporters: ['spec']
}
```

The Browser Runner requires `@wdio/browser-runner`. The React preset also needs `@vitejs/plugin-react`, and the guides recommend `@testing-library/react` for rendering. Presets exist for `vue`, `svelte`, `solid`, `react`, `preact` and `stencil`. For anything else, use `viteConfig` instead.

## Troubleshooting

- Chrome fails to start in CI with "user data directory is already in use" or "DevToolsActivePort file doesn't exist": see [Headless & Xvfb](/docs/headless-and-xvfb).
- `browser.mock()` or `browser.emulate()` has no effect: the session is not using WebDriver BiDi. Check your browser (Safari has no BiDi support), your cloud vendor, and `wdio:enforceWebDriverClassic`.
- Drivers or browsers can't be downloaded behind a proxy: see [Custom Driver Download Host](/docs/capabilities#custom-driver-download-host) and [Proxy Setup](/docs/proxy).
- Flaky tests: see [Retry Flaky Tests](/docs/retry) and [Debugging](/docs/debugging).

## Next steps

- [Configuration](/docs/configuration) reference for every `wdio.conf.ts` option.
- [TypeScript Setup](/docs/typescript) and [Frameworks](/docs/frameworks) (Mocha, Jasmine, Cucumber).
- [Page Object Pattern](/docs/pageobjects) to structure larger suites.
- [MCP](/docs/mcp) to let an AI agent drive a browser session through WebdriverIO.
- Other platforms: [Mobile Apps](/docs/platforms/mobile), [Desktop Apps](/docs/platforms/desktop), [Extensions & Editors](/docs/platforms/apps-and-extensions).
