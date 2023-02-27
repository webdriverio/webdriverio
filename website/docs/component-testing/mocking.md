---
id: mocking
title: Mocking
---

When writing tests it's only a matter of time before you need to create a "fake" version of an internal — or external — service. This is commonly referred to as mocking. WebdriverIO provides utility functions to help you out. You can `import { fn, spyOn, mock, unmock } from '@wdio/browser-runner'` to access it. See more information about the available mocking utilities in the [API docs](/docs/api/modules#wdiobrowser-runner).

## Functions

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

## Modules

Mock local modules or observe third-party-libraries, that are invoked in some other code, allowing you to test arguments, output or even redeclare its implementation.

There are two ways to mock functions: Either by creating a mock function to use in test code, or writing a manual mock to override a module dependency.

### Mocking File Imports

Let's imagine our component is importing a utility method from a file to handle a click.

```js title=utils.js
export function handleClick () {
    // handler implementation
}
```

In our component the click handler is used as following:

```ts title=LitComponent.js
import { handleClick } from './utils.js'

@customElement('simple-button')
export class SimpleButton extends LitElement {
    render() {
        return html`<button @click="${handleClick}">Click me!</button>`
    }
}
```

To mock the `handleClick` from `utils.js` we can use the `mock` method in our test as following:

```js title=LitComponent.test.js
import { expect, $ } from '@wdio/globals'
import { mock, fn } from '@wdio/browser-runner'
import { html, render } from 'lit'

import { SimpleButton } from './LitComponent.ts'
import { handleClick } from './utils.js'

/**
 * mock named export "handleClick" of `utils.ts` file
 */
mock('./utils.ts', () => ({
    handleClick: fn()
}))

describe('Simple Button Component Test', () => {
    it('call click handler', async () => {
        render(html`<simple-button />`, document.body)
        await $('simple-button').$('>>> button').click()
        expect(handleClick).toHaveBeenCalledTimes(1)
    })
})
```

### Mocking Dependencies

Suppose we have a class that fetches users from our API. The class uses [`axios`](https://github.com/axios/axios) to call the API then returns the data attribute which contains all the users:

```js title=users.js
import axios from 'axios';

class Users {
  static all() {
    return axios.get('/users.json').then(resp => resp.data)
  }
}

export default Users
```

Now, in order to test this method without actually hitting the API (and thus creating slow and fragile tests), we can use the `mock(...)` function to automatically mock the axios module.

Once we mock the module we can provide a [`mockResolvedValue`](https://vitest.dev/api/mock.html#mockresolvedvalue) for `.get` that returns the data we want our test to assert against. In effect, we are saying that we want `axios.get('/users.json')` to return a fake response.

```js title=users.test.js
import axios from 'axios'; // imports defined mock
import { mock, fn } from '@wdio/browser-runner'

import Users from './users.js'

/**
 * mock default export of `axios` dependency
 */
mock('axios', () => ({
    default: {
        get: fn()
    }
}))

describe('User API', () => {
    it('should fetch users', async () => {
        const users = [{name: 'Bob'}]
        const resp = {data: users}
        axios.get.mockResolvedValue(resp)

        // or you could use the following depending on your use case:
        // axios.get.mockImplementation(() => Promise.resolve(resp))

        const data = await Users.all()
        expect(data).toEqual(users)
    })
})
```

## Partials

Subsets of a module can be mocked and the rest of the module can keep their actual implementation:

```js title=foo-bar-baz.js
export const foo = 'foo';
export const bar = () => 'bar';
export default () => 'baz';
```

In your test you can access the original module by calling the `origModuleFactory` function:

```js
import { mock, fn } from '@wdio/browser-runner'
import defaultExport, { bar, foo } from './foo-bar-baz.js';

mock('./foo-bar-baz.js', async (origModuleFactory) => {
    const originalModule = await origModuleFactory()

    //Mock the default export and named export 'foo'
    return {
        __esModule: true,
        ...originalModule,
        default: fn(() => 'mocked baz'),
        foo: 'mocked foo',
    }
})

describe('partial mock', () => {
    it('should do a partial mock', () => {
        const defaultExportResult = defaultExport();
        expect(defaultExportResult).toBe('mocked baz');
        expect(defaultExport).toHaveBeenCalled();

        expect(foo).toBe('mocked foo');
        expect(bar()).toBe('bar');
    })
})
```

## Manual Mocks

Manual mocks are defined by writing a module in a `__mocks__/` (see also `automockDir` option) subdirectory. If the module you are mocking is a Node module (e.g.: `lodash`), the mock should be placed in the `__mocks__` directory and will be automatically mocked. There's no need to explicitly call `mock('module_name')`.

Scoped modules (also known as scoped packages) can be mocked by creating a file in a directory structure that matches the name of the scoped module. For example, to mock a scoped module called `@scope/project-name`, create a file at `__mocks__/@scope/project-name.js`, creating the `@scope/` directory accordingly.

```
.
├── config
├── __mocks__
│   ├── axios.js
│   ├── lodash.js
│   └── @scope
│       └── project-name.js
├── node_modules
└── views
```

When a manual mock exists for a given module, WebdriverIO will use that module when explicitly calling `mock('moduleName')`. However, when automock is set to true, the manual mock implementation will be used instead of the automatically created mock, even if `mock('moduleName')` is not called. To opt out of this behavior you will need to explicitly call `unmock('moduleName')` in tests that should use the actual module implementation, e.g.:

```js
import { unmock } from '@wdio/browser-runner'

unmock('lodash')
```

## Hoisting

In order to get mocking to work in the browser, WebdriverIO rewrites the test files and hoists the mock calls above everything else (see also [this blog post](https://www.coolcomputerclub.com/posts/jest-hoist-await/) on the hoisting problem in Jest). This limits the way you can pass in variables into the mock resolver, e.g.:

```js title=component.test.js
import dep from 'dependency'
const variable = 'foobar'

/**
 * ❌ this fails as `dep` and `variable` are not defined inside the mock resolver
 */
mock('./some/module.ts', () => ({
    exportA: dep,
    exportB: variable
}))
```

To fix this you have to define all used variables inside the resolver, e.g.:

```js title=component.test.js
/**
 * ✔️ this works as all variables are defined within the resolver
 */
mock('./some/module.ts', async () => {
    const dep = await import('dependency')
    const variable = 'foobar'

    return {
        exportA: dep,
        exportB: variable
    }
})
```

## Requests

If you are looking for mocking browser requests, e.g. API calls, head over to the [Request Mock and Spies](/docs/mocksandspies) section.
