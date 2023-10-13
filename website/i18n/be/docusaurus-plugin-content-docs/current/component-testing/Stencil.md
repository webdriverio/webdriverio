---
id: stencil
title: Stencil
---

[Stencil](https://stenciljs.com/) is a library for building reusable, scalable component libraries. You can test Stencil components directly in a real browser using WebdriverIO and its [browser runner](/docs/runner#browser-runner).

## Setup

To setup WebdriverIO within your Stencil project, follow the [instructions](/docs/component-testing#set-up) in our component testing docs. Make sure to select `stencil` as preset within your runner options, e.g.:

```js
// wdio.conf.js
export const config = {
    // ...
    runner: ['browser', {
        preset: 'stencil'
    }],
    // ...
}
```

:::info

In case you use Stencil with a framework like React or Vue, you should keep the preset for these frameworks.

:::

You can then start the tests by running:

```sh
npx wdio run ./wdio.conf.ts
```

## Writing Tests

Given you have the following Stencil component:

```tsx title="./components/Component.tsx"
import { Component, Prop, h } from '@stencil/core'

@Component({
    tag: 'my-name',
    shadow: true
})
export class MyName {
    @Prop() name: string

    normalize(name: string): string {
        if (name) {
            return name.slice(0, 1).toUpperCase() + name.slice(1).toLowerCase()
        }
        return ''
    }

    render() {
        return (
            <div class="text">
                <p>Hello! My name is {this.normalize(this.name)}.</p>
            </div>
        )
    }
}
```

In your test use the `render` method from `@wdio/browser-runner/stencil` to attach the component to the test page. To interact with the component we recommend to use WebdriverIO commands as they behave more close to actual user interactions, e.g.:

```tsx title="app.test.tsx"
import { expect } from '@wdio/globals'
import { render } from '@wdio/browser-runner/stencil'

import MyNameComponent from './components/Component.tsx'

describe('Stencil Component Testing', () => {
    it('should render component correctly', async () => {
        await render({
            components: [MyNameComponent],
            template: () => (
                <my-name name={'stencil'}></my-name>
            )
        })
        await expect($('>>>.text')).toHaveText('Hello! My name is Stencil.')
    })
})
```

## Element Updates

If you define properties or state in your Stencil component you have to manage when these changes should be applied to the component to be re-rendered. For that use the `flushAll` method that is returned from the `render` method, e.g.:

```ts
const { flushAll } = render({
    components: [AppLogin],
    template: () => <app-login />
})

// update component state via
await $('...').click()

flushAll()

// assert after update
await expect($('...')).toHaveElementClass('...')
```

If you prefer to apply changes automatically, set the `autoApplyChanges` flag, e.g.:

```ts
const { flushAll } = render({
    components: [AppLogin],
    template: () => <app-login />,
    autoApplyChanges: true
})
// update component state and assert immediatelly
await $('...').click()
await expect($('...')).toHaveElementClass('...')
```

## Examples

You can find a full example of a WebdriverIO component test suite for SolidJS in our [example repository](https://github.com/webdriverio/component-testing-examples/tree/main/stencil-component-starter).

