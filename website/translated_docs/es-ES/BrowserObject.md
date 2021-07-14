---
id: browserobject
title: El objeto del navegador
---

Si utiliza el gestor de pruebas de wdio, puede acceder a la instancia del controlador web a través del `browser` global o el objeto del `driver`. La sesión está inicializada por el 'testrunner'. Lo mismo ocurre para terminar la sesión. Esto también lo hace el proceso del 'testrunner'.

Además de todos los comandos del [api](API.md) el objeto del navegador proporciona más información en la que podría estar interesado durante su ejecución de prueba:

## Obtén las capacidades deseadas

```js
console.log(browser.sessionId); // salidas: "57b15c6ea81d0edb9e5b372da3d9ce28"
console.log(browser.capabilities);
/**
 * salidas:
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

## Obtener opciones de configuración

Siempre puede definir opciones personalizadas dentro de la configuración de wdio:

```js
// wdio.conf.js
exports.config = {
    // ...
    fakeUser: 'maxmustermann',
    fakePassword: 'foobar',
    // ...
}
```

luego lo puede acceder en sus pruebas:

```js
console.log(browser.config);
/**
 * salidas:
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

console.log(browser.config.fakeUser); // salidas: "maxmustermann"
```

## Banderas móviles

Si necesita modificar su prueba basándose en si su sesión se ejecuta o no en un dispositivo móvil, puede acceder a las banderas móviles para comprobar, por ejemplo.:

```js
// wdio.conf.js
exports.config = {
    // ...
    capacidades: {
        platformName: 'iOS',
        app: 'net.company.SafariLauncher',
        udid: '123123123123abc',
        deviceName: 'iPhone',
        // ...
    }
    // ...
};
```

En tu prueba puedes acceder a estas banderas de la siguiente forma:

```js
// Nota: `driver` es el equivalente al objeto `browser` pero semánticamente más correcto
// puedes elegir la variable global que quieres usar
console.log(driver.isMobile); // salidas: true
console.log(driver.isIOS); // salidas: true
console.log(driver.isAndroid); // salidas: false
```

Esto puede ser útil si desea definir selectores en sus objetos de página basados en el tipo de dispositivo, por ejemplo.

```js
// mypageobject.page.js
import Page from './page';

class LoginPage extends Page {
    // ...
    get username () {
        const selectorAndroid = 'new UiSelector().text("Cancel").className("android.widget.Button")';
        const selectorIOS = 'UIATarget.localTarget().frontMostApp().mainWindow().buttons()[0]';
        const selectorType = driver.isAndroid ? 'android' : 'ios';
        'const selector = driver.isAndroid ? selectorAndroid : selectorIOS;
        return $(`${selectorType}=${selector}`);
    }
    // ...
}
```

También puedes usar estas banderas para ejecutar sólo ciertas pruebas para ciertos tipos de dispositivo:

```js
// mytest.e2e.js
describe('my test', () => {
    // ...
    // sólo ejecutar pruebas con dispositivos Android
    if (driver.isAndroid) {
        it('prueba algo sólo para Android', () => {
            // ...
        })
    }
    // ...
})
```