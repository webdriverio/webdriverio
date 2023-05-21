---
id: accessibility
title: تست دستیابی پذیری
---

می توانید تست های دستیابی پذیری را در مجموعه تست‌های WebdriverIO خود را با استفاده از ابزارهای دسترسی منبع باز [از Deque به نام Ax](https://www.deque.com/axe/) اضافه کنید. راه اندازی بسیار آسان است، تنها کاری که باید انجام دهید این است که آداپتور WebdriverIO Axe را از طریق زیر نصب کنید:

```bash npm2yarn
npm install -g @axe-core/webdriverio
```

آداپتور Axe را می توان در حالت [مستقل یا اجرا کننده تست](/docs/setuptypes) با وارد کردن و مقداردهی اولیه آن با شیء [browser](/docs/api/browser)استفاده کرد، به عنوان مثال:

```ts
import { browser } from '@wdio/globals'
import AxeBuilder from '@axe-core/webdriverio'

describe('Accessibility Test', () => {
    it('should get the accessibility results from a page', async () => {
        const builder = new AxeBuilder({ client: browser })

        await browser.url('https://testingbot.com')
        const result = await builder.analyze()
        console.log('Acessibility Results:', result)
    })
})
```

می توانید اسناد بیشتری را در مورد آداپتور Axe WebdriverIO را در [GitHub](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/webdriverio#usage) بیابید.
