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

This plugin export a recommended configuration that enforce good practices.

To enable this configuration use the extends property in your `.eslintrc` config file:

```json
{
    "plugins": ["wdio"],
    "extends": [
        "eslint:recommended",
        "plugin:wdio/recommended"
    ]
}
```

See [ESLint documentation](https://eslint.org/docs/user-guide/configuring#extending-configuration-files) for more information about extending configuration files.

## List of supported rules

| Rule | Description |
| :--- | :--- |
| [wdio/await-expect](docs/rules/await-expect.md) | `expect` calls must be prefixed with an `await` |
| [wdio/no-debug](docs/rules/no-debug.md) | Don't allow `browser.debug()` statements |
| [wdio/no-pause](docs/rules/no-pause.md) | Don't allow `browser.pause(<number>)` statements |
