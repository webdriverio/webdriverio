---
id: multiremote
title: Multicontrol
---

WebdriverIO le permite ejecutar varias sesiones automatizadas en una sola prueba. Esto es práctico cuando estás probando características que requieren múltiples usuarios (por ejemplo, aplicaciones de chat o WebRTC).

En lugar de crear un par de instancias remotas donde se necesitan ejecutar comandos comunes como [`newSession`](/docs/api/webdriver#newsession) o [`url`](/docs/api/browser/url) en cada instancia, simplemente puedes crear una instancia **multiremoto** y controlar todos los navegadores al mismo tiempo.

Para ello, simplemente utilice la función `multiremote()` y pase un objeto con nombres clave a `capacidades` para valores. Al dar un nombre a cada capacidad, puedes seleccionar y acceder fácilmente a esa única instancia cuando ejecutas comandos en una sola instancia.

:::info

Multiremoto _no_ está diseñado para ejecutar todas tus pruebas en paralelo. Está pensado para ayudar a coordinar múltiples navegadores y/o dispositivos móviles para pruebas especiales de integración (por ejemplo, aplicaciones de chat).

:::

Todas las instancias multiremotas devuelven una matriz de resultados. El primer resultado representa la capacidad definida primero en el objeto de capacidad el segundo resultado la segunda capacidad, etc.

## Uso del modo independiente

Aquí hay un ejemplo de cómo crear una instancia multiremoto en __modo independiente__:

```js
import { multiremote } from 'webdriverio'

(async () => {
    const browser = await multiremote({
        myChromeBrowser: {
            capabilities: {
                browserName: 'chrome'
            }
        },
        myFirefoxBrowser: {
            capabilities: {
                browserName: 'firefox'
            }
        }
    })

    // open url with both browser at the same time
    await browser.url('http://json.org')

    // call commands at the same time
    const title = await browser.getTitle()
    expect(title).toEqual(['JSON', 'JSON'])

    // click on an element at the same time
    const elem = await browser.$('#someElem')
    await elem.click()

    // only click with one browser (Firefox)
    await elem.getInstance('myFirefoxBrowser').click()
})()
```

## Utilizando WDIO Testrunner

Para poder usar multiremoto en el testrunner WDIO, simplemente define el objeto `capacidades` en tu `wdio. onf.js` como un objeto con los nombres del navegador como claves (en vez de una lista de capacidades):

```js
export const config = {
    // ...
    capabilities: {
        myChromeBrowser: {
            capabilities: {
                browserName: 'chrome'
            }
        },
        myFirefoxBrowser: {
            capabilities: {
                browserName: 'firefox'
            }
        }
    }
    // ...
}
```

Esto creará dos sesiones de WebDriver con Chrome y Firefox. En lugar de solo Chrome y Firefox también puedes arrancar dos dispositivos móviles usando [Appium](http://appium.io) o un dispositivo móvil y un navegador.

Incluso puede iniciar uno de los [backend de los servicios en la nube](https://webdriver.io/docs/cloudservices.html) junto con instancias locales Webdriver/Appium, o Selenium Standalone instancias. WebdriverIO detecta automáticamente las capacidades de backend de la nube si especificas cualquiera de `bstack:options` ([Navegador](https://webdriver.io/docs/browserstack-service.html)), `sauce:options` ([SauceLabs](https://webdriver.io/docs/sauce-service.html)), o `tb:options` ([TestingBot](https://webdriver.io/docs/testingbot-service.html)) en las capacidades del navegador.

```js
export const config = {
    // ...
    user: process.env.BROWSERSTACK_USERNAME,
    key: process.env.BROWSERSTACK_ACCESS_KEY,
    capabilities: {
        myChromeBrowser: {
            capabilities: {
                browserName: 'chrome'
            }
        },
        myBrowserStackFirefoxBrowser: {
            capabilities: {
                browserName: 'firefox',
                'bstack:options': {
                    // ...
                }
            }
        }
    },
    services: [
        ['browserstack', 'selenium-standalone']
    ],
    // ...
}
```

Aquí es posible cualquier tipo de combinación de OS/navegador (incluyendo los navegadores móviles y de escritorio). Todos los comandos que tu llamada de prueba a través de la variable `browser` son ejecutados en paralelo con cada instancia. Esto ayuda a optimizar tus pruebas de integración y a acelerar su ejecución.

Por ejemplo, si se abre una URL:

```js
browser.url('https://socketio-chat-h9jt.herokuapp.com/')
```

El resultado de cada comando será un objeto con los nombres del navegador como clave, y el resultado del comando como valor, así:

```js
// wdio testrunner example
await browser.url('https://www.whatismybrowser.com')

const elem = await $('.string-major')
const result = await elem.getText()

console.log(result[0]) // returns: 'Chrome 40 on Mac OS X (Yosemite)'
console.log(result[1]) // returns: 'Firefox 35 on Mac OS X (Yosemite)'
```

Tenga en cuenta que cada comando se ejecuta uno por uno. Esto significa que el comando termina una vez que todos los navegadores lo han ejecutado. Esto es útil porque mantiene sincronizadas las acciones del navegador, lo que hace más fácil entender lo que está ocurriendo actualmente.

A veces es necesario hacer diferentes cosas en cada navegador para probar algo. Por ejemplo, si queremos probar una aplicación de chat, tiene que haber un navegador que envíe un mensaje de texto mientras que otro navegador espera recibirlo, y luego ejecuta una afirmación en él.

Cuando se utiliza el testrunner WDIO, registra los nombres del navegador con sus instancias en el ámbito global:

```js
const myChromeBrowser = browser.getInstance('myChromeBrowser')
await myChromeBrowser.$('#message').setValue('Hi, I am Chrome')
await myChromeBrowser.$('#send').click()

// wait until messages arrive
await $('.messages').waitForExist()
// check if one of the messages contain the Chrome message
assert.true(
    (
        await $$('.messages').map((m) => m.getText())
    ).includes('Hi, I am Chrome')
)
```

En este ejemplo, la instancia `myFirefoxBrowser` comenzará a esperar en un mensaje una vez que la instancia `myChromeBrowser` haya hecho clic en el botón `#send`.

Multiremote hace que sea fácil y conveniente controlar múltiples navegadores, ya sea que quieran hacer lo mismo en paralelo, o cosas diferentes en concierto.

## Acceder a instancias del navegador usando cadenas a través del objeto del navegador
Además de acceder a la instancia del navegador a través de sus variables globales (p. ej. `myChromeBrowser`, `myFirefoxBrowser`), también puede acceder a ellos a través del objeto `navegador`, e.. Puede obtener una lista de todas sus instancias a través de `browser.instances`. Esto es especialmente útil cuando se escriben pasos de prueba reutilizables que se pueden realizar en cualquiera de los dos navegadores, por ejemplo.:

wdio.conf.js:
```js
    capabilities: {
        userA: {
            capabilities: {
                browserName: 'chrome'
            }
        },
        userB: {
            capabilities: {
                browserName: 'chrome'
            }
        }
    }
```

Archivo Cucumber:
    ```feature
    When User A types a message into the chat
    ```

Archivo de definición de paso:
```js
When(/^User (.) types a message into the chat/, async (userId) => {
    await browser.getInstance(`user${userId}`).$('#message').setValue('Hi, I am Chrome')
    await browser.getInstance(`user${userId}`).$('#send').click()
})
```
