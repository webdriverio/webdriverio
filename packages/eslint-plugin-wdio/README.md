# eslint-plugin-wdio

ESLint rules for [WebdriverIO](https://webdriver.io)

## Installation

You'll first need to install [ESLint](https://eslint.org):

```
$ npm i eslint --save-dev
```

Next, install `eslint-plugin-wdio`:

```
$ npm install eslint-plugin-wdio --save-dev
```

**Note:** If you installed ESLint globally (using the `-g` flag) then you must also install `eslint-plugin-wdio` globally.

## Recommended configuration

This plugin export a recommended configuration that enforce good practices.

To enable this configuration use the extends property in your .eslintrc config file:
```
{
  "plugins": [
    "wdio"
  ],
  "extends": "plugin:wdio/recommended"
}
```

See [ESLint documentation](https://eslint.org/docs/user-guide/configuring#extending-configuration-files) for more information about extending configuration files.
