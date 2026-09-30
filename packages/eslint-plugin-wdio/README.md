# eslint-plugin-wdio

ESLint rules for [WebdriverIO](https://webdriver.io)

## Installation

You'll first need to install [ESLint](https://eslint.org) 10:

```sh
npm i eslint --save-dev
```

Next, install `eslint-plugin-wdio`:

```sh
npm install eslint-plugin-wdio --save-dev
```

**Note:** If you installed ESLint globally (using the `-g` flag) then you must also install `eslint-plugin-wdio` globally.

## Recommended configuration

This plugin exports a flat config that enforces good practices. Add it to `eslint.config.mjs`:

```js
import { configs as wdioConfig } from "eslint-plugin-wdio";

export default [
    wdioConfig['flat/recommended'],
];
```

The eslintrc export `plugin:wdio/recommended` is gone. Flat config is the supported setup.

See [ESLint documentation](https://eslint.org/docs/latest/use/configure/configuration-files) for more information about extending configuration files.

## TypeScript Support

When `typescript-eslint` is installed, the recommended configuration automatically replaces `wdio/await-expect` with `wdio/no-floating-promise` for stricter, type-aware promise handling.

To enable this, install the required dependencies:

```sh
npm install --save-dev typescript typescript-eslint
```

By default, ESLint lints only `.js`, `.mjs` and `.cjs` files. Add a `files` pattern so that it also lints your TypeScript specs:

```js
import { configs as wdioConfig } from "eslint-plugin-wdio";

export default [
    { files: ['**/*.ts'], ...wdioConfig['flat/recommended'] },
];
```

`wdio/no-floating-promise` needs type information, so your spec files must be part of a `tsconfig.json`.

To also lint JavaScript files, such as `wdio.conf.js`, add them to the TypeScript project (`"allowJs": true` and the files in `include`), then widen the pattern:

```js
export default [
    { files: ['**/*.{js,mjs,cjs,ts,mts,cts}'], ...wdioConfig['flat/recommended'] },
];
```

If a matched file is not part of the TypeScript project, ESLint reports "was not found by the project service".

## List of supported rules


- [`wdio/await-expect`](./docs/rules/await-expect.md)

`expect` calls must be prefixed with an `await`

- [`wdio/no-debug`](./docs/rules/no-debug.md)

Don't allow `browser.debug()` statements

- [`wdio/no-pause`](./docs/rules/no-pause.md)

Don't allow `browser.pause(<number>)` statements

- [`wdio/no-floating-promise`](./docs/rules/no-floating-promise.md)

Check for unhandled promises
