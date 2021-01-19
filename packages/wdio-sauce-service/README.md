WebdriverIO Sauce Service
=========================

> WebdriverIO service that provides a better integration into Sauce Labs. This service can be used for:
> - the Sauce Labs virtual machine cloud (desktop web and em/simulators) and can update the job metadata ('name'*, 'passed', 'tags', 'public', 'build', 'custom-data') and runs Sauce Connect if desired.
> - the Sauce Labs Real Device cloud (iOS and Android) and can **ONLY** update the job status to passed / failed

> - By default the Sauce Service will update the 'name' of the job when the job starts. This will give you the option to update the name at any given point in time.
> - The only time when you can't update the name of the job is when you execute a retry or a session reload.
> - The Sauce Service will also push the error stack of a failed test to the Sauce Labs commands tab

## Installation

The easiest way is to keep `@wdio/sauce-service` as a devDependency in your `package.json`.

```json
{
    "devDependencies": {
        "@wdio/sauce-service": "^6.3.6"
    }
}
```

You can simply do it by:

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

If you want WebdriverIO to automatically spin up a [Sauce Connect](https://wiki.saucelabs.com/display/DOCS/Sauce+Connect+Proxy) tunnel,
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

If you want to use an existing Sauce Connect tunnel you only need to provide, or the `tunnelIdentifier`, or if you are using a parent tunnel the `parentTunnel` into you capabilites like this:

<!--DOCUSAURUS_CODE_TABS-->
<!--Tunnel Identifier-->
```js
export.config = {
    // ...
    {
        browserName: 'chrome',
        platformName: 'Windows 10',
        browserVersion: 'latest',
        // Sauce options can be found here https://wiki.saucelabs.com/display/DOCS/Test+Configuration+Options
        'sauce:options': {
            tunnelIdentifier: 'YourTunnelName',

            // Example options
            build: 'your-build-name',
            screenResolution: '1600x1200',
            // ...
        },
    },
    // ...
};
```
<!--Parent Tunnel-->
```js
export.config = {
    // ...
    {
        browserName: 'chrome',
        platformName: 'Windows 10',
        browserVersion: 'latest',
        // Sauce options can be found here https://wiki.saucelabs.com/display/DOCS/Test+Configuration+Options
        'sauce:options': {
            tunnelIdentifier: 'ParentTunnelName',
            parentTunnel: '<username of parent>,

            // Example options
            build: 'your-build-name',
            screenResolution: '1600x1200',
            // ...
        },
    },
    // ...
};
```
<!--END_DOCUSAURUS_CODE_TABS-->

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

### maxErrorStackLength
This service will automatically push the error stack to Sauce Labs when a test fails. By default it will only push the first 5
lines, but if needed this can be changed. Be aware that more lines will result in more WebDriver calls which might slow down the execution.

Type: `number`<br>
Default: `5`

*(only for vm and or em/simulators)*

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

----

## Overriding generated name metadata
The service automatically generates a name for each test from the suite name, browser name and other information.

You can override this by providing a value for the `name` desired capability, but this will have the side effect of giving all tests the same name.

----

For more information on WebdriverIO see the [homepage](https://webdriver.io).
