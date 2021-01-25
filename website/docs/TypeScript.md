---
id: typescript
title: TypeScript Setup
---

You can write tests using [TypeScript](http://www.typescriptlang.org) to get autocompletion and type safety.

You will need [`typescript`](https://github.com/microsoft/TypeScript) and [`ts-node`](https://github.com/TypeStrong/ts-node) installed as `devDependencies`. WebdriverIO will automatically detect if these dependencies are installed and will compile your config and tests for you.

```bash npm2yarn
$ npm install typescript ts-node --save-dev
```

The minimum TypeScript version is 3.8.3.

## Framework Setup

And your `tsconfig.json` needs the following:

<Tabs
  defaultValue="sync"
  values={[
    {label: 'Sync Mode', value: 'sync'},
    {label: 'Async Mode', value: 'async'},
  ]
}>
<TabItem value="sync">

```json title="tsconfig.json"
{
    "compilerOptions": {
        "types": ["node", "webdriverio/sync"]
    }
}
```

</TabItem>
<TabItem value="async">

```json title="tsconfig.json"
{
    "compilerOptions": {
        "types": ["node", "webdriverio/async"]
    }
}
```

</TabItem>
</Tabs>

Please avoid importing `webdriverio` or `@wdio/sync` explicitly.
`WebdriverIO` and `WebDriver` types are accessible from anywhere once added to `types` in `tsconfig.json`.

## Framework types

Depending on the framework you use, you will need to add the types for that framework to your `tsconfig.json` types property, as well as install its type definitions. This is especially important if you want to have type support for the built-in assertion library [`expect-webdriverio`](https://www.npmjs.com/package/expect-webdriverio).

For instance, if you decide to use the Mocha framework, you need to install `@types/mocha` and add it like this to have all types globally available:

<Tabs
  defaultValue="mocha"
  values={[
    {label: 'Mocha', value: 'mocha'},
    {label: 'Jasmine', value: 'jasmine'},
    {label: 'Cucumber', value: 'cucumber'},
  ]
}>
<TabItem value="mocha">

```json title="tsconfig.json"
{
    "compilerOptions": {
        "types": ["node", "webdriverio", "@wdio/mocha-framework"]
    },
    "include": [
        "./test/**/*.ts"
    ]
}
```

</TabItem>
<TabItem value="jasmine">

```json title="tsconfig.json"
{
    "compilerOptions": {
        "types": ["node", "webdriverio", "@wdio/jasmine-framework"]
    },
    "include": [
        "./test/**/*.ts"
    ]
}
```

</TabItem>
<TabItem value="cucumber">

```json title="tsconfig.json"
{
    "compilerOptions": {
        "types": ["node", "webdriverio", "@wdio/cucumber-framework"]
    },
    "include": [
        "./test/**/*.ts"
    ]
}
```

</TabItem>
</Tabs>

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

```json title="tsconfig.json"
{
    "compilerOptions": { ... },
    "include": [
        "./test/**/*.ts",
        "./src/**/*.ts"
    ]
}
```

3. Add definitions for your commands according to your execution mode.

<Tabs
  defaultValue="sync"
  values={[
    {label: 'Sync', value: 'sync'},
    {label: 'Async', value: 'async'},
  ]
}>
<TabItem value="sync">

```typescript
declare namespace WebdriverIO {
    // adding command to `browser`
    interface Browser {
        browserCustomCommand: (arg) => void
    }
}
```

</TabItem>
<TabItem value="async">

```typescript
declare namespace WebdriverIO {
    // adding command to `$()`
    interface Element {
        // don't forget to wrap return values with Promise
        elementCustomCommand: (arg) => Promise<number>
    }
}
```

</TabItem>
</Tabs>

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
