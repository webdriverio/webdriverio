---
id: lit
title: Lit
---

Lit 是一款用于构建快速、轻量 Web 组件的库。 得益于 WebdriverIO 的 [影子 DOM 选择器](/docs/selectors#deep-selectors)，您可以一键快速查询 Shadow Root 中的嵌套元素来进行测试。

## Setup

To setup WebdriverIO within your Lit project, follow the [instructions](/docs/component-testing#set-up) in our component testing docs. For Lit you don't need a preset as Lit web components don't need to run through a compiler, they are pure web component enhancements. For Lit you don't need a preset as Lit web components don't need to run through a compiler, they are pure web component enhancements. For Lit you don't need a preset as Lit web components don't need to run through a compiler, they are pure web component enhancements.

Once set-up, you can start the tests by running:

```sh
npx wdio run ./wdio.conf.js
```

## 编写测试

假设您有如下 Lit 组件：

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

为了测试组件，您必须要在测试开始前将其渲染到测试页面中，并确保在测试完毕后被自动清理：

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

您可以在我们的[示例仓库](https://github.com/webdriverio/component-testing-examples/tree/main/lit-typescript-vite)中找到 Lit 的 WebdriverIO 测试套件的完整示例。
