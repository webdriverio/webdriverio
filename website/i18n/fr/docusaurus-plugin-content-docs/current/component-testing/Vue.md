---
id: vue
title: Vue.js
---

[Vue.js](https://vuejs.org/) est un framework abordable, performant et polyvalent pour la construction d'interfaces utilisateur web. Vous pouvez tester les composants React directement dans un vrai navigateur en utilisant WebdriverIO et son [fureteur](/docs/runner#browser-runner).

## Configuration

Pour configurer WebdriverIO dans votre projet React, suivez les [instructions](/docs/component-testing#set-up) de notre documentation de test de composants. Assurez-vous de sélectionner `solide` comme préréglage dans les options de votre exécuteur, par exemple.:

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

Si vous utilisez déjà [Vite](https://vitejs.dev/) comme serveur de développement, vous pouvez également réutiliser votre configuration dans `vite. onfig.ts` dans votre configuration WebdriverIO. Pour plus d'informations, voir `viteConfig` dans [options d'exécuteur](/docs/runner#runner-options).

:::

Le préréglage React nécessite que `@vitejs/plugin-react` soit installé. Nous recommandons également d'utiliser [Bibliothèque de test](https://testing-library.com/) pour afficher le composant dans la page de test. Vous devrez donc installer les dépendances supplémentaires suivantes :

```sh npm2yarn
npm install --save-dev @testing-library/vue @vitejs/plugin-vue
```

Vous pouvez ensuite démarrer les tests en exécutant :

```sh
npx wdio run ./wdio.conf.js
```

## Tests d'écriture

Étant donné que vous avez le composant React suivant :

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

Dans votre test, utilisez la méthode `rend` de `@testing-library/react` pour attacher le composant à la page de test. Pour interagir avec le composant, nous recommandons d'utiliser les commandes WebdriverIO car elles se comportent plus près des interactions utilisateur réelles, par exemple .:

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

Vous pouvez trouver un exemple complet d'une suite de tests de composants WebdriverIO pour Lit dans notre référentiel [exemples](https://github.com/webdriverio/component-testing-examples/tree/main/vue-typescript-vite).
