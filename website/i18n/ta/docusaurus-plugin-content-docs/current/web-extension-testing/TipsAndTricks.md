---
id: tips-and-tricks
title: குறிப்புகள் மற்றும் தந்திரங்கள்
---

Web extensionயை டெஸ்ட் செய்யும்பொழுது உதவியாக இருக்கும் பயனுள்ள உதவிக்குறிப்புகள் மற்றும் தந்திரங்கள் இந்தப் பக்கத்தில் உள்ளன.

## Test Popup Modal in Chrome

உங்கள் [extension manifest](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_action) இல் `default_popup` browser action entryயை வரையறுத்தால், பிரௌசர் top barஇல் உள்ள extension ஐகானைக் கிளிக் செய்வது வேலை செய்யாது என்பதால், அந்த HTML பக்கத்தை நேரடியாகச் சோதிக்கலாம். அதற்கு பதிலாக, நீங்கள் பாப்அப் html கோப்பை நேரடியாக திறக்க வேண்டும்.

Chrome இல், extension ஐடியை மீட்டெடுத்து, `browser.url('...')`மூலம் பாப்அப் பக்கத்தைத் திறப்பதன் மூலம் இது செயல்படுகிறது. அந்தப் பக்கத்தில் உள்ள நடத்தை பாப்அப்பில் உள்ளதைப் போலவே இருக்கும். இதைச் செய்ய, பின்வரும் custom commandயை எழுத பரிந்துரைக்கிறோம்:

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

உங்கள் `wdio.conf.js` இல் இந்தக் fileயை நீங்கள் இறக்குமதி செய்து,`before ` hookல் custom commandயைப் பதிவு செய்யலாம், எ.கா.:

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

இப்போது, உங்கள் டெஸ்ட்இல், நீங்கள் பாப்அப் பக்கத்தை இதன் மூலம் அணுகலாம்:

```ts
await browser.openExtensionPopup('My Web Extension')
```
