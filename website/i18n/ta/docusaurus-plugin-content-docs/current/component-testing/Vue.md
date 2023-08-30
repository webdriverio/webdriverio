---
id: vue
title: Vue.js
---

[Vue.js](https://vuejs.org/) என்பது இணைய பயனர் இடைமுகங்களை உருவாக்குவதற்கான அணுகக்கூடிய, செயல்திறன் மற்றும் பல்துறை பிரமேஒர்க் ஆகும். WebdriverIO மற்றும் அதன் [browser runner](/docs/runner#browser-runner)பயன்படுத்தி Vue.js காம்போனென்டுகளை உண்மையான பிரௌசரில் நேரடியாகச் சோதிக்கலாம்.

## செட்அப்

உங்கள் Vue.js திட்டத்தில் WebdriverIO ஐ அமைக்க, எங்கள் கூறு சோதனை ஆவணத்தில் உள்ள [வழிமுறைகளை](/docs/component-testing#set-up) பின்பற்றவும். உங்கள் ரன்னர் விருப்பங்களுக்குள் முன்னமைவாக `vue` ஐத் தேர்ந்தெடுக்கவும், எ.கா.:

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

நீங்கள் ஏற்கனவே [Vite](https://vitejs.dev/) டெவலப்மென்ட் சர்வராகப் பயன்படுத்துகிறீர்கள் என்றால், உங்கள் WebdriverIO கட்டமைப்பிற்குள் `vite.config.ts` இல் உங்கள் கட்டமைப்பை மீண்டும் பயன்படுத்தலாம். மேலும் தகவலுக்கு, `viteConfig` இன் [runner options](/docs/runner#runner-options)ஐப் பார்க்கவும்.

:::

Vue முன்னமைவுக்கு `@vitejs/plugin-vue` நிறுவ வேண்டும். டெஸ்ட் பக்கத்தில் காம்போனென்டுகளை வழங்குவதற்கு [Testing Library](https://testing-library.com/) ஐப் பயன்படுத்தவும் பரிந்துரைக்கிறோம். எனவே நீங்கள் பின்வரும் கூடுதல் சார்புகளை நிறுவ வேண்டும்:

```sh npm2yarn
npm install --save-dev @testing-library/vue @vitejs/plugin-vue
```

பின்னர் நீங்கள் டெஸ்டுகளை ரன் செய்வதன் மூலம் தொடங்கலாம்:

```sh
npx wdio run ./wdio.conf.js
```

## டெஸ்டுகளை எழுதுதல்

பின்வரும் Vue.js காம்போனென்ட் உங்களிடம் உள்ளது:

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

உங்கள் டெஸ்டில் `@testing-library/vue` இலிருந்து ` render ` மெத்தடை பயன்படுத்தி டெஸ்ட் பக்கத்துடன் கூறுகளை இணைக்கவும். காம்போனென்டுகளுடன் தொடர்பு கொள்ள WebdriverIO கட்டளைகளைப் பயன்படுத்தப் பரிந்துரைக்கிறோம், ஏனெனில் அவை உண்மையான பயனர் தொடர்புகளுக்கு மிகவும் நெருக்கமாகச் செயல்படுகின்றன, எ.கா.:

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

Vue.js க்கான WebdriverIO காம்போனென்ட் டெஸ்ட் தொகுப்பின் முழு உதாரணத்தையும் எங்களின் [example repository](https://github.com/webdriverio/component-testing-examples/tree/main/vue-typescript-vite) இல் காணலாம்.
