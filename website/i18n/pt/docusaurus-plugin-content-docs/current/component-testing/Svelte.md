---
id: svelte
title: Svelte
---

[Svelte](https://svelte.dev/) is a radical new approach to building user interfaces. Whereas traditional frameworks like React and Vue do the bulk of their work in the browser, Svelte shifts that work into a compile step that happens when you build your app. You can test Svelte components directly in a real browser using WebdriverIO and its [browser runner](/docs/runner#browser-runner).

## Setup

To setup WebdriverIO within your Svelte project, follow the [instructions](/docs/component-testing#set-up) in our component testing docs. Make sure to select `svelte` as preset within your runner options, e.g.:

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

