WebdriverIO Selenium Standalone Service
=======================================

Handling the Selenium server is out of scope of the actual WebdriverIO project. This service helps you to run Selenium seamlessly when running tests with the [WDIO testrunner](https://webdriver.io/guide/testrunner/gettingstarted.html). It uses the well known [selenium-standalone](https://www.npmjs.com/package/selenium-standalone) NPM package that automatically sets up the standalone server and all required driver for you.

__Note:__ If you use this service you don't need any other driver services (e.g. [wdio-chromedriver-service](https://www.npmjs.com/package/wdio-chromedriver-service)) anymore. All local browser can be started using this service.

## Installation

Before starting make sure you have JDK installed.

The easiest way is to keep `@wdio/selenium-standalone-service` as a devDependency in your `package.json`.

```json
{
    "devDependencies": {
        "@wdio/selenium-standalone-service": "^5.0.0"
    }
}
```

You can simple do it by:

```bash
npm install @wdio/selenium-standalone-service --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here.](https://webdriver.io/docs/gettingstarted.html)

## Configuration

By default, Google Chrome and Firefox are available when installed on the host system. In order to use the service you need to add `selenium-standalone` to your service array:

```js
// wdio.conf.js
export.config = {
    // ...
    services: [
        ['selenium-standalone', {
            logPath: 'logs',
            installArgs: {
                drivers: {
                    chrome: { version: '79.0.3945.88' },
                    firefox: { version: '0.26.0' }
                }
            },
            args: {
                drivers: {
                    chrome: { version: '79.0.3945.88' },
                    firefox: { version: '0.26.0' }
                }
            },
        }]
    ],
    // ...
};
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

### [`args`](https://www.npmjs.com/package/selenium-standalone#seleniumstartopts-cb)
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
            version : "79.0.3945.88",
            arch    : process.arch,
        }
    }
},
```

### [`installArgs`](https://www.npmjs.com/package/selenium-standalone#seleniuminstallopts-cb)
Map of arguments for the Selenium server, passed directly to `Selenium.install()`.

By default, versions will be installed based on what is set in the selenium-standalone package. The defaults can be overridden by specifying the versions.

Type: `Object`

Default: `{}`

Example:
```js
installArgs: {
    version : "3.141.59",
    baseURL : "https://selenium-release.storage.googleapis.com",
    drivers : {
        chrome : {
            version : "77.0.3865.40",
            arch    : process.arch,
            baseURL : "https://chromedriver.storage.googleapis.com",
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
