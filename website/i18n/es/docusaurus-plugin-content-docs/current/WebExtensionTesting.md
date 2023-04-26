---
id: web-extension-testing
title: Prueba de Extensión Web
---

WebdriverIO es la herramienta ideal para automatizar un navegador. Las extensiones Web son parte del navegador y pueden ser automatizadas de la misma manera. Cada vez que su extensión web utiliza scripts de contenido para ejecutar JavaScript en sitios web u ofrecer una ventana emergente, puede ejecutar una prueba e2e para eso usando WebdriverIO.

## Cargar una extensión web en el navegador

Como primer paso tenemos que cargar la extensión bajo prueba en el navegador como parte de nuestra sesión. Esto funciona de forma diferente para Chrome y Firefox.

:::info

Estos documentos dejan fuera las extensiones web de Safari ya que su soporte está muy atrasado y la demanda del usuario no es alta. Si está construyendo una extensión web para Safari, por favor [plantee un problema](https://github.com/webdriverio/webdriverio/issues/new?assignees=&labels=Docs+%F0%9F%93%96%2CNeeds+Triaging+%E2%8F%B3&template=documentation.yml&title=%5B%F0%9F%93%96+Docs%5D%3A+%3Ctitle%3E) y colabore en incluirlo aquí también.

:::

### Chrome

Cargar una extensión web en Chrome se puede hacer proporcionando una cadena codificada en `base64` del archivo `crx` o proporcionando una ruta a la carpeta de extensión web. Lo más fácil es sólo hacer esto último definiendo tus capacidades de cromo de la siguiente manera:

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
