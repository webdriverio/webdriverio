---
id: customservices
title: Custom Services
---

You can write your own custom service for the WDIO test runner to custom-fit your needs.

<dfn>Services</dfn> are add-ons that are created for reusable logic to simplify tests, manage your test suite, and integrate results. Services have access to all the same [`before`/`after` hooks](ConfigurationFile.md) available in the `wdio.conf.js`.

The basic construction of a custom service should look like this:

```js
export default class CustomService {
    onPrepare(config, capabilities) {
        // TODO: something before all workers launch
    }

    onWorkerStart(cid, caps, specs, args, execArgv) {
        // TODO: something before specific worker launch
    }

    onComplete(exitCode, config, capabilities) {
        // TODO: something after the workers shutdown
    },

    // custom service methods ...
}
```

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

### NPM

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

> **Note:** Services that are added by name behave slightly differently compared to your own imported services. Instead of the service handling all the hooks, as in the example above, the service needs to export a launcher that handles `onPrepare`, `onWorkerStart` and `onComplete`. The rest of the hooks will be handled by the service (the default export), as normal.
>
> Example:
>
> ```
> import Launcher from './launcher'
> import Service from './service'
>
> export default Service
> export const launcher = Launcher
> ```

We really appreciate every new plugin that could help other people run better tests! If you have created such a plugin, please create a Pull Request to our [configuration utility](https://github.com/webdriverio/webdriverio/blob/master/packages/wdio-cli/src/config.js#L20-L34) so that your package will be suggested whenever someone runs `wdio config`.
