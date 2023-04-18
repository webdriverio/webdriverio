---
id: svelte
title: Svelte
---

[Svelte](https://svelte.dev/) यूजर इंटरफेस बनाने के लिए एक क्रांतिकारी नया दृष्टिकोण है। जबकि रिएक्ट और वीयू जैसे पारंपरिक ढांचे ब्राउज़र में अपना अधिकांश काम करते हैं, Svelte उस काम को एक संकलन चरण में बदल देता है जो तब होता है जब आप अपना ऐप बनाते हैं। आप WebdriverIO और इसके [ब्राउज़र रनर](/docs/runner#browser-runner)का उपयोग करके सीधे एक वास्तविक ब्राउज़र में Svelte घटकों का परीक्षण कर सकते हैं।

## सेटअप

अपने Svelte प्रोजेक्ट में WebdriverIO को सेटअप करने के लिए, हमारे घटक परीक्षण डॉक्स में दिए गए [निर्देशों](/docs/component-testing#set-up) का पालन करें। सुनिश्चित करें कि आप अपने रनर विकल्पों में `svelte` प्रीसेट के रूप में चुनें, जैसे:

```js
// wdio.conf.js
export const config = {
    // ...
    runner: ['browser', {
        preset: 'svelte'
    }],
    // ...
}
```

:::info

यदि आप पहले से ही विकास सर्वर के रूप में [Vite](https://vitejs.dev/) का उपयोग कर रहे हैं तो आप अपने WebdriverIO कॉन्फ़िगरेशन के भीतर `vite.config.ts` में अपने कॉन्फ़िगरेशन का पुन: उपयोग भी कर सकते हैं। अधिक जानकारी के लिए, `viteConfig` in [रनर विकल्प](/docs/runner#runner-options)देखें।

:::

Svelte प्रीसेट को स्थापित करने के लिए `@sveltejs/vite-plugin-svelte` की आवश्यकता होती है। साथ ही हम परीक्षण पृष्ठ में घटक को प्रस्तुत करने के लिए [परीक्षण लाइब्रेरी](https://testing-library.com/) का उपयोग करने की अनुशंसा करते हैं। इसके लिए आपको निम्नलिखित अतिरिक्त निर्भरताओं को स्थापित करने की आवश्यकता होगी:

```sh npm2yarn
npm install --save-dev @testing-library/svelte @sveltejs/vite-plugin-svelte
```

फिर आप चलाकर परीक्षण शुरू कर सकते हैं:

```sh
npx wdio run ./wdio.conf.js
```

## लेखन परीक्षण

यह देखते हुए कि आपके पास निम्नलिखित Svelte घटक हैं:

```html title="./components/Component.svelte"
<script>
    export let name

    let buttonText = 'Button'

    function handleClick() {
      buttonText = 'Button Clicked'
    }
</script>

<h1>Hello {name}!</h1>
<button on:click="{handleClick}">{buttonText}</button>
```

अपने परीक्षण में परीक्षण पृष्ठ पर घटक संलग्न करने के लिए `@testing-library/svelte` से `render` विधि का उपयोग करें। घटक के साथ बातचीत करने के लिए हम WebdriverIO कमांड का उपयोग करने की अनुशंसा करते हैं क्योंकि वे वास्तविक उपयोगकर्ता इंटरैक्शन के अधिक निकट व्यवहार करते हैं, उदाहरण के लिए:

```ts title="svelte.test.js"
import expect from 'expect'

import { render, fireEvent, screen } from '@testing-library/svelte'
import '@testing-library/jest-dom'

import Component from './components/Component.svelte'

describe('Svelte Component Testing', () => {
    it('changes button text on click', async () => {
        render(Component, { name: 'World' })
        const button = await $('button')
        await expect(button).toHaveText('Button')
        await button.click()
        await expect(button).toHaveText('Button Clicked')
    })
})
```

आप Svelte के लिए WebdriverIO कंपोनेंट टेस्ट सूट का पूरा उदाहरण हमारे [उदाहरण रिपॉजिटरी](https://github.com/webdriverio/component-testing-examples/tree/main/svelte-typescript-vite)में पा सकते हैं।

