# eslint-plugin-wdio

ESLint rules for [WebdriverIO](https://webdriver.io)

## Installation

You'll first need to install [ESLint](https://eslint.org):

```sh
npm i eslint --save-dev
```

Next, install `eslint-plugin-wdio`:

```sh
npm install eslint-plugin-wdio --save-dev
```

**Note:** If you installed ESLint globally (using the `-g` flag) then you must also install `eslint-plugin-wdio` globally.

## Recommended configuration

This plugin exports a recommended configuration that enforces good practices.

### With ESLint v8 and below

To enable this configuration use the `extends` property in your `.eslintrc` config file:

```json
{
    "plugins": ["wdio"],
    "extends": [
        "eslint:recommended",
        "plugin:wdio/recommended"
    ]
}
```

### With ESLint v9 and Flat Config

If you are using the latest version of ESLint with the [flat configuration](https://eslint.org/docs/latest/use/configure/migration-guide), you can embed this plugin as follows:

```js
// eslint.config.mjs
import { configs as wdioConfig } from "eslint-plugin-wdio";

export default [
    wdioConfig['flat/recommended'],
];
```

See [ESLint documentation](https://eslint.org/docs/latest/use/configure/configuration-files) for more information about extending configuration files.

## TypeScript Support

When `typescript` and `@typescript-eslint/eslint-plugin` are detected, the recommended configuration automatically replaces `wdio/await-expect` with `wdio/no-floating-promise` for stricter, type-aware promise handling.

To enable this, install the required dependencies:

```sh
npm install --save-dev typescript @typescript-eslint/eslint-plugin
```

## List of supported rules


- [`wdio/await-expect`](./docs/rules/await-expect.md)

`expect` calls must be prefixed with an `await`

- [`wdio/no-debug`](./docs/rules/no-debug.md)

Don't allow `browser.debug()` statements

- [`wdio/no-pause`](./docs/rules/no-pause.md)

Don't allow `browser.pause(<number>)` statements

- [`wdio/no-floating-promise`](./docs/rules/no-floating-promise.md)

Check for unhandled promises
