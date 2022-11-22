---
id: component-testing
title: Component Testing
---

With WebdriverIOs [Browser Runner](/docs/runner#browser-runner) you can run tests within an actual desktop or mobile browser while using WebdriverIO and the WebDriver protocol to automate and interact what gets rendered on the page. This approach has [many advantages](/docs/runner#browser-runner) compared to other test frameworks that only allow testing against [JSDOM](https://www.npmjs.com/package/jsdom).

## How does it Work?

The Browser Runner uses [Vite](https://vitejs.dev/) to render a test page and intialize a test framework to run your tests in the browser. Currently it only supports Mocha but Jasmine and Cucumber are [on the roadmap](https://github.com/orgs/webdriverio/projects/1). This allows to test any kind of components even for projects that don't use Vite.

The Vite server is started by the WebdriverIO testrunner and configured so that you can use all reporter and services as you used to for normal e2e tests. Furthermore initialises the runner a [`browser`](/docs/api/browser) instance within the global scope that allows you to access a subset of the [WebdriverIO API](/docs/api).

## Setup

To set-up WebdriverIO for unit or component testing in the browser, initiate a new WebdriverIO project via:

```bash
npm init wdio@latest ./
# or
yarn create wdio ./
```

Once the configuration wizard starts, pick `browser` for running unit and component testing and choose one of the presets if desired otherwise go with _"Other"_ if you only want to run basic unit tests. You can also configure a custom Vite configuration if you use Vite already in your project. For more information check out all [runner options](/docs/runner#runner-options).

At the end of this process you should find a `wdio.conf.js` that contains various WebdriverIO configurations, including a `runner` property, e.g.:

```js
// wdio.conf.js
export const config = {
    // ...
    runner: ['browser', {
        // runner options
        preset: 'svelte' // setup WebdriverIOs Vite server for a Svelte project
    }]
}
```

By defining different [capabilities](http://localhost:3000/docs/configuration#capabilities) you can run your tests in different browser, in parallel if desired.

## Test Harness

It is totally up to you what you want to run in your tests and how you like to render the components. However we recommend to use the [Testing Library](https://testing-library.com/) as utility framework as it provides plugins for various of component frameworks, such as React, Preact, Svelte and Vue. It is very useful for rendering components into the test page and it automatically cleans up these components after every test.

You can mix Testing Library primitives with WebdriverIO commands as you wish, e.g.:

```ts
import { expect, $ } from '@wdio/globals'
import * as matchers from '@testing-library/jest-dom/matchers'
expect.extend(matchers)

import { render, fireEvent, screen } from '@testing-library/svelte'
import '@testing-library/jest-dom'

// see implementation here: examples/wdio/browser-runner/components/Component.svelte
import Component from './components/Component.svelte'

describe('Svelte Component Testing', () => {
    it('shows proper heading when rendered using Testing Library primitives', () => {
        render(Component, { name: 'World' })
        const heading = screen.getByText('Hello World!')
        expect(heading).toBeInTheDocument()
    })

    it('changes button text on click', async () => {
        render(Component, { name: 'World' })
        const button = await $('button')
        await button.click()
        await expect(button).toHaveText('Button Clicked')
    })
})
```

__Note:__ using render methods from Testing Library helps remove created components between the tests. If you don't use Testing Library ensure to attach your test components to a container that gets cleaned up between tests.

## Examples

You can find various examples for testing components using popular component frameworks in our [example repository](https://github.com/webdriverio/component-testing-examples).
