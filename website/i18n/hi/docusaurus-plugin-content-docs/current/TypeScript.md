---
id: typescript
title: टाइपस्क्रिप्ट सेटअप
---

स्वत: पूर्णता और टाइप सुरक्षा प्राप्त करने के लिए आप [टाइपस्क्रिप्ट](http://www.typescriptlang.org) का उपयोग करके परीक्षण लिख सकते हैं।

You will need [`tsx`](https://github.com/privatenumber/tsx) installed in `devDependencies`, via:

```bash npm2yarn
$ npm install tsx --save-dev
```

WebdriverIO स्वचालित रूप से पता लगाएगा कि क्या ये निर्भरताएँ स्थापित हैं और आपके लिए आपके कॉन्फ़िगरेशन और परीक्षणों को संकलित करेगा। Ensure to have a `tsconfig.json` in the same directory as your WDIO config.

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

If you use services that add commands to the browser scope you also need to include these into your `tsconfig.json`. For example if you use the `@wdio/lighthouse-service` ensure that you add it to the `types` as well, e.g.:

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

## युक्तियाँ और संकेत

### संकलन & लिंट

पूरी तरह से सुरक्षित होने के लिए, आप सर्वोत्तम प्रथाओं का पालन करने पर विचार कर सकते हैं: अपने कोड को टाइपस्क्रिप्ट कंपाइलर ( `tsc` या `npx tsc`चलाएँ) के साथ संकलित करें और [प्री-कमिट हुक](https://github.com/typicode/husky)पर [एस्लिंट](https://www.npmjs.com/package/@typescript-eslint/eslint-plugin) चलाएँ।
