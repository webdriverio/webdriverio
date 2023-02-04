---
id: mocks-and-spies
title: Mocks and Spies
---

In order to validate whether certain function handler are called as part of your component tests, the `@wdio/browser-runner` module exports mocking primitives you can use to test, if these functions have been called. By importing `fn` you can create a spy function (mock) to track its execution and with `spyOn` track a method on an already created object.

```ts
// see full example here: https://github.com/webdriverio/component-testing-examples/blob/main/react-typescript-vite/src/tests/LoginForm.test.tsx
import React from 'react'
import { $, expect } from '@wdio/globals'
import { Key } from 'webdriverio'
import { render } from '@testing-library/react'

/**
 * import mock capabilities
 */
import { fn, spyOn } from '@wdio/browser-runner'

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

WebdriverIO just re-exports [`@vitest/spy`](https://www.npmjs.com/package/@vitest/spy) here which is a lightweight Jest compatible spy implementation that can be used with WebdriverIOs [`expect`](/docs/api/expect-webdriverio) matchers. You can find more documentation on these mock functions on the [Vitest project page](https://vitest.dev/api/mock.html).

Of course, you can also install and import any other spy framework, e.g. [SinonJS](https://sinonjs.org/), as long as it supports the browser environment.
