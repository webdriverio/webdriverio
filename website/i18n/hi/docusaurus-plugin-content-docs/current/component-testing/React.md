---
id: react
title: React
---

[रिएक्ट](https://reactjs.org/) इंटरैक्टिव यूआई बनाने के लिए दर्द रहित बनाता है। अपने एप्लिकेशन में प्रत्येक स्थिति के लिए सरल दृश्य डिज़ाइन करें, और जब आपका डेटा बदलता है तो रिएक्ट प्रभावी रूप से सही घटकों को अपडेट और प्रस्तुत करेगा। आप WebdriverIO और इसके [ब्राउज़र रनर](/docs/runner#browser-runner)का उपयोग करके सीधे एक वास्तविक ब्राउज़र में रिएक्ट घटकों का परीक्षण कर सकते हैं।

## सेटअप

अपने रिएक्ट प्रोजेक्ट में WebdriverIO को सेटअप करने के लिए, हमारे कंपोनेंट टेस्टिंग डॉक्स में दिए गए [निर्देशों](/docs/component-testing#set-up) का पालन करें। अपने रनर विकल्पों में पूर्व निर्धारित के रूप में `react` चयन करना सुनिश्चित करें, उदाहरण के लिए:

```js
// wdio.conf.js
export const config = {
    // ...
    runner: ['browser', {
        preset: 'react'
    }],
    // ...
}
```

:::info

यदि आप पहले से ही विकास सर्वर के रूप में [Vite](https://vitejs.dev/) का उपयोग कर रहे हैं तो आप अपने WebdriverIO कॉन्फ़िगरेशन के भीतर `vite.config.ts` में अपने कॉन्फ़िगरेशन का पुन: उपयोग भी कर सकते हैं। अधिक जानकारी के लिए, `viteConfig` in [runner options](/docs/runner#runner-options)देखें।

:::

रिएक्ट प्रीसेट को स्थापित करने के लिए `@vitejs/plugin-react` की आवश्यकता होती है। साथ ही हम परीक्षण पृष्ठ में घटक को प्रस्तुत करने के लिए [परीक्षण लाइब्रेरी](https://testing-library.com/) का उपयोग करने की अनुशंसा करते हैं। इसके लिए आपको निम्नलिखित अतिरिक्त निर्भरताओं को स्थापित करने की आवश्यकता होगी:

```sh npm2yarn
npm install --save-dev @testing-library/react @vitejs/plugin-react
```

फिर आप चलाकर परीक्षण शुरू कर सकते हैं:

```sh
npx wdio run ./wdio.conf.js
```

## लेखन परीक्षण

यह देखते हुए कि आपके पास निम्नलिखित प्रतिक्रिया घटक हैं:

```tsx title="./components/Component.jsx"
import React, { useState } from 'react'

function App() {
    const [theme, setTheme] = useState('light')

    const toggleTheme = () => {
        const nextTheme = theme === 'light' ? 'dark' : 'light'
        setTheme(nextTheme)
    }

    return <button onClick={toggleTheme}>
        Current theme: {theme}
    </button>
}

export default App
```

अपने परीक्षण में परीक्षण पृष्ठ पर घटक संलग्न करने के लिए `@testing-library/react` से `render` विधि का उपयोग करें। घटक के साथ बातचीत करने के लिए हम WebdriverIO कमांड का उपयोग करने की अनुशंसा करते हैं क्योंकि वे वास्तविक उपयोगकर्ता इंटरैक्शन के अधिक निकट व्यवहार करते हैं, उदाहरण के लिए:

```ts title="app.test.tsx"
import { expect } from '@wdio/globals'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import * as matchers from '@testing-library/jest-dom/matchers'
expect.extend(matchers)

import App from './components/Component.jsx'

describe('React Component Testing', () => {
    it('Test theme button toggle', async () => {
        render(<App />)
        const buttonEl = screen.getByText(/Current theme/i)

        await $(buttonEl).click()
        expect(buttonEl).toContainHTML('dark')
    })
})
```

आप रिएक्ट के लिए WebdriverIO कंपोनेंट टेस्ट सूट का पूरा उदाहरण हमारे [उदाहरण रिपॉजिटरी](https://github.com/webdriverio/component-testing-examples/tree/main/react-typescript-vite)में पा सकते हैं।

