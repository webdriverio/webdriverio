---
id: typescript
title: TypeScript Setup
---

Similar to Babel setup, you can register [TypeScript](http://www.typescriptlang.org/) to compile your .ts files in your before hook of your config file. You will need [ts-node](https://github.com/TypeStrong/ts-node) and [tsconfig-paths](https://github.com/dividab/tsconfig-paths) as the installed devDependencies.
Minimal TypeScript version is 3.2.1

```js
// wdio.conf.js
before: function() {
    require('ts-node').register({ files: true });
},
```

Similarly for mocha:

```js
// wdio.conf.js
mochaOpts: {
    ui: 'bdd',
    require: [
        'tsconfig-paths/register'
    ]
},
```

and your `tsconfig.json` needs to look like:

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

For sync mode (@wdio/sync) `webdriverio` types have to be replaced with `@wdio/sync`:

```json
{
    "compilerOptions": {
        "types": ["node", "@wdio/sync"]
    }
}
```

Please avoid importing webdriverio or @wdio/sync explicitly. `WebdriverIO` and `WebDriver` typings are accessible from anywhere once added to types in `tsconfig.json`.

You can even use a typed configuration if you desire.
All you have to do is create a plain js config file that registers typescript and requires the typed config:

```javascript
require("ts-node/register")
module.exports = require("wdio.conf.ts")
```

And in your typed configuration file:

```typescript
const config: WebdriverIO.Config = {
    // Put your webdriverio configuration here
}

export { config }
```

Depending on the framework you use, you will need to add the typings for that framework to your `tsconfig.json` types property.
For instance, if we decide to use the mocha framework, we need to add it like this to have all typings globally available:

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

Instead of having all type definitions globally available, you can also import only the typings that you need like this:

```typescript
/*
* These import the type definition for the `test` and `suite` variables that are available in
* the beforeTest, afterTest, beforeSuite and afterSuite hooks.
*/
import { Suite, Test } from "@wdio/mocha-framework"
```
