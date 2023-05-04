---
id: lit
title: Lit
---

Lit est une bibliothèque simple pour créer des composants Web rapides et légers. Tester les composants Web Lit avec WebdriverIO est très facile grâce aux sélecteurs DOM fantômes WebdriverIOs [](/docs/selectors#deep-selectors) , vous pouvez interroger les éléments imbriqués dans les racines fantômes avec une seule commande.

## Configurer

Pour configurer WebdriverIO dans votre projet Lit, suivez les [instructions](/docs/component-testing#set-up) dans nos documents de test de composants. Pour Lit, vous n'avez pas besoin d'un préréglage car les composants Web Lit n'ont pas besoin de passer par un compilateur, ce sont de pures améliorations de composants Web.

Une fois configuré, vous pouvez démarrer les tests en exécutant :

```sh
npx wdio run ./wdio.conf.js
```

## Écriture de tests

Étant donné que vous avez le composant Lit suivant :

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

Pour tester le composant, vous devez le rendre dans la page de test avant le début du test et vous assurer qu'il est nettoyé par la suite :

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

Vous pouvez trouver un exemple complet d'une suite de tests de composants WebdriverIO pour Lit dans notre référentiel [exemples](https://github.com/webdriverio/component-testing-examples/tree/main/lit-typescript-vite).
