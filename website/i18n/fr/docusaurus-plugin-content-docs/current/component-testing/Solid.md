---
id: solid
title: SolidJS
---

[SolidJS](https://www.solidjs.com/) est un framework pour construire des interfaces utilisateur avec une réactivité simple et performante. Vous pouvez tester les composants React directement dans un vrai navigateur en utilisant WebdriverIO et son [fureteur](/docs/runner#browser-runner).

## Configuration

Pour configurer WebdriverIO dans votre projet Lit, suivez les [instructions](/docs/component-testing#set-up) dans nos documents de test de composants. Assurez-vous de sélectionner `solide` comme préréglage dans les options de votre exécuteur, par exemple.:

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

Si vous utilisez déjà [Vite](https://vitejs.dev/) comme serveur de développement, vous pouvez également réutiliser votre configuration dans `vite. onfig.ts` dans votre configuration WebdriverIO. Pour plus d'informations, voir `viteConfig` dans [options d'exécuteur](/docs/runner#runner-options).

:::

Le préréglage SolidJS requiert l'installation de `vite-plugin-solid`:

```sh npm2yarn
npm install --save-dev vite-plugin-solid
```

Vous pouvez ensuite démarrer les tests en exécutant :

```sh
npx wdio run ./wdio.conf.js
```

## Tests d'écriture

Étant donné que vous avez le composant React suivant :

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

Dans votre test, utilisez la méthode `rend` de `@testing-library/react` pour attacher le composant à la page de test. Pour interagir avec le composant, nous recommandons d'utiliser les commandes WebdriverIO car elles se comportent plus près des interactions utilisateur réelles, par exemple .:

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

Vous pouvez trouver un exemple complet d'une suite de tests de composants WebdriverIO pour Lit dans notre référentiel [exemples](https://github.com/webdriverio/component-testing-examples/tree/main/solidjs-typescript-vite).

