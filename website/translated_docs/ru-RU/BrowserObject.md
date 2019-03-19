---
id: browserobject
title: The Browser Object
---
Если вы используете WDIO TestRunner, можете получить доступ к инстансу WebDriver через глобальные объекты `browser` или `driver`. Сессия инициализируется при помощи TestRunner. То же самое для завершения сессии. Это так же выполняется при помощи TestRunner процесса.

Помимо всех команды из [api](API.md), объект браузера предоставляет больше информации, которая может быть интересна во время прогонки тестов:

## Получение Desired Capabilities

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

## Получение параметров конфигурации

Вы всегда можете определить пользовательские параметры в вашей wdio конфигурации:

```js
// wdio.conf.js
exports.config = {
    // ...
    fakeUser: 'maxmustermann',
    fakePassword: 'foobar',
    // ...
}
```

затем получить доступ к ним в тестах:

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

console.log(browser.config.fakeUser); // выводит: "maxmustermann"
```

## Мобильные флаги

Если вам нужно модифицировать ваш тест в зависимости от того запущен он на мобильном устройстве или нет, вы можете для этой проверки получить доступ к мобильным флагам. Пример:

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

Ваш тест может получить доступ к этим флагам таким образом:

```js
// Note: `driver` is the equivalent to the `browser` object but semantically more correct
// you can choose which global variable you want to use
console.log(driver.isMobile); // outputs: true
console.log(driver.isIOS); // outputs: true
console.log(driver.isAndroid); // outputs: false
```

This can be useful if you want to define selectors in your page objects based on the device type, e.g.

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

You can also use these flags to only run certain tests for certain device types:

```js
// mytest.e2e.js
describe('my test', () => {
    // ...
    // запустить тест только на Android устройствах
    if (driver.isAndroid) {
        it('протестировать что то только на Android', () => {
            // ...
        })
    }
    // ...
})
```