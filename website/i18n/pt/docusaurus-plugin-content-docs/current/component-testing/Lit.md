---
id: lit
title: Lit
---

Lit é uma biblioteca simples para criar componentes web rápidos e leves. Testar componentes web Lit com WebdriverIO é muito fácil graças aos [seletores shadow DOM](/docs/selectors#deep-selectors) do WebdriverIO. Você pode consultar elementos aninhados em raízes shadow com apenas um único comando.

## Configurar

Para configurar o WebdriverIO no seu projeto Lit, siga as [instruções](/docs/component-testing#set-up) em nossos documentos de teste de componentes. Para o Lit, você não precisa de uma predefinição, pois os componentes web do Lit não precisam ser executados por um compilador; eles são aprimoramentos puros dos componentes web.

Após a configuração, você pode iniciar os testes executando:

```sh
npx wdio run ./wdio.conf.js
```

## Escrevendo testes

Considerando que você tem o seguinte componente Lit:

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

Para testar o componente, você precisa renderizá-lo na página de teste antes do início do teste e garantir que ele seja limpo depois:

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

Você pode encontrar um exemplo completo de um conjunto de testes de componentes WebdriverIO para Lit em nosso [repositório de exemplos](https://github.com/webdriverio/component-testing-examples/tree/main/lit-typescript-vite).
