WDIO Logger Utility
===================

> A helper utility for logging of WebdriverIO packages

This package is used across all WebdriverIO packages to log information using the [`loglevel`](https://www.npmjs.com/package/loglevel) package. It can also be used for any other arbitrary Node.js project.

## Install

To install the package just call

```sh
$ npm install @wdio/logger
```

or when adding it to a WebdriverIO subpackage:

```sh
$ lerna add @wdio/logger --scope <subpackage>
```

## Usage

The package exposes a logger function that you can use to register an instance for your scoped package:

```js
import logger from '@wdio/logger'

const log = logger('myPackage')
log.info('some logs')
```

For more info see [`loglevel`](https://www.npmjs.com/package/loglevel) package on NPM.
