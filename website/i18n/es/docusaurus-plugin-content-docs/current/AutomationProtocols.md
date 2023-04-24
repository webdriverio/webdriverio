---
id: automationProtocols
title: Protocoles de automatización
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Con WebdriverIO, puede elegir entre múltiples tecnologías de automatización cuando ejecute sus pruebas E2E localmente o en la nube. De forma predeterminada, WebdriverIO siempre comprobará si hay un controlador de navegador que cumpla con el protocolo WebDriver en `localhost:4444`. Si no puede encontrar este controlador se vuelve a usar Chrome DevTools usando Puppeteer bajo la capa.

Casi todos los navegadores modernos que soportan [WebDriver](https://w3c.github.io/webdriver/) también soportan otra interfaz nativa llamada [DevTools](https://chromedevtools.github.io/devtools-protocol/) que puede ser usada para automatizar finalidades.

Ambas tienen ventajas y desventajas, dependiendo de su caso de uso y entorno.

## Protocolo WebDriver

> [WebDriver](https://w3c.github.io/webdriver/) es una interfaz de control remoto que permite la introspección y el control de agentes de usuarios. Proporciona un protocolo de cable neutral en la plataforma y en el lenguaje como una forma para que los programas fuera de proceso puedan dar instrucciones remotamente al comportamiento de los navegadores web.

El protocolo WebDriver ha sido diseñado para automatizar un navegador desde la perspectiva del usuario, significa que todo lo que un usuario es capaz de hacer, puede hacer con el explorador. Proporciona un conjunto de comandos que abstraen interacciones comunes con una aplicación (por ejemplo, navegando, haciendo clic o leyendo el estado de un elemento). Dado que es un estándar web, está bien soportado en todos los principales proveedores de navegador, y también está siendo utilizado como protocolo subyacente para la automatización móvil usando [Appium](http://appium.io).

Para utilizar este protocolo de automatización, necesita un servidor proxy que traduzca todos los comandos y los ejecuta en el entorno de destino (i. . navegador o aplicación móvil).

Para la automatización del navegador, el servidor proxy suele ser el controlador del navegador. Hay conductores disponibles para todos los navegadores:

- Chrome – [ChromeDriver](http://chromedriver.chromium.org/downloads)
- Firefox – [Geckodriver](https://github.com/mozilla/geckodriver/releases)
- Microsoft Edge – [Edge Driver](https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/)
- Internet Explorer – [InternetExplorerDriver](https://github.com/SeleniumHQ/selenium/wiki/InternetExplorerDriver)
- Safari – [SafariDriver](https://developer.apple.com/documentation/webkit/testing_with_webdriver_in_safari)

Para cualquier tipo de automatización móvil, necesitará instalar y configurar [Appium](http://appium.io). Le permitirá automatizar aplicaciones móviles (iOS/Android) o incluso aplicaciones de escritorio (macOS/Windows) utilizando la misma configuración WebdriverIO.

También hay muchos servicios que le permiten ejecutar la prueba de automatización en la nube a gran escala. En lugar de tener que configurar todos estos controladores a nivel local, puede hablar con estos servicios (e. . [Sauce Labs](https://saucelabs.com)) en la nube e inspecciona los resultados de su plataforma. La comunicación entre el script de prueba y el entorno de la automatización se verá así:

![Configurar WebDriver](/img/webdriver.png)

### Ventajas

- Estándar web oficial del W3C, soportado por los principales navegadores
- Protocolo simple que cubre las interacciones comunes de usuario
- Soporte para la automatización móvil (e incluso aplicaciones de escritorio nativos)
- Se puede usar tanto localmente como en la nube a través de servicios como [Sauce Labs.](https://saucelabs.com)

### Desventaja

- No está diseñado para un análisis profundo del navegador (por ejemplo, rastrear o interceptar eventos de red)
- Conjunto limitado de capacidades de automatización (por ejemplo, sin soporte para acelerar la CPU o la red)
- Intento adicional de configurar el controlador del navegador con selenium-standalone/chromedriver/etc

## Protocolo DevTools

La interfaz de DevTools es una interfaz nativa del navegador que normalmente se está utilizando para depurar el navegador desde una aplicación remota (e. , [Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools/)). Junto a sus capacidades para inspeccionar el navegador en casi todas las formas posibles, también se puede usar para controlarlo.

Mientras que cada navegador tenía su propia interfaz interna de DevTools que no estaba realmente expuesto al usuario, cada vez más navegadores están adoptando el [Protocolo de Herramientas de Desarrollo de Chrome](https://chromedevtools.github.io/devtools-protocol/). Se usa para depurar una aplicación web usando Chrome DevTools o para controlar Chrome utilizando herramientas como [Puppeteer](https://pptr.dev).

La comunicación se realiza sin ningún proxy, directamente al navegador usando WebSockets:

![DevTools Setup](/img/devtools.png)

WebdriverIO le permite utilizar las funciones DevTools como tecnología alternativa de automatización para WebDriver, si tiene requisitos especiales para automatizar el navegador. Con el paquete [`devtools`](https://www.npmjs.com/package/devtools) de NPM, puede usar los mismos comandos que proporciona WebDriver que entonces puede ser utilizado por WebdriverIO y el testrunner de WDIO para ejecutar sus comandos útiles encima de ese protocolo. Hace uso de Puppeteer a bajo la hoya y le permite ejecutar una secuencia de comandos con Puppeteer si es necesario.

Para usar DevTools como protocolo de automatización cambia la bandera `automationProtocol` a `devtools` en sus configuraciones o simplemente ejecuta WebdriverIO sin un controlador del navegador ejecutado en segundo plano.

<Tabs
  defaultValue="testrunner"
  values={[
    {label: 'Testrunner', value: 'testrunner'},
 {label: 'Standalone', value: 'standalone'},
 ]
}>
<TabItem value="testrunner">

```js title="wdio.conf.js"
export const config = {
    // ...
    automationProtocol: 'devtools'
    // ...
}
```
```js title="devtools.e2e.js"
describe('my test', () => {
    it('can use Puppeteer as automation fallback', async () => {
        // WebDriver command
        await browser.url('https://webdriver.io')

        // get <Puppeteer.Browser> instance (https://pptr.dev/#?product=Puppeteer&version=v5.2.1&show=api-class-browser)
        const puppeteer = await browser.getPuppeteer()

        // use Puppeteer interfaces
        const page = (await puppeteer.pages())[0]
        await page.setRequestInterception(true)
        page.on('request', interceptedRequest => {
            if (interceptedRequest.url().endsWith('webdriverio.png')) {
                return interceptedRequest.continue({
                    url: 'https://webdriver.io/img/puppeteer.png'
                })
            }

            interceptedRequest.continue()
        })

        // continue with WebDriver commands
        await browser.url('https://webdriver.io')

        /**
         * WebdriverIO logo is no replaced with the Puppeteer logo
         */
    })
})
```

__Note:__ there is no need to have either `selenium-standalone` or `chromedriver` services installed.

Recomendamos envolver las llamadas de Puppeteer dentro del comando `call`, para que todas las llamadas se ejecuten antes de que WebdriverIO continúe con el próximo comando WebDriver .

</TabItem>
<TabItem value="standalone">

```js
import { remote } from 'webdriverio'

const browser = await remote({
    automationProtocol: 'devtools',
    capabilities: {
        browserName: 'chrome'
    }
})

// WebDriver command
await browser.url('https://webdriver.io')

// get <Puppeteer.Browser> instance (https://pptr.dev/#?product=Puppeteer&version=v5.2.1&show=api-class-browser)
const puppeteer = await browser.getPuppeteer()

// switch to Puppeteer to intercept requests
const page = (await puppeteer.pages())[0]
await page.setRequestInterception(true)
page.on('request', interceptedRequest => {
    if (interceptedRequest.url().endsWith('webdriverio.png')) {
        return interceptedRequest.continue({
            url: 'https://user-images.githubusercontent.com/10379601/29446482-04f7036a-841f-11e7-9872-91d1fc2ea683.png'
        })
    }

    interceptedRequest.continue()
})

// continue with WebDriver commands
await browser.refresh()
await browser.pause(2000)

await browser.deleteSession()
```

</TabItem>
</Tabs>

Al acceder a la interfaz de Puppeteer, usted tiene acceso a una variedad de nuevas capacidades para automatizar o inspeccionar el navegador y la aplicación, e. , interceptando las peticiones de red (ver arriba), rastreando el navegador, las capacidades de CPU o de red y mucho más.

### `wdio:devtoolsOptions` Capacidades

Si ejecuta pruebas WebdriverIO a través del paquete DevTools, puede aplicar [opciones de Puppeteer personalizadas](https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-puppeteerlaunchoptions). Estas opciones serán pasadas directamente al [`launch`](https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-puppeteerlaunchoptions) o [`connect`](https://pptr.dev/#?product=Puppeteer&version=v8.0.0&show=api-puppeteerconnectoptions) métodos de Puppeteer. Otras opciones de devtools personalizadas son las siguiente:

#### customPort
Iniciar Chrome en un puerto personalizado.

Type: `number`<br /> Default: `9222` (default of Puppeteer)

Nota: si pasas `goog:chromeOptions/debuggerAddress`, `wdio:devtoolsOptions/browserWSEndpoint` o `wdio:devtoolsOptions/browserURL` opciones, WebdriverIO intentará conectarse con determinados detalles de conexión en lugar de iniciar un navegador. Por ejemplo, puede conectarse a la nube de Testingbots vía:

```js
import { format } from 'util'
import { remote } from 'webdriverio'

(async () => {
    const browser = await remote({
        capabilities: {
            'wdio:devtoolsOptions': {
                browserWSEndpoint: format(
                    `wss://cloud.testingbot.com?key=%s&secret=%s&browserName=chrome&browserVersion=latest`,
                    process.env.TESTINGBOT_KEY,
                    process.env.TESTINGBOT_SECRET
                )
            }
        }
    })

    await browser.url('https://webdriver.io')

    const title = await browser.getTitle()
    console.log(title) // returns "should return "WebdriverIO - click""

    await browser.deleteSession()
})()
```

### Ventajas

- Acceso a más capacidades de automatización (por ejemplo, interceptación de red, seguimiento etc.)
- No es necesario administrar los drivers del navegador

### Desventajas

- Sólo soporta el navegador basado en Chromium (ej: Chrome, Chromium Edge) y (parcialmente) Firefox
- __no__ soporta la ejecución en proveedores de nube como Sauce Labs, BrowserStack etc.
