---
id: mocking
title: मोकिंग
---

परीक्षण लिखते समय यह केवल कुछ समय पहले की बात है जब आपको आंतरिक - या बाहरी - सेवा का "नकली" संस्करण बनाने की आवश्यकता होती है। इसे आमतौर पर मजाक के रूप में जाना जाता है। WebdriverIO आपकी मदद करने के लिए उपयोगिता कार्य प्रदान करता है। आप इसे एक्सेस करने के लिए `import { fn, spyOn, mock, unmock } से '@wdio/browser-runner'`} इम्पोर्ट कर कते हैं उपलब्ध मॉकिंग उपयोगिताओं के बारे में अधिक जानकारी [एपीआई डॉक्स](/docs/api/modules#wdiobrowser-runner)में देखें।

## कार्य

यह सत्यापित करने के लिए कि कुछ फ़ंक्शन हैंडलर को आपके घटक परीक्षणों के हिस्से के रूप में बुलाया जाता है या नहीं, `@wdio/browser-runner` मॉड्यूल मॉकिंग प्रिमिटिव निर्यात करता है जिसका उपयोग आप परीक्षण के लिए कर सकते हैं, यदि इन फ़ंक्शंस को कॉल किया गया है। आप इन तरीकों को आयात कर सकते हैं:

```js
import { fn, spy } from '@wdio/browser-runner'
```

`fn` आयात करके आप इसके निष्पादन को ट्रैक करने के लिए एक स्पाई फंक्शन (नकली) बना सकते हैं और `spyOn` के साथ पहले से निर्मित वस्तु पर एक विधि को ट्रैक कर सकते हैं।

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

पूरा उदाहरण [घटक परीक्षण उदाहरण](https://github.com/webdriverio/component-testing-examples/blob/main/react-typescript-vite/src/tests/LoginForm.test.tsx) में पाया जा सकता है। भंडार।

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

पूरा उदाहरण [examples](https://github.com/webdriverio/webdriverio/blob/main/examples/wdio/browser-runner/lit.test.js) निर्देशिका में पाया जा सकता है।

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

WebdriverIO सिर्फ [`@ vitest/spy`](https://www.npmjs.com/package/@vitest/spy) को यहां फिर से निर्यात करता है जो एक हल्का जेस्ट संगत स्पाई कार्यान्वयन है जिसका उपयोग WebdriverIOs [`expect`](/docs/api/expect-webdriverio) मैचर्स की अपेक्षा के साथ किया जा सकता है। आप इन मॉक फंक्शन्स के बारे में अधिक दस्तावेज़ीकरण [Vitest प्रोजेक्ट पेज](https://vitest.dev/api/mock.html)पर प्राप्त कर सकते हैं।

बेशक, आप किसी अन्य स्पाई फ्रेमवर्क को स्थापित और आयात भी कर सकते हैं, जैसे [SinonJS](https://sinonjs.org/), जब तक कि यह ब्राउज़र वातावरण का समर्थन करता है।

## मॉड्यूल

नकली स्थानीय मॉड्यूल या तृतीय-पक्ष-पुस्तकालयों का निरीक्षण करें, जिन्हें किसी अन्य कोड में लागू किया जाता है, जिससे आप तर्कों, आउटपुट का परीक्षण कर सकते हैं या इसके कार्यान्वयन को फिर से शुरू कर सकते हैं।

मॉक फ़ंक्शंस के दो तरीके हैं: या तो परीक्षण कोड में उपयोग करने के लिए मॉक फ़ंक्शन बनाकर, या मॉड्यूल निर्भरता को ओवरराइड करने के लिए मैन्युअल मॉक लिखकर।

### नकली फ़ाइल आयात

आइए कल्पना करें कि हमारा घटक क्लिक को संभालने के लिए फ़ाइल से उपयोगिता विधि आयात कर रहा है।

```js title=utils.js
export function handleClick () {
    // handler implementation
}
```

हमारे घटक में क्लिक हैंडलर का उपयोग निम्नानुसार किया जाता है:

```ts title=LitComponent.js
import { handleClick } from './utils.js'

@customElement('simple-button')
export class SimpleButton extends LitElement {
    render() {
        return html`<button @click="${handleClick}">Click me!</button>`
    }
}
```

हैंडल को मॉक करने के लिए `handleClick` से `utils.js`पर क्लिक करें, हम अपने टेस्ट में `mock` मेथड का उपयोग इस प्रकार कर सकते हैं:

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

### नकली निर्भरता

मान लीजिए कि हमारे पास एक वर्ग है जो हमारे एपीआई से उपयोगकर्ताओं को प्राप्त करता है। एपीआई को कॉल करने के लिए वर्ग [`axios`](https://github.com/axios/axios) का उपयोग करता है, फिर डेटा विशेषता देता है जिसमें सभी उपयोगकर्ता शामिल होते हैं:

```js title=users.js
import axios from 'axios';

class Users {
  static all() {
    return axios.get('/users.json').then(resp => resp.data)
  }
}

export default Users
```

अब, वास्तव में एपीआई को हिट किए बिना इस विधि का परीक्षण करने के लिए (और इस प्रकार धीमी और नाजुक परीक्षण बनाते हुए), हम एक्सिस मॉड्यूल को स्वचालित रूप से नकली करने के लिए `mock(...)` फ़ंक्शन का उपयोग कर सकते हैं।

एक बार जब हम मॉड्यूल का मज़ाक उड़ाते हैं तो हम [`mockResolvedValue`](https://vitest.dev/api/mock.html#mockresolvedvalue) के लिए `.get` प्राप्त करें जो उस डेटा को लौटाता है जिसके खिलाफ हम चाहते हैं कि हमारा परीक्षण हो। वास्तव में, हम कह रहे हैं कि हम चाहते हैं कि `axios.get('/users.json')` नकली प्रतिक्रिया लौटाए।

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

## आंशिक

एक मॉड्यूल के सबसेट का मज़ाक उड़ाया जा सकता है और बाकी मॉड्यूल अपना वास्तविक कार्यान्वयन रख सकते हैं:

```js title=foo-bar-baz.js
export const foo = 'foo';
export const bar = () => 'bar';
export default () => 'baz';
```

अपने परीक्षण में आप `origModuleFactory` फ़ंक्शन को कॉल करके मूल मॉड्यूल तक पहुंच सकते हैं:

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

## मैनुअल मॉक

मैनुअल मॉक को `__mocks__/` (भी देखें `automockDir`) उपनिर्देशिका में एक मॉड्यूल लिखकर परिभाषित किया गया है। यदि आप जिस मॉड्यूल का मज़ाक उड़ा रहे हैं वह एक नोड मॉड्यूल है (उदाहरण: `lodash`), नकली को `__mocks__` निर्देशिका में रखा जाना चाहिए और स्वचालित रूप से मज़ाक उड़ाया जाएगा। `mock('module_name')`स्पष्ट रूप से कॉल करने की कोई आवश्यकता नहीं है।

स्कोप्ड मॉड्यूल (जिसे स्कोप्ड पैकेज के रूप में भी जाना जाता है) को एक डायरेक्टरी स्ट्रक्चर में फाइल बनाकर मॉक किया जा सकता है जो स्कोप्ड मॉड्यूल के नाम से मेल खाता है। उदाहरण के लिए, `@scope/project-name` नामक एक स्कोप्ड मॉड्यूल को मॉक करने के लिए, `__mocks__/@scope/project-name.js` पर एक फाइल बनाएं, तदनुसार `@scope/` डायरेक्टरी बनाएं।

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

जब किसी दिए गए मॉड्यूल के लिए मैन्युअल मॉक मौजूद होता है, तो WebdriverIO `mock('moduleName')`को स्पष्ट रूप से कॉल करते समय उस मॉड्यूल का उपयोग करेगा। हालाँकि, जब ऑटोमॉक को सही पर सेट किया जाता है, तो स्वचालित रूप से बनाए गए मॉक के बजाय मैन्युअल मॉक कार्यान्वयन का उपयोग किया जाएगा, भले ही <`mock('moduleName')` को कॉल न किया गया हो। इस व्यवहार से बाहर निकलने के लिए आपको परीक्षणों में `unmock('moduleName')` को स्पष्ट रूप से कॉल करने की आवश्यकता होगी जो वास्तविक मॉड्यूल कार्यान्वयन का उपयोग करना चाहिए, उदाहरण के लिए:

```js
import { unmock } from '@wdio/browser-runner'

unmock('lodash')
```

## Hoisting

ब्राउज़र में काम करने के लिए मज़ाक करने के लिए, WebdriverIO परीक्षण फ़ाइलों को फिर से लिखता है और मॉक कॉल्स को बाकी सभी चीज़ों से ऊपर उठाता है (यह भी देखें [यह ब्लॉग पोस्ट](https://www.coolcomputerclub.com/posts/jest-hoist-await/) जेस्ट में उत्थापन समस्या पर)। यह आपके द्वारा मॉक रिज़ॉल्वर में वेरिएबल्स पास करने के तरीके को सीमित करता है, उदाहरण के लिए:

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

इसे ठीक करने के लिए आपको रिज़ॉल्वर के अंदर उपयोग किए गए सभी वेरिएबल्स को परिभाषित करना होगा, जैसे:

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

## अनुरोध

यदि आप नकली ब्राउज़र अनुरोधों की तलाश कर रहे हैं, उदाहरण के लिए एपीआई कॉल, तो [अनुरोध नकली और जासूस](/docs/mocksandspies) अनुभाग पर जाएं।
