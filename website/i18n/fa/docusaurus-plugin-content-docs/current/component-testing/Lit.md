---
id: lit
title: Lit
---

Lit یک کتابخانه ساده برای ساخت اجزای وب سریع و سبک است. آزمایش اجزای وب Lit با WebdriverIO به لطف انتخابگرهای [shadow DOM](/docs/selectors#deep-selectors) بسیار آسان است.

## تنظیم

برای راه‌اندازی WebdriverIO در پروژه Lit خود، دستورالعمل‌های [](/docs/component-testing#set-up) در اسناد تست اجزاء ما را دنبال کنید. برای Lit نیازی به تنظیم از پیش تعیین شده ندارید، زیرا اجزای وب Lit نیازی به اجرا از طریق یک کامپایلر ندارند، آنها بهبودی برای اجزاء خالص وب هستند.

پس از راه‌اندازی، می‌توانید تست‌ها را با اجرای زیر شروع کنید:

```sh
npx wdio run ./wdio.conf.js
```

## نوشتن تست‌ها

فرض کنید کامپوننت Lit زیر را دارید:

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

برای تست کامپوننت، باید قبل از شروع تست، آن را در صفحه تست رندر کنید و مطمئن شوید که بعداً پاک می شود:

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

می توانید یک نمونه کامل از مجموعه تست WebdriverIO برای Lit را در [مخزن نمونه ما](https://github.com/webdriverio/component-testing-examples/tree/main/lit-typescript-vite) بیابید.
