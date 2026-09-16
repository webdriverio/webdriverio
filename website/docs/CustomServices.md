---
id: customservices
title: Custom Services
---

You can write your own custom service for the WDIO test runner to custom-fit your needs.

Services are add-ons that are created for reusable logic to simplify tests, manage your test suite and integrate results. Services have access to all the same [hooks](/docs/configurationfile) available in the `wdio.conf.js`.

There are two types of services that can be defined: a launcher service that only has access to the `onPrepare`, `onWorkerStart`, `onWorkerEnd` and `onComplete` hook which are only executed once per test run, and a worker service that has access to all other hooks and is being executed for each worker. Note that you can not share (global) variables between both types of services as worker services run in a different (worker) process.

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
    constructor (serviceOptions, capabilities, config) {
        this.options = serviceOptions
    }

    /**
     * this browser object is passed in here for the first time
     */
    async before(config, capabilities, browser) {
        this.browser = browser

        // TODO: something before all tests are run, e.g.:
        await this.browser.setWindowSize(1024, 768)
    }

    after(exitCode, config, capabilities) {
        // TODO: something after all tests are run
    }

    beforeTest(test, context) {
        // TODO: something before each Mocha/Jasmine test run
    }

    beforeScenario(test, context) {
        // TODO: something before each Cucumber scenario run
    }

    // other hooks or custom service methods ...
}
```

It is recommended to store the browser object through the passed in parameter in the constructor. Lastly expose both types of workers as following:

```js
import CustomLauncherService from './launcher'
import CustomWorkerService from './service'

export default CustomWorkerService
export const launcher = CustomLauncherService
```

If you are using TypeScript and want to make sure that hook methods parameter are type safe, you can define your service class as follows:

```ts
import type { Capabilities, Options, Services } from '@wdio/types'

export default class CustomWorkerService implements Services.ServiceInstance {
    constructor (
        private _options: MyServiceOptions,
        private _capabilities: Capabilities.RemoteCapability,
        private _config: WebdriverIO.Config,
    ) {
        // ...
    }

    // ...
}
```

## Conditional Worker Services

A service can decide whether its worker code is needed for a test run or for a particular worker. There are two optional checks:

| Check | Where it runs | Arguments | Effect of returning `false` |
| --- | --- | --- | --- |
| Named module export `shouldLoad` | Launcher process, after importing the service module | Configuration, all configured capabilities | The service module is not imported in any worker. Its launcher service still runs. |
| Static worker service method `shouldRun` | Worker process, before constructing the service | Service options, that worker's capabilities, configuration | The worker service is not constructed, so none of its hooks run in that worker. |

Use `shouldLoad(config, capabilities)` for service modules configured by name or path. This is a package-wide decision: if the same service appears more than once with different options, the result applies to all of those entries. For example, a custom service that requires remote credentials could export:

```js
// wdio-custom-service/index.js
import CustomLauncherService from './launcher.js'
import CustomWorkerService from './service.js'

export function shouldLoad(config, capabilities) {
    return Boolean(config.user && config.key)
}

export default CustomWorkerService
export const launcher = CustomLauncherService
```

Use `static shouldRun(options, capabilities, config)` to decide separately for each service entry and worker. It also works with custom service classes passed directly in `services`. For example, this service can restrict its hooks to a configured browser:

```js
// wdio-custom-service/service.js
export default class CustomWorkerService {
    static shouldRun(options, capabilities, config) {
        return !options.browserName || options.browserName === capabilities.browserName
    }

    before(capabilities, specs, browser) {
        // Runs only in workers that passed shouldRun.
    }
}
```

With `services: [['custom', { browserName: 'chrome' }]]`, this worker service is constructed only for Chrome capabilities, provided the package's `shouldLoad` check also allows it. The worker must import the service module to call `shouldRun`; returning `false` from this method does not prevent that import or affect the launcher service.

Both checks can return a boolean or a promise of a boolean. WebdriverIO awaits each result, and only `false` disables loading or construction. Services without these checks keep their existing behavior. Already constructed service objects containing hooks are unchanged.

If either check throws or rejects, service initialization fails with an error identifying the service. This differs from errors thrown by service hooks, described below.

## Service Error Handling

An Error thrown during a service hook will be logged while the runner continues. If a hook in your service is critical to the setup or teardown of the test runner, the `SevereServiceError` exposed from the `webdriverio` package can be used to stop the runner.

```js
import { SevereServiceError } from 'webdriverio'

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

export const config = {
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
* Example services: [`@wdio/sauce-service`](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-sauce-service)

Following the recommended naming pattern allows services to be added by name:

```js
// Add wdio-custom-service
export const config = {
    // ...
    services: ['custom'],
    // ...
}
```

### Add Published Service to WDIO CLI and Docs

We really appreciate every new plugin that could help other people run better tests! If you have created such a plugin, please consider adding it to our CLI and docs to make it easier to be found.

Please raise a pull request with the following changes:

- add your service to the list of [supported services](https://github.com/webdriverio/webdriverio/blob/main/packages/wdio-cli/src/constants.ts#L92-L128)) in the CLI module
- enhance the [service list](https://github.com/webdriverio/webdriverio/blob/main/scripts/docs-generation/3rd-party/services.json) for adding your docs to the official Webdriver.io page
