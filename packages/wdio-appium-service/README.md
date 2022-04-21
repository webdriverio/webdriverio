WebdriverIO Appium Service
==========================

Handling the Appium server is out of scope of the actual WebdriverIO project. This service helps you to run the Appium server seamlessly when running tests with the [WDIO testrunner](https://webdriver.io/docs/clioptions). It starts the [Appium Server](http://appium.io/docs/en/about-appium/getting-started/index.html#starting-appium) in a child process.

## Installation

The easiest way is to keep `@wdio/appium-service` as a devDependency in your `package.json`, via:

```sh
npm install @wdio/appium-service --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here.](https://webdriver.io/docs/gettingstarted)

## Configuration

In order to use the service you need to add `appium` to your service array:

```js
// wdio.conf.js
exports.config
    // ...
    port: 4723, // default appium port
    services: ['appium'],
    // ...
};
```

## Options

The following options can be added to the wdio.conf.js file. To define options for the service you need to add the service to the `services` list in the following way:

```js
// wdio.conf.js
exports.config
    // ...
    port: 4723, // default appium port
    services: [
        ['appium', {
            // Appium service options here
            // ...
        }]
    ],
    // ...
};
```

### logPath
Path where all logs from the Appium server should be stored.

Type: `String`

Example:
```js
exports.config
    // ...
    services: [
        ['appium', {
            logPath : './'
        }]
    ],
    // ...
}
```

### command
To use your own installation of Appium, e.g. globally installed, specify the command which should be started.

Type: `String`

Example:
```js
exports.config
    // ...
    services: [
        ['appium', {
            command : 'appium'
        }]
    ],
    // ...
}
```

### args
Map of arguments for the Appium server, passed directly to `appium`.

See [the documentation](http://appium.io/docs/en/writing-running-appium/server-args/index.html) for possible arguments.
The arguments should be supplied in lower camel case, so `--pre-launch true` becomes `preLaunch: true` or passed as an array.

Type: `Object` or `Array`

Default: `{}`

Example:
```js
exports.config
    // ...
    services: [
        ['appium', {
            args: {
                // ...
                debugLogSpacing: true,
                platformName: 'iOS',
                // ...
            }
            // or
            // args: ['-p', '4722', '--relaxed-security', '--log-level', 'info:info']
        }]
    ],
    // ...
}
```

----

For more information on WebdriverIO see the [homepage](https://webdriver.io).
