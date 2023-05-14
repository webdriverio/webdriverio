---
id: mocking
title: Mocking
---

டெஸ்டுகளை எழுதும்போது, நீங்கள் இன்டெர்னல் அல்லது எக்ஸ்டெர்னல் சர்வீஸின் "போலி" பதிப்பை உருவாக்க வேண்டும். இது பொதுவாக மாக்கிங் என்று குறிப்பிடப்படுகிறது. WebdriverIO உங்களுக்கு உதவ பயன்பாட்டு செயல்பாடுகளை வழங்குகிறது. அதை அணுக '@wdio/browser-runner'</code> இலிருந்து {fn, spyOn, mock, unmock } ஐ நீங்கள் `இறக்குமதி செய்யலாம். <a href="/docs/api/modules#wdiobrowser-runner">API docs</a>இல் இருக்கும் மாக் செய்யும் பயன்பாடுகள்பற்றிய கூடுதல் தகவலைப் பார்க்கவும்.</p>

<h2 spaces-before="0">செயல்பாடுகள்</h2>

<p spaces-before="0">சில செயல்பாடு ஹேண்ட்லர்கள் உங்கள் காம்போனென்ட் சோதனைகளின் ஒரு பகுதியாக அழைக்கப்படுகிறதா என்பதைச் சரிபார்க்க, <code>@wdio/browser-runner` மாட்யூல் மாக் செய்யும் ப்ரிமிட்டிவ்களை ஏற்றுமதி செய்கிறது, இந்தச் செயல்பாடுகள் அழைக்கப்பட்டிருந்தால், நீங்கள் சோதிக்க பயன்படுத்தலாம். இந்த மெத்தெடுகளை நீங்கள் இறக்குமதி செய்யலாம்:

```js
import { fn, spy } from '@wdio/browser-runner'
```

`fn` ஐ இறக்குமதி செய்வதன் மூலம், அதன் செயல்பாட்டைக் கண்காணிக்க உளவு செயல்பாட்டை (mock) உருவாக்கலாம் மற்றும் `spyOn` மூலம் ஏற்கனவே உருவாக்கப்பட்ட ஆப்ஜெக்ட்டின் மீது ஒரு மெத்தடை கண்காணிக்கலாம்.

<Tabs
  defaultValue="mocks"
  values={[
    {label: 'Mocks', value: 'mocks'},
 {label: 'Spies', value: 'spies'}
 ]
}>
<TabItem value="mocks">

முழு உதாரணத்தையும் [Component Testing Example](https://github.com/webdriverio/component-testing-examples/blob/main/react-typescript-vite/src/tests/LoginForm.test.tsx) இல் காணலாம் களஞ்சியம்.

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

முழு உதாரணத்தையும் [examples](https://github.com/webdriverio/webdriverio/blob/main/examples/wdio/browser-runner/lit.test.js) கோப்பகத்தில் காணலாம்.

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

WebdriverIO [`@vitest/spy`](https://www.npmjs.com/package/@vitest/spy) மீண்டும் ஏற்றுமதி செய்கிறது, இது WebdriverIOs [` expect `](/docs/api/expect-webdriverio) மேட்ச்சர்களுடன் பயன்படுத்தக்கூடிய இலகுரக ஜெஸ்ட் இணக்கமான உளவு செயலாக்கமாகும். இந்த மாக் செயல்பாடுகள்பற்றிய கூடுதல் ஆவணங்களை [Vitest project page](https://vitest.dev/api/mock.html)இல் காணலாம்.

நிச்சயமாக, நீங்கள் வேறு எந்த உளவு பிரமேஒர்க்கையும் நிறுவலாம் மற்றும் இறக்குமதி செய்யலாம், எ.கா. [SinonJS](https://sinonjs.org/), பிரௌசர் என்விரான்மென்டை ஆதரிக்கும் வரை.

## தொகுதிகள்

லோக்கல் தொகுதிகளை மாக் செய்யவும் அல்லது வேறுசில கோடில் செயல்படுத்தப்படுகின்ற மூன்றாம் தரப்பு-லைப்ரரிகளை கண்காணிக்கவும், ஆர்குமென்டுகளை டெஸ்ட் செய்யவும், வெளியீடு செய்யவும் அல்லது அதன் செயலாக்கத்தை மீண்டும் அறிவிக்கவும் அனுமதிக்கிறது.

There are two ways to mock functions: Either by creating a mock function to use in test code, or writing a manual mock to override a module dependency.

### பைல் இறக்குமதிகளை மாக் செய்தல்

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
