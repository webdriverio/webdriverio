---
id: lit
title: Lit
---

Lit es una biblioteca sencilla para construir componentes web rápidos y ligeros. Probar componentes web de Lit con WebdriverIO es muy fácil gracias a los selectores WebdriverIOs [shadow DOM](/docs/selectors#deep-selectors) se puede consultar en elementos anidados de raíces de sombras con solo un comando.

## Configuración

Para configurar WebdriverIO dentro de su proyecto Lit, siga las [instrucciones](/docs/component-testing#set-up) en nuestros documentos de prueba de componentes. Para Lit no necesita un ajuste predeterminado ya que los componentes web de Lit no necesitan correr a través de un compilador, son mejoras puras de componentes web.

Una vez configurado, puede iniciar las pruebas ejecutando:

```sh
npx wdio run ./wdio.conf.js
```

## Tests de escritura

Dado que usted tiene el siguiente componente Lit:

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

Para probar el componente tiene que renderizarlo en la página de prueba antes de que comience la prueba y asegurarse de que se limpia después:

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

Puede encontrar un ejemplo completo de una suite de pruebas de componentes WebdriverIO para Lit en nuestro [repositorio de ejemplo](https://github.com/webdriverio/component-testing-examples/tree/main/lit-typescript-vite).
