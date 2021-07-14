---
id: typescript
title: TypeScript Setup
---

Similar to Babel setup, you can register [TypeScript](http://www.typescriptlang.org/) to compile your .ts files in your before hook of your config file. You will need [ts-node](https://github.com/TypeStrong/ts-node) and [tsconfig-paths](https://github.com/dividab/tsconfig-paths) as the installed devDependencies.

```js
    before: function() {
        require('ts-node/register');
    },
```

Similarly for mocha:

```js
    mochaOpts: {
        ui: 'bdd',
        compilers: [
            'ts-node/register',
            'tsconfig-paths/register'
        ]
    },
```

and:

```json
    //tsconfig.json
    "compilerOptions": {
    "baseUrl": ".",
    "paths": {
            "*": [ "./*" ],
            "src/*": ["./src/*"]
        }
    },
    "include": [
        "./src/**/*.ts"
    ]
```