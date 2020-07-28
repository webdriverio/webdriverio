---
id: customreporter
title: Benutzerdefinierte Reporter
---

Du kannst deinen eigenen Reporter für WebdriverIO schreiben, der deinen Bedürfnissen entspricht. Alles was getan werden muss ist ein neues Node.js Modul zu erstellen, welches von `@wdio/reporter` erbt, sodass es Nachrichten ordnungsgemäß erhalten kann. Die Grundkonstruktion sollte wie folgt aussehen:

```js
import WDIOReporter from '@wdio/reporter';

export default class CustomReporter extends WDIOReporter {
    constructor (options) {
        /**
         * make reporter to write to output stream by default
         */
        options = Object.assign(options, { stdout: true });
        super(options);
    }

    onTestPass (test) {
        this.write(`Congratulations! Your test "${test.title}" passed 👏`);
    }
};
```

Zum Schluss muss der Reporter nur noch in der Konfiguration gesetzt werden. Dafür sollte die `wdio.conf.js` folgendermaßen geändert werden:

```js
var CustomReporter = require('./reporter/my.custom.reporter');

exports.config = {
    // ...
    reporters: [[CustomReporter, {
        someOption: 'foobar'
    }]],
    // ...
};
```

Der Reporter can ebenfalls auf NPM veröffentlicht werden, so das ihn jeder benutzen kann. Der Name des NPM Paketes sollte, wie andere Reporter auch, das folgende Namen Muster haben: `wdio-<reportername>-reporter`. Um den Reporter dann einfacher zu finden, sollten Tags und Keywords wie `wdio` oder `wdio-reporter` verwendet werden.

## Ereignishandler

Ereignishändler können für verschiedene Events registriert werden. Diese erhalten dann Nachrichten mit nützlichen Informationen über den aktuellen Status des Tests. Die Struktur dieser Informationen hängen vom Event selber ab sind aber einheitlich unter den verschiedenen unterstützen Frameworks (Mocha, Jasmine, Cucumber). Ein Reporter sollte daher immer für all Frameworks gleich funktionieren. Die folgende Liste enthält alle möglichen Methoden-Events, die von der Reporter Klasse abgefangen werden können:

```js
import WDIOReporter from '@wdio/reporter';

export default class CustomReporter extends WDIOReporter {
    onRunnerStart () {}
    onBeforeCommand () {}
    onAfterCommand () {}
    onScreenshot () {}
    onSuiteStart () {}
    onHookStart () {}
    onHookEnd () {}
    onTestStart () {}
    onTestPass () {}
    onTestFail () {}
    onTestSkip () {}
    onTestEnd () {}
    onSuiteEnd () {}
    onRunnerEnd () {}
};
```

Die Methodennamen sollten selbsterklärend sein. Um etwas in einem bestimmten Event auszugeben sollte die `this.write(...)` Methode verwendet werden. Sie wird von der Elternklasse (`WDIOReporter`) implementiert. Dies erzeugt dann entweder den Text im StdOut oder schreibt es in eine Datei abhängig, wie der Reporter eingestellt ist.

```js
import WDIOReporter from '@wdio/reporter';

export default class CustomReporter extends WDIOReporter {
    onTestPass (test) {
        this.write(`Congratulations! Your test "${test.title}" passed 👏`);
    }
};
```

Beachte, dass in Reporter keine asynchronen Operationen durchgeführt werden sollten. Alle Ereignishandler sollten synchrone Operationen ausführen, um ungewollte Seiteneffekte zu vermeiden. Make sure you check out the [example section](https://github.com/webdriverio/webdriverio/tree/master/examples/wdio) where you can find an example for a custom reporter that prints the event name for each event. If you have implemented a custom reporter that can be useful for the community, don't hesitate to make a Pull Request so we can make the reporter available for the public.