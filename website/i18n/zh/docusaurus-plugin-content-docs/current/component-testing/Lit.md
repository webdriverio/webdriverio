---
id: lit
title: Lit
---

Lit 是一款用于构建快速、轻量 Web 组件的库。 得益于 WebdriverIO 的 [影子 DOM 选择器](/docs/selectors#deep-selectors)，您可以一键快速查询 Shadow Root 中的嵌套元素来进行测试。

## 设置

要在您的 Lit 项目中设置 WebdriverIO，请按照我们的组件测试文档中的 [说明](/docs/component-testing#set-up) 进行操作。 对于 Lit，您不需要预设，因为 Lit 网络组件不需要通过编译器运行，它们是纯粹的网络组件增强功能。

设置完成后，您可以通过运行以下命令开始测试：

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
