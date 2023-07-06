---
id: react
title: React
---

[React](https://reactjs.org/) rend la création d'interfaces sans douleur. Concevez des vues simples pour chaque état de votre application, et React mettra à jour et affichera efficacement les bons composants lorsque vos données changeront. Vous pouvez tester les composants React directement dans un vrai navigateur en utilisant WebdriverIO et son [fureteur](/docs/runner#browser-runner).

## Configuration

Pour configurer WebdriverIO dans votre projet React, suivez les [instructions](/docs/component-testing#set-up) de notre documentation de test de composants. Assurez-vous de sélectionner `réagir` comme prédéfini dans les options de votre exécuteur, par exemple.:

```js
// wdio.conf.js
export const config = {
    // ...
    runner: ['browser', {
        preset: 'react'
    }],
    // ...
}
```

:::info

Si vous utilisez déjà [Vite](https://vitejs.dev/) comme serveur de développement, vous pouvez également réutiliser votre configuration dans `vite. onfig.ts` dans votre configuration WebdriverIO. Pour plus d'informations, voir `viteConfig` dans [options d'exécuteur](/docs/runner#runner-options).

:::

Le préréglage React nécessite que `@vitejs/plugin-react` soit installé. Nous recommandons également d'utiliser [Bibliothèque de test](https://testing-library.com/) pour afficher le composant dans la page de test. Vous devrez donc installer les dépendances supplémentaires suivantes :

```sh npm2yarn
npm install --save-dev @testing-library/react @vitejs/plugin-react
```

Vous pouvez ensuite démarrer les tests en exécutant :

```sh
npx wdio run ./wdio.conf.js
```

## Tests d'écriture

Étant donné que vous avez le composant React suivant :

```tsx title="./components/Component.jsx"
import React, { useState } from 'react'

function App() {
    const [theme, setTheme] = useState('light')

    const toggleTheme = () => {
        const nextTheme = theme === 'light' ? 'dark' : 'light'
        setTheme(nextTheme)
    }

    return <button onClick={toggleTheme}>
        Current theme: {theme}
    </button>
}

export default App
```

Dans votre test, utilisez la méthode `rend` de `@testing-library/react` pour attacher le composant à la page de test. Pour interagir avec le composant, nous recommandons d'utiliser les commandes WebdriverIO car elles se comportent plus près des interactions utilisateur réelles, par exemple .:

```ts title="app.test.tsx"
import { expect } from '@wdio/globals'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import * as matchers from '@testing-library/jest-dom/matchers'
expect.extend(matchers)

import App from './components/Component.jsx'

describe('React Component Testing', () => {
    it('Test theme button toggle', async () => {
        render(<App />)
        const buttonEl = screen.getByText(/Current theme/i)

        await $(buttonEl).click()
        expect(buttonEl).toContainHTML('dark')
    })
})
```

Vous pouvez trouver un exemple complet d'une suite de tests de composants WebdriverIO pour Lit dans notre référentiel [exemples](https://github.com/webdriverio/component-testing-examples/tree/main/react-typescript-vite).

