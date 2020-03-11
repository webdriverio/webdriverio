---
id: browserobject
title: Das Browser-Objekt
---

Wenn Sie den WDIO Testrunner verwenden, können Sie über die globalen `browser` oder `driver` Variablen direkt auf die WebDriver Instanz zugreifen. Die Session wird vom Testrunner initialisiert und die Instanz im globalen Scope registriert. Das Beenden der Session wird ebenfalls vom Testrunner übernommen. Damit brauchen Sie sich nicht um jegweiliges Session Management kümmern.

Neben allen Befehlen, die in der [api](API.md) dokumentiert sind, bietet das Browser-Objekt einige weitere Informationen, die Sie während Ihres Testlaufs interessieren könnten:

## Auf Gesetzte Browser Daten zugreifen

```js
console.log(browser.sessionId); // outputs: "57b15c6ea81d0edb9e5b372da3d9ce28"
console.log(browser.capabilities);
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

## Auf Gesetzte Konfigurations-Optionen zugreifen

Sie können immer benutzerdefinierte Optionen innerhalb der WDIO Konfigurations-Datei festlegen:

```js
// wdio.conf.js
exports.config = {
    // ...
    fakeUser: 'maxmustermann',
    fakePassword: 'foobar',
    // ...
}
```

um dann auf diese folgendermaßen in Ihren Tests zuzugreifen:

```js
console.log(browser.config);
/**
 * outputs:
 * {
        port: 4444,
        protocol: 'http',
        waitforTimeout: 10000,
        waitforInterval: 250,
        coloredLogs: true,
        deprecationWarnings: true,
        logLevel: 'debug',
        baseUrl: 'http://localhost',
        connectionRetryTimeout: 90000,
        connectionRetryCount: 3,
        sync: true,
        specs: [ 'err.js' ],
        fakeUser: 'maxmustermann', // <-- custom option
        fakePassword: 'foobar', // <-- custom option
        // ...
 */

console.log(browser.config.fakeUser); // outputs: "maxmustermann"
```

## Mobile Eigenschaften

Wenn sich Ihr Test anders verhalten soll, basierend darauf, ob dieser auf einem Mobilen-Endgerät ausgeführt wird oder nicht, können Sie auf die mobilen Attribute der Session zurückgreifen, z.B.:

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
};
```

In Ihrem Test können Sie auf diese Attribute wie folgt zugreifen:

```js
// Note: `driver` is the equivalent to the `browser` object but semantically more correct
// you can choose which global variable you want to use
console.log(driver.isMobile); // outputs: true
console.log(driver.isIOS); // outputs: true
console.log(driver.isAndroid); // outputs: false
```

Dies kann nützlich sein, wenn Sie Selektoren in Ihre Page Objekten basierend auf den Gerätetyp definieren möchten:

```js
// mypageobject.page.js
import Page from './page';

class LoginPage extends Page {
    // ...
    get username () {
        const selectorAndroid = 'new UiSelector().text("Cancel").className("android.widget.Button")';
        const selectorIOS = 'UIATarget.localTarget().frontMostApp().mainWindow().buttons()[0]';
        const selectorType = driver.isAndroid ? 'android' : 'ios';
        const selector = driver.isAndroid ? selectorAndroid : selectorIOS;
        return $(`${selectorType}=${selector}`);
    }
    // ...
}
```

Sie können ebenfalls bestimmte mobile Flags (z.B. isAndroid oder isIOS) verwenden, um Tests nur auf bestimmten Gerätetypen auszuführen:

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