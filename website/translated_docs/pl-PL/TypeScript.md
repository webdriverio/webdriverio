---
id: typescript
title: Konfiguracja TypeScript
---

Podobnie jak przy konfiguracji Babela możesz zarejestrować [TypeScript](http://www.typescriptlang.org/)w twoim pliku konfiguracyjnym aby skompilować pliki .ts wywołaniu `before`. Będziesz potrzebować[ts-node](https://github.com/TypeStrong/ts-node) i [tsconfig-paths](https://github.com/dividab/tsconfig-paths) zainstalowanych jako devDependences.

```js
    before: function() {
        require('ts-node/register');
    },
```

Podobnie w konfiguracji dla mocha:

```js
    mochaOpts: {
        ui: 'bdd',
        compilers: [
            'ts-node/register',
            'tsconfig-paths/register'
        ]
    },
```

oraz:

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