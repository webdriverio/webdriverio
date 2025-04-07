---
id: preact
title: Preact
---

[Preact](https://preactjs.com/) é uma alternativa rápida de 3kB ao React com a mesma API moderna. Você pode testar componentes do Preact diretamente em um navegador real usando o WebdriverIO e seu [browser runner](/docs/runner#browser-runner).

## Configurar

Para configurar o WebdriverIO no seu projeto Preact, siga as [instruções](/docs/component-testing#set-up) em nossos documentos de teste de componentes. Certifique-se de selecionar `preact` como predefinição nas opções do seu runner, por exemplo:

```js
// wdio.conf.js
export const config = {
    // ...
    runner: ['browser', {
        preset: 'preact'
    }],
    // ...
}
```

:::info

Se você já estiver usando o [Vite](https://vitejs.dev/) como servidor de desenvolvimento, você também pode reutilizar sua configuração em `vite.config.ts` dentro da sua configuração do WebdriverIO. Para obter mais informações, consulte `viteConfig` em [opções do runner](/docs/runner#runner-options).

:::

A predefinição Preact requer que `@preact/preset-vite` esteja instalado. Também recomendamos usar a [Biblioteca de testes](https://testing-library.com/) para renderizar o componente na página de teste. Portanto, você precisará instalar as seguintes dependências adicionais:

```sh npm2yarn
npm install --save-dev @testing-library/preact @preact/preset-vite
```

Você pode então iniciar os testes executando:

```sh
npx wdio run ./wdio.conf.js
```

## Escrevendo testes

Considerando que você tem o seguinte componente Preact:

```tsx title="./components/Component.jsx"
import { h } from 'preact'
import { useState } from 'preact/hooks'

interface Props {
    initialCount: number
}

export function Counter({ initialCount }: Props) {
    const [count, setCount] = useState(initialCount)
    const increment = () => setCount(count + 1)

    return (
        <div>
            Current value: {count}
            <button onClick={increment}>Increment</button>
        </div>
    )
}

```

No seu teste, use o método `render` de `@testing-library/preact` para anexar o componente à página de teste. Para interagir com o componente, recomendamos usar comandos WebdriverIO, pois eles se comportam mais próximos das interações reais do usuário, por exemplo:

```ts title="app.test.tsx"
import { expect } from 'expect'
import { render, screen } from '@testing-library/preact'

import { Counter } from './components/PreactComponent.js'

describe('Preact Component Testing', () => {
    it('should increment after "Increment" button is clicked', async () => {
        const component = await $(render(<Counter initialCount={5} />))
        await expect(component).toHaveText(expect.stringContaining('Current value: 5'))

        const incrElem = await $(screen.getByText('Increment'))
        await incrElem.click()
        await expect(component).toHaveText(expect.stringContaining('Current value: 6'))
    })
})
```

Você pode encontrar um exemplo completo de um conjunto de testes de componentes WebdriverIO para Preact em nosso [repositório de exemplos](https://github.com/webdriverio/component-testing-examples/tree/main/preact-typescript-vite).
