---
id: typescript
title: TypeScript Setup
---

Similar to Babel setup, you can register [TypeScript](http://www.typescriptlang.org) to compile your `*.ts` files in the `before` hook of your config file. You will need [`ts-node`](https://github.com/TypeStrong/ts-node) and [`tsconfig-paths`](https://github.com/dividab/tsconfig-paths) installed as `devDependencies`.

The minimum TypeScript version is 3.7.3.

## Framework Setup

The following framework configurations need to be applied to set up TypeScript properly with WebdriverIO.

### Mocha

```js
// wdio.conf.js
mochaOpts: {
    ui: 'bdd',
    require: 'ts-node/register',
    compilers: [
        // optional
        'tsconfig-paths/register'
    ]
},
```

### Jasmine

```js
// wdio.conf.js
jasmineNodeOpts: {
    requires: ['ts-node/register']
},
```

### Cucumber

```js
// wdio.conf.js
cucumberOpts: {
    requireModule: [
        'tsconfig-paths/register',
        () => { require('ts-node').register({ files: true }) },
    ],
    require: [/* support and step definitions files here */],
},
```

And your `tsconfig.json` needs the following:

```json
{
    "compilerOptions": {
        "baseUrl": ".",
        "paths": {
            "*": [ "./*" ],
            "src/*": ["./src/*"]
        },
        "types": ["node", "webdriverio"]
    },
    "include": [
        "./src/**/*.ts"
    ]
}
```

For sync mode (`@wdio/sync`), `webdriverio` types must be replaced with `@wdio/sync`:

```json
{
    "compilerOptions": {
        "types": ["node", "@wdio/sync"]
    }
}
```

Please avoid importing `webdriverio` or `@wdio/sync` explicitly.
`WebdriverIO` and `WebDriver` types are accessible from anywhere once added to `types` in `tsconfig.json`.

## Typed Configuration

You can even use a typed configuration if you desire.
All you have to do is create a plain JS config file that registers TypeScript and requires the typed config:

```javascript
require('ts-node/register')
module.exports = require('./wdio.conf')
```

And in your typed configuration file:

```typescript
const config: WebdriverIO.Config = {
    // Put your webdriverio configuration here
}

export { config }
```

## Framework types

Depending on the framework you use, you will need to add the types for that framework to your `tsconfig.json` types property.

For instance, if you decide to use the Mocha framework, you need to add it like this to have all types globally available:

```json
{
    "compilerOptions": {
        "baseUrl": ".",
        "paths": {
            "*": [ "./*" ],
            "src/*": ["./src/*"]
        },
        "types": ["node", "webdriverio", "@wdio/mocha-framework"]
    },
    "include": [
        "./src/**/*.ts"
    ]
}
```

Instead of having all type definitions globally available, you can also `import` only the types that you need, like this:

```typescript
/*
* These import the type definition for the `test` and `suite` variables that are available in
* the `beforeTest`, `afterTest`, `beforeSuite`, and `afterSuite` hooks.
*/
import { Suite, Test } from '@wdio/mocha-framework'
```

## Adding custom commands

With TypeScript, it's easy to extend WebdriverIO interfaces. Add types to your [custom commands](CustomCommands.md) like this:

1. Create types definition file (e.g., `./types/wdio.d.ts`)
2. Specify path to types in `tsconfig.json`

    ```json
    {
        "compilerOptions": {
            "typeRoots": ["./types"]
        }
    }
    ```

3. Add defintions for your commands according to your execution mode.

    **Sync mode**

    ```typescript
    declare module WebdriverIO {
        // adding command to `browser`
        interface Browser {
            browserCustomCommand: (arg) => void
        }
    }
    ```

    **Async mode**

    ```typescript
    declare module WebdriverIO {
        // adding command to `$()`
        interface Element {
            // don't forget to wrap return values with Promise
            elementCustomCommand: (arg) => Promise<number>
        }
    }
    ```
