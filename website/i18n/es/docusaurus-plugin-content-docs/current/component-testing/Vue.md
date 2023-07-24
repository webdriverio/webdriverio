---
id: vue
title: Vue.js
---

[Vue.js](https://vuejs.org/) es un framework accesible, performante y versátil para construir interfaces de usuario web. Usted puede probar componentes Vue.js directamente en un navegador real usando WebdriverIO y su [gestor de navegadores](/docs/runner#browser-runner).

## Configuración

Para configurar WebdriverIO en su proyecto Vue.js, siga las [instrucciones](/docs/component-testing#set-up) en nuestros documentos de prueba de componentes. Asegúrese de seleccionar `vue` como preset dentro de sus opciones de corredor, por ejemplo:

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

Si ya está usando [Vite](https://vitejs.dev/) como servidor de desarrollo también puede volver a usar tu configuración en `vite. onfig.ts` dentro de su configuración WebdriverIO. Para más información, consulte `viteConfig` en [opciones de corredor](/docs/runner#runner-options).

:::

:::info

If you are using [Nuxt](https://nuxt.com/), WebdriverIO will automatically enable the [auto-import](https://nuxt.com/docs/guide/concepts/auto-imports) feature.

:::

El preset de Vue requiere que `@vitejs/plugin-vue` esté instalado. También recomendamos utilizar [Testing Library](https://testing-library.com/) para renderizar el componente en la página de prueba. Por lo tanto, tendrá que instalar las siguientes dependencias adicionales:

```sh npm2yarn
npm install --save-dev @testing-library/vue @vitejs/plugin-vue
```

Luego puede iniciar las pruebas ejecutando:

```sh
npx wdio run ./wdio.conf.js
```

## Pruebas de escritura

Dado que tiene el siguiente componente Vue.js:

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

En su prueba, utilice el método `render` de `@testing-library/vue` para adjuntar el componente a la página de prueba. Para interactuar con el componente recomendamos utilizar comandos WebdriverIO ya que se comportan más cerca de las interacciones reales del usuario, por ejemplo:

```ts title="vue.test.js"
import { $, expect } from '@wdio/globals'
import { render } from '@testing-library/vue'
import Component from './components/Component.vue'

describe('Vue Component Testing', () => {
    it('increments value on click', async () => {
        // The render method returns a collection of utilities to query your component.
        const { getByText } = render(Component)

        // getByText returns the first matching node for the provided text, and
        // throws an error if no elements match or if more than one match is found.
        getByText('Times clicked: 0')

        const button = await $(getByText('increment'))

        // Dispatch a native click event to our button element.
        await button.click()
        await button.click()

        getByText('Times clicked: 2') // assert with Testing Library
        await expect($('p=Times clicked: 2')).toExist() // assert with WebdriverIO
    })
})
```

Puede encontrar un ejemplo completo de una suite de pruebas de componentes WebdriverIO para Vue.js en nuestro [repositorio de ejemplo](https://github.com/webdriverio/component-testing-examples/tree/main/vue-typescript-vite).
