---
id: capabilities
title: Capabilities
---

A capability is a definition for a remote interface. It helps WebdriverIO to understand in which browser or mobile environment you like to run your tests on. Capabilities are less crucial when developing tests locally as you run it on one remote interface most of the time but becomes more important when running a large set of integration tests in CI/CD.

:::info

The format of a capability object is well defined by the [WebDriver specification](https://w3c.github.io/webdriver/#capabilities). The WebdriverIO testrunner will fail early if user defined capabilities do not adhere to that specification.

:::

## Custom Capabilities

While the amount of fixed defined capabilities is verry low, everyone can provide and accept custom capabilities that are specific to the automation driver or remote interface:

### Browser Specific Capability Extensions

- `goog:chromeOptions`: [Chromedriver](https://chromedriver.chromium.org/capabilities) extensions, only applicable for testing in Chrome
- `moz:firefoxOptions`: [Geckodriver](https://firefox-source-docs.mozilla.org/testing/geckodriver/Capabilities.html) extensions, only applicable for testing in Firefox
- `ms:edgeOptions`: [EdgeOptions](https://learn.microsoft.com/en-us/microsoft-edge/webdriver-chromium/capabilities-edge-options) for specifying the environment when using EdgeDriver for testing Chromium Edge

### Cloud Vendor Capability Extensions

- `sauce:options`: [Sauce Labs](https://docs.saucelabs.com/dev/test-configuration-options/#w3c-webdriver-browser-capabilities--optional)
- `bstack:options`: [BrowserStack](https://www.browserstack.com/docs/automate/selenium/organize-tests)
- `tb:options`: [TestingBot](https://testingbot.com/support/other/test-options)
- and many more...

### Automation Engine Capability Extensions

- `appium:xxx`: [Appium](https://appium.github.io/appium.io/docs/en/writing-running-appium/caps/)
- `selenoid:xxx`: [Selenoid](https://github.com/aerokube/selenoid/blob/master/docs/special-capabilities.adoc)
- and many more...

### WebdriverIO Capabilities to manage browser driver options

WebdriverIO manages installing and running browser driver for you. In order to propagate options to the driver you can use the following custom capabilities:

- `wdio:chromedriverOptions`: manage Chromedriver options (see `chromedriver --help` for more information)
- `wdio:safaridriverOptions`: manage Safaridriver [options](https://github.com/webdriverio-community/node-safaridriver#options)
- `wdio:geckodriverOptions`: manage Geckodriver [options](https://github.com/webdriverio-community/node-geckodriver#options)
- `wdio:edgedriverOptions`: manage Edgedriver [options](https://github.com/webdriverio-community/node-edgedriver#options)

## Special Capabilities for Specific Use Cases

This is a list of examples showing which capabilities need to be applied to achieve a certain use case.

### Run Browser Headless

Running a headless browser means to run a browser instance without window or UI. This is mostly used within CI/CD environments where no display is used. To run a browser in headless mode, apply the following capabilities:

<Tabs
  defaultValue="chrome"
  values={[
    {label: 'Chrome', value: 'chrome'},
    {label: 'Firefox', value: 'firefox'},
    {label: 'Microsoft Edge', value: 'msedge'},
    {label: 'Safari', value: 'safari'},
  ]
}>
<TabItem value="chrome">

```ts
{
    browserName: 'chrome',
    'goog:chromeOptions': {
        args: ['headless', 'disable-gpu']
    }
}
```

</TabItem>
<TabItem value="firefox">

```ts
    browserName: 'firefox',
    'moz:firefoxOptions': {
        args: ['-headless']
    }
```

</TabItem>
<TabItem value="msedge">

```ts
    browserName: 'msedge',
    'ms:edgeOptions': {
        args: ['--headless']
    }
```

</TabItem>
<TabItem value="safari">

It seems that Safari [doesn't support](https://discussions.apple.com/thread/251837694) running in headless mode.

</TabItem>
</Tabs>

### Automate Different Browser Channels

If you like to test a browser version that is not yet released as stable, e.g. Chrome Canary, you can do so by setting capabilities and pointing to the browser you like to start, e.g.:

<Tabs
  defaultValue="chrome"
  values={[
    {label: 'Chrome', value: 'chrome'},
    {label: 'Firefox', value: 'firefox'},
    {label: 'Microsoft Edge', value: 'msedge'},
    {label: 'Safari', value: 'safari'},
  ]
}>
<TabItem value="chrome">

When testing on Chrome, WebdriverIO will automatically download the desired browser version and driver for you based on the defined `browserVersion`, e.g.:

```ts
{
    browserName: 'chrome',
    browserVersion: 'stable' // or 'dev', 'canary', 'beta'
}
```

</TabItem>
<TabItem value="firefox">

When testing on Firefox, make sure you have the desired browser version installed on your machine. You can point WebdriverIO to the browser to execute via:

```ts
    browserName: 'firefox',
    'moz:firefoxOptions': {
        bin: '/Applications/Firefox\ Nightly.app/Contents/MacOS/firefox'
    }
```

</TabItem>
<TabItem value="msedge">

When testing on Micrsoft Edge, make sure you have the desired browser version installed on your machine. You can point WebdriverIO to the browser to execute via:

```ts
    browserName: 'msedge',
    'ms:edgeOptions': {
        bin: '/Applications/Microsoft\ Edge\ Canary.app/Contents/MacOS/Microsoft\ Edge\ Canary'
    }
```

</TabItem>
<TabItem value="safari">

When testing on Safari, make sure you have the [Safari Technology Preview](https://developer.apple.com/safari/technology-preview/) installed on your machine. You can point WebdriverIO to that version via:

```ts
    browserName: 'safari technology preview'
```

</TabItem>
</Tabs>
