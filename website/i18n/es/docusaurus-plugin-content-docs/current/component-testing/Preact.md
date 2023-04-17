---
id: preact
title: Preact
---

[Preact](https://preactjs.com/) es una rápida alternativa de 3kB a React con la misma API moderna. Puede probar componentes de Preact directamente en un navegador real usando WebdriverIO y su [gestor de navegadores](/docs/runner#browser-runner).

## Configuración

Para configurar WebdriverIO dentro de su proyecto Lit, siga las [instrucciones](/docs/component-testing#set-up) en nuestros documentos de prueba de componentes. Asegúrese de seleccionar `preact` como preset dentro de sus opciones corredoras, por ejemplo:

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

Si ya estás usando [Vite](https://vitejs.dev/) como servidor de desarrollo también puedes volver a usar tu configuración en `vite. onfig.ts` dentro de su configuración WebdriverIO. Para más información, consulte `viteConfig` en [opciones de corredor](/docs/runner#runner-options).

:::

El preset React requiere `@preact/preset-vite` para ser instalado. También recomendamos utilizar [Testing Library](https://testing-library.com/) para renderizar el componente en la página de prueba. Por lo tanto, tendrás que instalar las siguientes dependencias adicionales:

```sh npm2yarn
npm install --save-dev @testing-library/preact @preact/preset-vite
```

Luego puede iniciar las pruebas ejecutando:

```sh
npx wdio run ./wdio.conf.js
```

## Tests de escritura

Dado que usted tiene el siguiente componente Lit:

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

En su prueba utilice el método `render` de `@testing-library/preact` para adjuntar el componente a la página de prueba. Para interactuar con el componente recomendamos usar comandos WebdriverIO ya que se comportan más cerca de las interacciones reales del usuario, por ejemplo:

```ts title="app.test.tsx"
import { expect } from 'expect'
import { render, screen } from '@testing-library/preact'

import { Counter } from './components/PreactComponent.js'

describe('Preact Component Testing', () => {
    it('should increment after "Increment" button is clicked', async () => {
        const component = await $(render(<Counter initialCount={5} />))
        await expect(component).toHaveTextContaining('Current value: 5')

        const incrElem = await $(screen.getByText('Increment'))
        await incrElem.click()
        await expect(component).toHaveTextContaining('Current value: 6')
    })
})
```

Puede encontrar un ejemplo completo de una suite de pruebas de componentes WebdriverIO para Lit en nuestro [repositorio de ejemplo](https://github.com/webdriverio/component-testing-examples/tree/main/react-typescript-vite).
