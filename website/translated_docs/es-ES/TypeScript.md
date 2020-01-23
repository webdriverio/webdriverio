---
id: typescript
title: Configurar TypeScript
---

Similar a la configuración de Babel, puede registrar [TypeScript](http://www.typescriptlang.org/) para compilar sus archivos .ts en el "before" hook de su archivo de configuración. Necesitará [ts-node](https://github.com/TypeStrong/ts-node) y [tsconfig-paths](https://github.com/dividab/tsconfig-paths) como devDependencies instaladas.

```js
    before: function() {
      require('ts-node/register');
    },
```

Del mismo modo para mocha:

```js
    mochaOpts: {
        ui: 'bdd',
        compilers: [
            'ts-node/register',
            'tsconfig-paths/register'
        ]
    },
```

y:

```json
    //tsconfig.json
    "compilerOptions": {
    "baseUrl": ". ,
    "paths": {
            "*": [ ". *" ],
            "src/*": [". src/*"]
        }
    },
    "include": [
        ". src/**/*.ts"
    ]
```