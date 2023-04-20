---
id: customservices
title: Benutzerdefinierte Plugins
---

Sie können ihr eigenes benutzerdefiniertes Plugin für den WDIO-Testrunner schreiben, der auf Ihre Bedürfnisse zugeschnitten ist.

Services sind Add-Ons, die wiederverwendbare Logik erhalten, um Tests zu vereinfachen, Ihre Testsuite zu verwalten und mit Dritt-Anbieter zu integrieren. Dienste haben Zugriff auf dieselben [Hooks](/docs/configurationfile) die in `wdio.conf.js`verfügbar sind.

Es gibt zwei Arten von Services: ein Launcher-Service, der nur Zugriff auf die Hooks `onPrepare`, `onWorkerStart`, `onWorkerEnd` und `onComplete` hat, die nur einmal pro Testlauf ausgeführt werden, und ein Worker-Service, der Zugriff auf alle anderen Hooks hat und von jedem Worker ausgeführt wird. Beachten Sie, dass Sie (globale) Variablen nicht zwischen beiden Arten von Services gemeinsam nutzen können, da Worker-Dienste in einem anderen (Worker-)Prozess ausgeführt werden.

Ein Launcher-Dienst kann wie folgt definiert werden:

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

Wohingegen ein Worker-Service wie folgt aussehen sollte:

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

Es wird empfohlen, das Browser-Objekt über den übergebenen Parameter im Konstruktor zu speichern. Lastly expose both types of workers as following:

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
        private _config: Omit<Options.Testrunner, 'capabilities'>
    ) {
        // ...
    }

    // ...
}
```

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
