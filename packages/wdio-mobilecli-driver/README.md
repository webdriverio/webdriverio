WebdriverIO mobilecli Driver
============================

> A WebdriverIO driver that runs WebdriverIO commands on mobile devices through [mobilecli](https://github.com/mobile-next/mobilecli).

**Status: work in progress.** The driver can start and end a session on a device. It can not find or use elements yet: every other command fails with `The command "<name>" is not supported by @wdio/mobilecli-driver`.

## Prerequisites

mobilecli is not installed with this package. You install it yourself and start its server before a test run:

```sh
npm install -g mobilecli
mobilecli devices        # the devices that mobilecli sees
mobilecli server start   # listens on http://localhost:12000
```

The device has to be running, the driver does not boot it. An iOS device also needs the agent of mobilecli, which is installed once with `mobilecli agent install --device <id>`.

## Configuration

WebdriverIO talks to browsers and devices through an automation protocol. The default is `webdriver`, which is also what Appium uses. This package is a second protocol driver for mobile: you keep writing tests with the WebdriverIO API, and the driver runs them through a mobilecli server instead of an Appium server.

It is selected in the testrunner config file:

```ts
// wdio.conf.ts
export const config: WebdriverIO.Config = {
    // ...
    automationProtocol: '@wdio/mobilecli-driver',
    // where `mobilecli server start` runs, these are the defaults
    hostname: 'localhost',
    port: 12000,
    capabilities: [{
        platformName: 'iOS',
        'mobilecli:udid': '<id from `mobilecli devices`>'
    }]
}
```

### Capabilities

| Capability | Description |
|---|---|
| `platformName` | `iOS` or `Android`. Optional: the session gets it from the device. If it is set and the device is of the other platform, the session does not start. |
| `mobilecli:udid` | The id of the device, as listed by `mobilecli devices`. Optional when exactly one device is online. |

### Sessions

mobilecli has no sessions. Starting a session connects to the server and to the device, and ending it only disconnects: the device, the app and the server keep running.
