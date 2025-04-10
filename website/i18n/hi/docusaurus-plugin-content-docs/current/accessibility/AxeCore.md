---
id: axe-core
title: Axe Core
---

You can include accessibility tests within your WebdriverIO test suite using the open-source accessibility tools [from Deque called Axe](https://www.deque.com/axe/). The setup is very easy, all you need to do is to install the WebdriverIO Axe adapter via:

```bash npm2yarn
npm install -g @axe-core/webdriverio
```

एक्स एडॉप्टर का उपयोग या तो [स्टैंडअलोन या टेस्टरनर](/docs/setuptypes) मोड में केवल [ब्राउज़र ऑब्जेक्ट](/docs/api/browser)के साथ इम्पोर्ट और आरंभ करके किया जा सकता है, उदाहरण के लिए:

```ts
import { browser } from '@wdio/globals'
import AxeBuilder from '@axe-core/webdriverio'

describe('Accessibility Test', () => {
    it('should get the accessibility results from a page', async () => {
        const builder = new AxeBuilder({ client: browser })

        await browser.url('https://testingbot.com')
        const result = await builder.analyze()
        console.log('Acessibility Results:', result)
    })
})
```

आप Axe WebdriverIO अडैप्टर [गिटGitHub पर](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/webdriverio#usage)अधिक दस्तावेज़ीकरण प्राप्त कर सकते हैं।
