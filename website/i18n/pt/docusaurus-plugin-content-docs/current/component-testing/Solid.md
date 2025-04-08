---
id: solid
title: SolidJS
---

[SolidJS](https://www.solidjs.com/) é uma estrutura para construir interfaces de usuário com reatividade simples e de alto desempenho. Você pode testar componentes SolidJS diretamente em um navegador real usando o WebdriverIO e seu [executor do navegador](/docs/runner#browser-runner).

## Configurar

Para configurar o WebdriverIO no seu projeto SolidJS, siga as [instruções](/docs/component-testing#set-up) em nossos documentos de teste de componentes. Certifique-se de selecionar `sólido` como predefinição nas opções do seu corredor, por exemplo:

```js
// wdio.conf.js
export const config = {
    // ...
    runner: ['browser', {
        preset: 'solid'
    }],
    // ...
}
```

:::info

Se você já estiver usando o [Vite](https://vitejs.dev/) como servidor de desenvolvimento, você também pode reutilizar sua configuração em `vite.config.ts` dentro da sua configuração do WebdriverIO. Para obter mais informações, consulte `viteConfig` em [opções do runner](/docs/runner#runner-options).

:::

A predefinição SolidJS requer que `vite-plugin-solid` esteja instalado:

```sh npm2yarn
npm install --save-dev vite-plugin-solid
```

Você pode então iniciar os testes executando:

```sh
npx wdio run ./wdio.conf.js
```

## Escrevendo testes

Considerando que você tem o seguinte componente SolidJS:

```html title="./components/Component.tsx"
import { createSignal } from 'solid-js'

function App() {
    const [theme, setTheme] = createSignal('light')

    const toggleTheme = () => {
        const nextTheme = theme() === 'light' ? 'dark' : 'light'
        setTheme(nextTheme)
    }

    return <button onClick={toggleTheme}>
        Current theme: {theme()}
    </button>
}

export default App
```

No seu teste, use o método `render` de `solid-js/web` para anexar o componente à página de teste. Para interagir com o componente, recomendamos usar comandos WebdriverIO, pois eles se comportam mais próximos das interações reais do usuário, por exemplo:

```ts title="app.test.tsx"
import { expect } from '@wdio/globals'
import { render } from 'solid-js/web'

import App from './components/Component.jsx'

describe('Teste de Componente Solid', () => {
    /**
     * garante que renderizamos o componente para cada teste em um
     * novo container raiz
     */
    let root: Element
    beforeEach(() => {
        if (root) {
            root.remove()
        }

        root = document.createElement('div')
        document.body.appendChild(root)
    })

    it('Testar alternância do botão de tema', async () => {
        render(<App />, root)
        const buttonEl = await $('button')

        await buttonEl.click()
        expect(buttonEl).toContainHTML('dark')
    })
})

```

Você pode encontrar um exemplo completo de um conjunto de testes de componentes WebdriverIO para SolidJS em nosso [repositório de exemplos](https://github.com/webdriverio/component-testing-examples/tree/main/solidjs-typescript-vite).

