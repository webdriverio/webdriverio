---
id: customservices
title: Custom Services
---

You can write your own custom service for the WDIO test runner to custom-fit your needs.

<dfn>Services</dfn> are add-ons that are created for reusable logic to simplify tests, manage your test suite and integrate results. Services have access to all the same [hooks](ConfigurationFile.md) available in the `wdio.conf.js`.

There are two types of services that can be defined: a launcher service that only has access to the `onPrepare`, `onWorkerStart` and `onComplete` hook which are only executed once per test run, and a worker service that has access to all other hooks and is being executed for each worker. Note that you can not share (global) variables between both types of services as worker services run in a different (worker) process.

A launcher service can be defined as follows:

```js
export default class CustomLauncherService {
    // If a hook returns a promise, WebdriverIO will wait until that promise is resolved to continue.
    async onPrepare(config, capabilities) {
        // TODO: something before all workers launch
    }

    onComplete(exitCode, config, capabilities) {
        // TODO: something after the workers shutdown
    }

    // custom service methods ...
}
```

Whereas a worker service should look like this:

```js
export default class CustomWorkerService {
    /**
     * `serviceOptions` contains all options specific to the service
     * e.g. if defined as follows:
     *
     * ```
     * services: [['custom', { foo: 'bar' }]]
     * ```
     *
     * the `serviceOptions` parameter will be: `{ foo: 'bar' }`
     */
    constructor (serviceOptions, capabilities, config, browser) {
        this.browser = browser
    }

    before(config, capabilities) {
        // TODO: something before all tests are run, e.g.:
        this.browser.setWindowSize(1024, 768)
    }

    after(exitCode, config, capabilities) {
        // TODO: something after all tests are run
    }

    // other hooks or custom service methods ...
}
```

It is recommended to store the browser object through the passed in paramater in the constructor. Lastly expose both types of workers as following:

```js
import CustomLauncherService from './launcher'
import CustomWorkerService from './service'

export default CustomWorkerService
export const launcher = CustomLauncherService
```

## Service Error Handling

An Error thrown during a service hook will be logged while the runner continues. If a hook in your service is critical to the setup or teardown of the test runner, the `SevereServiceError` exposed from the `webdriverio` package can be used to stop the runner.

```js
// use `require` here to avoid type collision when using TypeScript
// and WebdriverIO in sync mode
const { SevereServiceError } = require('webdriverio')

export default class CustomServiceLauncher {
    async onPrepare(config, capabilities) {
        // TODO: something critical for setup before all workers launch

        throw new SevereServiceError('Something went wrong.')
    }

    // custom service methods ...
}
```

## Import Service from Module

The only thing to do now in order to use this service is to assign it to the `services` property.

Modify your `wdio.conf.js` file to look like this:

```js
import CustomService from './service/my.custom.service'

exports.config = {
    // ...
    services: [
        /**
         * use imported service class
         */
        [CustomService, {
            someOption: true
        }],
        /**
         * use absolute path to service
         */
        ['/path/to/service.js', {
            someOption: true
        }]
    ],
    // ...
}
```

## Publish Service on NPM

To make services easier to consume and discover by the WebdriverIO community, please follow these recommendations:

* Services should use this naming convention: `wdio-*-service`
* Use NPM keywords: `wdio-plugin`, `wdio-service`
* The `main` entry should `export` an instance of the service
* Example services: [`@wdio/sauce-service`](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-sauce-service)

Following the recommended naming pattern allows services to be added by name:

```js
// Add wdio-custom-service
exports.config = {
    // ...
    services: ['custom'],
    // ...
}
```

### Add Published Service to WDIO CLI and Docs

We really appreciate every new plugin that could help other people run better tests! If you have created such a plugin, please consider adding it to our CLI and docs to make it easier to be found.

Please raise a pull request with the following changes:

- add your service to the list of [supported services](https://github.com/webdriverio/webdriverio/blob/master/packages/wdio-cli/src/constants.ts#L83-L111)) in the CLI module
- enhance the [service list](https://github.com/webdriverio/webdriverio/blob/master/scripts/docs-generation/3rd-party/services.json) for adding your docs to the offical Webdriver.io page
