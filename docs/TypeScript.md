---
id: typescript
title: TypeScript Setup
---

Similar to Babel setup, you can register [TypeScript](http://www.typescriptlang.org/) to compile your .ts files in your before hook of your config file. You will need [ts-node](https://github.com/TypeStrong/ts-node) and [tsconfig-paths](https://github.com/dividab/tsconfig-paths) as the installed devDependencies.

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
