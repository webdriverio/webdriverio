---
id: solid
title: SolidJS
---

[सॉलिडजेएस](https://www.solidjs.com/) सरल और प्रदर्शनकारी प्रतिक्रियाशीलता के साथ यूजर इंटरफेस बनाने के लिए एक ढांचा है। आप WebdriverIO और इसके [ब्राउज़र रनर](/docs/runner#browser-runner)का उपयोग करके सीधे एक वास्तविक ब्राउज़र में सॉलिडजेएस घटकों का परीक्षण कर सकते हैं।

## सेटअप

अपने सॉलिडजेएस प्रोजेक्ट के भीतर वेबड्राइवरियो को सेटअप करने के लिए, हमारे घटक परीक्षण डॉक्स में [निर्देशों](/docs/component-testing#set-up) का पालन करें। अपने रनर विकल्पों में `solid` प्रीसेट के रूप में चुनना सुनिश्चित करें, उदाहरण के लिए:solid

```js
// wdio.conf.js
export const config = {
    // ...
    runner: ['browser', {
        preset: 'solid'
    }],
    // ...
}
```

:::info

यदि आप पहले से ही विकास सर्वर के रूप में [Vite](https://vitejs.dev/) का उपयोग कर रहे हैं तो आप अपने WebdriverIO कॉन्फ़िगरेशन के भीतर `vite.config.ts` में अपने कॉन्फ़िगरेशन का पुन: उपयोग भी कर सकते हैं। अधिक जानकारी के लिए, `viteConfig` in [रनर विकल्प](/docs/runner#runner-options)देखें।

:::

सॉलिडजेएस प्रीसेट को स्थापित करने के लिए `vite-plugin-solid`की आवश्यकता होती है:

```sh npm2yarn
npm install --save-dev vite-plugin-solid
```

फिर आप चलाकर परीक्षण शुरू कर सकते हैं:

```sh
npx wdio run ./wdio.conf.js
```

## लेखन परीक्षण

Given you have the following SolidJS component:

```html title="./components/Component.tsx"
import { createSignal } from 'solid-js'

function App() {
    const [theme, setTheme] = createSignal('light')

    const toggleTheme = () => {
        const nextTheme = theme() === 'light' ? 'dark' : 'light'
        setTheme(nextTheme)
    }

    return <button onClick={toggleTheme}>
        Current theme: {theme()}
    </button>
}

export default App
```

In your test use the `render` method from `solid-js/web` to attach the component to the test page. To interact with the component we recommend to use WebdriverIO commands as they behave more close to actual user interactions, e.g.:

```ts title="app.test.tsx"
import { expect } from '@wdio/globals'
import { render } from 'solid-js/web'

import App from './components/Component.jsx'

describe('React Component Testing', () => {
    /**
     * ensure we render the component for every test in a
     * new root container
     */
    let root: Element
    beforeEach(() => {
        if (root) {
            root.remove()
        }

        root = document.createElement('div')
        document.body.appendChild(root)
    })

    it('Test theme button toggle', async () => {
        render(<App />, root)
        const buttonEl = await $('button')

        await buttonEl.click()
        expect(buttonEl).toContainHTML('dark')
    })
})
```

You can find a full example of a WebdriverIO component test suite for SolidJS in our [example repository](https://github.com/webdriverio/component-testing-examples/tree/main/solidjs-typescript-vite).

