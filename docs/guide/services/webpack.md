name: Webpack
category: services
tags: guide
index: 8
title: WebdriverIO - Webpack Service
---

WDIO Webpack Service
====================

This allows you to build your static assets through webpack before testing.

## Installation

The easiest way is to keep `wdio-webpack-service` as a devDependency in your `package.json`.

```json
{
  "devDependencies": {
    "wdio-webpack-service": "^1.0.0"
  }
}
```

You can simple do it by:

```bash
npm install wdio-webpack-service --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here.](http://webdriver.io/guide/getstarted/install.html)

## Configuration

In order to use the static server service you need to add `webpack` to your service array:

```js
// wdio.conf.js
export.config = {
  // ...
  services: ['webpack'],
  // ...
};
```

## Options

### webpackConfig (required)

The configuration for webpack to use in order to build the bundle. See [webpack's documentation](http://webpack.github.io/docs/configuration.html) for more information.

Type: `Object`

### webpackDriverConfig

This option lets you override some of the settings in you webpack config for the driver. You can use this to change things like where the files are placed. The configurations are merged using the [`webpack-merge`](https://github.com/survivejs/webpack-merge) project and the smart strategy.

Type: `Object`

### webpackLog

Debugging logs, will print mount points and requests. When `webpackLogs` is set to `true` it will print into the console. Otherwise a string will be treated as the log folder.

Type: `Boolean` or `String`
