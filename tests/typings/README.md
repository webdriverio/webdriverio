Typings Validation
====================

Typings validations is used to ensure that typings files are not broken.
TypeScript compilation is used to do this kind of static analysis.

Tp run this validation, run the following command from the project root:

```sh
$ pnpm run test:typings
```

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
