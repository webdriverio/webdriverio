---
id: lit
title: Lit
---

Lit is a simple library for building fast, lightweight web components. Testing Lit web components with WebdriverIO is very easy thanks to WebdriverIOs [shadow DOM selectors](http://localhost:3000/docs/selectors#deep-selectors) you can query in shadow roots nested elements with just one single command.

## Setup

To setup WebdriverIO within your Lit project, follow the [instructions](/docs/component-testing#set-up) in our component testing docs. For Lit you need a preset as Lit web components don't need to run through a compiler, they are pure web component enhancements.

Once set-up, you can start the tests by running:

```sh
npx wdio run ./wdio.conf.js
```

## Writing Tests

Given you have the following Lit component:

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

In order test the component you have to render it into the test page before the test starts and ensure it gets cleaned up afterwards:

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

You can find a full example of a WebdriverIO component test suite for Lit in our [example repository](https://github.com/webdriverio/component-testing-examples/tree/main/lit-typescript-vite).
