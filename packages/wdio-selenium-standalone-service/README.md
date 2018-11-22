WebdriverIO Selenium Standalone Service
=======================================

Handling the Selenium server is out of scope of the actual WebdriverIO project. This service helps you to run Selenium seamlessly when running tests with the [WDIO testrunner](http://webdriver.io/docs/gettingstarted.html). It uses the well know [selenium-standalone](https://www.npmjs.com/package/selenium-standalone) NPM package that automatically sets up the standalone server and all required driver for you.

## Installation

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

Instructions on how to install `WebdriverIO` can be found [here.](http://webdriver.io/docs/gettingstarted.html)

## Configuration

By default, Google Chrome, Firefox and PhantomJS are available when installed on the host system. In order to use the service you need to add `selenium-standalone` to your service array:

```js
// wdio.conf.js
export.config = {
  // ...
  services: ['@wdio/selenium-standalone'],
  // ...
};
```

## Options

The following options can be added to the wdio.conf.js file.

### seleniumLogs
Path where all logs from the Selenium server should be stored.

Type: `String`

Default: `{}`

Example:
```js
seleniumLogs : "./",
```

### seleniumArgs
Map of arguments for the Selenium server, passed directly to `Selenium.start()`.

Type: `Object`

Default: `{}`

Example:
```js
seleniumArgs: {
  version : "3.9.1",
  drivers : {
    chrome : {
      version : "2.38",
      arch    : process.arch,
    }
  }
},
```

### seleniumInstallArgs
Map of arguments for the Selenium server, passed directly to `Selenium.install()`.

By default, versions will be installed based on what is set in the selenium-standalone package. The defaults can be overridden by specifying the versions.

Type: `Object`

Default: `{}`

Example:
```js
seleniumInstallArgs: {
  version : "3.9.1",
  baseURL : "https://selenium-release.storage.googleapis.com",
  drivers : {
    chrome : {
      version : "2.38",
      arch    : process.arch,
      baseURL : "https://chromedriver.storage.googleapis.com",
    }
  }
},
```

----

For more information on WebdriverIO see the [homepage](http://webdriver.io).
