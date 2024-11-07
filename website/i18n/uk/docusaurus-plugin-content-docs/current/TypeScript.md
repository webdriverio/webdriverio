---
id: typescript
title: Налаштування TypeScript
---

Ви можете писати тести, використовуючи [TypeScript](http://www.typescriptlang.org) для автодоповнення та типізації.

You will need [`tsx`](https://github.com/privatenumber/tsx) installed in `devDependencies`, via:

```bash npm2yarn
$ npm install tsx --save-dev
```

WebdriverIO автоматично визначить, чи встановлено ці залежності, і скомпілює вашу конфігурацію та тести для вас. Ensure to have a `tsconfig.json` in the same directory as your WDIO config.

#### Custom TSConfig

If you need to set a different path for `tsconfig.json` please set the TSCONFIG_PATH environment variable with your desired path, or use wdio config's [tsConfigPath setting](/docs/configurationfile).

Alternatively, you can use the [environment variable](https://tsx.is/dev-api/node-cli#custom-tsconfig-json-path) for `tsx`.


#### Type Checking

Note that `tsx` does not support type-checking - if you wish to check your types then you will need to do this in a separate step with `tsc`.

## Framework Setup

Your `tsconfig.json` needs the following:

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

Якщо ви використовуєте сервіси, які додають команди до об'єкта браузера, вам також потрібно додати їх у свій `tsconfig.json`. Наприклад, якщо ви використовуєте `@wdio/lighthouse-service` переконайтеся, що ви додали його до `types`, як показано тут:

```json title="tsconfig.json"
{
    "compilerOptions": {
        "types": [
            "node",
            "@wdio/globals/types",
            "@wdio/mocha-framework",
            "@wdio/lighthouse-service"
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

## Поради та хитрощі

### Компіляція & та лінтинг

Щоб бути цілковито безпечним, дотримуватеся найкращих практик: копілюйте свій код за допомогою компілятора TypeScript (запустіть `tsc` або `npx tsc`) і перевіряйте його за допомогою [eslint](https://www.npmjs.com/package/@typescript-eslint/eslint-plugin) у [pre-commit хуці](https://github.com/typicode/husky).
