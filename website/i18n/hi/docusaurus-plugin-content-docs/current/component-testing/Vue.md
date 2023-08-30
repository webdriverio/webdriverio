---
id: vue
title: Vue.js
---

[Vue.js](https://vuejs.org/) वेब यूजर इंटरफेस बनाने के लिए एक सुलभ, प्रदर्शनकारी और बहुमुखी ढांचा है। आप WebdriverIO और इसके [ब्राउज़र रनर](/docs/runner#browser-runner)का उपयोग करके सीधे वास्तविक ब्राउज़र में Vue.js घटकों का परीक्षण कर सकते हैं।

## सेटअप

अपने Vue.js प्रोजेक्ट में WebdriverIO सेटअप करने के लिए, हमारे कंपोनेंट टेस्टिंग डॉक्स में [निर्देशों](/docs/component-testing#set-up) का पालन करें। अपने रनर विकल्पों में `vue` प्रीसेट के रूप में चुनना सुनिश्चित करें, उदाहरण के लिए:

```js
// wdio.conf.js
export const config = {
    // ...
    runner: ['browser', {
        preset: 'vue'
    }],
    // ...
}
```

:::info

यदि आप पहले से ही विकास सर्वर के रूप में [Vite](https://vitejs.dev/) का उपयोग कर रहे हैं तो आप अपने WebdriverIO कॉन्फ़िगरेशन के भीतर `vite.config.ts` में अपने कॉन्फ़िगरेशन का पुन: उपयोग भी कर सकते हैं। अधिक जानकारी के लिए, `viteConfig` in [रनर विकल्प](/docs/runner#runner-options)देखें।

:::

Vue प्रीसेट को स्थापित करने के लिए `@vitejs/plugin-vue` की आवश्यकता होती है। साथ ही हम परीक्षण पृष्ठ में घटक को प्रस्तुत करने के लिए [परीक्षण लाइब्रेरी](https://testing-library.com/) का उपयोग करने की अनुशंसा करते हैं। इसके लिए आपको निम्नलिखित अतिरिक्त निर्भरताओं को स्थापित करने की आवश्यकता होगी:

```sh npm2yarn
npm install --save-dev @testing-library/vue @vitejs/plugin-vue
```

फिर आप चलाकर परीक्षण शुरू कर सकते हैं:

```sh
npx wdio run ./wdio.conf.js
```

## लेखन परीक्षण

यह देखते हुए कि आपके पास निम्नलिखित Vue.js घटक हैं:

```tsx title="./components/Component.vue"
<template>
    <div>
        <p>Times clicked: {{ count }}</p>
        <button @click="increment">increment</button>
    </div>
</template>

<script>
export default {
    data: () => ({
        count: 0,
    }),

    methods: {
        increment() {
            this.count++
        },
    },
}
</script>
```

अपने परीक्षण में परीक्षण पृष्ठ पर घटक संलग्न करने के लिए `@testing-library/vue` से `render` विधि का उपयोग करें। घटक के साथ बातचीत करने के लिए हम WebdriverIO कमांड का उपयोग करने की अनुशंसा करते हैं क्योंकि वे वास्तविक उपयोगकर्ता इंटरैक्शन के अधिक निकट व्यवहार करते हैं, उदाहरण के लिए:

```ts title="vue.test.js"
import { $, expect } from '@wdio/globals'
import { render } from '@testing-library/vue'
import Component from './components/Component.vue'

describe('Vue Component Testing', () => {
    it('increments value on click', async () => {
        // The render method returns a collection of utilities to query your component.
        const { getByText } = render(Component)

        // getByText returns the first matching node for the provided text, and
        // throws an error if no elements match or if more than one match is found.
        getByText('Times clicked: 0')

        const button = await $(getByText('increment'))

        // Dispatch a native click event to our button element.
        await button.click()
        await button.click()

        getByText('Times clicked: 2') // assert with Testing Library
        await expect($('p=Times clicked: 2')).toExist() // assert with WebdriverIO
    })
})
```

आप हमारे [उदाहरण भंडार](https://github.com/webdriverio/component-testing-examples/tree/main/vue-typescript-vite)में Vue.js के लिए WebdriverIO घटक परीक्षण सूट का एक पूर्ण उदाहरण पा सकते हैं।
