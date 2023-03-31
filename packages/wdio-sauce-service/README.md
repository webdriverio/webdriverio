WebdriverIO Sauce Service
=========================

WebdriverIO service that provides a better integration into Sauce Labs. This service can be used for:

- the Sauce Labs Virtual Machine Cloud (Desktop Web/Emulator/Simulator)
- the Sauce Labs Real Device cloud (iOS and Android)

It can update the job metadata ('name'*, 'passed', 'tags', 'public', 'build', 'custom-data') and runs Sauce Connect if desired.

What else will this service do for you:

- By default the Sauce Service will update the 'name' of the job when the job starts. This will give you the option to update the name at any given point in time.
- You can define a `setJobName` parameter and customise the job name according to your capabilities, options and suite title
- The Sauce Service will also push the error stack of a failed test to the Sauce Labs commands tab
- It will allow you to automatically configure and spin up [Sauce Connect](https://wiki.saucelabs.com/display/DOCS/Sauce+Connect+Proxy)
- And it will set context points in your command list to identify which commands were executed in what test

## Installation

The easiest way is to keep `@wdio/sauce-service` as a devDependency in your `package.json`, via:

```sh
npm install @wdio/sauce-service --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here.](https://webdriver.io/docs/gettingstarted)

## Configuration

To use the service for the Virtual Desktop/Emulator/Simulator Machine and Real Device cloud you need to set `user` and `key` in your `wdio.conf.js` file. It will automatically use Sauce Labs to run your integration tests. If you run your tests on Sauce Labs you can specify the region you want to run your tests in via the `region` property. Available short handles for regions are `us` (default), `eu` and `apac`. These regions are used for the Sauce Labs VM cloud and the Sauce Labs Real Device Cloud. If you don't provide the region, it defaults to `us`.

If you want WebdriverIO to automatically spin up a [Sauce Connect](https://wiki.saucelabs.com/display/DOCS/Sauce+Connect+Proxy) tunnel, you need to set `sauceConnect: true`. If you would like to change the data center to EU add `region:'eu'` or APAC add `region:'apac'` as US data center is set as default.

```js
// wdio.conf.js
export const config = {
    // ...
    user: process.env.SAUCE_USERNAME,
    key: process.env.SAUCE_ACCESS_KEY,
    region: 'us', // or 'eu' or 'apac'
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

If you want to use an existing Sauce Connect tunnel you only need to provide a `tunnelIdentifier`, or if you are using a parent tunnel, include the `parentTunnel` in the capabilities like this:


<Tabs
  defaultValue="tunnelidentifier"
  values={[
    {label: 'Tunnel Identifier', value: 'tunnelidentifier'},
    {label: 'Parent Tunnel', value: 'parenttunnel'}
  ]
}>
<TabItem value="tunnelidentifier">

```js
export const config = {
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

</TabItem>
<TabItem value="parenttunnel">

```js
export const config = {
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

</TabItem>
</Tabs>
```

## Sauce Service Options

To authorize the Sauce Labs service your config needs to contain a [`user`](https://webdriver.io/docs/options#user) and [`key`](https://webdriver.io/docs/options#key) option.

### maxErrorStackLength
This service will automatically push the error stack to Sauce Labs when a test fails. By default, it will only push the first 5 lines, but if needed this can be changed. Be aware that more lines will result in more WebDriver calls which might slow down the execution.

Type: `number`<br />
Default: `5`

### sauceConnect
If `true` it runs Sauce Connect and opens a secure connection between a Sauce Labs virtual machine running your browser tests.

Type: `Boolean`<br />
Default: `false`

### sauceConnectOpts
Apply Sauce Connect options (e.g. to change port number or logFile settings). See [this list](https://wiki.saucelabs.com/display/DOCS/Sauce+Connect+Proxy+Command-Line+Quick+Reference+Guide) for more information. Per default, the service disables SC proxy auto-detection via `noAutodetect`` as this can be unreliable for some machines.

NOTE: When specifying the options the `--` should be omitted. It can also be turned into camelCase (e.g. `shared-tunnel` or `sharedTunnel`).

Type: `Object`<br />
Default: `{ noAutodetect: true }`

### uploadLogs

If `true` this option uploads all WebdriverIO log files to the Sauce Labs platform for further inspection. Make sure you have [`outputDir`](https://webdriver.io/docs/options#outputdir) set in your wdio config to write logs into files, otherwise data will be streamed to stdout and can't get uploaded.

Type: `Boolean`<br />
Default: `true`

### setJobName

Allows users to dynamically set the job name based on worker parameters such as WebdriverIO configuration, used capabilities and the original suite title.

Type: `Function`<br />
Default: `(config, capabilities, suiteTitle) => suiteTitle`

----

## Overriding generated name metadata
The service automatically generates a name for each test from the suite name, browser name and other information.

You can override this by providing a value for the `name` desired capability, but this will have the side effect of giving all tests the same name.

----

For more information on WebdriverIO see the [homepage](https://webdriver.io).
