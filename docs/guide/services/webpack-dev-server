name: Webpack Dev Server
category: services
tags: guide
index: 9
title: WebdriverIO - Webpack Dev Server Service
---

WDIO Webpack Dev Server Service
====================

This allows you to run a local server with your built static assets using Webpack Dev Server before testing.

## Installation

``bash
npm install wdio-webpack-dev-server-service --save-dev
```

## Configuration

This assumes you have:

- [set up WebdriverIO](https://webdriver.io/guide.html).
- [set up Webpack Dev Server](https://webpack.js.org/guides/development/#webpack-dev-server) - the example will use `webpack.dev.config.js` as the configuration file.

Add the Webpack Dev Server service to your WebdriverIO services list:

```js
// wdio.conf.js
export.config = {
  // ...
  services: ['webpack-dev-server'],
  // ...
};
```

Options are set directly on your WebdriverIO config as well, e.g.

```js
// wdio.conf.js
export.config = {
  // ...
  webpackConfig: require('webpack.dev.config.js'),
  webpackPort: 8080,
  // ...
};
```

## Options

### `webpackConfig`
Type: `String` | `Object`

Default: `webpack.config.js`

Either the absolute path to your Webpack configuration, or your actual Webpack configuration.

### `webpackPort`
Type: Number

Default: `8080`

The port the Dev Server should be run on. You'll want to set this same port in the `baseUrl` option of your WebdriverIO configuration.
