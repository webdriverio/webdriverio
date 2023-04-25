---
id: customcommands
title: Benutzerdefinierte Befehle
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Wenn Sie die Instanz von `browser` mit Ihrem eigenen Befehlssatz erweitern möchten, ist die Browsermethode  `addCommand` für Sie da. Sie können Ihren Befehl asynchron schreiben, genau wie in Ihrem Test.

## Parameter

### Befehlsname

Ein Name, der den Befehl definiert und an das Browser- oder Element Objekt angehängt wird.

Type: `String`

### Benutzerdefinierte Funktion

Eine Funktion, die ausgeführt wird, wenn der Befehl aufgerufen wird. Die `this` Variable ist entweder [`WebdriverIO.Browser`](/docs/api/browser) oder [`WebdriverIO.Element`](/docs/api/element), je nachdem, ob der Befehl vom Browser- oder Element-Objekt ausgeführt wurde.

Type: `Function`

### Target Scope

Markierung, die festlegt, ob der Befehl an den Browser- oder Element-Objekt angehängt werden soll. Wenn auf `true` gesetzt, ist der Befehl ein Elementbefehl.

Type: `Boolean`<br /> Default: `false`

## Beispiele

Dieses Beispiel zeigt, wie Sie einen neuen Befehl hinzufügen, der die aktuelle URL und den Titel als ein Ergebnis zurückgibt. Der Geltungsbereich (`this`) ist ein [`WebdriverIO.Browser`](/docs/api/browser) Objekt.

```js
browser.addCommand('getUrlAndTitle', async function (customVar) {
    // `this` refers to the `browser` scope
    return {
        url: await this.getUrl(),
        title: await this.getTitle(),
        customVar: customVar
    }
})
```

Darüber hinaus können Sie die Elementinstanz mit Ihrem eigenen Befehlssatz erweitern, indem Sie `true` als letztes Argument übergeben. Der Geltungsbereich (`this`) ist in diesem Fall ein [`WebdriverIO.Element`](/docs/api/element) Objekt.

```js
browser.addCommand("waitAndClick", async function () {
    // `this` is return value of $(selector)
    await this.waitForDisplayed()
    await this.click()
}, true)
```

Benutzerdefinierte Befehle geben Ihnen die Möglichkeit, eine bestimmte Folge von häufig verwendeten Befehlen in einem einzigen Aufruf zu bündeln. Sie können an jedem Punkt Ihrer Testsuite benutzerdefinierte Befehle definieren; Stellen Sie nur sicher, dass der Befehl *vor* seiner Verwendung definiert ist. (Die `before` Hook in Ihrer `wdio.conf.js` ist ein guter Ort, um benuzterdefinierte Befehle zu erstellen.)

Einmal definiert, können Sie sie wie folgt verwenden:

```js
it('should use my custom command', async () => {
    await browser.url('http://www.github.com')
    const result = await browser.getUrlAndTitle('foobar')

    assert.strictEqual(result.url, 'https://github.com/')
    assert.strictEqual(result.title, 'GitHub · Where software is built')
    assert.strictEqual(result.customVar, 'foobar')
})
```

__Hinweis:__ Wenn Sie einen benutzerdefinierten Befehl für die `Browser Instanz` registrieren, ist der Befehl für Elemente nicht zugänglich. Wenn Sie einen Befehl im Elementbereich registrieren, ist er für die `browser` Variable nicht zugänglich:

```js
browser.addCommand("myCustomBrowserCommand", () => { return 1 })
const elem = await $('body')
console.log(typeof browser.myCustomBrowserCommand) // outputs "function"
console.log(typeof elem.myCustomBrowserCommand()) // outputs "undefined"

browser.addCommand("myCustomElementCommand", () => { return 1 }, true)
const elem2 = await $('body')
console.log(typeof browser.myCustomElementCommand) // outputs "undefined"
console.log(await elem2.myCustomElementCommand('foobar')) // outputs "1"

const elem3 = await $('body')
elem3.addCommand("myCustomElementCommand2", () => { return 2 })
console.log(typeof browser.myCustomElementCommand2) // outputs "undefined"
console.log(await elem3.myCustomElementCommand2('foobar')) // outputs "2"
```

__Hinweis:__ Wenn Sie einen benutzerdefinierten Befehl verketten müssen, sollte der Befehl mit `$` enden.

```js
browser.addCommand("user$", (locator) => { return ele })
browser.addCommand("user$", (locator) => { return ele }, true)
await browser.user$('foo').user$('bar').click()
```

Achten Sie darauf, die `browser` Variable nicht mit zu vielen benutzerdefinierten Befehlen zu überladen.

Wir empfehlen, benutzerdefinierte Logik in [Seitenobjekten](PageObjects.md)zu definieren, damit sie an eine bestimmte Seite gebunden sind.

## Typdefinitionen Erweitern

Mit TypeScript ist es einfach, WebdriverIO-Schnittstellen zu erweitern. Fügen Sie Ihren benutzerdefinierten Befehlen Typen wie folgt hinzu:

1. Erstellen Sie eine Typdefinitionsdatei (z. B. `./src/types/wdio.d.ts`)
2. a. Wenn Sie eine Typdefinitionsdatei im Modulstil verwenden (mit Import/Export und `deklarieren Sie im globalen WebdriverIO Namespace` in der Typdefinitionsdatei), und stellen Sie sicher, dass Sie den Dateipfad in die Eigenschaft `tsconfig.json` `include` aufnehmen.

   b.  Wenn Sie Typdefinitionsdateien im Ambient-Stil verwenden (kein Import/Export in Typdefinitionsdateien und `deklarieren Sie den Namensraum WebdriverIO` für benutzerdefinierte Befehle),</code> Sie sicher, dass die `tsconfig.json` *nicht* einen Abschnitt `enthält, da dies der Fall ist dazu führen, dass alle Typdefinitionsdateien, die nicht im Abschnitt <code>include` aufgeführt sind, von Typoskript nicht erkannt werden.

<Tabs
  defaultValue="modules"
  values={[
    {label: 'Modules (using import/export)', value: 'modules'},
 {label: 'Ambient Type Definitions (no tsconfig include)', value: 'ambient'},
 ]
}>
<TabItem value="modules">

```json title="tsconfig.json"
{
    "compilerOptions": { ... },
    "include": [
        "./test/**/*.ts",
        "./src/types/**/*.ts"
    ]
}
```

</TabItem>
<TabItem value="ambient">

```json title="tsconfig.json"
{
    "compilerOptions": { ... }
}
```

</TabItem>
</Tabs>

3. Fügen Sie Definitionen für Ihre Befehle entsprechend Ihrem Ausführungsmodus hinzu.

<Tabs
  defaultValue="modules"
  values={[
    {label: 'Modules (using import/export)', value: 'modules'},
 {label: 'Ambient Type Definitions', value: 'ambient'},
 ]
}>
<TabItem value="modules">

```typescript
declare global {
    namespace WebdriverIO {
        interface Browser {
            browserCustomCommand: (arg: any) => Promise<void>
        }

        interface MultiRemoteBrowser {
            browserCustomCommand: (arg: any) => Promise<void>
        }

        interface Element {
            elementCustomCommand: (arg: any) => Promise<number>
        }
    }
}
```

</TabItem>
<TabItem value="ambient">

```typescript
declare namespace WebdriverIO {
    interface Browser {
        browserCustomCommand: (arg: any) => Promise<void>
    }

    interface MultiRemoteBrowser {
        browserCustomCommand: (arg: any) => Promise<void>
    }

    interface Element {
        elementCustomCommand: (arg: any) => Promise<number>
    }
}
```

</TabItem>
</Tabs>

## Integrieren Sie Bibliotheken von Drittanbietern

Wenn Sie externe Bibliotheken verwenden (z. B. um Datenbankaufrufe durchzuführen), die Promises unterstützen, ist es eine gute Idee, bestimmte API-Methoden mit einem benutzerdefinierten Befehl zu umhüllen.

Bei der Rückgabe des Promises stellt WebdriverIO sicher, dass es nicht mit dem nächsten Befehl fortfährt, bis das Promise aufgelöst ist. Wenn das Promise abgelehnt wird, gibt der Befehl einen Fehler aus.

```js
import got from 'got'

browser.addCommand('makeRequest', async (url) => {
    return got(url).json()
})
```

Dann verwenden Sie es einfach in Ihren WDIO-Testspezifikationen:

```js
it('execute external library in a sync way', async () => {
    await browser.url('...')
    const body = await browser.makeRequest('http://...')
    console.log(body) // returns response body
})
```

**Hinweis:** Das Ergebnis Ihres benutzerdefinierten Befehls ist das Ergebnis des von Ihnen zurückgegebenen Promises.

## Befehle Überschreiben

Sie können native Befehle auch mit `overwriteCommand`überschreiben.

Dies wird nicht empfohlen, da dies zu unvorhersehbarem Verhalten des Frameworks führen kann!

Der Gesamtansatz ähnelt `addCommand`, der einzige Unterschied besteht darin, dass das erste Argument in der Befehlsfunktion die ursprüngliche Funktion ist, die Sie überschreiben werden. Sehen Sie sich unten einige Beispiele an.

### Überschreiben von Browserbefehlen

```js
/**
 * print milliseconds before pause and return its value.
 */
// 'pause'            - name of command to be overwritten
// origPauseFunction  - original pause function
browser.overwriteCommand('pause', async (origPauseFunction, ms) => {
    console.log(`sleeping for ${ms}`)
    await origPauseFunction(ms)
    return ms
})

// then use it as before
console.log(`was sleeping for ${await browser.pause(1000)}`)
```

### Überschreiben von Elementbefehlen

Das Überschreiben von Befehlen auf Elementebene ist fast dasselbe. Übergeben Sie einfach `true` als drittes Argument an `overwriteCommand`:

```js
/**
 * Attempt to scroll to element if it is not clickable.
 * Pass { force: true } to click with JS even if element is not visible or clickable.
 */
// 'click'            - name of command to be overwritten
// origClickFunction  - original click function
browser.overwriteCommand('click', async function (origClickFunction, { force = false } = {}) {
    if (!force) {
        try {
            // attempt to click
            await origClickFunction()
            return null
        } catch (err) {
            if (err.message.includes('not clickable at point')) {
                console.warn('WARN: Element', this.selector, 'is not clickable.',
                    'Scrolling to it before clicking again.')

                // scroll to element and click again
                await this.scrollIntoView()
                return origClickFunction()
            }
            throw err
        }
    }

    // clicking with js
    console.warn('WARN: Using force click for', this.selector)
    await browser.execute((el) => {
        el.click()
    }, this)
}, true) // don't forget to pass `true` as 3rd argument

// then use it as before
const elem = await $('body')
await elem.click()

// or pass params
await elem.click({ force: true })
```

## Fügen Sie weitere WebDriver-Befehle hinzu

Wenn Sie das WebDriver-Protokoll verwenden und Tests auf einer Plattform ausführen, die zusätzliche Befehle unterstützt, die nicht durch eine der Protokolldefinitionen in [`@wdio/protocols`](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-protocols/src/protocols) definiert sind, können Sie diese manuell über die Schnittstelle `addCommand` hinzufügen. Das Paket `webdriver` bietet einen Befehlswrapper, der es ermöglicht, diese neuen Endpunkte auf die gleiche Weise wie andere Befehle zu registrieren und dieselben Parameterprüfungen und Fehlerbehandlungen bereitzustellen. Um diesen neuen Endpunkt zu registrieren, importieren Sie den Befehlswrapper und registrieren Sie wie folgt einen neuen Befehl damit:

```js
import { command } from 'webdriver'

browser.addCommand('myNewCommand', command('POST', '/session/:sessionId/foobar/:someId', {
    command: 'myNewCommand',
    description: 'a new WebDriver command',
    ref: 'https://vendor.com/commands/#myNewCommand',
    variables: [{
        name: 'someId',
        description: 'some id to something'
    }],
    parameters: [{
        name: 'foo',
        type: 'string',
        description: 'a valid parameter',
        required: true
    }]
}))
```

Der Aufruf dieses Befehls mit ungültigen Parametern führt zur gleichen Fehlerbehandlung wie vordefinierte Protokollbefehle, z.B.:

```js
// call command without required url parameter and payload
await browser.myNewCommand()

/**
 * results in the following error:
 * Error: Wrong parameters applied for myNewCommand
 * Usage: myNewCommand(someId, foo)
 *
 * Property Description:
 *   "someId" (string): some id to something
 *   "foo" (string): a valid parameter
 *
 * For more info see https://my-api.com
 *    at Browser.protocolCommand (...)
 *    ...
 */
```

`browser.myNewCommand('foo', 'bar')`, stellt eine korrekte WebDriver-Anfrage an z. B. `http://localhost:4444/session/7bae3c4c55c3bf82f54894ddc83c5f31/foobar/foo` mit dem Argument `{ foo: 'bar' }`.

:::note
Der URL-Parameter `:sessionId` wird automatisch durch die Sitzungs-ID der WebDriver-Sitzung ersetzt. Andere URL-Parameter können angewendet werden, müssen aber innerhalb von `variables` definiert werden.
:::

Sehen Sie sich Beispiele an, wie Protokollbefehle im [`@wdio/protocols`](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-protocols/src/protocols) definiert werden können.
