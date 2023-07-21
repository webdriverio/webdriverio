---
id: lit
title: Lit
---

लिट तेज, हल्के वेब घटकों के निर्माण के लिए एक सरल पुस्तकालय है। WebdriverIO के साथ लिट वेब घटकों का परीक्षण करना बहुत आसान है WebdriverIOs [शैडो डोम सेलेक्टर्स](/docs/selectors#deep-selectors) के लिए धन्यवाद आप केवल एक कमांड के साथ शैडो रूट्स नेस्टेड एलिमेंट्स में क्वेरी कर सकते हैं।

## सेटअप

अपने सॉलिडजेएस प्रोजेक्ट के भीतर वेबड्राइवरियो को सेटअप करने के लिए, हमारे घटक परीक्षण डॉक्स में [निर्देशों](/docs/component-testing#set-up) का पालन करें। लिट के लिए आपको प्रीसेट की आवश्यकता नहीं है क्योंकि लिट वेब घटकों को एक कंपाइलर के माध्यम से चलाने की आवश्यकता नहीं है, वे शुद्ध वेब घटक संवर्द्धन हैं।

एक बार सेट-अप हो जाने के बाद, आप चलाकर परीक्षण शुरू कर सकते हैं:

```sh
npx wdio run ./wdio.conf.js
```

## लेखन परीक्षण

यह देखते हुए कि आपके पास निम्नलिखित लिट घटक हैं:

```ts title="./components/Component.ts"
import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('simple-greeting')
export class SimpleGreeting extends LitElement {
    @property()
    name?: string = 'World'

    // Render the UI as a function of component state
    render() {
        return html`<p>Hello, ${this.name}!</p>`
    }
}
```

परीक्षण शुरू होने से पहले घटक का परीक्षण करने के लिए आपको इसे परीक्षण पृष्ठ में प्रस्तुत करना होगा और यह सुनिश्चित करना होगा कि यह बाद में साफ हो जाए:

```ts title="lit.test.js"
import expect from 'expect'
import { waitFor } from '@testing-library/dom'

// import Lit component
import './components/Component.ts'

describe('Lit Component testing', () => {
    let elem: HTMLElement

    beforeEach(() => {
        elem = document.createElement('simple-greeting')
    })

    it('should render component', async () => {
        elem.setAttribute('name', 'WebdriverIO')
        document.body.appendChild(elem)

        await waitFor(() => {
            expect(elem.shadowRoot.textContent).toBe('Hello, WebdriverIO!')
        })
    })

    afterEach(() => {
        elem.remove()
    })
})
```

आप हमारे [उदाहरण भंडार](https://github.com/webdriverio/component-testing-examples/tree/main/lit-typescript-vite)में Lit के लिए WebdriverIO घटक परीक्षण सूट का एक पूर्ण उदाहरण पा सकते हैं।
