WebdriverIO Sauce Service
=========================

> WebdriverIO service that provides a better integration into SauceLabs. It updates the job metadata ('name', 'passed', 'tags', 'public', 'build', 'custom-data') and runs Sauce Connect if desired.

## Installation

The easiest way is to keep `@wdio/sauce-service` as a devDependency in your `package.json`.

```json
{
  "devDependencies": {
    "@wdio/sauce-service": "^5.0.0"
  }
}
```

You can simple do it by:

```bash
npm install @wdio/sauce-service --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here.](https://webdriver.io/docs/gettingstarted.html)

## Configuration

In order to use the service you need to set `user` and `key` in your `wdio.conf.js` file. It will automatically
use Sauce Labs to run your integration tests. If you want to use [Sauce Connect](https://wiki.saucelabs.com/display/DOCS/Sauce+Connect+Proxy)
you just need to set `sauceConnect: true`.

```js
// wdio.conf.js
export.config = {
  // ...
  services: ['sauce'],
  user: process.env.SAUCE_USERNAME,
  key: process.env.SAUCE_ACCESS_KEY,
  sauceConnect: true,
  // ...
};
```

## Options

### user
Your Sauce Labs username.

Type: `String`

### key
Your Sauce Labs access key.

Type: `String`

### sauceConnect
If true it runs Sauce Connect and opens a secure connection between a Sauce Labs virtual machine running your browser tests.

Type: `Boolean`<br>
Default: `false`

### sauceConnectOpts
Apply Sauce Connect options (e.g. to change port number or logFile settings). See [this list](https://github.com/bermi/sauce-connect-launcher#advanced-usage) for more information.

Type: `Object`<br>
Default: `{}`
