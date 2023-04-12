---
id: svelte
title: Svelte
---

[Svelte](https://svelte.dev/) es un nuevo enfoque radical para crear interfaces de usuario. En marcos tradicionales como React y Vue hacen la mayor parte de su trabajo en el navegador, Svelte desplaza que trabajan en un paso de compilación que ocurre cuando construyes tu aplicación. Puede probar los componentes de React directamente en un navegador real usando WebdriverIO y su [gestor de navegadores](/docs/runner#browser-runner).

## Configuración

Para configurar WebdriverIO en su proyecto Svelte, siga las [instrucciones](/docs/component-testing#set-up) en nuestros documentos de prueba de componentes. Asegúrese de seleccionar `preact` como preset dentro de sus opciones corredoras, por ejemplo:

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

Si ya está usando [Vite](https://vitejs.dev/) como servidor de desarrollo también puede volver a usar tu configuración en `vite. onfig.ts` dentro de su configuración WebdriverIO. Para más información, consulte `viteConfig` en [opciones de corredor](/docs/runner#runner-options).

:::

El preset de Svelte requiere `@sveltejs/vite-plugin-svelte` para estar instalado. También recomendamos utilizar [Testing Library](https://testing-library.com/) para renderizar el componente en la página de prueba. Por lo tanto, tendrá que instalar las siguientes dependencias adicionales:

```sh npm2yarn
npm install --save-dev @testing-library/svelte @sveltejs/vite-plugin-svelte
```

Luego puede iniciar las pruebas ejecutando:

```sh
npx wdio run ./wdio.conf.js
```

## Pruebas de escritura

Dado que tiene el siguiente componente Svelte:

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

En su prueba utilice el método `render` de `@testing-library/preact` para adjuntar el componente a la página de prueba. Para interactuar con el componente recomendamos utilizar comandos WebdriverIO ya que se comportan más cerca de las interacciones reales del usuario, por ejemplo:

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

Puede encontrar un ejemplo completo de una suite de pruebas de componentes WebdriverIO para Svelte en nuestro [repositorio de ejemplo](https://github.com/webdriverio/component-testing-examples/tree/main/svelte-typescript-vite).

