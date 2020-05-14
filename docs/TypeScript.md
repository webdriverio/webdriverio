---
id: typescript
title: TypeScript Setup
---

Similar to Babel setup, you can register [TypeScript](http://www.typescriptlang.org) to compile your `*.ts` files in the `before` hook of your config file. You will need [`ts-node`](https://github.com/TypeStrong/ts-node) and [`tsconfig-paths`](https://github.com/dividab/tsconfig-paths) installed as `devDependencies`.

The minimum TypeScript version is 3.7.3.

## Framework Setup

The following framework configurations need to be applied to set up TypeScript properly with WebdriverIO.

<!--DOCUSAURUS_CODE_TABS-->
<!--Mocha-->
```js
// wdio.conf.js
exports.config = {
    // ...
    mochaOpts: {
        ui: 'bdd',
        require: 'ts-node/register',
        compilers: [
            // optional
            'tsconfig-paths/register'
        ]
    },
    // ...
}
```
<!--Jasmine-->
```js
// wdio.conf.js
exports.config = {
    // ...
    jasmineNodeOpts: {
        requires: ['ts-node/register', 'tsconfig-paths/register']
    },
    // ...
}
```
<!--Cucumber-->
```js
// wdio.conf.js
exports.config = {
    // ...
    cucumberOpts: {
        requireModule: [
            'tsconfig-paths/register',
            () => { require('ts-node').register({ files: true }) },
        ],
        require: [/* support and step definitions files here */],
    },
    // ...
}
```
<!--END_DOCUSAURUS_CODE_TABS-->

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

Depending on the framework you use, you will need to add the types for that framework to your `tsconfig.json` types property, as well as install its type definitions. This is especially important if you want to have type support for the built-in assertion library [`expect-webdriverio`](https://www.npmjs.com/package/expect-webdriverio).

For instance, if you decide to use the Mocha framework, you need to install `@types/mocha` and add it like this to have all types globally available:

<!--DOCUSAURUS_CODE_TABS-->
<!--Mocha-->
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
<!--Jasmine-->
```json
{
    "compilerOptions": {
        "baseUrl": ".",
        "paths": {
            "*": [ "./*" ],
            "src/*": ["./src/*"]
        },
        "types": ["node", "webdriverio", "@wdio/jasmine-framework"]
    },
    "include": [
        "./src/**/*.ts"
    ]
}
```
<!--Cucumber-->
```json
{
    "compilerOptions": {
        "baseUrl": ".",
        "paths": {
            "*": [ "./*" ],
            "src/*": ["./src/*"]
        },
        "types": ["node", "webdriverio", "@wdio/cucumber-framework"]
    },
    "include": [
        "./src/**/*.ts"
    ]
}
```
<!--END_DOCUSAURUS_CODE_TABS-->

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

3. Add definitions for your commands according to your execution mode.

<!--DOCUSAURUS_CODE_TABS-->
<!--Sync Mode-->
```typescript
declare module WebdriverIO {
    // adding command to `browser`
    interface Browser {
        browserCustomCommand: (arg) => void
    }
}
```
<!--Async Mode-->
```typescript
declare module WebdriverIO {
    // adding command to `$()`
    interface Element {
        // don't forget to wrap return values with Promise
        elementCustomCommand: (arg) => Promise<number>
    }
}
```
<!--END_DOCUSAURUS_CODE_TABS-->
