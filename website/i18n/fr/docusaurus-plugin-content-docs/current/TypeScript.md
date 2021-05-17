---
id: typescript
title: TypeScript Setup
---

You can write tests using [TypeScript](http://www.typescriptlang.org) to get autocompletion and type safety.

You will need [`typescript`](https://github.com/microsoft/TypeScript) and [`ts-node`](https://github.com/TypeStrong/ts-node) installed as `devDependencies`. WebdriverIO will automatically detect if these dependencies are installed and will compile your config and tests for you. If you need to configure how ts-node runs please use the environment variables for [ts-node](TypeScript.md) or use wdio config's [autoCompileOpts section](ConfigurationFile.md).

```bash npm2yarn
$ npm install typescript ts-node --save-dev
```

The minimum TypeScript version is `v4.0.5`.

## Configuration

You can provide custom `ts-node` and `tsconfig-paths` options through your `wdio.conf.ts`, e.g.:

```ts title="wdio.conf.ts"
export const config = {
    // ...
    autoCompileOpts: {
        autoCompile: true,
        // see https://github.com/TypeStrong/ts-node#cli-and-programmatic-options
        // for all available options
        tsNodeOpts: {
            transpileOnly: true,
            project: 'tsconfig.json'
        },
        // tsconfig-paths is only used if "tsConfigPathsOpts" are provided, if you
        // do please make sure "tsconfig-paths" is installed as dependency
        tsConfigPathsOpts: {
            baseUrl: './'
        }
    }
}
```

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

Please avoid importing `webdriverio` or `@wdio/sync` explicitly. `WebdriverIO` and `WebDriver` types are accessible from anywhere once added to `types` in `tsconfig.json`. If you use additional WebdriverIO services, plugins or the `devtools` automation package, please also add them to the `types` list as many provide additional typings.

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
        "types": ["node", "webdriverio/sync", "@wdio/mocha-framework"]
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
        "types": ["node", "webdriverio/sync", "@wdio/jasmine-framework"]
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
        "types": ["node", "webdriverio/sync", "@wdio/cucumber-framework"]
    },
    "include": [
        "./test/**/*.ts"
    ]
}
```

</TabItem>
</Tabs>

## Services

If you use services that add commands to the browser scope you also need to include these into your `tsconfig.json`. For example if you use the `@wdio/devtools-service` ensure that you add it to the `types` as well, e.g.:

```json title="tsconfig.json"
{
    "compilerOptions": {
        "types": [
            "node",
            "webdriverio/sync",
            "@wdio/mocha-framework",
            "@wdio/devtools-service"
        ]
    },
    "include": [
        "./test/**/*.ts"
    ]
}
```

Adding services and reporters to your TypeScript config also strengthen the type safety of your WebdriverIO config file.

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
  defaultValue="modules"
  values={[
    {label: 'Modules (using import/export)', value: 'modules'},
 {label: 'Ambient Type Definitions', value: 'ambient'},
 ]
}>
<TabItem value="modules">

<Tabs
  defaultValue="sync"
  values={[
    {label: 'Sync', value: 'sync'},
 {label: 'Async', value: 'async'},
 ]
}>
<TabItem value="sync">

```typescript
declare global {
    namespace WebdriverIO {
        interface Browser {
            browserCustomCommand: (arg: any) => void
        }

        interface MultiRemoteBrowser {
            browserCustomCommand: (arg: any) => void
        }

        interface Element {
            elementCustomCommand: (arg: any) => number
        }
    }
}
```

</TabItem>
<TabItem value="async">

```typescript
declare global {
    namespace WebdriverIO {
        interface Browser {
            browserCustomCommand: (arg: any) => Promise<void>
        }

        interface MultiRemoteBrowser {
            browserCustomCommand: (arg: any) => Promise<void>
        }

        interface Element {
            elementCustomCommand: (arg: any) => Promise<number>
        }
    }
}
```

</TabItem>
</Tabs>

</TabItem>
<TabItem value="ambient">

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
    interface Browser {
        browserCustomCommand: (arg: any) => void
    }

    interface MultiRemoteBrowser {
        browserCustomCommand: (arg: any) => void
    }

    interface Element {
        elementCustomCommand: (arg: any) => number
    }
}
```

</TabItem>
<TabItem value="async">

```typescript
declare namespace WebdriverIO {
    interface Browser {
        browserCustomCommand: (arg: any) => Promise<void>
    }

    interface MultiRemoteBrowser {
        browserCustomCommand: (arg: any) => Promise<void>
    }

    interface Element {
        elementCustomCommand: (arg: any) => Promise<number>
    }
}
```

</TabItem>
</Tabs>

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
      "webdriverio/sync",
      "@wdio/mocha-framework"
    ],
  },
  "include": [
    "./test/**/*.ts"
  ]
}
```

### Compile & Lint

To be entirely safe, you may consider following the best practices: compile your code with TypeScript compiler (run `tsc` or `npx tsc`) and have [eslint](https://www.npmjs.com/package/@typescript-eslint/eslint-plugin) running on [pre-commit hook](https://github.com/typicode/husky).
