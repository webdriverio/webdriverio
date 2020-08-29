WebdriverIO Sauce Service
=========================

> WebdriverIO service that provides a better integration into Sauce Labs. This service can be used for:
> - the Sauce Labs virtual machine cloud (desktop web and em/simulators) and can update the job metadata ('name', 'passed', 'tags', 'public', 'build', 'custom-data') and runs Sauce Connect if desired.
> - the Sauce Labs Real Device cloud (iOS and Android) and can **ONLY** update the job status to passed / failed

## Installation

The easiest way is to keep `@wdio/sauce-service` as a devDependency in your `package.json`.

```json
{
    "devDependencies": {
        "@wdio/sauce-service": "^6.3.6"
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
use Sauce Labs to run your integration tests.
If you run your tests on Sauce Labs you can specify the region you want to run your tests in via the `region` property.
Available short handles for regions are `us` (default) and `eu`. These regions are used for the Sauce Labs VM cloud and the Sauce Labs Real Device Cloud. If you don't provide the region, it defaults to `us`.

> NOTE:\
> By default the `ondemand.us-west-1.saucelabs.com` US endpoint will be used. This is the new Unified Platform endpoint. If you want to use the *old* endpoint then
> don't provide a region and add `hostname: ondemand.saucelabs.com` to your configuration file.

If you want to use [Sauce Connect](https://wiki.saucelabs.com/display/DOCS/Sauce+Connect+Proxy)
you just need to set `sauceConnect: true`. If you would like to change data center to EU add `region:'eu'` as US data center is set as default (region only works on ^4.14.1 or ^5.0.0).

```js
// wdio.conf.js
export.config = {
    // ...
    user: process.env.SAUCE_USERNAME,
    key: process.env.SAUCE_ACCESS_KEY,
    region: 'us',
    services: [
        ['sauce', {
            sauceConnect: true,
            sauceConnectOpts: {
                // ...
            }
        }]
    ],
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

In order to authorize to the Sauce Labs service your config needs to contain a [`user`](https://webdriver.io/docs/options.html#user) and [`key`](https://webdriver.io/docs/options.html#key) option.

### sauceConnect
If true it runs Sauce Connect and opens a secure connection between a Sauce Labs virtual machine running your browser tests.

Type: `Boolean`<br>
Default: `false`

*(only for vm and or em/simulators)*

### sauceConnectOpts
Apply Sauce Connect options (e.g. to change port number or logFile settings). See [this list](https://github.com/bermi/sauce-connect-launcher#advanced-usage) for more information. Per default the service disables SC proxy auto-detection as via `noAutodetect` as this can be unreliable for some machines.

Type: `Object`<br>
Default: `{ noAutodetect: true }`

*(only for vm and or em/simulators)*

### setJobNameInBeforeSuite
If true it updates the job name at the Sauce Labs job in the beforeSuite Hook. Attention: this comes at the cost of an additional call to Sauce Labs. The advantage of using this flag is the direct visibility of the job name in sauce labs also during the run time. This is especially useful for long running tests.

Type: `Boolean`<br>
Default: `false`

----

## Overriding generated name metadata
The service automatically generates a name for each test from the suite name, browser name and other information.

You can override this by providing a value for the `name` desired capability, but this will have the side effect of giving all tests the same name.

----

For more information on WebdriverIO see the [homepage](https://webdriver.io).
