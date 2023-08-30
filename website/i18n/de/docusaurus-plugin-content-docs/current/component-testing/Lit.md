---
id: lit
title: Lit
---

Lit ist eine einfache Bibliothek zum Erstellen schneller, leichter Webkomponenten. Das Testen von Lit-Webkomponenten mit WebdriverIO ist dank WebdriverIOs [Shadow-DOM-Selektoren](/docs/selectors#deep-selectors) sehr einfach. Sie können in Shadow-Roots verschachtelte Elemente mit nur einem einzigen Befehl abfragen.

## Setup

Um WebdriverIO in Ihrem Lit-Projekt einzurichten, befolgen Sie die [Anweisungen](/docs/component-testing#set-up) in unseren Komponententestdokumenten. Für Lit benötigen Sie keine Voreinstellung, da Lit-Webkomponenten keinen Compiler durchlaufen müssen, es handelt sich um reine Erweiterungen von Webkomponenten.

Nach der Einrichtung können Sie die Tests starten, indem Sie Folgendes ausführen:

```sh
npx wdio run ./wdio.conf.js
```

## Tests schreiben

Vorausgesetzt, Sie haben die folgende Lit-Komponente:

```ts title="./components/Component.ts"
import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('simple-greeting')
export class SimpleGreeting extends LitElement {
    @property()
    name?: string = 'World'

    // Render the UI as a function of component state
    render() {
        return html`<p>Hello, ${this.name}!</p>`
    }
}
```

Um die Komponente zu testen, müssen Sie sie vor Beginn des Tests in die Testseite rendern und sicherstellen, dass sie danach bereinigt wird:

```ts title="lit.test.js"
import expect from 'expect'
import { waitFor } from '@testing-library/dom'

// import Lit component
import './components/Component.ts'

describe('Lit Component testing', () => {
    let elem: HTMLElement

    beforeEach(() => {
        elem = document.createElement('simple-greeting')
    })

    it('should render component', async () => {
        elem.setAttribute('name', 'WebdriverIO')
        document.body.appendChild(elem)

        await waitFor(() => {
            expect(elem.shadowRoot.textContent).toBe('Hello, WebdriverIO!')
        })
    })

    afterEach(() => {
        elem.remove()
    })
})
```

Ein vollständiges Beispiel einer Testsuite für WebdriverIO-Komponenten für Lit finden Sie in unserem [Beispiel-Repository](https://github.com/webdriverio/component-testing-examples/tree/main/lit-typescript-vite).
