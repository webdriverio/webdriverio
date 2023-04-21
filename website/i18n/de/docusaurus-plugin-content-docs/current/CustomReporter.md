---
id: customreporter
title: Benutzerdefinierter Reporter
---

Sie können Ihren eigenen benutzerdefinierten Reporter für den WDIO-Testrunner schreiben, der auf Ihre Bedürfnisse zugeschnitten ist. Und es ist einfach!

Alles, was Sie tun müssen, ist, ein Node.JS Modul zu erstellen, das vom Paket `@wdio/reporter` erbt, damit es Nachrichten vom Test empfangen kann.

Die Grundeinstellung sollte so aussehen:

```js
import WDIOReporter from '@wdio/reporter'

export default class CustomReporter extends WDIOReporter {
    constructor(options) {
        /*
         * make reporter to write to the output stream by default
         */
        options = Object.assign(options, { stdout: true })
        super(options)
    }

    onTestPass(test) {
        this.write(`Congratulations! Your test "${test.title}" passed 👏`)
    }
}
```

Um diesen Reporter zu verwenden, müssen Sie ihn lediglich der Eigenschaft `reporter` in Ihrer Konfiguration zuweisen.


Ihre `wdio.conf.js` -Datei sollte so aussehen:

```js
import CustomReporter from './reporter/my.custom.reporter'

export const config = {
    // ...
    reporters: [
        /**
         * use imported reporter class
         */
        [CustomReporter, {
            someOption: 'foobar'
        }]
        /**
         * use absolute path to reporter
         */
        ['/path/to/reporter.js', {
            someOption: 'foobar'
        }]
    ],
    // ...
}
```

Sie können den Reporter auch in NPM veröffentlichen, damit jeder ihn verwenden kann. Benennen Sie das Paket wie ähnlich wie andere Reporter, z.B.: `wdio-<reportername>-reporter` und taggen Sie es mit Schlüsselwörtern wie `wdio` oder `wdio-reporter`.

## Event-Handler

Sie können einen Ereignishandler für mehrere Ereignisse registrieren, die während des Testens ausgelöst werden. Alle folgenden Handler erhalten Payloads mit nützlichen Informationen über den aktuellen Status und Fortschritt.

Die Struktur dieser Payload-Objekte hängt vom Ereignis ab und ist über die Frameworks (Mocha, Jasmine und Cucumber) hinweg einheitlich. Sobald Sie einen benutzerdefinierten Reporter implementiert haben, sollte er für alle Frameworks funktionieren.

Die folgende Liste enthält alle möglichen Methoden, die Sie Ihrer Reporter-Klasse hinzufügen können:

```js
import WDIOReporter from '@wdio/reporter'

export default class CustomReporter extends WDIOReporter {
    onRunnerStart() {}
    onBeforeCommand() {}
    onAfterCommand() {}
    onSuiteStart() {}
    onHookStart() {}
    onHookEnd() {}
    onTestStart() {}
    onTestPass() {}
    onTestFail() {}
    onTestSkip() {}
    onTestEnd() {}
    onSuiteEnd() {}
    onRunnerEnd() {}
}
```

Die Methodennamen sind ziemlich selbsterklärend.

Um bei einem bestimmten Ereignis etwas auszugeben, verwenden Sie die Methode `this.write(...)`, die von der übergeordneten Klasse `WDIOReporter` bereitgestellt wird. Es streamt den Inhalt entweder an `stdout`oder an eine Log-Datei (abhängig von den Optionen des Reporters).

```js
import WDIOReporter from '@wdio/reporter'

export default class CustomReporter extends WDIOReporter {
    onTestPass(test) {
        this.write(`Congratulations! Your test "${test.title}" passed 👏`)
    }
}
```

Beachten Sie, dass Sie die Testausführung in keiner Weise verzögern können.

Alle Event-Handler sollten synchrone Routinen ausführen (sonst geraten Sie in Race-Conditions).

Sehen Sie sich auf jeden Fall den [Beispielabschnitt](https://github.com/webdriverio/webdriverio/tree/main/examples/wdio) an, in dem Sie einen benutzerdefinierten Beispielreporter finden, der den Ereignisnamen für jedes Ereignis druckt.

Wenn Sie einen benutzerdefinierten Reporter implementiert haben, der für die Community nützlich sein könnte, zögern Sie nicht, eine Pull-Request-Anfrage zu stellen, damit wir den Reporter der Öffentlichkeit zugänglich machen können!

Wenn Sie den WDIO-Testrunner über die `Launcher` -Schnittstelle ausführen, können Sie außerdem keinen benutzerdefinierten Reporter als Funktion wie folgt anwenden:

```js
import Launcher from '@wdio/cli'

import CustomReporter from './reporter/my.custom.reporter'

const launcher = new Launcher('/path/to/config.file.js', {
    // this will NOT work, because CustomReporter is not serializable
    reporters: ['dot', CustomReporter]
})
```

## Reporter Synchronisation

Wenn Ihr Reporter asynchrone Operationen ausführen muss, um die Log Daten zu bearbeiten (z. B. das Hochladen von Log-Daten oder anderen Assets), können Sie die Methode `isSynchronised` in Ihrem benutzerdefinierten Reporter überschreiben, damit der WebdriverIO-Runner warten kann, bis Sie alles verarbeitet ist. Ein Beispiel dafür ist in [`@wdio/sumologic-reporter`](https://github.com/webdriverio/webdriverio/blob/main/packages/wdio-sumologic-reporter/src/index.js)zu sehen:

```js
export default class SumoLogicReporter extends WDIOReporter {
    constructor (options) {
        // ...
        this.unsynced = []
        this.interval = setInterval(::this.sync, this.options.syncInterval)
        // ...
    }

    /**
     * overwrite isSynchronised method
     */
    get isSynchronised () {
        return this.unsynced.length === 0
    }

    /**
     * sync log files
     */
    sync () {
        // ...
        request({
            method: 'POST',
            uri: this.options.sourceAddress,
            body: logLines
        }, (err, resp) => {
            // ...
            /**
             * remove transferred logs from log bucket
             */
            this.unsynced.splice(0, MAX_LINES)
            // ...
        }
    }
}
```

Auf diese Weise wartet das Testframework, bis alle Log-Informationen hochgeladen sind.

## Veröffentlichen Sie Reporter auf NPM

Damit Reporter von der WebdriverIO-Community leichter genutzt und entdeckt werden kann, befolgen Sie bitte diese Empfehlungen:

* Services sollten diese Namenskonvention verwenden: `wdio-*-reporter`
* Verwenden Sie NPM-Schlüsselwörter: `wdio-plugin`, `wdio-reporter`
* Das Reporter Paket sollte eine Instanz des Reporters exportieren.
* Sie können sich an folgenden Beispiel Reporter orientieren: [`@wdio/dot-service`](https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-dot-reporter)

Das Befolgen der empfohlenen Namenskonvention ermöglicht das Hinzufügen von Diensten nach Namen, z.B. wenn sie einen `wdio-custom-reporter` veröffentlichen, kann dieser folgendermaßen eingerichtet werden:

```js
// Add wdio-custom-reporter
export const config = {
    // ...
    reporter: ['custom'],
    // ...
}
```

### Veröffentlichte Reporter zum WDIO CLI und der Dokumentation hinzufügen

Wir schätzen wirklich jedes neue Plugin, das anderen helfen könnte, bessere Tests durchzuführen! Wenn Sie ein solches Plugin erstellt haben, ziehen Sie bitte in Betracht, es zum CLI und der Dokumentation hinzuzufügen, damit es leichter gefunden werden kann.

Bitte stellen Sie einen Pull-Request mit den folgenden Änderungen:

- Fügen Sie Ihren Reporter zur Liste der [unterstützten Reporter](https://github.com/webdriverio/webdriverio/blob/main/packages/wdio-cli/src/constants.ts#L74-L91) im CLI-Modul hinzu
- Erweitern Sie die [Reporterliste](https://github.com/webdriverio/webdriverio/blob/main/scripts/docs-generation/3rd-party/reporters.json), um Ihre Dokumentation zur offiziellen Webdriver.io-Seite hinzuzufügen
