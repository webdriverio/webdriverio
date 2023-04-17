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

- `attachInstance`: Instanz, um eine Sitzung mit einer Eigenschaft `sessionId` (z.B. `{ sessionId: 'xxx' }`)
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

- `attachInstance`: Instanz, um eine Sitzung mit einer Eigenschaft `sessionId` (z.B. `{ sessionId: 'xxx' }`)

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

Anstatt den Befehl `wdio` aufzurufen, können Sie den Testrunner auch als Modul einbinden und in einer beliebigen Umgebung ausführen. Dazu benötigen Sie das Paket `@wdio/cli` als Modul, etwa so:

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

Erstellen Sie danach eine Instanz des Launchers und führen Sie den Test aus.

#### `Launcher(configPath, opts)`

Der `Launcher` Klassenkonstruktor erwartet die URL zur Konfigurationsdatei und ein `opts` Objekt mit Einstellungen, die diejenigen in der Konfiguration überschreiben.

##### Parameter

- `configPath`: Pfad zu `wdio.conf.js` zum Ausführen
- `opt`: Argumente ([`<RunCommandArguments>`](https://github.com/webdriverio/webdriverio/blob/main/packages/wdio-cli/src/types.ts#L51-L77)) um Werte aus der Konfigurationsdatei zu überschreiben

##### Beispiel

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

Der Befehl `run` gibt ein [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)zurück. Es wird resolved, wenn Tests erfolgreich ausgeführt oder fehlgeschlagen sind, und ein Fehler wird geworfen, wenn der Launcher die Tests nicht starten konnte.

## `@wdio/browser-runner`

Wenn Sie Unit- oder Komponententests mit WebdriverIOs [Browser Runner](/docs/runner#browser-runner) ausführen, können Sie Mocking Funktionalitäten für Ihre Tests importieren, z.B.:

```ts
import { fn, spyOn, mock, unmock } from '@wdio/browser-runner'
```

Die folgenden Variablen stehen zur Verfügung:

#### `fn`

Mock-Funktion, siehe mehr in den offiziellen [Vitest-Dokumenten](https://vitest.dev/api/mock.html#mock-functions).

#### `spyOn`

Spionagefunktion, siehe mehr in den offiziellen [Vitest-Dokumenten](https://vitest.dev/api/mock.html#mock-functions).

#### `mock`

Methode zum Mocken einer Datei oder einer Dependency.

##### Parameter

- `moduleName`: entweder ein relativer Pfad zu der Datei, die gemockt werden soll, oder ein Modulname.
- `Factory`: Funktion zum Zurückgeben des gemockten Modules (optional)

##### Beispiel

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

Mock Setting aufheben, die im manuellen Mock-Verzeichnis (`__mocks__`) definiert ist.

##### Parameter

- `moduleName`: Name des zu entmockenden Moduls.

##### Beispiel

```js
unmock('lodash')
```
