---
id: typescript
title: TypeScript Setup
---

You can write tests using [TypeScript](http://www.typescriptlang.org) to get autocompletion and type safety.

You will need [`typescript`](https://github.com/microsoft/TypeScript) and [`ts-node`](https://github.com/TypeStrong/ts-node) installed as `devDependencies`.

```
npm i typescript ts-node --save-dev
```

The minimum TypeScript version is 3.7.3.

## Framework Setup

And your `tsconfig.json` needs the following:

```json
{
    "compilerOptions": {
        "types": ["node", "webdriverio"]
    },
    "include": [
        "./test/**/*.ts"
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

### Typed Configuration

We recommend using a typed configuration to prevent unexpected errors in the `wdio.conf`.
All you have to do is create a plain JS config file that registers TypeScript and requires the typed config:

```javascript
require('ts-node').register({ transpileOnly: true })
module.exports = require('./wdio.conf.ts')
```

And in your typed configuration file:

```typescript
import { Config } from 'webdriverio';

const config: Config = {
    // Put your webdriverio configuration here
}

export { config }
```

If you are using this approach for a typed configuration, you have to remove the line with 'ts-node/register' from your framework options in your config file.

### Non-typed configuration

If you still prefer to keep `wdio.conf` as a JavaScript file, the following framework configurations need to be applied to set up TypeScript properly with WebdriverIO.

<!--DOCUSAURUS_CODE_TABS-->
<!--Mocha-->
```js
// wdio.conf.js
exports.config = {
    // ...
    mochaOpts: {
        require: ['ts-node/register'],
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
        requires: ['ts-node/register']
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
            () => { require('ts-node').register({ transpileOnly: true }) },
        ],
        require: [/* support and step definitions files here */],
    },
    // ...
}
```
<!--END_DOCUSAURUS_CODE_TABS-->

## Framework types

Depending on the framework you use, you will need to add the types for that framework to your `tsconfig.json` types property, as well as install its type definitions. This is especially important if you want to have type support for the built-in assertion library [`expect-webdriverio`](https://www.npmjs.com/package/expect-webdriverio).

For instance, if you decide to use the Mocha framework, you need to install `@types/mocha` and add it like this to have all types globally available:

<!--DOCUSAURUS_CODE_TABS-->
<!--Mocha-->
```json
{
    "compilerOptions": {
        "types": ["node", "webdriverio", "@wdio/mocha-framework"]
    },
    "include": [
        "./test/**/*.ts"
    ]
}
```
<!--Jasmine-->
```json
{
    "compilerOptions": {
        "types": ["node", "webdriverio", "@wdio/jasmine-framework"]
    },
    "include": [
        "./test/**/*.ts"
    ]
}
```
<!--Cucumber-->
```json
{
    "compilerOptions": {
        "types": ["node", "webdriverio", "@wdio/cucumber-framework"]
    },
    "include": [
        "./test/**/*.ts"
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

1. Create a type definition file (e.g., `./src/types/wdio.d.ts`)
2. Make sure to include path in the `tsconfig.json`

```json
{
    "compilerOptions": { ... },
    "include": [
        "./test/**/*.ts",
        "./src/**/*.ts"
    ]
}
```

3. Add definitions for your commands according to your execution mode.

<!--DOCUSAURUS_CODE_TABS-->
<!--Sync Mode-->
```typescript
declare namespace WebdriverIO {
    // adding command to `browser`
    interface Browser {
        browserCustomCommand: (arg) => void
    }
}
```
<!--Async Mode-->
```typescript
declare namespace WebdriverIO {
    // adding command to `$()`
    interface Element {
        // don't forget to wrap return values with Promise
        elementCustomCommand: (arg) => Promise<number>
    }
}
```
<!--END_DOCUSAURUS_CODE_TABS-->

## Tips and Hints

### tsconfig.json example

```json
{
  "compilerOptions": {
    "outDir": "./.tsbuild/",
    "sourceMap": false,
    "target": "es2019",
    "module": "commonjs",
    "removeComments": true,
    "noImplicitAny": true,
    "strictPropertyInitialization": true,
    "strictNullChecks": true,
    "types": [
      "node",
      "@wdio/mocha-framework",
      "@wdio/sync"
    ],
  },
  "include": [
    "./test/**/*.ts"
  ]
}
```

### Compile & Lint

To be entirely safe, you may consider following the best practices: compile your code with TypeScript compiler (run `tsc` or `npx tsc`) and have [eslint](https://www.npmjs.com/package/@typescript-eslint/eslint-plugin) running on [pre-commit hook](https://github.com/typicode/husky).
