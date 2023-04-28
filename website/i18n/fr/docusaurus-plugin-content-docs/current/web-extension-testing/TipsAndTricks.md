---
id: tips-and-tricks
title: Conseils et astuces
---

Cette page contient un ensemble de trucs et astuces utiles pour tester une extension web.

## Tester la popup modale dans Chrome

Si vous définissez une entrée d'action de navigateur `default_popup` dans votre [manifeste d'extension](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_action) , vous pouvez tester cette page HTML directement, car cliquer sur l'icône d'extension dans la barre supérieure du navigateur ne fonctionnera pas. Au lieu de cela, vous devez ouvrir directement le fichier html popup.

Dans Chrome, cela fonctionne en récupérant l'ID de l'extension et en ouvrant la page pop-up via `browser.url('...')`. Le comportement sur cette page sera le même que dans le popup. Pour ce faire, nous vous recommandons d'écrire la commande personnalisée suivante:

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

Dans votre `wdio.conf.js` vous pouvez importer ce fichier et enregistrer la commande personnalisée dans votre `avant` hook, par exemple.:

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

Maintenant, dans votre test, vous pouvez accéder à la page pop-up via :

```ts
await browser.openExtensionPopup('My Web Extension')
```
