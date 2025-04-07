---
id: svelte
title: Svelte
---

[Svelte](https://svelte.dev/) é uma nova abordagem radical para a construção de interfaces de usuário. Enquanto frameworks tradicionais como React e Vue fazem a maior parte do trabalho no navegador, o Svelte transfere esse trabalho para uma etapa de compilação que acontece quando você cria seu aplicativo. Você pode testar componentes do Svelte diretamente em um navegador real usando o WebdriverIO e seu [browser runner](/docs/runner#browser-runner).

## Configurar

Para configurar o WebdriverIO no seu projeto Svelte, siga as [instruções](/docs/component-testing#set-up) em nossos documentos de teste de componentes. Certifique-se de selecionar `svelte` como predefinição nas opções do seu corredor, por exemplo:

```js
// wdio.conf.js
export const config = {
    // ...
    runner: ['browser', {
        preset: 'svelte'
    }],
    // ...
}
```

:::info

Se você já estiver usando o [Vite](https://vitejs.dev/) como servidor de desenvolvimento, você também pode reutilizar sua configuração em `vite.config.ts` dentro da sua configuração do WebdriverIO. Para obter mais informações, consulte `viteConfig` em [opções do runner](/docs/runner#runner-options).

:::

A predefinição Svelte requer que `@sveltejs/vite-plugin-svelte` seja instalado. Também recomendamos usar a [Biblioteca de testes](https://testing-library.com/) para renderizar o componente na página de teste. Portanto, você precisará instalar as seguintes dependências adicionais:

```sh npm2yarn
npm install --save-dev @testing-library/svelte @sveltejs/vite-plugin-svelte
```

Você pode então iniciar os testes executando:

```sh
npx wdio run ./wdio.conf.js
```

## Escrevendo testes

Considerando que você tem o seguinte componente Svelte:

```html title="./components/Component.svelte"
<script>
    export let name

    let buttonText = 'Button'

    function handleClick() {
      buttonText = 'Button Clicked'
    }
</script>

<h1>Hello {name}!</h1>
<button on:click="{handleClick}">{buttonText}</button>
```

No seu teste, use o método `render` de `@testing-library/svelte` para anexar o componente à página de teste. Para interagir com o componente, recomendamos usar comandos WebdriverIO, pois eles se comportam mais próximos das interações reais do usuário, por exemplo:

```ts title="svelte.test.js"
import expect from 'expect'

import { render, fireEvent, screen } from '@testing-library/svelte'
import '@testing-library/jest-dom'

import Component from './components/Component.svelte'

describe('Svelte Component Testing', () => {
    it('changes button text on click', async () => {
        render(Component, { name: 'World' })
        const button = await $('button')
        await expect(button).toHaveText('Button')
        await button.click()
        await expect(button).toHaveText('Button Clicked')
    })
})
```

Você pode encontrar um exemplo completo de um conjunto de testes de componentes WebdriverIO para Svelte em nosso [repositório de exemplos](https://github.com/webdriverio/component-testing-examples/tree/main/svelte-typescript-vite).

