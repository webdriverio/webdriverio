---
id: vue
title: Vue.js
---

[Vue.js](https://vuejs.org/) is an approachable, performant and versatile framework for building web user interfaces. You can test Vue.js components directly in a real browser using WebdriverIO and its [browser runner](/docs/runner#browser-runner).

## Setup

To setup WebdriverIO within your Vue.js project, follow the [instructions](/docs/component-testing#set-up) in our component testing docs. Make sure to select `vue` as preset within your runner options, e.g.:

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

If you are already using [Vite](https://vitejs.dev/) as development server you can also just re-use your configuration in `vite.config.ts` within your WebdriverIO config. For more information, see `viteConfig` in [runner options](/docs/runner#runner-options).

:::

The Vue preset requires `@vitejs/plugin-vue` to be installed. Also we recommend using [Testing Library](https://testing-library.com/) for rendering the component into the test page. Therefor you'll need to install the following additional dependencies:

```sh npm2yarn
npm install --save-dev @testing-library/vue @vitejs/plugin-vue
```

You can then start the tests by running:

```sh
npx wdio run ./wdio.conf.js
```

## Writing Tests

Given you have the following Vue.js component:

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

In your test use the `render` method from `@testing-library/vue` to attach the component to the test page. To interact with the component we recommend to use WebdriverIO commands as they behave more close to actual user interactions, e.g.:

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

You can find a full example of a WebdriverIO component test suite for Vue.js in our [example repository](https://github.com/webdriverio/component-testing-examples/tree/main/vue-typescript-vite).

## Testing Async Components in Vue3

If you are using Vue v3 and are testing [async components](https://vuejs.org/guide/built-ins/suspense.html#async-setup) like the following:

```vue
<script setup>
const res = await fetch(...)
const posts = await res.json()
</script>

<template>
  {{ posts }}
</template>
```

We recommend to use [`@vue/test-utils`](https://www.npmjs.com/package/@vue/test-utils) and a little suspence wrapper to get the component rendered. Unfortunately [`@testing-library/vue`](https://github.com/testing-library/vue-testing-library/issues/230) has no support for this yet. Create a `helper.ts` file with the following content:

```ts
import { mount, type VueWrapper as VueWrapperImport } from '@vue/test-utils'
import { Suspense } from 'vue'

export type VueWrapper = VueWrapperImport<any>
const scheduler = typeof setImmediate === 'function' ? setImmediate : setTimeout

export function flushPromises(): Promise<void> {
  return new Promise((resolve) => {
    scheduler(resolve, 0)
  })
}

export function wrapInSuspense(
  component: ReturnType<typeof defineComponent>,
  { props }: { props: object },
): ReturnType<typeof defineComponent> {
  return defineComponent({
    render() {
        console.log('RENDER ME AS WELL', Suspense);

      return h(
        'div',
        { id: 'root' },
        h(Suspense, null, {
          default() {
            console.log('RENDER ME', component, props);

            return h(component, props)
          },
          fallback: h('div', 'fallback'),
        }),
      )
    },
  })
}

export function renderAsyncComponent(vueComponent: ReturnType<typeof defineComponent>, props: object): VueWrapper{
    const component = wrapInSuspense(vueComponent, { props })
    return mount(component, { attachTo: document.body })
}
```

Then import and test the component as following:

```ts
import { $, expect } from '@wdio/globals'

import { renderAsyncComponent, flushPromises, type VueWrapper } from './helpers.js'
import AsyncComponent from '/components/SomeAsyncComponent.vue'

describe('Testing Async Components', () => {
    let wrapper: VueWrapper

    it('should display component correctly', async () => {
        const props = {}
        wrapper = renderAsyncComponent(AsyncComponent, { props })
        await flushPromises()
        await expect($('...')).toBePresent()
    })

    afterEach(() => {
        wrapper.unmount()
    })
})
```

## Testing Vue Components in Nuxt

If you are using the web framework [Nuxt](https://nuxt.com/), WebdriverIO will automatically enable the [auto-import](https://nuxt.com/docs/guide/concepts/auto-imports) feature and makes testing your Vue components and Nuxt pages easy. However any [Nuxt modules](https://nuxt.com/modules) that you might define in your config and requires context to the Nuxt application can not be supported.

__Reasons for that are:__
- WebdriverIO can't initiate a Nuxt application soley in a browser environment
- Having component tests depend too much on the Nuxt environment creates complexity and we recommend to run these tests as e2e tests

:::info

WebdriverIO also provides a service for running e2e tests on Nuxt applications, see [`webdriverio-community/wdio-nuxt-service`](https://github.com/webdriverio-community/wdio-nuxt-service) for information.

:::

### Mocking built-in composables

In case your component uses a native Nuxt composable, e.g. [`useNuxtData`](https://nuxt.com/docs/api/composables/use-nuxt-data), WebdriverIO will automatically mock these functions and allows you to modify their behavior or assert against them, e.g.:

```ts
import { mocked } from '@wdio/browser-runner'

// e.g. your component uses calls `useNuxtData` the following way
// `const { data: posts } = useNuxtData('posts')`
// in your test you can assert against it
expect(useNuxtData).toBeCalledWith('posts')
// and change their behavior
mocked(useNuxtData).mockReturnValue({
    data: [...]
})
```

### Handling 3rd party composables

All [3rd party modules](https://nuxt.com/modules) that can supercharge your Nuxt project can't automatically get mocked. In those cases you need to manually mock them, e.g. given your application uses the [Supabase](https://nuxt.com/modules/supabase) module plugin:

```js title=""
export default defineNuxtConfig({
  modules: [
    "@nuxtjs/supabase",
    // ...
  ],
  // ...
});
```

and you create an instance of Supabase somewhere in your composables, e.g.:

```ts
const superbase = useSupabaseClient()
```

the test will fail due to:

```
ReferenceError: useSupabaseClient is not defined
```

Here, we recommend to either mock out the whole module that uses the `useSupabaseClient` function or create a global variable that mocks this function, e.g.:

```ts
import { fn } from '@wdio/browser-runner'
globalThis.useSupabaseClient = fn().mockReturnValue({})
```
