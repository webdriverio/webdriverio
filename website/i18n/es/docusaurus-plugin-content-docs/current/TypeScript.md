---
id: typescript
title: Configuración de TypeScript
---

Puede escribir pruebas usando [TypeScript](http://www.typescriptlang.org) para completar automáticamente y escribir seguridad.

You will need [`tsx`](https://github.com/privatenumber/tsx) installed in `devDependencies`, via:

```bash npm2yarn
$ npm install tsx --save-dev
```

WebdriverIO detectará automáticamente si estas dependencias están instaladas y compilará su configuración y pruebas para usted. Ensure to have a `tsconfig.json` in the same directory as your WDIO config.

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

Si utiliza servicios que añaden comandos al ámbito del navegador, también necesita incluirlos en su `tsconfig.json`. Por ejemplo, si utiliza `@wdio/lighthouse-service` asegúrese de añadirlo a los `tipos` también, por ejemplo.:

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

// Here is an example where you might want to import the types directly
const remoteConfig: Options.WebdriverIO = {
    hostname: 'http://localhost',
    port: '4444' // Error: Type 'string' is not assignable to type 'number'.ts(2322)
    capabilities: {
        browserName: 'chrome'
    }
}

// For other cases, you can use the `WebdriverIO` namespace
export const config: WebdriverIO.Config = {
  ...remoteConfig
  // Other configs options
}
```

## Consejos y sugerencias

### Compilar & Lint

Estar totalmente seguro puede considerar seguir las mejores prácticas: compile su código con el compilador TypeScript (ejecute `tsc` o `npx tsc`) y tenga [eslint](https://www.npmjs.com/package/@typescript-eslint/eslint-plugin) ejecutándose en [gancho pre-commit](https://github.com/typicode/husky).
