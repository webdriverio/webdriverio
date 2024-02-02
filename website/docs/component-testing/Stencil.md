---
id: stencil
title: Stencil
---

[Stencil](https://stenciljs.com/) is a library for building reusable, scalable component libraries. You can test Stencil components directly in a real browser using WebdriverIO and its [browser runner](/docs/runner#browser-runner).

## Setup

To set up WebdriverIO within your Stencil project, follow the [instructions](/docs/component-testing#set-up) in our component testing docs. Make sure to select `stencil` as preset within your runner options, e.g.:

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

Given you have the following Stencil components:

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

### `render`

In your test use the `render` method from `@wdio/browser-runner/stencil` to attach the component to the test page. To interact with the component we recommend using WebdriverIO commands as they behave closer to actual user interactions, e.g.:

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

#### Render Options

The `render` method provides the following options:

##### `components`

An array of components to test. Component classes can be imported into the spec file, then their reference should be added to the `component` array to be used throughout the test.

__Type:__ `CustomElementConstructor[]`<br />
__Default:__ `[]`

##### `flushQueue`

If `false`, do not flush the render queue on the initial test setup.

__Type:__ `boolean`<br />
__Default:__ `true`

##### `template`

The initial JSX that is used to generate the test. Use `template` when you want to initialize a component using their properties, instead of their HTML attributes. It will render the specified template (JSX) into `document.body`.

__Type:__ `JSX.Template`

##### `html`

The initial HTML used to generate the test. This can be useful to construct a collection of components working together, and assign HTML attributes.

__Type:__ `string`

##### `language`

Sets the mocked `lang` attribute on `<html>`.

__Type:__ `string`

##### `autoApplyChanges`

By default, any changes to component properties and attributes must `env.waitForChanges()` to test the updates. As an option, `autoApplyChanges` continuously flushes the queue in the background.

__Type:__ `boolean`<br />
__Default:__ `false`

##### `attachStyles`

By default, styles are not attached to the DOM and they are not reflected in the serialized HTML. Setting this option to `true` will include the component's styles in the serializable output.

__Type:__ `boolean`<br />
__Default:__ `false`

#### Render Environment

The `render` method returns an environment object that provides certain utility helpers to manage the component's environment.

##### `flushAll`

After changes have been made to a component, such as an update to a property or attribute, the test page does not automatically apply the changes. To wait for, and apply the update, call `await flushAll()`

__Type:__ `() => void`

##### `unmount`

Removes the container element from the DOM.

__Type:__ `() => void`

##### `styles`

All styles defined by components.

__Type:__ `Record<string, string>`

##### `container`

Container element in which the template is being rendered.

__Type:__ `HTMLElement`

##### `$container`

The container element as a WebdriverIO element.

__Type:__ `WebdriverIO.Element`

##### `root`

The root component of the template.

__Type:__ `HTMLElement`

##### `$root`

The root component as a WebdriverIO element.

__Type:__ `WebdriverIO.Element`

### `waitForChanges`

Helper method to wait for the component to be ready.

```ts
import { render, waitForChanges } from '@wdio/browser-runner/stencil'
import { MyComponent } from './component.tsx'

const page = render({
    components: [MyComponent],
    html: '<my-component></my-component>'
})

expect(page.root.querySelector('div')).not.toBeDefined()
await waitForChanges()
expect(page.root.querySelector('div')).toBeDefined()
```

## Element Updates

If you define properties or states in your Stencil component you have to manage when these changes should be applied to the component to be re-rendered.


## Examples

You can find a full example of a WebdriverIO component test suite for Stencil in our [example repository](https://github.com/webdriverio/component-testing-examples/tree/main/stencil-component-starter).

