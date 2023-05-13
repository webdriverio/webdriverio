---
id: lit
title: Lit
---

லிட் என்பது வேகமான, இலகுரக வெப் காம்போனென்டுகளை உருவாக்குவதற்கான எளிய நூலகம். WebdriverIO உடன் Lit வெப் காம்போனென்டுகளை சோதிப்பது WebdriverIOs [shadow DOM selectors](/docs/selectors#deep-selectors) க்கு மிகவும் எளிதானது.

## செட்அப்

உங்கள் லிட் ப்ரொஜெக்ட்டில் WebdriverIO ஐ அமைக்க, எங்கள் காம்போனென்ட் டெஸ்ட் ஆவணத்தில் [instructions](/docs/component-testing#set-up)வழிமுறைகளைப் பின்பற்றவும். Lit க்கு உங்களுக்கு முன்னோட்டம் தேவையில்லை, ஏனெனில் Lit வெப் காம்போனென்டுகள் கம்பைலர் மூலம் இயங்கத் தேவையில்லை, அவை புயூர் வெப் காம்போனென்ட் மேம்பாடுகள்.

அமைத்தவுடன், டெஸ்டுகளை ரன் செய்வதன் மூலம் தொடங்கலாம்:

```sh
npx wdio run ./wdio.conf.js
```

## டெஸ்டுகளை எழுதுதல்

உங்களிடம் பின்வரும் லிட் கூறுகள் இருப்பதால்:

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

காம்போனென்டுகளைச் டெஸ்ட் செய்வதற்கு, டெஸ்ட் தொடங்கும் முன் அதை டெஸ்ட் பக்கத்திற்கு வழங்க வேண்டும், பின்னர் அது கிளீன் அப் செய்யப்படுவதை உறுதிசெய்யவும்:

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

Lit க்கான WebdriverIO காம்போனென்ட் டெஸ்ட் தொகுப்பின் முழு உதாரணத்தையும் எங்களின் [example repository](https://github.com/webdriverio/component-testing-examples/tree/main/lit-typescript-vite)இல் காணலாம்.
