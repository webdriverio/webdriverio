---
id: angular
title: Angular
description: "Mount an Angular component with TestBed, click it in Chrome with the WebdriverIO browser runner, and check that Angular updates the rendered output."
---

Use Angular's `TestBed` to render a standalone component on the browser runner's test page. The example below uses Angular 21, an inline template and Angular's just-in-time (JIT) compiler.

## Setup

Follow the [component testing setup](/docs/component-testing#setup) and select **Other** for the framework and **Mocha** for the test framework. The default browser runner can run this inline template without an Angular preset. For an existing Angular 21 project, match the compiler version to the version of `@angular/core` in your project.

```sh npm2yarn
npm install @angular/core@21 @angular/platform-browser@21 rxjs@7
npm install --save-dev @angular/compiler@21 typescript@~5.9.0 @types/mocha
```

Enable Angular's TypeScript decorators with `"experimentalDecorators": true` in your `tsconfig.json`. Add `"mocha"` and `"@wdio/globals/types"` to `compilerOptions.types` if your project specifies a list of types.

```ts title="wdio.conf.ts"
export const config: WebdriverIO.Config = {
    runner: 'browser',
    framework: 'mocha',
    mochaOpts: { ui: 'bdd' },
    logLevel: 'warn',
    specs: ['./src/**/*.test.ts'],
    capabilities: [{
        browserName: 'chrome',
        'goog:chromeOptions': { args: ['--headless=new'] }
    }]
}
```

## Test a component

This counter renders a signal's value in an output element. Clicking **Increment** changes the signal.

```ts title="src/counter.component.ts"
import { Component, signal } from '@angular/core'

@Component({
    selector: 'app-counter',
    template: `
        <button type="button" (click)="increment()">Increment</button>
        <output aria-label="Count">{{ count() }}</output>
    `
})
export class CounterComponent {
    readonly count = signal(0)

    increment() {
        this.count.update(value => value + 1)
    }
}
```

Load Angular's JIT compiler and initialize the browser testing environment once for this suite. After creating the fixture, wait for the initial render before interacting with its DOM. Reset the testing module after each test to destroy its fixtures.

```ts title="src/counter.component.test.ts"
import '@angular/compiler'
import { TestBed } from '@angular/core/testing'
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing'
import { $, expect } from '@wdio/globals'

import { CounterComponent } from './counter.component'

describe('Angular counter', () => {
    before(() => {
        TestBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting())
    })

    afterEach(() => {
        TestBed.resetTestingModule()
    })

    after(() => {
        TestBed.resetTestEnvironment()
    })

    it('increments when clicked', async () => {
        const fixture = TestBed.createComponent(CounterComponent)
        await fixture.whenStable()

        const count = $('output[aria-label="Count"]')
        await expect(count).toHaveText('0')
        await $('button=Increment').click()
        await expect(count).toHaveText('1')
    })
})
```

Run the spec from the project directory:

```sh
npx wdio run ./wdio.conf.ts
```

For components with `templateUrl`, external styles or an ahead-of-time build, configure your project's Angular compilation step to handle those resources. The [runnable example](https://github.com/webdriverio/component-testing-examples/tree/cb93d2168b0fd79d72f24211b6128c7041f404f7/angular-typescript-vite) includes the full configuration and lockfile for this inline-template setup.
