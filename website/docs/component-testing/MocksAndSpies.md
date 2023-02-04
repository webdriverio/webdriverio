---
id: mocks-and-spies
title: Mocks and Spies
---

In order to validate whether certain function handler are called as part of your component tests, the `@wdio/browser-runner` module exports mocking primitives you can use to test, if these functions have been called. You can import these methods via:

```js
import { fn, spy } from '@wdio/browser-runner'
```

By importing `fn` you can create a spy function (mock) to track its execution and with `spyOn` track a method on an already created object.

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs
  defaultValue="mocks"
  values={[
    {label: 'Mocks', value: 'mocks'},
    {label: 'Spies', value: 'spies'}
  ]
}>
<TabItem value="mocks">

The full example can be found in the [Component Testing Example](https://github.com/webdriverio/component-testing-examples/blob/main/react-typescript-vite/src/tests/LoginForm.test.tsx) repository.

```ts
import React from 'react'
import { $, expect } from '@wdio/globals'
import { fn } from '@wdio/browser-runner'
import { Key } from 'webdriverio'
import { render } from '@testing-library/react'

import LoginForm from '../components/LoginForm'

describe('LoginForm', () => {
    it('should call onLogin handler if username and password was provided', async () => {
        const onLogin = fn()
        render(<LoginForm onLogin={onLogin} />)
        await $('input[name="username"]').setValue('testuser123')
        await $('input[name="password"]').setValue('s3cret')
        await browser.keys(Key.Enter)

        /**
         * verify the handler was called
         */
        expect(onLogin).toBeCalledTimes(1)
        expect(onLogin).toBeCalledWith(expect.equal({
            username: 'testuser123',
            password: 's3cret'
        }))
    })
})
```

</TabItem>
<TabItem value="spies">

The full example can be found in the [examples](https://github.com/webdriverio/webdriverio/blob/main/examples/wdio/browser-runner/lit.test.js) directory.

```js
import { expect, $ } from '@wdio/globals'
import { spyOn } from '@wdio/browser-runner'
import { html, render } from 'lit'
import { SimpleGreeting } from './components/LitComponent.ts'

const getQuestionFn = spyOn(SimpleGreeting.prototype, 'getQuestion')

describe('Lit Component testing', () => {
    it('should render component', async () => {
        render(
            html`<simple-greeting name="WebdriverIO" />`,
            document.body
        )

        const innerElem = await $('simple-greeting').$('>>> p')
        expect(await innerElem.getText()).toBe('Hello, WebdriverIO! How are you today?')
    })

    it('should render with mocked component function', async () => {
        getQuestionFn.mockReturnValue('Does this work?')
        render(
            html`<simple-greeting name="WebdriverIO" />`,
            document.body
        )

        const innerElem = await $('simple-greeting').$('>>> p')
        expect(await innerElem.getText()).toBe('Hello, WebdriverIO! Does this work?')
    })
})
```

</TabItem>
</Tabs>

WebdriverIO just re-exports [`@vitest/spy`](https://www.npmjs.com/package/@vitest/spy) here which is a lightweight Jest compatible spy implementation that can be used with WebdriverIOs [`expect`](/docs/api/expect-webdriverio) matchers. You can find more documentation on these mock functions on the [Vitest project page](https://vitest.dev/api/mock.html).

Of course, you can also install and import any other spy framework, e.g. [SinonJS](https://sinonjs.org/), as long as it supports the browser environment.
