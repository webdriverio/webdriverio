---
id: typescript
title: TypeScript-Setup
---

Ähnlich wie beim Babel Setup können Sie einen [TypeScript](http://www.typescriptlang.org/) Compiler registrieren, um Ihre `.ts` Dateien in der "before" Hook Ihrer Konfigurationsdatei kompilieren zu lassen. Sie benötigen [ts-node](https://github.com/TypeStrong/ts-node) und [tsconfig-Pfade](https://github.com/dividab/tsconfig-paths) als installierte devDependencies.

```js
    before: function() {
        require('ts-node/register');
    },
```

Ähnlich für Mocha:

```js
    mochaOpts: {
        ui: 'bdd',
        compilers: [
            'ts-node/register',
            'tsconfig-paths/register'
        ]
    },
```

und:

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