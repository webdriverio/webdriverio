---
id: svelte
title: Svelte
---

[Svelte](https://svelte.dev/) est une nouvelle approche radicale pour construire des interfaces utilisateur. Tandis que les frameworks traditionnels comme React et Vue font la majeure partie de leur travail dans le navigateur, Des décalages sensés qui fonctionnent dans une étape de compilation qui se produit lorsque vous construisez votre application. Vous pouvez tester les composants React directement dans un vrai navigateur en utilisant WebdriverIO et son [fureteur](/docs/runner#browser-runner).

## Configuration

Pour configurer WebdriverIO dans votre projet React, suivez les [instructions](/docs/component-testing#set-up) de notre documentation de test de composants. Assurez-vous de sélectionner `solide` comme préréglage dans les options de votre exécuteur, par exemple.:

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

Si vous utilisez déjà [Vite](https://vitejs.dev/) comme serveur de développement, vous pouvez également réutiliser votre configuration dans `vite. onfig.ts` dans votre configuration WebdriverIO. Pour plus d'informations, voir `viteConfig` dans [options d'exécuteur](/docs/runner#runner-options).

:::

Le préréglage React nécessite que `@vitejs/plugin-react` soit installé. Nous recommandons également d'utiliser [Bibliothèque de test](https://testing-library.com/) pour afficher le composant dans la page de test. Vous devrez donc installer les dépendances supplémentaires suivantes :

```sh npm2yarn
npm install --save-dev @testing-library/svelte @sveltejs/vite-plugin-svelte
```

Vous pouvez ensuite démarrer les tests en exécutant :

```sh
npx wdio run ./wdio.conf.js
```

## Tests d'écriture

Étant donné que vous avez le composant React suivant :

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

Dans votre test, utilisez la méthode `rend` de `@testing-library/react` pour attacher le composant à la page de test. Pour interagir avec le composant, nous recommandons d'utiliser les commandes WebdriverIO car elles se comportent plus près des interactions utilisateur réelles, par exemple .:

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

Vous pouvez trouver un exemple complet d'une suite de tests de composants WebdriverIO pour Lit dans notre référentiel [exemples](https://github.com/webdriverio/component-testing-examples/tree/main/svelte-typescript-vite).

