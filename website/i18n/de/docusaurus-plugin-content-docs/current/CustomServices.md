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

Es wird empfohlen, das Browser-Objekt über den übergebenen Parameter im Konstruktor zu speichern. Exportieren Sie dann beide Arten von Services wie folgt:

```js
import CustomLauncherService from './launcher'
import CustomWorkerService from './service'

export default CustomWorkerService
export const launcher = CustomLauncherService
```

Wenn Sie TypeScript verwenden und sicherstellen möchten, dass die Hook-Methodenparameter typsicher sind, können Sie Ihre Dienstklasse wie folgt definieren:

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

## Service Fehler Handhabung

Wenn in einer Ihrer Service Funktionen ein Fehler geworfen wird, wird dieser vom Runner nur geloggt und der Test weiter ausgeführt. Wenn ein Hook in Ihrem Service entscheidend für die Einrichtung oder den Abbau des Test-Runners ist, kann der `SevereServiceError`, der aus dem Paket `webdriverio` verfügbar gemacht wird, verwendet werden, um den Runner zu stoppen.

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

## Services Importieren

Um den Service nutzen zu können, müssen Sie ihn jetzt nur noch der Eigenschaft `services` in Ihrer `wdio.conf.js` zuweisen.

Ihre Konfigurations-Datei sollte so aussehen:

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

## Veröffentlichen Sie Service-Plugins auf NPM

Damit Services von der WebdriverIO-Community leichter genutzt und entdeckt werden kann, befolgen Sie bitte diese Empfehlungen:

* Services sollten diese Namenskonvention verwenden: `wdio-*-service`
* Verwenden Sie NPM-Schlüsselwörter: `wdio-plugin`, `wdio-service`
* Das Service Modul sollte eine Instanz des Services exportieren.
* Sie können sich an folgenden Beispiel Service orientieren: [`@wdio/sauce-service`](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-sauce-service)

Das Befolgen der empfohlenen Namenskonvention ermöglicht das Hinzufügen von Services nach Namen, z.B. wenn sie einen `wdio-custom-service` veröffentlichen, kann dieser folgendermaßen eingerichtet werden:

```js
// Add wdio-custom-service
export const config = {
    // ...
    services: ['custom'],
    // ...
}
```

### Veröffentlichte Service-Plugins zum WDIO CLI und der Dokumentation hinzufügen

Wir schätzen wirklich jedes neue Plugin, das anderen helfen könnte, bessere Tests durchzuführen! Wenn Sie ein solches Plugin erstellt haben, ziehen Sie bitte in Betracht, es zum CLI und der Dokumentation hinzuzufügen, damit es leichter gefunden werden kann.

Bitte stellen Sie einen Pull-Request mit den folgenden Änderungen:

- Fügen Sie Ihren Service zur Liste der [unterstützten Services](https://github.com/webdriverio/webdriverio/blob/main/packages/wdio-cli/src/constants.ts#L92-L128) im CLI-Modul hinzu
- Erweitern Sie die [Service Liste](https://github.com/webdriverio/webdriverio/blob/main/scripts/docs-generation/3rd-party/services.json), um Ihre Dokumentation zur offiziellen Webdriver.io-Seite hinzuzufügen
