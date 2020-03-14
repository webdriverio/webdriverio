---
id: typescript
title: Настройка TypeScript
---

Как и Babel, вы можете подключить [TypeScript](http://www.typescriptlang.org/) для компилирования ваших .ts файлов в вашем before hook конфигурационного файла. Вам нужно чтобы [ts-node](https://github.com/TypeStrong/ts-node) и [tsconfig-path](https://github.com/dividab/tsconfig-paths) были установлены в devDependencies.

```js
    before: function() {
        require('ts-node/register');
    },
```

Аналогично для Mocha:

```js
    mochaOpts: {
        ui: 'bdd',
        compilers: [
            'ts-node/register',
            'tsconfig-paths/register'
        ]
    },
```

и:

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