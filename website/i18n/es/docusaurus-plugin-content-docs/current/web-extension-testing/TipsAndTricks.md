---
id: tips-and-tricks
title: Consejos y trucos
---

Esta página contiene un conjunto de consejos y trucos útiles que pueden ser útiles a la hora de probar una extensión web.

## Prueba Modal Popup en Chrome

Si define una entrada de acción del navegador `default_popup` en el manifiesto de su extensión [](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_action) puede probar directamente esa página HTML, ya que hacer clic en el icono de la extensión en la barra superior del navegador no funcionará. En su lugar, tiene que abrir el archivo html popup directamente.

En Chrome esto funciona recuperando el ID de extensión y abriendo la página emergente a través de `browser.url('...')`. El comportamiento en esa página será el mismo que en el popup. Para ello se recomienda escribir el siguiente comando personalizado:

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

En su `wdio.conf.js` puede importar este archivo y registrar el comando personalizado en su `antes del gancho` , por ejemplo:

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

Ahora, en la prueba, puede acceder a la página emergente vía:

```ts
await browser.openExtensionPopup('My Web Extension')
```
