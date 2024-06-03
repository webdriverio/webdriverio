WebdriverIO BrowserStack Service
==========

> A WebdriverIO service that manages local tunnel and job metadata for BrowserStack users.

## Installation


The easiest way is to keep `@wdio/browserstack-service` as a devDependency in your `package.json`, via:

```sh
npm install @wdio/browserstack-service --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here.](https://webdriver.io/docs/gettingstarted)


## Configuration

WebdriverIO has BrowserStack support out of the box. You should set `user` and `key` in your `wdio.conf.js` file. This service plugin provides support for [BrowserStack Tunnel](https://www.browserstack.com/docs/automate/selenium/getting-started/nodejs/local-testing). Set `browserstackLocal: true` also to activate this feature.
Reporting of session status on BrowserStack will respect `strict` setting of Cucumber options.

```js
// wdio.conf.js
export const config = {
    // ...
    user: process.env.BROWSERSTACK_USERNAME,
    key: process.env.BROWSERSTACK_ACCESS_KEY,
    services: [
        ['browserstack', {
            testObservability: true,
            testObservabilityOptions: {
                projectName: "Your project name goes here",
                buildName: "The static build job name goes here e.g. Nightly regression"
            },
            browserstackLocal: true
        }]
    ],
    // ...
};
```

## Options

In order to authorize to the BrowserStack service your config needs to contain a [`user`](https://webdriver.io/docs/options#user) and [`key`](https://webdriver.io/docs/options#key) option.

### testObservability

Test Observability is an advanced test reporting tool that gives insights to improve your automation tests and helps you debug faster. It’s enabled by default by setting the testObservability​ flag as true for all users of browserstack-service. You can disable this by setting the testObservability​ flag to false.

Once your tests finish running, you can visit [Test Observability](https://observability.browserstack.com/?utm_source=webdriverio&utm_medium=partnered&utm_campaign=documentation) to debug your builds with additional insights like Unique Error Analysis, Automatic Flaky Test Detection, and more.

You can use Test Observability even if you don’t run your tests on the BrowserStack infrastructure. Even if you run your tests on a CI, a local machine, or even on other cloud service providers, Test Observability can still generate intelligent test reports and advanced analytics on your tests.

If you want to use Test Observability without running your tests on BrowserStack infrastructure, you can set your config as follows:


```js
// wdio.conf.js
export const config = {
    // ...
    services: [
        ['browserstack', {
            testObservability: true,
            testObservabilityOptions: {
                user: process.env.BROWSERSTACK_USERNAME,
                key: process.env.BROWSERSTACK_ACCESS_KEY,
                projectName: "Your project name goes here",
                buildName: "The static build job name goes here e.g. Nightly regression"
            }
        }]
    ],
    // ...
};
```

You can explore all the features of Test Observability in [this sandbox](https://observability-demo.browserstack.com/?utm_source=webdriverio&utm_medium=partnered&utm_campaign=documentation) or read more about it [here](https://www.browserstack.com/docs/test-observability/overview/what-is-test-observability?utm_source=webdriverio&utm_medium=partnered&utm_campaign=documentation).

### browserstackLocal
Set this to true to enable routing connections from BrowserStack cloud through your computer.

Type: `Boolean`<br />
Default: `false`

### forcedStop
Set this to true to kill the BrowserStack Local process on complete, without waiting for the BrowserStack Local stop callback to be called. This is experimental and should not be used by all. Mostly necessary as a workaround for [this issue](https://github.com/browserstack/browserstack-local-nodejs/issues/41).

Type: `Boolean`<br />
Default: `false`

### app

[Appium](https://appium.io/) set this with the app file path available locally on your machine to use the app as [application under test](https://www.browserstack.com/docs/app-automate/appium/set-up-tests/specify-app) for Appium sessions.

Type: `String` or `JsonObject`<br />
Default: `undefined`

List of available app values:

#### path
Use locally available app file path as an application under test for Appium.

```js
services: [
  ['browserstack', {
    app: '/path/to/local/app.apk'
    // OR
    app: {
      path: '/path/to/local/app.apk'
    }
  }]
]
```

Pass custom_id while the app upload.

```js
services: [
  ['browserstack', {
    app: {
      path: '/path/to/local/app.apk',
      custom_id: 'custom_id'
    }
  }]
]
```

#### id
Use the app URL returned after uploading the app to BrowserStack.

```js
services: [
  ['browserstack', {
    app: 'bs://<app-id>'
    // OR
    app: {
      id: 'bs://<app-id>'
    }
  }]
]
```

#### custom_id

use custom_id of already uploaded apps

```js
services: [
  ['browserstack', {
    app: 'custom_id'
    // OR
    app: {
      custom_id: 'custom_id'
    }
  }]
]
```

#### shareable_id

use shareable_id of already uploaded apps

```js
services: [
  ['browserstack', {
    app: 'username/custom_id'
    // OR
    app: {
      shareable_id: 'username/custom_id'
    }
  }]
]
```

### preferScenarioName

Cucumber only. Set the BrowserStack Automate session name to the Scenario name if only a single Scenario ran.
Useful when running in parallel with [wdio-cucumber-parallel-execution](https://github.com/SimitTomar/wdio-cucumber-parallel-execution).

Type: `Boolean`<br />
Default: `false`

### sessionNameFormat

Customize the BrowserStack Automate session name format.

Type: `Function`<br />
Default (Cucumber/Jasmine): `(config, capabilities, suiteTitle) => suiteTitle`<br />
Default (Mocha): `(config, capabilities, suiteTitle, testTitle) => suiteTitle + ' - ' + testTitle`

### sessionNameOmitTestTitle

Mocha only. Do not append the test title to the BrowserStack Automate session name.

Type: `Boolean`<br />
Default: `false`

### sessionNamePrependTopLevelSuiteTitle

Mocha only. Prepend the top level suite title to the BrowserStack Automate session name.

Type: `Boolean`<br />
Default: `false`

### setSessionName

Automatically set the BrowserStack Automate session name.

Type: `Boolean`<br />
Default: `true`

### setSessionStatus

Automatically set the BrowserStack Automate session status (passed/failed).

Type: `Boolean`<br />
Default: `true`

### buildIdentifier

**buildIdentifier** is a unique id to differentiate every execution that gets appended to buildName. Choose your buildIdentifier format from the available expressions:
* `BUILD_NUMBER`: Generates an incremental counter with every execution
* `DATE_TIME`: Generates a Timestamp with every execution. Eg. 05-Nov-19:30

```js
services: [
  ['browserstack', {
    buildIdentifier: '#${BUILD_NUMBER}'
  }]
]
```
Build Identifier supports usage of either or both expressions along with any other characters enabling custom formatting options.

### opts

BrowserStack Local options.

Type: `Object`<br />
Default: `{}`

List of available local testing modifiers to be passed as opts:

#### Local Identifier

If doing simultaneous multiple local testing connections, set this uniquely for different processes -

```js
opts = { localIdentifier: "randomstring" };
```

#### Verbose Logging

To enable verbose logging -

```js
opts = { verbose: "true" };
```

Note - Possible values for 'verbose' modifier are '1', '2', '3' and 'true'

#### Force Local

To route all traffic via local(your) machine -

```js
opts = { forceLocal: "true" };
```

#### Folder Testing

To test local folder rather internal server, provide path to folder as value of this option -

```js
opts = { f: "/my/awesome/folder" };
```

#### Force Start

To kill other running BrowserStack Local instances -

```js
opts = { force: "true" };
```

#### Only Automate

To disable local testing for Live and Screenshots, and enable only Automate -

```js
opts = { onlyAutomate: "true" };
```

#### Proxy

To use a proxy for local testing -

- proxyHost: Hostname/IP of proxy, remaining proxy options are ignored if this option is absent
- proxyPort: Port for the proxy, defaults to 3128 when -proxyHost is used
- proxyUser: Username for connecting to proxy (Basic Auth Only)
- proxyPass: Password for USERNAME, will be ignored if USERNAME is empty or not specified

```js
opts = {
  proxyHost: "127.0.0.1",
  proxyPort: "8000",
  proxyUser: "user",
  proxyPass: "password",
};
```

#### Local Proxy

To use local proxy in local testing -

- localProxyHost: Hostname/IP of proxy, remaining proxy options are ignored if this option is absent
- localProxyPort: Port for the proxy, defaults to 8081 when -localProxyHost is used
- localProxyUser: Username for connecting to proxy (Basic Auth Only)
- localProxyPass: Password for USERNAME, will be ignored if USERNAME is empty or not specified

```js
opts = {
  localProxyHost: "127.0.0.1",
  localProxyPort: "8000",
  localProxyUser: "user",
  localProxyPass: "password",
};
```

#### PAC (Proxy Auto-Configuration)

To use PAC (Proxy Auto-Configuration) in local testing -

- pac-file: PAC (Proxy Auto-Configuration) file’s absolute path

```js
opts = { "pac-file": "<pac_file_abs_path>" };
```

#### Binary Path

By default, BrowserStack local wrappers try downloading and executing the latest version of BrowserStack binary in ~/.browserstack or the present working directory or the tmp folder by order. But you can override these by passing the -binarypath argument.
Path to specify local Binary path -

```js
opts = { binarypath: "/path/to/binary" };
```

#### Logfile

To save the logs to the file while running with the '-v' argument, you can specify the path of the file. By default the logs are saved in the local.log file in the present woring directory.
To specify the path to file where the logs will be saved -

```js
opts = { verbose: "true", logFile: "./local.log" };
```

----

For more information on WebdriverIO see the [homepage](https://webdriver.io).
