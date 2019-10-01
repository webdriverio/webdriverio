WebdriverIO Sauce Service
=========================

> WebdriverIO service that provides a better integration into SauceLabs. This service can be used for:
> - the Sauce Labs virtual machine cloud (desktop web and em/simulators) and can update the job metadata ('name', 'passed', 'tags', 'public', 'build', 'custom-data') and runs Sauce Connect if desired.
> - the Sauce Labs Real Device cloud (iOS and Android) and can **ONLY** update the job status to passed / failed

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

In order to use the service for the virtual machine and em/simulator cloud you need to set `user` and `key` in your `wdio.conf.js` file. It will automatically
use Sauce Labs to run your integration tests. If you want to use [Sauce Connect](https://wiki.saucelabs.com/display/DOCS/Sauce+Connect+Proxy)
you just need to set `sauceConnect: true`. If you would like to change data center to EU add `region:'eu'` as US data center is set as default (region only works on ^4.14.1 or ^5.0.0).

```js
// wdio.conf.js
export.config = {
  // ...
  services: ['sauce'],
  user: process.env.SAUCE_USERNAME,
  key: process.env.SAUCE_ACCESS_KEY,
  region: 'us',
  sauceConnect: true,
  // ...
};
```

If you want to use the Real Device cloud just pass the `testobject_api_key` in the capabilities like this:

```js
capabilities = [
  {
    deviceName: 'iPhone XS',
    // The api key that has a reference to the app-project in the RDC cloud
    testobject_api_key: process.env.SAUCE_RDC_ACCESS_KEY,
    // Some default settings
    // You can find more info in the TO Appium Basic Setup section
    platformName: 'iOS',
    platformVersion: '11.4'
  },
]
```

## Sauce Service Options

### sauceConnect
If true it runs Sauce Connect and opens a secure connection between a Sauce Labs virtual machine running your browser tests.

Type: `Boolean`<br>
Default: `false`

*(only for vm and or em/simulators)*

### sauceConnectOpts
Apply Sauce Connect options (e.g. to change port number or logFile settings). See [this list](https://github.com/bermi/sauce-connect-launcher#advanced-usage) for more information.

Type: `Object`<br>
Default: `{}`

*(only for vm and or em/simulators)*

### scRelay
Use Sauce Connect as a Selenium Relay. See more [here](https://wiki.saucelabs.com/display/DOCS/Using+the+Selenium+Relay+with+Sauce+Connect+Proxy).

Type: `Boolean`<br>
Default: `false`
