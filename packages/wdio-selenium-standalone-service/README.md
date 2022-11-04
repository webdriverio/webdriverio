WebdriverIO Selenium Standalone Service
=======================================

Handling the Selenium server is out of the scope of the actual WebdriverIO project. This service helps you to run Selenium seamlessly when running tests with the [WDIO testrunner](https://webdriver.io/guide/testrunner/gettingstarted). It uses the well-known [selenium-standalone](https://www.npmjs.com/package/selenium-standalone) NPM package that automatically sets up the standalone server and all required drivers for you.

__Note:__ If you use this service you don't need any other driver services (e.g. [wdio-chromedriver-service](https://www.npmjs.com/package/wdio-chromedriver-service)) anymore. All local browsers can be started using this service.

## Installation

Before starting make sure you have JDK installed.

The easiest way is to keep `@wdio/selenium-standalone-service` as a devDependency in your `package.json`.
You can do it by:

```sh
npm install @wdio/selenium-standalone-service --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here.](https://webdriver.io/docs/gettingstarted)

## Configuration

By default, ChromeDriver, Geckodriver and some other browser drivers based on the OS are available when installed on the user's system. To use the service you need to add `selenium-standalone` to your service array:

```js
/**
 * simplified mode (available since v6.11.0)
 * set `true` to use the version provided by `selenium-standalone`, 'latest' by default
*/
export const config = {
    // ...
    services: [
        ['selenium-standalone', { drivers: { firefox: '0.29.1', chrome: true, chromiumedge: 'latest' } }]
    ],
    // ...
};
```

Control browser driver installation/running separately.
```js
// wdio.conf.js
const drivers = {
    chrome: { version: '91.0.4472.101' }, // https://chromedriver.chromium.org/
    firefox: { version: '0.29.1' }, // https://github.com/mozilla/geckodriver/releases
    chromiumedge: { version: '85.0.564.70' } // https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/
}

export const config = {
    // ...
    services: [
        ['selenium-standalone', {
            logPath: 'logs',
            installArgs: { drivers }, // drivers to install
            args: { drivers } // drivers to use
        }]
    ],
    // ...
};
```

### Custom Configurations

By default the service starts on `localhost:4444` and ensures that all capabilities are able to connect to it. If you prefer to run on a different port please specify `port` as an option in your capabilities, e.g.:

```js
// wdio.conf.js
export const config = {
    // ...
    services: [
        ['selenium-standalone', {
            logPath: './temp',
            args: {
                version: "3.141.59",
                seleniumArgs: ['-host', '127.0.0.1','-port', '5555']
            },
        }]
    ],
    capabilities: [{
        browserName: 'chrome',
        port: 5555
    }, {
        browserName: 'firefox',
        port: 5555
    }, {
        browserName: 'MicrosoftEdge',
        port: 5555
    }]
    // ...
}
```

## Options

The following options can be added to the wdio.conf.js file.

### logPath
Path where all logs from the Selenium server should be stored.

Type: `String`

Default: `{}`

Example:
```js
logPath : './',
```

### [`args`](https://github.com/vvo/selenium-standalone/blob/HEAD/docs/API.md#seleniumstartopts)
Map of arguments for the Selenium server, passed directly to `Selenium.start()`.
Please note that latest drivers have to be installed, see `installArgs`.

Type: `Object`

Default: `{}`

Example:
```js
args: {
    version : "3.141.59",
    drivers : {
        chrome : {
            version : "91.0.4472.101",
            arch    : process.arch
        }
    }
},
```

### [`installArgs`](https://github.com/vvo/selenium-standalone/blob/HEAD/docs/API.md#seleniuminstallopts)
Map of arguments for the Selenium server, passed directly to `Selenium.install()`.

By default, versions will be installed based on what is set in the selenium-standalone package. The defaults can be overridden by specifying the versions.

Type: `Object`

Default: `{}`

Example:
```js
installArgs: {
    version : "3.141.59",
    baseURL : "https://github.com/SeleniumHQ/selenium/releases/download",
    drivers : {
        chrome : {
            version : "91.0.4472.101",
            arch    : process.arch,
            baseURL : "https://chromedriver.storage.googleapis.com"
        }
    }
},
```

### skipSeleniumInstall
Boolean for skipping `selenium-standalone` server install.

Type: `Boolean`

Default: `false`

----

For more information on WebdriverIO see the [homepage](https://webdriver.io).
