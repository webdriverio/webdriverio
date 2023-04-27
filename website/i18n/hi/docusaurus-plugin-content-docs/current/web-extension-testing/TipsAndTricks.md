---
id: tips-and-tricks
title: सलाह व सुझाव
---

इस पृष्ठ में उपयोगी टिप्स और ट्रिक्स का एक सेट है जो वेब एक्सटेंशन का परीक्षण करते समय सहायक हो सकता है।

## क्रोम में टेस्ट पॉपअप मोडल

यदि आप अपने `default_popup` ब्राउज़र क्रिया प्रविष्टि प रिभाषित करते हैं, तो आप सीधे उस HTML पृष्ठ का परीक्षण कर सकते हैं, क्योंकि ब्राउज़र के शीर्ष बार में एक्सटेंशन आइकन पर क्लिक करने से काम नहीं चलेगा. इसके बजाय, आपको सीधे पॉपअप html फ़ाइल खोलनी होगी।

क्रोम में यह एक्सटेंशन आईडी को पुनः प्राप्त करके और `browser.url('...')`के माध्यम से पॉपअप पेज खोलकर काम करता है। उस पृष्ठ पर व्यवहार पॉपअप के समान ही होगा। ऐसा करने के लिए हम निम्नलिखित कस्टम कमांड लिखने की सलाह देते हैं:



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


आपके `wdio.conf.js` में आप इस फ़ाइल को इम्पोर्ट कर सकते हैं और कस्टम कमांड को अपने `before` हुक में रजिस्टर कर सकते हैं, जैसे:



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


अब, अपने परीक्षण में, आप पॉपअप पेज को इसके माध्यम से एक्सेस कर सकते हैं:



```ts
await browser.openExtensionPopup('My Web Extension')
```
