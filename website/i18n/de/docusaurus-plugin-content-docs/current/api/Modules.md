---
id: modules
title: Module
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

WebdriverIO veröffentlicht verschiedene Module für NPM und andere Anbieter, die Sie verwenden können, um Ihr eigenes Automatisierungs-Framework zu erstellen. Weitere Dokumentation zu WebdriverIO Einrichtungstypen [finden Sie hier](/docs/setuptypes).

## `webdriver` und `devtools`

Die Protokollpakete ([`webdriver`](https://www.npmjs.com/package/webdriver) und [`devtools`](https://www.npmjs.com/package/devtools)) exportieren eine Klasse mit den folgenden statischen Funktionen, die Ihnen erlauben, Sitzungen zu initiieren:

#### `newSession(options, modifier, userPrototype, customCommandWrapper)`

Startet eine neue Sitzung mit bestimmten Fähigkeiten. Basierend auf der Session-Antwort stehen Ihnen verschiedene Befehle zu Verfügung.

##### Parameter

- `options`: [WebDriver Optionen](/docs/configuration#webdriver-options)
- `modifier`: Funktion, die es erlaubt, die Client-Instanz zu modifizieren, bevor sie zurückgegeben wird
- `userPrototype`: Prototyp-Objekt, mit dem der Prototyp der Instanz erweitert werden kann
- `customCommandWrapper`: Funktion, die die Funktionalität von Protokoll-Befehle beeinflussen kann.

##### Rückgabewert:

- [Browser](/docs/api/browser) Objekt

##### Beispiel

```js
const client = await WebDriver.newSession({
    capabilities: { browserName: 'chrome' }
})
```

#### `attachSession(attachInstance, modifier, userPrototype, customCommandWrapper)`

Verbindet sich mit einer bereits laufenden Automatisierungs-Session.

##### Parameter

-
- `modifier`: Funktion, die es erlaubt, die Client-Instanz zu modifizieren, bevor sie zurückgegeben wird
- `userPrototype`: Prototyp-Objekt, mit dem der Prototyp der Instanz erweitert werden kann
- `customCommandWrapper`: Funktion, die die Funktionalität von Protokoll-Befehle beeinflussen kann.

##### Rückgabewert:

- [Browser](/docs/api/browser) object

##### Beispiel

```js
const client = await WebDriver.newSession({...})
const clonedClient = await WebDriver.attachSession(client)
```

#### `reloadSession(instance)`

Lädt eine angegebene Instanz neu.

##### Parameter

- `instance`: Paket Instanz, die neu geladen werden soll

##### Beispiel

```js
const client = await WebDriver.newSession({...})
await WebDriver.reloadSession(client)
```

## `webdriverio`

Ähnlich wie bei den Protokollpaketen (`webdriver` und `devtools`) können Sie auch die APIs des WebdriverIO-Pakets zur Verwaltung von Sessions verwenden. Die APIs können mit `import { remote, attach, multiremote } from 'webdriverio'` importiert werden und enthalten folgende Funktionalität:

#### `remote(options, modifier)`

Startet eine WebdriverIO-Sitzung. Die Instanz enthält alle Protokoll befehle, jedoch mit zusätzlichen Funktionen, siehe [API-Dokumentation](/docs/api).

##### Parameter

- `Optionen`: [WebdriverIO-Optionen](/docs/configuration#webdriverio)
- `modifier`: Funktion, die es erlaubt, die Client-Instanz zu modifizieren, bevor sie zurückgegeben wird

##### Rückgabewert:

- [Browser](/docs/api/browser) Objekt

##### Beispiel

```js
import { remote } from 'webdriverio'

const browser = await remote({
    capabilities: { browserName: 'chrome' }
})
```

#### `attach(attachOptions)`

Verbindet sich mit einer bereits laufenden Automatisierungs-Session.

##### Parameter

-

##### Rückgabewert:

- [Browser](/docs/api/browser) Objekt

##### Beispiel

```js
import { remote, attach } from 'webdriverio'

const browser = await remote({...})
const newBrowser = await attach(browser)
```

#### `multiremote(multiremoteOptions)`

Startet eine Multi-Remote-Instanz, mit der Sie mehrere Browser oder Mobile Endgeräte innerhalb einer Instanz steuern können. Schauen Sie sich unsere [Multiremote Beispiele](https://github.com/webdriverio/webdriverio/tree/main/examples/multiremote) für konkrete Anwendungsfälle an.

##### Parameter

- `multiremoteOptions`: ein Objekt mit Eigenschaften, die den Browsernamen und seine [WebdriverIO Optionen repräsentieren](/docs/configuration#webdriverio).

##### Rückgabewert:

- [Browser](/docs/api/browser) Objekt

##### Beispiel

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
