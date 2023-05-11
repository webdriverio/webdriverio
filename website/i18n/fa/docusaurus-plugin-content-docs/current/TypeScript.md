---
id: typescript
title: راه اندازی TypeScript
---

می‌توانید با استفاده از [TypeScript](http://www.typescriptlang.org) تست‌ها را برای تکمیل خودکار و امنیت نوع بنویسید.

شما به [`typescript`](https://github.com/microsoft/TypeScript) و [`ts-node`](https://github.com/TypeStrong/ts-node) به عنوان `devDependencies` نیاز دارید، از طریق:

```bash npm2yarn
$ npm install typescript ts-node --save-dev
```

WebdriverIO به طور خودکار تشخیص می دهد که آیا این وابستگی ها نصب شده اند و پیکربندی و تست های شما را برای شما کامپایل می کند. مطمئن شوید که فایل `tsconfig.json` در همان دایرکتوری با پیکربندی WDIO وجود دارد. If you need to configure how ts-node runs please use the environment variables for [ts-node](https://www.npmjs.com/package/ts-node#options) or use wdio config's [autoCompileOpts section](configurationfile) .

## Configuration

You can provide custom `ts-node` options through your `wdio.conf.ts`, e.g.:

```ts title="wdio.conf.ts"
export const config = {
    // ...
    autoCompileOpts: {
        autoCompile: true,
        // see https://github.com/TypeStrong/ts-node#cli-and-programmatic-options
        // for all available options
        tsNodeOpts: {
            transpileOnly: true,
            project: './tsconfig.json'
        }
    }
}
```

Or apply them through the environment:

```sh
# run wdio testrunner with custom tsconfig.json location
TS_NODE_PROJECT=./.config/tsconfig.json wdio run wdio.conf.ts
```

The minimum TypeScript version is `v4.0.5`.

## Framework Setup

And your `tsconfig.json` needs the following:

```json title="tsconfig.json"
{
    "compilerOptions": {
        "types": ["node", "@wdio/globals/types"]
    }
}
```

Please avoid importing `webdriverio` or `@wdio/sync` explicitly. `WebdriverIO` and `WebDriver` types are accessible from anywhere once added to `types` in `tsconfig.json`. If you use additional WebdriverIO services, plugins or the `devtools` automation package, please also add them to the `types` list as many provide additional typings.

## Framework Types

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
        "types": ["node", "@wdio/globals/types", "@wdio/mocha-framework"]
    }
}
```

</TabItem>
<TabItem value="jasmine">

```json title="tsconfig.json"
{
    "compilerOptions": {
        "types": ["node", "@wdio/globals/types", "@wdio/jasmine-framework"]
    }
}
```

</TabItem>
<TabItem value="cucumber">

```json title="tsconfig.json"
{
    "compilerOptions": {
        "types": ["node", "@wdio/globals/types", "@wdio/cucumber-framework"]
    }
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
            "@wdio/globals/types",
            "@wdio/mocha-framework",
            "@wdio/devtools-service"
        ]
    }
}
```

Adding services and reporters to your TypeScript config also strengthen the type safety of your WebdriverIO config file.

## Type Definitions

When running WebdriverIO commands all properties are usually typed so that you don't have to deal with importing additional types. However there are cases where you want to define variables upfront. To ensure that these are type safe you can use all types defined in the [`@wdio/types`](https://www.npmjs.com/package/@wdio/types) package. For example if you like to define the remote option for `webdriverio` you can do:

```ts
import type { Options } from '@wdio/types'

const config: Options.WebdriverIO = {
    hostname: 'http://localhost',
    port: '4444' // Error: Type 'string' is not assignable to type 'number'.ts(2322)
    capabilities: {
        browserName: 'chrome'
    }
}
```

## Tips and Hints

### Compile & Lint

To be entirely safe, you may consider following the best practices: compile your code with TypeScript compiler (run `tsc` or `npx tsc`) and have [eslint](https://www.npmjs.com/package/@typescript-eslint/eslint-plugin) running on [pre-commit hook](https://github.com/typicode/husky).
