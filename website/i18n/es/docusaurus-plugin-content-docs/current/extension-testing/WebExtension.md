---
id: web-extensions
title: Prueba de Extensión Web
---

WebdriverIO es la herramienta ideal para automatizar un navegador. Las extensiones Web son parte del navegador y pueden ser automatizadas de la misma manera. Cada vez que su extensión web utiliza scripts de contenido para ejecutar JavaScript en sitios web u ofrecer una ventana emergente, puede ejecutar una prueba e2e para eso usando WebdriverIO.

## Loading a Web Extension into the Browser

Como primer paso tenemos que cargar la extensión bajo prueba en el navegador como parte de nuestra sesión. Esto funciona de forma diferente para Chrome y Firefox.

:::info

Estos documentos dejan fuera las extensiones web de Safari ya que su soporte está muy atrasado y la demanda del usuario no es alta. Si está construyendo una extensión web para Safari, por favor [plantee un problema](https://github.com/webdriverio/webdriverio/issues/new?assignees=&labels=Docs+%F0%9F%93%96%2CNeeds+Triaging+%E2%8F%B3&template=documentation.yml&title=%5B%F0%9F%93%96+Docs%5D%3A+%3Ctitle%3E) y colabore en incluirlo aquí también.

:::

### Chrome

Cargar una extensión web en Chrome se puede hacer proporcionando una cadena codificada en `base64` del archivo `crx` o proporcionando una ruta a la carpeta de extensión web. The easiest is just to do the latter by defining your Chrome capabilities as following:

```js wdio.conf.js
import path from 'node:path'
import url from 'node:url'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

export const config = {
    // ...
    capabilities: [{
        browserName,
        'goog:chromeOptions': {
            // given your wdio.conf.js is in the root directory and your compiled
            // web extension files are located in the `./dist` folder
            args: [`--load-extension=${path.join(__dirname, '..', '..', 'dist')}`]
        }
    }]
}
```

:::info

Si automatizas un navegador diferente a Chrome, p.ej. Bravo, Edge u Opera, es probable que la opción del navegador coincida con el ejemplo anterior, utilizando un nombre de capacidad diferente.. `ms:edgeOptions`.

:::

Si compila su extensión como archivo `.crx` usando p.ej. el paquete [crx](https://www.npmjs.com/package/crx) NPM, también puedes inyectar la extensión empaquetada:

```js wdio.conf.js
import path from 'node:path'
import url from 'node:url'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const extPath = path.join(__dirname, `web-extension-chrome.crx`)
const chromeExtension = (await fs.readFile(extPath)).toString('base64')

export const config = {
    // ...
    capabilities: [{
        browserName,
        'goog:chromeOptions': {
            extensions: [chromeExtension]
        }
    }]
}
```

### Firefox

Para crear un perfil de Firefox que incluya extensiones, puedes utilizar el [Firefox Profile Service](/docs/firefox-profile-service) para configurar tu sesión en consecuencia. Sin embargo, puede que tenga problemas en los que su extensión local desarrollada no pueda ser cargada debido a la firma de incidencias. En este caso también puedes cargar una extensión en el gancho `antes de` mediante el comando [`installAddOn`](/docs/api/gecko#installaddon), por ejemplo.:

```js wdio.conf.js
import path from 'node:path'
import url from 'node:url'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const extensionPath = path.resolve(__dirname, `web-extension.xpi`)

export const config = {
    // ...
    before: async (capabilities) => {
        const browserName = (capabilities as Capabilities.Capabilities).browserName
        if (browserName === 'firefox') {
            const extension = await fs.readFile(extensionPath)
            await browser.installAddOn(extension.toString('base64'), true)
        }
    }
}
```

Para generar un archivo `.xpi`, se recomienda utilizar el paquete [`web-ext`](https://www.npmjs.com/package/web-ext) NPM. Puede recopilar su extensión usando el siguiente comando de ejemplo:

```sh
npx web-ext build -s dist/ -a . -n web-extension-firefox.xpi
```

## Tips & Tricks

The following section contains a set useful tips and tricks that can be helpful when testing a web extension.

### Test Popup Modal in Chrome

If you define a `default_popup` browser action entry in your [extension manifest](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_action) you can test that HTML page directly, since clicking on the extension icon in the browser top bar won't work. Instead, you have to open the popup html file directly.

In Chrome this works by retrieving the extension ID and opening the popup page through `browser.url('...')`. The behavior on that page will be the same as within the popup. To do so we recommend to write the following custom command:

```ts customCommand.ts
export async function openExtensionPopup (this: WebdriverIO.Browser, extensionName: string, popupUrl = 'index.html') {
  if ((this.capabilities as Capabilities.Capabilities).browserName !== 'chrome') {
    throw new Error('This command only works with Chrome')
  }
  await this.url('chrome://extensions/')

  const extensions = await this.$$('>>> extensions-item')
  const extension = await extensions.find(async (ext) => (
    await ext.$('#name').getText()) === extensionName
  )

  if (!extension) {
    const installedExtensions = await extensions.map((ext) => ext.$('#name').getText())
    throw new Error(`Couldn't find extension "${extensionName}", available installed extensions are "${installedExtensions.join('", "')}"`)
  }

  const extId = await extension.getAttribute('id')
  await this.url(`chrome-extension://${extId}/popup/${popupUrl}`)
}

declare global {
  namespace WebdriverIO {
      interface Browser {
        openExtensionPopup: typeof openExtensionPopup
      }
  }
}
```

In your `wdio.conf.js` you can import this file and register the custom command in your `before` hook, e.g.:

```ts wdio.conf.ts
import type { Options } from '@wdio/testrunner'
import { browser } from '@wdio/globals'

import { openExtensionPopup } from './support/customCommands'

export const config: Options.Testrunner = {
  // ...
  before: () => {
    browser.addCommand('openExtensionPopup', openExtensionPopup)
  }
}
```

Now, in your test, you can access the popup page via:

```ts
await browser.openExtensionPopup('My Web Extension')
```
