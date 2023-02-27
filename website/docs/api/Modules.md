---
id: modules
title: Modules
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

WebdriverIO publishes various of modules to NPM and other registries that you can use to build your own automation framework. See more documentation on WebdriverIO setup types [here](/docs/setuptypes).

## `webdriver` and `devtools`

The protocol packages ([`webdriver`](https://www.npmjs.com/package/webdriver) and [`devtools`](https://www.npmjs.com/package/devtools)) expose a class with the following static functions attached that allow you to initiate sessions:

#### `newSession(options, modifier, userPrototype, customCommandWrapper)`

Starts a new session with specific capabilities. Based on the session response commands from different protocols will be provided.

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

##### Example

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

The `run` command returns a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise). It is resolved if tests ran successfully or failed, and it is rejected if the launcher was unable to start run the tests.

## `@wdio/browser-runner`

When running unit or component tests using WebdriverIO's [browser runner](/docs/runner#browser-runner) you can import mocking utilities for your tests, e.g.:

```ts
import { fn, spyOn, mock, unmock } from '@wdio/browser-runner'
```

The following named exports are available:

#### `fn`

Mock function, see more in the official [Vitest docs](https://vitest.dev/api/mock.html#mock-functions).

#### `spyOn`

Spy function, see more in the official [Vitest docs](https://vitest.dev/api/mock.html#mock-functions).

#### `mock`

Method to mock file or dependency module.

##### Paramaters

- `moduleName`: either a relative path to the file to be mocked or a module name.
- `factory`: function to return the mocked value (optional)

##### Example

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

Unmock dependency that is defined within the manual mock (`__mocks__`) directory.

##### Paramaters

- `moduleName`: name of the module to be unmocked.

##### Example

```js
unmock('lodash')
```
