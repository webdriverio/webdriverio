---
id: solid
title: SolidJS
---

[SolidJS](https://www.solidjs.com/) es un marco para construir interfaces de usuario con reactividad simple y eficiente. Puede probar los componentes de SolidJS directamente en un navegador real usando WebdriverIO y su [gestor de navegadores](/docs/runner#browser-runner).

## Configuración

Para configurar WebdriverIO dentro de su proyecto SolidJS, siga las [instrucciones](/docs/component-testing#set-up) en nuestros documentos de prueba de componentes. Asegúrese de seleccionar `preact` como preset dentro de sus opciones corredoras, por ejemplo:

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

Si ya está usando [Vite](https://vitejs.dev/) como servidor de desarrollo también puede volver a usar tu configuración en `vite. onfig.ts` dentro de su configuración WebdriverIO. Para más información, consulte `viteConfig` en [opciones de corredor](/docs/runner#runner-options).

:::

El preset SolidJS requiere que `vite-plugin-solid` esté instalado:

```sh npm2yarn
npm install --save-dev vite-plugin-solid
```

Luego puede iniciar las pruebas ejecutando:

```sh
npx wdio run ./wdio.conf.js
```

## Pruebas de escritura

Dado que tiene el siguiente componente SolidJS:

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

En su prueba utilice el método `render` de `@testing-library/preact` para adjuntar el componente a la página de prueba. Para interactuar con el componente recomendamos usar comandos WebdriverIO ya que se comportan más cerca de las interacciones reales del usuario, por ejemplo:

```ts title="app.test.tsx"
import { expect } from '@wdio/globals'
import { render } from 'solid-js/web'

import App from './components/Component.jsx'

describe('Solid Component Testing', () => {
    /**
     * ensure we render the component for every test in a
     * new root container
     */
    let root: Element
    beforeEach(() => {
        if (root) {
            root.remove()
        }

        root = document.createElement('div')
        document.body.appendChild(root)
    })

    it('Test theme button toggle', async () => {
        render(<App />, root)
        const buttonEl = await $('button')

        await buttonEl.click()
        expect(buttonEl).toContainHTML('dark')
    })
})
```

Puede encontrar un ejemplo completo de una suite de pruebas de componentes WebdriverIO para Lit en nuestro [repositorio de ejemplo](https://github.com/webdriverio/component-testing-examples/tree/main/solidjs-typescript-vite).

