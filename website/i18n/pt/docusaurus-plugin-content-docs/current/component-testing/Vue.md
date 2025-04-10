---
id: vue
title: Vue.js
---

[Vue.js](https://vuejs.org/) é uma estrutura acessível, de alto desempenho e versátil para criar interfaces de usuário da web. Você pode testar componentes do Vue.js diretamente em um navegador real usando o WebdriverIO e seu [executor do navegador](/docs/runner#browser-runner).

## Configurar

Para configurar o WebdriverIO no seu projeto Vue.js, siga as [instruções](/docs/component-testing#set-up) em nossos documentos de teste de componentes. Certifique-se de selecionar `vue` como predefinição nas opções do seu runner, por exemplo:

```js
// wdio.conf.js
export const config = {
    // ...
    runner: ['browser', {
        preset: 'vue'
    }],
    // ...
}
```

:::info

Se você já estiver usando o [Vite](https://vitejs.dev/) como servidor de desenvolvimento, você também pode reutilizar sua configuração em `vite.config.ts` dentro da sua configuração do WebdriverIO. Para obter mais informações, consulte `viteConfig` em [opções do runner](/docs/runner#runner-options).

:::

A predefinição do Vue requer que `@vitejs/plugin-vue` esteja instalado. Também recomendamos usar a [Biblioteca de testes](https://testing-library.com/) para renderizar o componente na página de teste. Portanto, você precisará instalar as seguintes dependências adicionais:

```sh npm2yarn
npm install --save-dev @testing-library/vue @vitejs/plugin-vue
```

Você pode então iniciar os testes executando:

```sh
npx wdio run ./wdio.conf.js
```

## Escrevendo testes

Considerando que você tem o seguinte componente Vue.js:

```tsx title="./components/Component.vue"
<template>
    <div>
        <p>Times clicked: {{ count }}</p>
        <button @click="increment">increment</button>
    </div>
</template>

<script>
export default {
    data: () => ({
        count: 0,
    }),

    methods: {
        increment() {
            this.count++
        },
    },
}
</script>
```

No seu teste, renderize o componente no DOM e execute asserções nele. Recomendamos usar [`@vue/test-utils`](https://test-utils.vuejs.org/) ou [`@testing-library/vue`](https://testing-library.com/docs/vue-testing-library/intro/) para anexar o componente à página de teste. Para interagir com o componente, use os comandos WebdriverIO, pois eles se comportam mais próximos das interações reais do usuário, por exemplo:

<Tabs
  defaultValue="utils"
  values={[
    {label: '@vue/test-utils', value: 'utils'},
 {label: '@testing-library/vue', value: 'testinglib'}
 ]
}>
<TabItem value="utils">

```ts title="vue.test.js"
import { $, expect } from '@wdio/globals'
import { mount } from '@vue/test-utils'
import Component from './components/Component.vue'

describe('Teste de Componente Vue', () => {
    it('incrementa o valor ao clicar', async () => {
        // O método render retorna uma coleção de utilitários para consultar seu componente.

        const wrapper = mount(Component, { attachTo: document.body })
        expect(wrapper.text()).toContain('Times clicked: 0')

        const button = await $('aria/increment')

        // Dispara um evento de clique nativo no nosso elemento de botão.
        await button.click()
        await button.click()

        expect(wrapper.text()).toContain('Times clicked: 2')
        await expect($('p=Times clicked: 2')).toExist() // mesma asserção com WebdriverIO
    })
})
```

</TabItem>
<TabItem value="testinglib">

```ts
import { $, expect } from '@wdio/globals'
import { render } from '@testing-library/vue'
import Component from './components/Component.vue'

describe('Teste de Componente Vue', () => {
    it('incrementa o valor ao clicar', async () => {
        // O método render retorna uma coleção de utilitários para consultar seu componente.
        const { getByText } = render(Component)

        // getByText returns the first matching node for the provided text, and
        // throws an error if no elements match or if more than one match is found.
        getByText('Times clicked: 0')

        const button = await $(getByText('increment'))

        // Dispatch a native click event to our button element.
        await button.click()
        await button.click()

        getByText('Times clicked: 2') // asserção com Testing Library
        await expect($('p=Times clicked: 2')).toExist() // asserção com WebdriverIO
    })
})
```

</TabItem>
</Tabs>

Você pode encontrar um exemplo completo de um conjunto de testes de componentes WebdriverIO para Vue.js em nosso [repositório de exemplos](https://github.com/webdriverio/component-testing-examples/tree/main/vue-typescript-vite).

## Testando componentes assíncronos no Vue3

Se você estiver usando o Vue v3 e estiver testando [componentes assíncronos](https://vuejs.org/guide/built-ins/suspense.html#async-setup) como o seguinte:

```vue
<script setup>
const res = await fetch(...)
const posts = await res.json()
</script>

<template>
  {{ posts }}
</template>
```

Recomendamos usar [`@vue/test-utils`](https://www.npmjs.com/package/@vue/test-utils) e um pequeno wrapper de suspense para renderizar o componente. Infelizmente, [`@testing-library/vue`](https://github.com/testing-library/vue-testing-library/issues/230) ainda não tem suporte para isso. Crie um arquivo `helper.ts` com o seguinte conteúdo:

```ts
import { mount, type VueWrapper as VueWrapperImport } from '@vue/test-utils'
import { Suspense } from 'vue'

export type VueWrapper = VueWrapperImport<any>
const scheduler = typeof setImmediate === 'function' ? setImmediate : setTimeout

export function flushPromises(): Promise<void> {
  return new Promise((resolve) => {
    scheduler(resolve, 0)
  })
}

export function wrapInSuspense(
  component: ReturnType<typeof defineComponent>,
  { props }: { props: object },
): ReturnType<typeof defineComponent> {
  return defineComponent({
    render() {
      return h(
        'div',
        { id: 'root' },
        h(Suspense, null, {
          default() {
            return h(component, props)
          },
          fallback: h('div', 'fallback'),
        }),
      )
    },
  })
}

export function renderAsyncComponent(vueComponent: ReturnType<typeof defineComponent>, props: object): VueWrapper{
    const component = wrapInSuspense(vueComponent, { props })
    return mount(component, { attachTo: document.body })
}
```

Em seguida, importe e teste o componente da seguinte maneira:

```ts
import { $, expect } from '@wdio/globals'

import { renderAsyncComponent, flushPromises, type VueWrapper } from './helpers.js'
import AsyncComponent from '/components/SomeAsyncComponent.vue'

describe('Testing Async Components', () => {
    let wrapper: VueWrapper

    it('should display component correctly', async () => {
        const props = {}
        wrapper = renderAsyncComponent(AsyncComponent, { props })
        await flushPromises()
        await expect($('...')).toBePresent()
    })

    afterEach(() => {
        wrapper.unmount()
    })
})
```

## Testando componentes Vue no Nuxt

Se você estiver usando o framework web [Nuxt](https://nuxt.com/), o WebdriverIO habilitará automaticamente o recurso [importação automática](https://nuxt.com/docs/guide/concepts/auto-imports) e facilitará o teste de seus componentes Vue e páginas Nuxt. Entretanto, quaisquer [módulos Nuxt](https://nuxt.com/modules) que você possa definir em sua configuração e que exijam contexto para o aplicativo Nuxt não podem ser suportados.

__As razões para isso são:__
- O WebdriverIO não pode iniciar um aplicativo Nuxt somente em um ambiente de navegador
- Ter testes de componentes dependendo muito do ambiente Nuxt cria complexidade e recomendamos executar esses testes como testes e2e

:::info

O WebdriverIO também fornece um serviço para executar testes e2e em aplicativos Nuxt. Consulte [`webdriverio-community/wdio-nuxt-service`](https://github.com/webdriverio-community/wdio-nuxt-service) para obter informações.

:::

### Mocking de composables integrados

Caso seu componente use um composable nativo do Nuxt, por exemplo, [`useNuxtData`](https://nuxt.com/docs/api/composables/use-nuxt-data), o WebdriverIO simulará automaticamente essas funções e permitirá que você modifique seu comportamento ou faça afirmações contra elas, por exemplo:

```ts
import { mocked } from '@wdio/browser-runner'

// por exemplo, seu componente usa a chamada `useNuxtData` da seguinte forma
// `const { data: posts } = useNuxtData('posts')`
// no seu teste, você pode afirmar contra isso
expect(useNuxtData).toBeCalledWith('posts')
// e alterar o comportamento deles
mocked(useNuxtData).mockReturnValue({
    data: [...]
})
})
```

### Manipulando composables de terceiros

Todos os [módulos de terceiros](https://nuxt.com/modules) que podem potencializar seu projeto Nuxt não podem ser automaticamente simulados. Nesses casos, você precisa simulá-los manualmente, por exemplo, dado que seu aplicativo usa o plugin do módulo [Supabase](https://nuxt.com/modules/supabase):

```js title=""
export default defineNuxtConfig({
  modules: [
    "@nuxtjs/supabase",
    // ...
  ],
  // ...
});
```

e você cria uma instância do Supabase em algum lugar em seus composables, por exemplo:

```ts
const superbase = useSupabaseClient()
```

o teste falhará devido a:

```
ReferenceError: useSupabaseClient não está definido
```

Aqui, recomendamos simular todo o módulo que usa a função `useSupabaseClient` ou criar uma variável global que simula essa função, por exemplo:

```ts
import { fn } from '@wdio/browser-runner'
globalThis.useSupabaseClient = fn().mockReturnValue({})
```
