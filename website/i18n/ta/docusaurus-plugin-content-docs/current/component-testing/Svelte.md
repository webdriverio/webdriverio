---
id: svelte
title: Svelte
---

[Svelte](https://svelte.dev/) என்பது பயனர் இடைமுகங்களை உருவாக்குவதற்கான ஒரு தீவிரமான புதிய அணுகுமுறையாகும். ரியாக்ட் மற்றும் வ்யூ போன்ற பாரம்பரிய பிரமேஒர்க்குகள் பிரௌசரில் தங்கள் பணியின் பெரும்பகுதியைச் செய்யும் அதே வேளையில், ஸ்வெல்ட் உங்கள் பயன்பாட்டை உருவாக்கும்போது ஏற்படும் தொகுக்கும் படியாக மாற்றுகிறது. WebdriverIO மற்றும் அதன் [browser runner](/docs/runner#browser-runner) யைப்பயன்படுத்தி உண்மையான பிரௌசரில் Svelte காம்போனென்டுகளை நேரடியாகச் சோதிக்கலாம்.

## செட்அப்

உங்கள் Svelte ப்ரொஜெக்ட்டில் WebdriverIO ஐ அமைக்க, எங்கள் காம்போனென்ட் டெஸ்ட் ஆவணத்தின் [instructions](/docs/component-testing#set-up) வழிமுறைகளைப் பின்பற்றவும். உங்கள் ரன்னர் விருப்பங்களில் `svelte` முன்னமைவாகத் தேர்ந்தெடுக்கவும், எ.கா.:

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

நீங்கள் ஏற்கனவே [Vite](https://vitejs.dev/) டெவலப்மென்ட் சர்வராகப் பயன்படுத்துகிறீர்கள் என்றால், உங்கள் WebdriverIO கட்டமைப்பிற்குள் `vite.config.ts` இல் உங்கள் கட்டமைப்பை மீண்டும் பயன்படுத்தலாம். மேலும் தகவலுக்கு, `viteConfig` இன் [runner options](/docs/runner#runner-options)ஐப் பார்க்கவும்.

:::

Svelte முன்னமைவை நிறுவ `@sveltejs/vite-plugin-svelte` தேவைப்படுகிறது. டெஸ்ட் பக்கத்தில் காம்போனென்டுகளை வழங்குவதற்கு [Testing Library](https://testing-library.com/) ஐப் பயன்படுத்தவும் பரிந்துரைக்கிறோம். எனவே நீங்கள் பின்வரும் கூடுதல் சார்புகளை நிறுவ வேண்டும்:

```sh npm2yarn
npm install --save-dev @testing-library/svelte @sveltejs/vite-plugin-svelte
```

பின்னர் நீங்கள் டெஸ்டுகளை ரன் செய்வதன் மூலம் தொடங்கலாம்:

```sh
npx wdio run ./wdio.conf.js
```

## டெஸ்டுகளை எழுதுதல்

உங்களிடம் பின்வரும் Svelte காம்போனென்ட் உள்ளது:

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

உங்கள் டெஸ்டில் `@testing-library/svelte` இலிருந்து ` render ` மெத்தடை பயன்படுத்தி டெஸ்ட் பக்கத்துடன் காம்போனென்டுகளை இணைக்கவும். காம்போனென்டுகளுடன் தொடர்பு கொள்ள WebdriverIO கட்டளைகளைப் பயன்படுத்தப் பரிந்துரைக்கிறோம், ஏனெனில் அவை உண்மையான பயனர் தொடர்புகளுக்கு மிகவும் நெருக்கமாகச் செயல்படுகின்றன, எ.கா.:

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

Svelte க்கான WebdriverIO காம்போனென்ட் டெஸ்ட் தொகுப்பின் முழு உதாரணத்தையும் எங்களின் [example repository](https://github.com/webdriverio/component-testing-examples/tree/main/svelte-typescript-vite)இல் காணலாம்.

