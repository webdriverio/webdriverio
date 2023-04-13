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

Sometimes it is necessary to do different things in each browser in order to test something. For instance, if we want to test a chat application, there has to be one browser who sends a text message while another browser waits to receive it, and then run an assertion on it.

When using the WDIO testrunner, it registers the browser names with their instances to the global scope:

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

In this example, the `myFirefoxBrowser` instance will start waiting on a message once the `myChromeBrowser` instance has clicked on `#send` button.

Multiremote makes it easy and convenient to control multiple browsers, whether you want them doing the same thing in parallel, or different things in concert.

## Accessing browser instances using strings via the browser object
In addition to accessing the browser instance via their global variables (e.g. `myChromeBrowser`, `myFirefoxBrowser`), you can also access them via the `browser` object, e.g. `browser["myChromeBrowser"]` or `browser["myFirefoxBrowser"]`. You can get a list of all your instances via `browser.instances`. This is especially useful when writing re-usable test steps that can be performed in either browser, e.g.:

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

Cucumber file:
    ```feature
    When User A types a message into the chat
    ```

Step definition file:
```js
When(/^User (.) types a message into the chat/, async (userId) => {
    await browser.getInstance(`user${userId}`).$('#message').setValue('Hi, I am Chrome')
    await browser.getInstance(`user${userId}`).$('#send').click()
})
```
