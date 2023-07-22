---
id: vue
title: Vue.js
---

[Vue.js](https://vuejs.org/) ist ein zugängliches, leistungsfähiges und vielseitiges Framework zum Erstellen von Web-Benutzeroberflächen. Mit WebdriverIO und seinem [Browser Runner](/docs/runner#browser-runner)können Sie Vue.js-Komponenten direkt in einem echten Browser testen.

## Setup

Um WebdriverIO in Ihrem Vue.js-Projekt einzurichten, befolgen Sie die [Anweisungen](/docs/component-testing#set-up) in unseren Komponententestdokumenten. Stellen Sie sicher, dass Sie `vue` als Voreinstellung in Ihren Runner-Optionen auswählen, z. B.:

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

Wenn Sie bereits [Vite](https://vitejs.dev/) als Entwicklungsserver verwenden, können Sie auch einfach Ihre Konfiguration in `vite.config.ts` in Ihrer WebdriverIO-Konfiguration wiederverwenden. Weitere Informationen finden Sie unter `viteConfig` in [Runner-Optionen](/docs/runner#runner-options).

:::

:::info

If you are using [Nuxt](https://nuxt.com/) WebdriverIO will automatically enable the [auto-import](https://nuxt.com/docs/guide/concepts/auto-imports) feature.

:::

Für die Vue-Voreinstellung muss `@vitejs/plugin-vue` installiert sein. Außerdem empfehlen wir die Verwendung von [Testing Library](https://testing-library.com/) zum Rendern der Komponente auf der Testseite. Dazu müssen Sie die folgenden zusätzlichen Abhängigkeiten installieren:

```sh npm2yarn
npm install --save-dev @testing-library/vue @vitejs/plugin-vue
```

Sie können die Tests dann starten, indem Sie Folgendes ausführen:

```sh
npx wdio run ./wdio.conf.js
```

## Tests schreiben

Vorausgesetzt, Sie haben die folgende Vue.js-Komponente:

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

Verwenden Sie in Ihrem Test die Methode `render` aus `@testing-library/vue` , um die Komponente an die Testseite anzuhängen. Um mit der Komponente zu interagieren, empfehlen wir die Verwendung von WebdriverIO-Befehlen, da sie sich näher an tatsächlichen Benutzerinteraktionen verhalten, z.B.:

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

Ein vollständiges Beispiel einer Testsuite für WebdriverIO-Komponenten für Vue.js finden Sie in unserem [Beispiel-Repository](https://github.com/webdriverio/component-testing-examples/tree/main/vue-typescript-vite).
