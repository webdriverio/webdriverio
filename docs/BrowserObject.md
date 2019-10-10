---
id: browserobject
title: The Browser Object
---

If you use the WDIO test runner, you can access the WebDriver instance through the global `browser` or `driver` object.

The session is initialized by the test runner. The same goes for ending the session. This is also done by the test runner process.

Besides all commands from the [API](API.md), the `browser` object provides some more information you might be interested in during your test run:

## Get Desired Capabilities

```js
console.log(browser.sessionId) // outputs: "57b15c6ea81d0edb9e5b372da3d9ce28"
console.log(browser.capabilities)
/**
 * outputs:
   { acceptInsecureCerts: false,
     acceptSslCerts: false,
     applicationCacheEnabled: false,
     browserConnectionEnabled: false,
     browserName: 'chrome',
     chrome:
      { chromedriverVersion: '2.40.565386 (45a059dc425e08165f9a10324bd1380cc13ca363)',
        userDataDir: '/var/folders/ns/8mj2mh0x27b_gsdddy1knnsm0000gn/T/.org.chromium.Chromium.mpJ0yc' },
     cssSelectorsEnabled: true,
     databaseEnabled: false,
     handlesAlerts: true,
     hasTouchScreen: false,
     javascriptEnabled: true,
     locationContextEnabled: true,
     mobileEmulationEnabled: false,
     nativeEvents: true,
     networkConnectionEnabled: false,
     pageLoadStrategy: 'normal',
     platform: 'Mac OS X',
     rotatable: false,
     setWindowRect: true,
     takesHeapSnapshot: true,
     takesScreenshot: true,
     unexpectedAlertBehaviour: '',
     version: '68.0.3440.106',
     webStorageEnabled: true }
 */
```

## Get Config Options

You can always define custom options within your WDIO config:

```js
// wdio.conf.js
exports.config = {
    // ...
    fakeUser: 'maxmustermann',
    fakePassword: 'foobar',
    // ...
}
```

And access it in your tests:

```js
console.log(browser.config)
/**
 * outputs:
 * {
        port: 4444,
        protocol: 'http',
        waitforTimeout: 10000,
        waitforInterval: 250,
        logLevel: 'debug',
        baseUrl: 'http://localhost',
        connectionRetryTimeout: 90000,
        connectionRetryCount: 3,
        specs: [ 'err.js' ],
        fakeUser: 'maxmustermann', // <-- custom option
        fakePassword: 'foobar', // <-- custom option
        // ...
 */

console.log(browser.config.fakeUser) // outputs: "maxmustermann"
```

## Mobile Flags

If you need to modify your test based on whether or not your session runs on a mobile device, you can access the mobile flags to check.

For example, given this config:

```js
// wdio.conf.js
exports.config = {
    // ...
    capabilities: {
        platformName: 'iOS',
        app: 'net.company.SafariLauncher',
        udid: '123123123123abc',
        deviceName: 'iPhone',
        // ...
    }
    // ...
}
```

You can access these flags in your test like so:

```js
// Note: `driver` is the equivalent to the `browser` object but semantically more correct
// you can choose which global variable you want to use
console.log(driver.isMobile) // outputs: true
console.log(driver.isIOS) // outputs: true
console.log(driver.isAndroid) // outputs: false
```

This can be useful if, for example, you want to define selectors in your [page objects](PageObjects.md) based on the device type, like this:

```js
// mypageobject.page.js
import Page from './page'

class LoginPage extends Page {
    // ...
    get username() {
        const selectorAndroid = 'new UiSelector().text("Cancel").className("android.widget.Button")'
        const selectorIOS = 'UIATarget.localTarget().frontMostApp().mainWindow().buttons()[0]'
        const selectorType = driver.isAndroid ? 'android' : 'ios'
        const selector = driver.isAndroid ? selectorAndroid : selectorIOS
        return $(`${selectorType}=${selector}`)
    }
    // ...
}
```

You can also use these flags to run only certain tests for certain device types:

```js
// mytest.e2e.js
describe('my test', () => {
    // ...
    // only run test with Android devices
    if (driver.isAndroid) {
        it('tests something only for Android', () => {
            // ...
        })
    }
    // ...
})
```
