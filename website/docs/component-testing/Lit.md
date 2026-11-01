---
id: lit
title: Lit
description: "Test Lit web components with the WebdriverIO browser runner, query nested shadow roots, and clean up rendered templates between tests."
---

Lit is a simple library for building fast, lightweight web components. Testing Lit web components with WebdriverIO is very easy thanks to WebdriverIOs [shadow DOM selectors](/docs/selectors#deep-selectors) you can query in shadow roots nested elements with just one single command.

## Setup

To setup WebdriverIO within your Lit project, follow the [instructions](/docs/component-testing#set-up) in our component testing docs. For Lit you don't need a preset as Lit web components don't need to run through a compiler, they are pure web component enhancements.

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

## Rendering Lit Templates

If you use Lit's `render()` to create your fixture, clear it with `render(nothing, container)` after each test. Lit keeps render state on the container. Removing only the rendered element does not clear that state, so rendering the same template again can leave the next test without its component.

Use a dedicated container to keep your fixture separate from the browser runner's page. This example reuses that container and the same template callsite across both tests:

```ts title="lit-render.test.ts"
import { $, expect } from '@wdio/globals'
import { html, render, nothing } from 'lit'

import './components/Component.ts'

describe('Lit template rendering', () => {
    let container: HTMLDivElement

    before(() => {
        container = document.createElement('div')
        container.id = 'lit-fixture'
        document.body.appendChild(container)
    })

    beforeEach(() => {
        render(html`<simple-greeting name="WebdriverIO"></simple-greeting>`, container)
    })

    afterEach(() => {
        render(nothing, container)
    })

    after(() => {
        container.remove()
    })

    for (const title of ['renders the greeting', 'renders it again in the next test']) {
        it(title, async () => {
            await expect($('#lit-fixture').$('simple-greeting').$('p'))
                .toHaveText('Hello, WebdriverIO!')
        })
    }
})
```

You can also create a new container in `beforeEach`. Clear it with `render(nothing, container)` before removing the container in `afterEach`. Keep this cleanup in your tests; the browser runner does not reset Lit's render state for you.

You can find a full example of a WebdriverIO component test suite for Lit in our [example repository](https://github.com/webdriverio/component-testing-examples/tree/main/lit-typescript-vite).
