---
id: typescript
title: TypeScript Setup
---

Similar to Babel setup, you can register [TypeScript](http://www.typescriptlang.org/) to compile your .ts files in your before hook of your config file. You will need [ts-node](https://github.com/TypeStrong/ts-node) as an installed devDependency.

```js
    before(function() {
        require('ts-node/register');
    }),
```

Similarly for mocha:

```js
    mochaOpts: {
        ui: 'bdd',
        compilers: ['ts:ts-node/register'],
        requires: ['./test/helpers/common.js']
    },
```
