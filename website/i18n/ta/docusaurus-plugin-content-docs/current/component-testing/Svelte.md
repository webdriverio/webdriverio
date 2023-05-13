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

If you are already using [Vite](https://vitejs.dev/) as development server you can also just re-use your configuration in `vite.config.ts` within your WebdriverIO config. For more information, see `viteConfig` in [runner options](/docs/runner#runner-options).

:::

The Svelte preset requires `@sveltejs/vite-plugin-svelte` to be installed. Also we recommend using [Testing Library](https://testing-library.com/) for rendering the component into the test page. Therefor you'll need to install the following additional dependencies:

```sh npm2yarn
npm install --save-dev @testing-library/svelte @sveltejs/vite-plugin-svelte
```

You can then start the tests by running:

```sh
npx wdio run ./wdio.conf.js
```

## Writing Tests

Given you have the following Svelte component:

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

In your test use the `render` method from `@testing-library/svelte` to attach the component to the test page. To interact with the component we recommend to use WebdriverIO commands as they behave more close to actual user interactions, e.g.:

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

You can find a full example of a WebdriverIO component test suite for Svelte in our [example repository](https://github.com/webdriverio/component-testing-examples/tree/main/svelte-typescript-vite).

