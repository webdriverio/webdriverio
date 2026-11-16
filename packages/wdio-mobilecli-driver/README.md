WebdriverIO mobilecli Driver
============================

> A WebdriverIO driver that runs WebdriverIO commands on mobile devices through [mobilecli](https://github.com/mobile-next/mobilecli).

**Status: work in progress.** The package exists and compiles, but it can not start a session yet. Nothing in it is usable in a test today.

## What it will be

WebdriverIO talks to browsers and devices through an automation protocol. The default is `webdriver`, which is also what Appium uses. This package is a second protocol driver for mobile: you keep writing tests with the WebdriverIO API (`$`, `click`, `setValue`, `getText`), and the driver runs them through a mobilecli server instead of an Appium server.

It is selected in the testrunner config file:

```ts
// wdio.conf.ts
export const config: WebdriverIO.Config = {
    // ...
    automationProtocol: '@wdio/mobilecli-driver',
    // ...
}
```

mobilecli is not installed with this package. You install it yourself.
