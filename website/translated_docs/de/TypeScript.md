---
id: typescript
title: TypeScript-Setup
---
Ähnlich wie beim Babel Setup können Sie einen [TypeScript](http://www.typescriptlang.org/) Compiler registrieren, um Ihre `.ts` Dateien in der "before" Hook Ihrer Konfigurationsdatei kompilieren zu lassen. You will need [ts-node](https://github.com/TypeStrong/ts-node) and [tsconfig-paths](https://github.com/dividab/tsconfig-paths) as the installed devDependencies.

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