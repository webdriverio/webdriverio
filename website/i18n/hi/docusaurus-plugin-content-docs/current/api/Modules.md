---
id: modules
title: मॉड्यूल
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

WebdriverIO एनपीएम और अन्य रजिस्ट्रियों के लिए विभिन्न मॉड्यूल प्रकाशित करता है जिनका उपयोग आप अपने स्वयं के स्वचालन ढांचे के निर्माण के लिए कर सकते हैं। WebdriverIO सेटअप प्रकार के बारे में अधिक दस्तावेज़ [यहाँ](/docs/setuptypes)देखें।

## `webdriver` और `devtools`

प्रोटोकॉल पैकेज ([`webdriver`](https://www.npmjs.com/package/webdriver) और [`devtools`](https://www.npmjs. com/package/devtools)) निम्न स्थैतिक कार्यों के साथ एक वर्ग को उजागर करता है जो आपको सत्र आरंभ करने की अनुमति देता है:

#### `newSession(options, modifier, userPrototype, customCommandWrapper)`

विशिष्ट क्षमताओं के साथ एक नया सत्र प्रारंभ करता है। सत्र प्रतिक्रिया के आधार पर विभिन्न प्रोटोकॉल से आदेश प्रदान किए जाएंगे।

##### Paramaters

- `options`: [WebDriver Options](/docs/configuration#webdriver-options)
- `modifier`: function that allows to modify the client instance before it is being returned
- `userPrototype`: properties object that allows to extend the instance prototype
- `customCommandWrapper`: function that allows to wrap functionality around function calls

##### Returns

- [Browser](/docs/api/browser) object

##### Example

```js
const client = await WebDriver.newSession({
    capabilities: { browserName: 'chrome' }
})
```

#### `attachSession(attachInstance, modifier, userPrototype, customCommandWrapper)`

Attaches to a running WebDriver or DevTools session.

##### Paramaters

- `attachInstance`: instance to attach a session to or at least an object with a property `sessionId` (e.g. `{ sessionId: 'xxx' }`)
- `modifier`: function that allows to modify the client instance before it is being returned
- `userPrototype`: properties object that allows to extend the instance prototype
- `customCommandWrapper`: function that allows to wrap functionality around function calls

##### Returns

- [Browser](/docs/api/browser) object

##### Example

```js
const client = await WebDriver.newSession({...})
const clonedClient = await WebDriver.attachSession(client)
```

#### `reloadSession(instance)`

Reloads a session given provided instance.

##### Paramaters

- `instance`: package instance to reload

##### Example

```js
const client = await WebDriver.newSession({...})
await WebDriver.reloadSession(client)
```

## `webdriverio`

Similar as to the protocol packages (`webdriver` and `devtools`) you can also use the WebdriverIO package APIs to manage sessions. The APIs can be imported using `import { remote, attach, multiremote } from 'webdriverio` and contain the following functionality:

#### `remote(options, modifier)`

Starts a WebdriverIO session. The instance contains all commands as the protocol package but with additional higher order functions, see [API docs](/docs/api).

##### Paramaters

- `options`: [WebdriverIO Options](/docs/configuration#webdriverio)
- `modifier`: function that allows to modify the client instance before it is being returned

##### Returns

- [Browser](/docs/api/browser) object

##### Example

```js
import { remote } from 'webdriverio'

const browser = await remote({
    capabilities: { browserName: 'chrome' }
})
```

#### `attach(attachOptions)`

Attaches to a running WebdriverIO session.

##### Paramaters

- `attachOptions`: instance to attach a session to or at least an object with a property `sessionId` (e.g. `{ sessionId: 'xxx' }`)

##### Returns

- [Browser](/docs/api/browser) object

##### Example

```js
import { remote, attach } from 'webdriverio'

const browser = await remote({...})
const newBrowser = await attach(browser)
```

#### `multiremote(multiremoteOptions)`

Initiates a multiremote instance which allows you to control multiple session within a single instance. Checkout our [multiremote examples](https://github.com/webdriverio/webdriverio/tree/main/examples/multiremote) for concrete use cases.

##### Paramaters

- `multiremoteOptions`: an object with keys representing the browser name and their [WebdriverIO Options](/docs/configuration#webdriverio).

##### Returns

- [Browser](/docs/api/browser) object

##### Example

```js
import { multiremote } from 'webdriverio'

const matrix = await multiremote({
    myChromeBrowser: {
        capabilities: { browserName: 'chrome' }
    },
    myFirefoxBrowser: {
        capabilities: { browserName: 'firefox' }
    }
})
await matrix.url('http://json.org')
await matrix.getInstance('browserA').url('https://google.com')

console.log(await matrix.getTitle())
// returns ['Google', 'JSON']
```

## `@wdio/cli`

Instead of calling the `wdio` command, you can also include the test runner as module and run it in an arbitrary environment. For that, you'll need to require the `@wdio/cli` package as module, like this:

<Tabs
  defaultValue="esm"
  values={[
    {label: 'EcmaScript Modules', value: 'esm'},
 {label: 'CommonJS', value: 'cjs'}
 ]
}>
<TabItem value="esm">

```js
import Launcher from '@wdio/cli'
```

</TabItem>
<TabItem value="cjs">

```js
const Launcher = require('@wdio/cli').default
```

</TabItem>
</Tabs>

After that, create an instance of the launcher, and run the test.

#### `Launcher(configPath, opts)`

The `Launcher` class constructor expects the URL to the config file, and an `opts` object with settings that will overwrite those in the config.

##### Paramaters

- `configPath`: path to the `wdio.conf.js` to run
- `opts`: arguments ([`<RunCommandArguments>`](https://github.com/webdriverio/webdriverio/blob/main/packages/wdio-cli/src/types.ts#L51-L77)) to overwrite values from the config file

##### उदाहरण

```js
const wdio = new Launcher(
    '/path/to/my/wdio.conf.js',
    { spec: '/path/to/a/single/spec.e2e.js' }
)

wdio.run().then((exitCode) => {
    process.exit(exitCode)
}, (error) => {
    console.error('Launcher failed to start the test', error.stacktrace)
    process.exit(1)
})
```

`run` कमांड [प्रॉमिस](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)देता है। यदि परीक्षण सफलतापूर्वक चलता है या विफल रहता है तो इसका समाधान किया जाता है, और यदि लॉन्चर परीक्षण चलाने में असमर्थ था तो इसे अस्वीकार कर दिया जाता है।

## `@wdio/browser-runner`

WebdriverIO के [ब्राउज़र रनर](/docs/runner#browser-runner) का उपयोग करके यूनिट या घटक परीक्षण चलाते समय आप अपने परीक्षणों के लिए मॉकिंग उपयोगिताओं का आयात कर सकते हैं, जैसे:

```ts
import { fn, spyOn, mock, unmock } from '@wdio/browser-runner'
```

निम्नलिखित नामित निर्यात उपलब्ध हैं:

#### `fn`

मॉक फंक्शन, आधिकारिक [सबसे महत्वपूर्ण डॉक्स](https://vitest.dev/api/mock.html#mock-functions)में अधिक देखें।

#### `spyOn`

स्पाई फंक्शन, आधिकारिक [वीटेस्ट डॉक्स](https://vitest.dev/api/mock.html#mock-functions)में अधिक देखें।

#### `mock`

फ़ाइल या निर्भरता मॉड्यूल को मॉक करने की विधि।

##### मापदंडों

- `moduleName`: या तो फ़ाइल का एक सापेक्ष पथ जिसका मजाक उड़ाया जाना है या एक मॉड्यूल नाम।
- `factory`: नकली मान लौटाने के लिए फ़ंक्शन (वैकल्पिक)

##### उदाहरण

```js
mock('../src/constants.ts', () => ({
    SOME_DEFAULT: 'mocked out'
}))

mock('lodash', (origModuleFactory) => {
    const origModule = await origModuleFactory()
    return {
        ...origModule,
        pick: fn()
    }
})
```

#### `unmock`

अनमॉक डिपेंडेंसी जिसे मैनुअल मॉक (`__mocks__`) डायरेक्टरी में परिभाषित किया गया है।

##### मापदंडों

- `moduleName`: मॉड्यूल का नाम अनमोक होना।

##### उदाहरण

```js
unmock('lodash')
```
