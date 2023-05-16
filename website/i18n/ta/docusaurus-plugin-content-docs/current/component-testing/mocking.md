---
id: mocking
title: Mocking
---

டெஸ்டுகளை எழுதும்போது, நீங்கள் இன்டெர்னல் அல்லது எக்ஸ்டெர்னல் சர்வீஸின் "போலி" பதிப்பை உருவாக்க வேண்டும். இது பொதுவாக மாக்கிங் என்று குறிப்பிடப்படுகிறது. WebdriverIO உங்களுக்கு உதவ பயன்பாட்டு செயல்பாடுகளை வழங்குகிறது. அதை அணுக `'@wdio/browser-runner'` இலிருந்து {fn, spyOn, mock, unmock } ஐ நீங்கள் இறக்குமதி செய்யலாம். <a href="/docs/api/modules#wdiobrowser-runner">API docs</a>இல் இருக்கும் மாக் செய்யும் பயன்பாடுகள்பற்றிய கூடுதல் தகவலைப் பார்க்கவும்.

## செயல்பாடுகள்

சில செயல்பாடு ஹேண்ட்லர்கள் உங்கள் காம்போனென்ட் சோதனைகளின் ஒரு பகுதியாக அழைக்கப்படுகிறதா என்பதைச் சரிபார்க்க, `@wdio/browser-runner` மாட்யூல் மாக் செய்யும் ப்ரிமிட்டிவ்களை ஏற்றுமதி செய்கிறது, இந்தச் செயல்பாடுகள் அழைக்கப்பட்டிருந்தால், நீங்கள் சோதிக்க பயன்படுத்தலாம். இந்த மெத்தெடுகளை நீங்கள் இறக்குமதி செய்யலாம்:

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

செயல்பாடுகளை மாக் செய்ய இரண்டு வழிகள் உள்ளன: டெஸ்ட் கோடில் பயன்படுத்த ஒரு மாக் செயல்பாட்டை உருவாக்குவதன் மூலம் அல்லது ஒரு தொகுதி சார்புநிலையை ஓவர்ரைடு செய்ய ஒரு மேனுவல் மாக் எழுதுவதன் மூலம்.

### பைல் இறக்குமதிகளை மாக் செய்தல்

ஒரு க்ளிக்கைக் கையாள ஒரு பைலிலிருந்து ஒரு பயன்பாட்டு முறையை எங்கள் காம்போனென்ட் இறக்குமதி செய்கிறது என்று கற்பனை செய்து கொள்வோம்.

```js title=utils.js
export function handleClick () {
    // handler implementation
}
```

எங்கள் காம்போனென்டுகளில் கிளிக் கையாளுதல் பின்வருமாறு பயன்படுத்தப்படுகிறது:

```ts title=LitComponent.js
import { handleClick } from './utils.js'

@customElement('simple-button')
export class SimpleButton extends LitElement {
    render() {
        return html`<button @click="${handleClick}">Click me!</button>`
    }
}
```

`utils.js` இலிருந்து `handleClick` மாக் செய்ய, எங்கள் டெஸ்டில் `mock` மெத்தடைப் பின்வருமாறு பயன்படுத்தலாம்:

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

### மாக்கிங் சார்புகள்

எங்களின் API இலிருந்து பயனர்களைப் பெறும் ஒரு கிளாஸ் எங்களிடம் உள்ளது என்று வைத்துக்கொள்வோம். API ஐ அழைக்கக் கிளாஸ் [`axios`](https://github.com/axios/axios) ஐப் பயன்படுத்துகிறது, பின்னர் அனைத்து பயனர்களையும் உள்ளடக்கிய டேட்டா ஆட்ரிபூட் வழங்குகிறது:

```js title=users.js
import axios from 'axios';

class Users {
  static all() {
    return axios.get('/users.json').then(resp => resp.data)
  }
}

export default Users
```

இப்போது, API ஐத் தாக்காமல் இந்த டெஸ்ட் செய்வதற்காக (இதனால் மெதுவான மற்றும் பலவீனமான டெஸ்டுகளை உருவாக்குதல்), நாம் `mock(...)` செயல்பாட்டைப் பயன்படுத்தி, axios தொகுதியைத் தானாகவே மாக் செய்யலாம்.

தொகுதியை நாம் மாக் செய்தவுடன், [`mockResolvedValue`](https://vitest.dev/api/mock.html#mockresolvedvalue) `get.` ஐப் பெறுங்கள், இது எங்கள் டெஸ்டிற்கு எதிராக நாங்கள் உறுதிப்படுத்த விரும்பும் டேட்டாவை வழங்கும். உண்மையில், போலியான பதிலை வழங்க `axios.get('/users.json')` வேண்டும் என்று கூறுகிறோம்.

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

## பகுதிகள்

ஒரு தொகுதியின் துணைக்குழுக்கள் மாக் செய்யப்படலாம் மற்றும் மீதமுள்ள தொகுதிகள் அவற்றின் உண்மையான செயலாக்கத்தை வைத்திருக்க முடியும்:

```js title=foo-bar-baz.js
export const foo = 'foo';
export const bar = () => 'bar';
export default () => 'baz';
```

உங்கள் டெஸ்டில் `origModuleFactory` செயல்பாட்டை அழைப்பதன் மூலம் அசல் தொகுதியை அணுகலாம்:

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

## மேனுவல் மாக்ஸ்

`__mocks__/` (`automockDir` விருப்பத்தையும் பார்க்கவும்) துணை டைரக்டரியில் ஒரு தொகுதியை எழுதுவதன் மூலம் மேனுவல் மாக்குகள் வரையறுக்கப்படுகின்றன. நீங்கள் மாக் செய்யும் தொகுதி ஒரு நோடு தொகுதியாக இருந்தால் (எ.கா: `lodash`), அந்த மாக் `__mocks__` டைரக்டரியில் வைக்கப்பட வேண்டும் மற்றும் தானாகவே மாக் செய்யப்படும். `mock('module_name')`வெளிப்படையாக அழைக்க வேண்டிய அவசியம் இல்லை.

ஸ்கோப் செய்யப்பட்ட தொகுதிகள் (ஸ்கோப்டு பேக்கேஜ்கள் என்றும் அழைக்கப்படுகின்றன) டைரக்டரி அமைப்பில் ஒரு பைலை உருவாக்குவதன் மூலம் மாக் செய்யப்படலாம், இது ஸ்கோப்டு தொகுதியின் பெயருடன் பொருந்த வேண்டும். எடுத்துக்காட்டாக, `@scope/project-name`எனப்படும் ஸ்கோப் தொகுதியை மாக் செய்ய, `__mocks__/@scope/project-name.js`இல் ஒரு பைலை உருவாக்கவும், அதன்படி `@scope/` டைரக்டரியை உருவாக்கவும்.

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

கொடுக்கப்பட்ட தொகுதிக்கு ஒரு மேனுவல் மாக் இருக்கும்போது, WebdriverIO `mock('moduleName')`வெளிப்படையாக அழைக்கும்போது அந்தத் தொகுதியைப் பயன்படுத்தும். இருப்பினும், automock true என அமைக்கப்படும்போது, `mock('moduleName')` அழைக்கப்படாவிட்டாலும், தானாக உருவாக்கப்பட்ட மாக்கிற்கு பதிலாகக் மேனுவல் மாக் செயல்படுத்தல் பயன்படுத்தப்படும். இந்த நடத்தையிலிருந்து விலக, உண்மையான தொகுதிச் செயலாக்கத்தைப் பயன்படுத்த வேண்டிய டெஸ்டுகளில் `unmock('moduleName')` நீங்கள் வெளிப்படையாக அழைக்க வேண்டும், எ.கா.:

```js
import { unmock } from '@wdio/browser-runner'

unmock('lodash')
```

## Hoisting

பிரௌசரில் மாக் செய்வதைப் பெறுவதற்காக, WebdriverIO டெஸ்ட் பைல்களை மீண்டும் எழுதுகிறது மற்றும் எல்லாவற்றிற்கும் மேலாக மாக் அழைப்புகளை உயர்த்துகிறது (Jest இல் ஏற்றுதல் பிரச்சனையில் [this blog post](https://www.coolcomputerclub.com/posts/jest-hoist-await/) ஐயும் பார்க்கவும்). மாக் ரிசல்வரில் நீங்கள் வேறியபல்ஸுகளை அனுப்பும் வழியை இது கட்டுப்படுத்துகிறது, எ.கா.:

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

இதைச் சரிசெய்ய, ரிசல்வருக்குள் பயன்படுத்தப்படும் அனைத்து வேறியபல்ஸுகளையும் நீங்கள் வரையறுக்க வேண்டும், எ.கா.:

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

## கோரிக்கை

மாக் செய்யும் பிரௌசர் கோரிக்கைகளை நீங்கள் தேடுகிறீர்களானால், எ.கா. API அழைப்புகள், [Request Mock and Spies](/docs/mocksandspies) பகுதிக்குச் செல்லவும்.
