WebdriverIO Appium Service
==========================

Handling the Appium server is out of the scope of the actual WebdriverIO project. This service helps you to run the Appium server seamlessly when running tests with the [WDIO testrunner](https://webdriver.io/docs/clioptions). It starts the [Appium Server](https://appium.github.io/appium.io/docs/en/about-appium/getting-started/index.html#starting-appium) in a child process.

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
export const config = {
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
export const config = {
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
The path where all logs from the Appium server should be stored.

Type: `String`

Example:
```js
export const config = {
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
To use your installation of Appium, e.g. globally installed, specify the command which should be started.

Type: `String`

Example:
```js
export const config = {
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

See [the documentation](https://github.com/appium/appium/blob/master/packages/appium/docs/en/cli/args.md) for possible arguments.
The arguments are supplied in lower camel case. For instance, `debugLogSpacing: true` transforms into `--debug-log-spacing`, or they can be supplied as outlined in the Appium documentation.

Type: `Object`

Default: `{}`

Example:
```js
export const config = {
    // ...
    services: [
        ['appium', {
            args: {
                // ...
                debugLogSpacing: true,
                platformName: 'iOS'
                // ...
            }
        }]
    ],
    // ...
}
```
**Note:** The utilization of aliases is discouraged and unsupported. Instead, please use the full property name in lower camel case.

----

For more information on WebdriverIO see the [homepage](https://webdriver.io).
