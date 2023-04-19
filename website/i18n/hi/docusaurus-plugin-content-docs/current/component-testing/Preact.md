---
id: preact
title: Preact
---

[Preact](https://preactjs.com/) समान आधुनिक API के साथ रिएक्ट करने का एक तेज़ 3kB विकल्प है। आप WebdriverIO और इसके [ब्राउज़र रनर](/docs/runner#browser-runner)का उपयोग करके सीधे वास्तविक ब्राउज़र में Preact घटकों का परीक्षण कर सकते हैं।

## सेटअप

अपने Preact प्रोजेक्ट में WebdriverIO को सेटअप करने के लिए, हमारे कंपोनेंट टेस्टिंग डॉक्स में [निर्देशों](/docs/component-testing#set-up) का पालन करें। अपने रनर विकल्पों में प्रीसेट के रूप में `preact` चयन करना सुनिश्चित करें, उदाहरण के लिए:

```js
// wdio.conf.js
export const config = {
    // ...
    runner: ['browser', {
        preset: 'preact'
    }],
    // ...
}
```

:::info

यदि आप पहले से ही विकास सर्वर के रूप में [Vite](https://vitejs.dev/) का उपयोग कर रहे हैं तो आप अपने WebdriverIO कॉन्फ़िगरेशन के भीतर `vite.config.ts` में अपने कॉन्फ़िगरेशन का पुन: उपयोग भी कर सकते हैं। अधिक जानकारी के लिए, `viteConfig` in [रनर विकल्प](/docs/runner#runner-options)देखें।

:::

रिएक्ट प्रीसेट को स्थापित करने के लिए `@preact/preset-vite` की आवश्यकता होती है। साथ ही हम परीक्षण पृष्ठ में घटक को प्रस्तुत करने के लिए [परीक्षण लाइब्रेरी](https://testing-library.com/) का उपयोग करने की अनुशंसा करते हैं। इसके लिए आपको निम्नलिखित अतिरिक्त निर्भरताओं को स्थापित करने की आवश्यकता होगी:

```sh npm2yarn
npm install --save-dev @testing-library/preact @preact/preset-vite
```

फिर आप चलाकर परीक्षण शुरू कर सकते हैं:

```sh
npx wdio run ./wdio.conf.js
```

## लेखन परीक्षण

यह देखते हुए कि आपके पास निम्नलिखित Preact घटक हैं:

```tsx title="./components/Component.jsx"
import { h } from 'preact'
import { useState } from 'preact/hooks'

interface Props {
    initialCount: number
}

export function Counter({ initialCount }: Props) {
    const [count, setCount] = useState(initialCount)
    const increment = () => setCount(count + 1)

    return (
        <div>
            Current value: {count}
            <button onClick={increment}>Increment</button>
        </div>
    )
}

```

अपने परीक्षण में परीक्षण पृष्ठ पर घटक संलग्न करने के लिए `@testing-library/preact` से `render` विधि का उपयोग करें। घटक के साथ बातचीत करने के लिए हम WebdriverIO कमांड का उपयोग करने की अनुशंसा करते हैं क्योंकि वे वास्तविक उपयोगकर्ता इंटरैक्शन के अधिक निकट व्यवहार करते हैं, उदाहरण के लिए:

```ts title="app.test.tsx"
import { expect } from 'expect'
import { render, screen } from '@testing-library/preact'

import { Counter } from './components/PreactComponent.js'

describe('Preact Component Testing', () => {
    it('should increment after "Increment" button is clicked', async () => {
        const component = await $(render(<Counter initialCount={5} />))
        await expect(component).toHaveTextContaining('Current value: 5')

        const incrElem = await $(screen.getByText('Increment'))
        await incrElem.click()
        await expect(component).toHaveTextContaining('Current value: 6')
    })
})
```

आप रिएक्ट के लिए WebdriverIO कंपोनेंट टेस्ट सूट का पूरा उदाहरण हमारे [उदाहरण रिपॉजिटरी](https://github.com/webdriverio/component-testing-examples/tree/main/react-typescript-vite)में पा सकते हैं।
