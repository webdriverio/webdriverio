WebdriverIO mobilecli Driver
============================

> A WebdriverIO driver that runs WebdriverIO commands on mobile devices through [mobilecli](https://github.com/mobile-next/mobilecli).

**Status: work in progress.** The driver can start and end a session on a device, install and start an app, find elements, tap them, type, read their text and value, wait for them, close the keyboard, and return the page source. Everything else is not there yet: a command that is not listed below fails with `The command "<name>" is not supported by @wdio/mobilecli-driver`.

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
        'mobilecli:udid': '<id from `mobilecli devices`>',
        'mobilecli:app': '/path/to/my.app.zip'
    }]
}
```

The server address comes from the connection options of WebdriverIO: `protocol`, `hostname`, `port` and `path`. The `headers` option is sent with every request, for example the `Authorization` header of a proxy in front of a remote server.

### Capabilities

| Capability | Description |
|---|---|
| `platformName` | `iOS` or `Android`. Optional: the session gets it from the device. If it is set and the device is of the other platform, the session does not start. |
| `mobilecli:udid` | The id of the device, as listed by `mobilecli devices`. Optional when exactly one device is online. |
| `mobilecli:app` | The app to install and start when the session starts, see [Apps](#apps). Optional. |
| `mobilecli:options` | Settings of the driver, see [Settings](#settings). Optional. |

With `alwaysMatch` and `firstMatch`, the session starts with the first `firstMatch` entry that matches a device.

### Settings

The capability `mobilecli:options` changes how long the driver waits and how it reads the screen. Every setting is optional. They are in milliseconds, except `maxSearchesPerScreen`.

```ts
capabilities: [{
    platformName: 'iOS',
    'mobilecli:options': {
        actionTimeout: 10000,
        installTimeout: 300000
    }
}]
```

| Setting | Default | Description |
|---|---|---|
| `actionTimeout` | `waitforTimeout` of WebdriverIO (5000) | How long a command of an element waits until it can use the element, see [Waiting](#waiting). The action timeout of Mobilewright. |
| `pollInterval` | `waitforInterval` of WebdriverIO (100) | How long a command waits between two reads of the screen while it waits for its element. |
| `stabilityDelay` | 50 | An element is tapped when two reads of the screen show it at the same place. This is the time between these two reads. |
| `stabilityWindow` | 1000 | How long a read of the screen counts as the first of these two reads. |
| `screenFreshTime` | 100 | How long a read of the screen is used again in place of a new one, as long as the driver did nothing on the screen. Finds and reads in a row then share one read, which makes a test faster. With `0` every find and every command reads the screen itself. |
| `maxSearchesPerScreen` | 2 | How often a find can search the same selector in one read of the screen. WebdriverIO searches a second time right after it waited for an element. |
| `focusTimeout` | 3000 | How long `addValue()` waits until the element that it tapped has the focus, before it types. |
| `keyboardTimeout` | 60000 | How long `hideKeyboard()` can take. |
| `installTimeout` | 190000 | How long the install of the app of `mobilecli:app` can take. |
| `appLaunchTimeout` | 20000 | How long the driver waits until the app of `mobilecli:app` is in the foreground after it was started, see [Apps](#apps). |

A setting that the driver does not know, or that is not a number of 0 or more, fails the start of the session.

### Sessions

mobilecli has no sessions. Starting a session connects to the server and to the device, and ending it only disconnects: the device, the app and the server keep running.

## Apps

With the capability `mobilecli:app` the session installs the app on the device and starts it, so the test starts in the app. Without it the session starts with what is on the screen of the device.

| Device | App file |
|---|---|
| Android device or emulator | `.apk` |
| iOS simulator | `.app` folder, or a `.zip` with the `.app` folder in it |
| iOS device | `.ipa` |

The value is a path on the machine where the mobilecli server runs. Use an absolute path: the server resolves a relative path from the folder it was started in.

```ts
import path from 'node:path'

export const config: WebdriverIO.Config = {
    // ...
    capabilities: [{
        platformName: 'Android',
        'mobilecli:app': path.resolve(import.meta.dirname, 'apps', 'my-app.apk')
    }]
}
```

An app that is already installed is replaced and keeps its data. If the app can not be installed or started, the session does not start and the error has the reason of mobilecli.

After the start, the driver waits until the app is in the foreground, the same as Mobilewright: it asks mobilecli which app is in the foreground every 100 ms. The session starts when it is this app. If it is not after 20 seconds, the session does not start:

```
The app com.example.app was started, but it was not in the foreground within 20000ms (in the foreground: com.android.launcher). Give it more time with "appLaunchTimeout" in the capability "mobilecli:options".
```

A real device can need more time than a simulator or an emulator:

```ts
capabilities: [{
    platformName: 'iOS',
    'mobilecli:app': '/path/to/my.ipa',
    'mobilecli:options': { appLaunchTimeout: 60000 }
}]
```

On some Android devices mobilecli can not say which app is in the foreground, although the app did start. The driver then logs a warning and the session starts.

The driver can not install, start or stop an app during a test yet.

## Commands

These WebdriverIO commands work. The driver follows [Mobilewright](https://mobilewright.dev), which also runs on mobilecli: a command does what its Mobilewright counterpart does, with the same calls to mobilecli.

| WebdriverIO | Mobilewright | mobilecli |
|---|---|---|
| `$(selector)`, `$$(selector)` | a locator | `device.dump.ui`, the driver matches the selector in the UI tree |
| `$(selector).click()`, `$(selector).tap()` | `locator.tap()` | `device.io.tap` |
| `$(selector).setValue(text)` | `locator.fill(text)` | `device.io.tap`, `device.io.fill` |
| `$(selector).clearValue()` | `locator.clear()` | `device.io.tap`, `device.io.fill` with no text |
| `$(selector).addValue(text)` | | `device.io.tap`, `device.io.text` |
| `$(selector).getText()`, `getValue()` | `locator.getText()`, `getValue()` | `device.dump.ui` |
| `$(selector).isDisplayed()`, `isEnabled()` | `locator.isVisible()`, `isEnabled()` | `device.dump.ui` |
| `$(selector).waitForExist()`, `waitForDisplayed()`, `waitForEnabled()` | `locator.waitFor({ state })` | `device.dump.ui` |
| `browser.hideKeyboard()`, `isKeyboardShown()` | `screen.keyboard.hide()`, `isVisible()` | `device.io.keyboard.hide`, `device.io.keyboard.status` |
| `browser.getPageSource()` | `screen.viewTree()` | `device.dump.ui` |

Assertions that use these commands work too, for example `expect($('~message')).toHaveText('...')` and `expect($('~message')).toBeDisplayed()`.

## Selectors

mobilecli has no element search. The driver reads the UI tree of the screen and matches the selector itself. `$` and `$$` work with these selectors:

| Selector | iOS | Android |
|---|---|---|
| `~login` (accessibility id) | The accessibility identifier, or the label of an element without one. | The `content-desc`. |
| `id=login` | The same as `~login`. | The `resource-id`: the whole id (`com.example:id/login`) or only its name (`login`). |
| `XCUIElementTypeButton`, `android.widget.Button` (class name) | The element type. | The class. |

They match the same attribute as in Appium, so a selector that works with Appium finds the same element here. Any other selector (XPath, CSS, `-ios predicate string`, `-ios class chain`, `-android uiautomator`, ...) fails with an `invalid selector` error. Chained calls like `$('~list').$('~item')` are not supported yet.

mobilecli leaves elements out of the UI tree that have no label, text or id and can not be used. Such an element can not be found.

## Waiting

A test does not need waits of its own. Every command waits for its element, the same way as [Mobilewright](https://mobilewright.dev/docs/guides/auto-waiting):

| Command | Waits until the element |
|---|---|
| `click()`, `tap()`, `setValue()`, `addValue()`, `clearValue()` | is on the screen, is visible, is enabled, and does not move: it is at the same place in two looks at the screen. |
| `getText()`, `getValue()` | is on the screen and is visible. |

An element is visible if mobilecli says so, or else if it has a size.

If the time is up, the command fails with the reason, for example `Element with the selector "login" (accessibility id): element found but not enabled after 5000ms`. An element that keeps moving is used where it is when the time is up.

### Timeouts

How long a command waits can be set in three places. The first one of this list that is set, is used:

| Where | Timeout | Interval | Mobilewright |
|---|---|---|---|
| The test, from that line on | `browser.setTimeout({ implicit: 10000 })` | | |
| The capability `mobilecli:options` | `actionTimeout` | `pollInterval` | `use.actionTimeout` |
| The WebdriverIO config | `waitforTimeout` (5000) | `waitforInterval` (100) | |

```ts
export const config: WebdriverIO.Config = {
    // ...
    waitforTimeout: 5000,   // how long a command waits for its element, in ms
    waitforInterval: 100    // the time between two reads of the screen, in ms
}
```

An element that is not on the screen at all is waited for by WebdriverIO first, for `waitforTimeout`. The timeout of the driver starts when the element is there.

`browser.setTimeout()` only uses `implicit`. A native app has no page load and no script timeout, so `pageLoad` and `script` do nothing.

The other timeouts of [Mobilewright](https://mobilewright.dev/docs/test/timeouts) map as follows:

| Mobilewright | WebdriverIO |
|---|---|
| Test timeout (`timeout`) | The timeout of the framework, for example `mochaOpts.timeout`. |
| Expect timeout (`expect.timeout`) | `waitforTimeout`, or the `wait` option of an assertion. |
| Install timeout (`use.installTimeout`) | `installTimeout` of `mobilecli:options`. |
| App launch timeout (`use.appLaunchTimeout`) | `appLaunchTimeout` of `mobilecli:options`. |
| Action timeout per action (`locator.tap({ timeout })`) | Not supported, see below. |
| Global and allocation timeout | No counterpart. |

### No timeout per command

Mobilewright takes a timeout on every action, for example `locator.tap({ timeout: 10000 })`. The driver does not. `$('~login').click({ timeout: 10000 })` fails with `The command "performActions" is not supported by @wdio/mobilecli-driver`, because WebdriverIO sends a click with options as a pointer action. `getText()` and `getValue()` ignore their arguments. The commands of WebdriverIO have no such option, and the driver can not add it on its own:

- The types of WebdriverIO do not have it, so TypeScript rejects `click({ timeout })`.
- WebdriverIO waits for an element that is not on the screen yet for `waitforTimeout`, before the driver gets the command. A timeout of the command would only start after that wait.

For one command that needs more time, wait for the element first with the wait command that matches the command:

| Command | Wait first with |
|---|---|
| `click()`, `tap()`, `setValue()`, `addValue()`, `clearValue()` | `await $('~login').waitForEnabled({ timeout: 20000 })` |
| `getText()`, `getValue()` | `await $('~message').waitForDisplayed({ timeout: 20000 })` |

To give all commands more time from a line on, use `browser.setTimeout({ implicit: 20000 })`.

### Wait commands

To wait without a command, use the wait commands of WebdriverIO:

| WebdriverIO | Mobilewright |
|---|---|
| `await $('~message').waitForDisplayed({ timeout: 10000 })` | `locator.waitFor({ state: 'visible', timeout: 10000 })` |
| `await $('~spinner').waitForDisplayed({ reverse: true })` | `locator.waitFor({ state: 'hidden' })` |
| `await $('~submit').waitForEnabled()` | `locator.waitFor({ state: 'enabled' })` |
| `await $('~submit').waitForEnabled({ reverse: true })` | `locator.waitFor({ state: 'disabled' })` |
| `await $('~message').waitForExist()` | |

`isDisplayed()` and `isEnabled()` do not wait: they say how the element is now, and `false` for an element that is not on the screen.

## Click and tap

mobilecli has no click. `click()` and `tap()` are the same command in the driver: a tap in the middle of the element.

An element that is not on the screen is not scrolled to. `click()` and `tap()` with options (a place in the element, a button, a duration) and `browser.tap({ x, y })` are not supported.

## Type and clear

| Command | What happens |
|---|---|
| `$('~email').setValue('a@b.c')` | Replaces what is in the field with the text. |
| `$('~email').addValue('more')` | Adds the text to what is in the field. |
| `$('~email').clearValue()` | Empties the field, and fails if the field still has a value after that. |

mobilecli types into the field that has the focus, so the driver taps the element first. An element that already has the focus is not tapped: `addValue` then adds the text where the cursor is, and on iOS a tap on a field that has the focus opens the edit menu, after which the text is lost. Only `string` and `number` values are supported.

With `{ mask: true }`, for example `$('~password').setValue(password, { mask: true })`, the text is replaced with `**MASKED**` in the log and in the events for reporters, as in WebdriverIO. mobilecli still gets the text. Both platforms report a password field with dots, so `getPageSource()` does not show it either.

## The keyboard

Typing opens the on-screen keyboard, and it stays open. mobilecli leaves the keyboard out of the UI tree, so the driver can not see that an element is behind it: a tap on that element hits the keyboard. Close the keyboard first:

```ts
if (await browser.isKeyboardShown()) {
    await browser.hideKeyboard()
}
await $('~button-LOGIN').click()
```

`hideKeyboard()` takes no strategy, mobilecli decides how the keyboard is closed. It does nothing if no keyboard is open and fails if the keyboard stays open. On a real iOS device it only works in an app that can be debugged.

## Read an element

| Command | Returns |
|---|---|
| `getText()` | The text of the element. If it has none its label (the `content-desc` on Android), and if it has none its value. |
| `getValue()` | The value of the element, for example what is typed in a field. An empty string if it has none. |

Both are the same as in Mobilewright. `getText()` can differ from Appium, which returns the value before the label on iOS and never the `content-desc` on Android.

## Page source

`browser.getPageSource()` returns the UI tree as mobilecli gives it, as a JSON string. It is not the XML of Appium:

```ts
const { elements } = JSON.parse(await browser.getPageSource())
// [{ type: 'Button', label: 'General', name: 'com.apple.settings.general', rect: { x: 16, y: 293, width: 370, height: 52 }, children: [...] }, ...]
```
