---
id: mocking
title: Mocking
---

Beim Schreiben von Tests ist es nur eine Frage der Zeit, bis Sie eine „gefälschte“ Version eines internen – oder externen – Dienstes erstellen müssen. Dies wird allgemein als Mocking bezeichnet. WebdriverIO bietet Hilfsfunktionen, um Ihnen zu helfen. Sie können `import { fn, spyOn, mock, unmock } from "@wdio/browser-runner“` importieren, um darauf zuzugreifen. Weitere Informationen zu den verfügbaren Mocking-Hilfsprogrammen finden Sie in der [API-Dokumentation](/docs/api/modules#wdiobrowser-runner).

## Funktionen

Um zu überprüfen, ob bestimmte Funktionshandler im Rahmen Ihrer Komponententests aufgerufen werden, exportiert das Modul `@wdio/browser-runner` Mocking Hilfsmittel, mit denen Sie testen können, ob diese Funktionen aufgerufen wurden. Sie können diese Methoden importieren über:

```js
import { fn, spy } from '@wdio/browser-runner'
```

Durch den Import von `fn` können Sie eine Spionagefunktion (Mock) erstellen, um ihre Ausführung zu verfolgen, und mit `spyOn` eine Methode auf einem bereits erstellten Objekt verfolgen.

<Tabs
  defaultValue="mocks"
  values={[
    {label: 'Mocks', value: 'mocks'},
 {label: 'Spies', value: 'spies'}
 ]
}>
<TabItem value="mocks">

Das vollständige Beispiel finden Sie im [Beispiel für Komponententests](https://github.com/webdriverio/component-testing-examples/blob/main/react-typescript-vite/src/tests/LoginForm.test.tsx) Repository.

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

Das vollständige Beispiel finden Sie im Verzeichnis [examples](https://github.com/webdriverio/webdriverio/blob/main/examples/wdio/browser-runner/lit.test.js).

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

WebdriverIO exportiert hier einfach [`@vitest/spy`](https://www.npmjs.com/package/@vitest/spy) erneut, was eine Jest-kompatible Mockimplementierung ist, die mit WebdriverIOs [`expect`](/docs/api/expect-webdriverio) Matcher verwedendet werden kann. Weitere Dokumentation zu diesen Mock-Funktionen finden Sie auf der [Vitest-Projektseite](https://vitest.dev/api/mock.html).

Natürlich können Sie auch jedes andere Mock-Framework installieren und importieren, zB [SinonJS](https://sinonjs.org/), sofern es die Browserumgebung unterstützt.

## Module

Mocken Sie lokale Module oder beobachten Sie Bibliotheken von Drittanbietern, die in anderem Code aufgerufen werden, sodass Sie Argumente testen, ausgeben oder sogar ihre Implementierung neu deklarieren können.

Es gibt zwei Möglichkeiten, Funktionen zu simulieren: Entweder durch Erstellen einer Mock-Funktion zur Verwendung im Testcode oder durch Schreiben eines manuellen Mocks, um eine Modulabhängigkeit zu überschreiben.

### Mocking von Dateiimporten

Stellen wir uns vor, unsere Komponente importiert eine Utility-Methode aus einer Datei, um einen Klick zu verarbeiten.

```js title=utils.js
export function handleClick () {
    // handler implementation
}
```

In unserer Komponente wird der Click-Handler wie folgt verwendet:

```ts title=LitComponent.js
import { handleClick } from './utils.js'

@customElement('simple-button')
export class SimpleButton extends LitElement {
    render() {
        return html`<button @click="${handleClick}">Click me!</button>`
    }
}
```

Um den `handleClick` von `utils.js` zu simulieren, können wir in unserem Test die Methode `mock` wie folgt verwenden:

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

### Mocking von Abhängigkeiten

Angenommen, wir haben eine Klasse, die Benutzer von unserer API abruft. Die Klasse verwendet [`axios`](https://github.com/axios/axios), um die API aufzurufen, und gibt dann das Datenattribut zurück, das alle Benutzer enthält:

```js title=users.js
import axios from 'axios';

class Users {
  static all() {
    return axios.get('/users.json').then(resp => resp.data)
  }
}

export default Users
```

Um diese Methode zu testen, ohne tatsächlich auf die API zuzugreifen (und damit langsame und anfällige Tests zu vermeiden), können wir die Funktion `mock(...)` verwenden, um das Axios-Modul automatisch zu simulieren.

Nachdem wir das Modul ausgetauscht haben, können wir einen [`mockResolvedValue`](https://vitest.dev/api/mock.html#mockresolvedvalue) für `.get` bereitstellen, der die Daten zurückgibt, gegen die unser Test validiert werden soll. Tatsächlich sagen wir, dass wir wollen, dass `axios.get('/users.json')` eine gefälschte Antwort zurückgibt.

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

## Teil Mocking

Teilmengen eines Moduls können ausgetauscht werden und der Rest des Moduls kann seine tatsächliche Implementierung beibehalten:

```js title=foo-bar-baz.js
export const foo = 'foo';
export const bar = () => 'bar';
export default () => 'baz';
```

The original module will be passed into the mock factory which you can use to e.g. partially mock a dependency:

```js
import { mock, fn } from '@wdio/browser-runner'
import defaultExport, { bar, foo } from './foo-bar-baz.js';

mock('./foo-bar-baz.js', async (originalModule) => {
    // Mock the default export and named export 'foo'
    // and propagate named export from the original module
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

## Manuelle Mocks

Manuelle Mocks werden definiert, indem ein Modul in ein Unterverzeichnis `__mocks__/` (siehe auch Option `automockDir` ) geschrieben wird. Wenn das Modul, das Sie austauschen, ein Node-Modul ist (z. B.: `lodash`), sollte das Mock im Verzeichnis `__mocks__` abgelegt werden und wird automatisch ausgetauscht. Es ist nicht erforderlich, `mock('module_name')`explizit aufzurufen.

Scoped-Module (auch als Scoped-Pakete bezeichnet) können ausgetauscht werden, indem eine Datei in einer Verzeichnisstruktur erstellt wird, die mit dem Namen des Scoped-Moduls übereinstimmt. Um beispielsweise ein Scoped Packet mit dem Namen `@scope/project-name`zu simulieren, erstellen Sie eine Datei unter `__mocks__/@scope/project-name.js`und erstellen entsprechend das Verzeichnis `@scope/`.

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

Wenn ein manueller Mock für ein bestimmtes Modul vorhanden ist, verwendet WebdriverIO dieses Modul beim expliziten Aufruf von `mock('moduleName')`. Wenn jedoch automock auf true gesetzt ist, wird die manuelle Mock-Implementierung anstelle des automatisch erstellten Mock verwendet, selbst wenn `mock('moduleName')` nicht aufgerufen wird. Um dieses Verhalten auszustellen, müssen Sie explizit `unmock('moduleName')` in Tests aufrufen, die die eigentliche Modulimplementierung verwenden sollen, z.B.:

```js
import { unmock } from '@wdio/browser-runner'

unmock('lodash')
```

## Hoisting

Um Mocking im Browser zum Laufen zu bringen, schreibt WebdriverIO die Testdateien um und stellt die Mock-Calls über alles andere (siehe auch [diesen Blogpost](https://www.coolcomputerclub.com/posts/jest-hoist-await/) zum Hoisting-Problem in Jest). Dies schränkt die Art und Weise ein, wie Sie Variablen an den Mock-Resolver übergeben können, z. B.:

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

Um dies zu beheben, müssen Sie alle verwendeten Variablen im Resolver definieren, z.B.:

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

## Netzwerk Requests

API-Aufrufe, gehen Sie zum Abschnitt [Request Mock and Spies](/docs/mocksandspies).
