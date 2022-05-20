Typings Validation
====================

Typings validations is used to ensure that typings files are not broken.
TypeScript compilation is used to do this kind of static analysis.

## Structure

- sync and webdriverio folders are TypeScript projects
- project/ tsconfig.json - TypeScript configuration file
- project/ sync.ts and async.ts - TypeScript files with usage of static and generated typings

## What errors can be caught?

- typings file is missing
- typings file is broken (ex: syntax error)
- invalid types for particular types (*), ex: `browser.execute`, `$('').click` and others defined by user.

(*) An approach followed to choose methods:

- check typings in both webdriverio and sync projects
- at least one type from each typings file
- at least one type from template file
- at least one type from specific-types.json file
- at least some generic types like `<T>(...) => T`
- check important chainable functions like `$('foo').$('bar')`

## Flow

1. `npm run generate:typings`
2. copy static and generated to sync and webdriverio (see **Copying process** below)
3. complile ts files inside sync and webdriverio
4. delete compiled JavaScript files

## Copying process

Typings should appear in node_modules folder, same as in real project. In order to achieve that typings are copied to package folders accordingly.

1. Delete `node_modules` folder in every project
2. Copy every typings and `package.json` file of package to `node_modules`, ex: `packages/wdio-types` to `node_modules/@wdio/types`, etc.
3. Copy referenced typings that are required by webdriverio typings
