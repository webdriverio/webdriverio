---
id: clioptions
title: WDIO CLI Optionen
---

WebdriverIO verfügt über einen eigenen Testrunner, um Ihnen dabei zu helfen, schnellstmöglich mit dem Testen zu beginnen. All die Arbeit, die vorher erforderlich war, um WebdriverIO mit einem Test Framework zu integrieren gehört der Vergangenheit an. Der WebdriverIO Testrunner tut nun all diese Arbeit für Sie und hilft dabei Ihre Tests so effizient wie möglich auszuführen.

Beginnend mit v5 von WebdriverIO wird der Testrunner als seperates NPM-Paket zusammengefasst und ist verfügbar unter dem Namen `@wdio/cli`. Um die Kommandozeilen-Schnittstelle zu sehen, geben Sie einfach den folgenden Befehl in Ihrem Terminal ein:

```sh
$ npm install @wdio/cli
$ ./node_modules/.bin/wdio --help

WebdriverIO CLI runner

Usage: wdio [options] [configFile]
Usage: wdio config
Usage: wdio repl <browserName>

config file defaults to wdio.conf.js
The [options] object will override values from the config file.
An optional list of spec files can be piped to wdio that will override
configured specs

Commands:
  wdio.js repl <browserName>  Run WebDriver session in command line

Options:
  --help                prints WebdriverIO help menu                   [boolean]
  --version             prints WebdriverIO version                     [boolean]
  --host, -h            automation driver host address                  [string]
  --port, -p            automation driver port                          [number]
  --user, -u            username if using a cloud service as automation backend
                                                                        [string]
  --key, -k             corresponding access key to the user            [string]
  --watch               watch specs for changes                        [boolean]
  --logLevel, -l        level of logging verbosity
                            [choices: "trace", "debug", "info", "warn", "error"]
  --bail                stop test runner after specific amount of tests have
```

Sehr gut! Nun müssen Sie eine Konfigurationsdatei erstellen, in der alle Informationen über Ihre Tests, Browser und Einstellungen definiert sind. Wechseln Sie zum Abschnitt [Konfigurationsdatei](ConfigurationFile.md) , um herauszufinden, wie diese Datei aussehen soll. Mit dem `wdio` Konfigurations-Helfer ist es super einfach Ihre Konfigurationsdatei zu generieren. Führen Sie folgenden Befehl in der Kommandozeile aus:

```sh
$ ./node_modules/.bin/wdio config
```

um das Hilfsprogramm zu starten. Es wird Ihnen Fragen stellen, abhängig von den Antworten, die Sie geben. Auf diese Weise können Sie Ihre Konfigurationsdatei in weniger als einer Minute generieren.

![WDIO configuration utility](/img/config-utility.gif)

Sobald Sie Ihre Konfigurationsdatei eingerichtet haben, können Sie Ihre E2E Tests mit dem folgenden Aufruf starten:

```sh
$ ./node_modules/.bin/wdio wdio.conf.js
```

Das wars! Jetzt können Sie über die globale Variable `browser` oder `driver` den Browser oder das Mobile Endgerät steuern.

## Den Testrunner Programmatisch Ausführen

Anstatt den wdio CLI Befehl zu nutzen, können Sie auch den Testrunner als Modul einbinden und Ihre Tests programmatisch ausführen. Dafür muss das Paket `@wdio/cli` als Modul folgendermaßen importiert werden:

```js
import Launcher from '@wdio/cli';
```

Danach erstellen Sie eine Instanz des Launchers und starten den Test. Die Launcher-Klasse erwartet als Parameter den Pfad zur Konfigurationsdatei und Parameter, die bestimmte Werte in der Konfiguration überschreiben sollen.

```js
const wdio = new Launcher('/path/to/my/wdio.conf.js', opts);
wdio.run().then((code) => {
    process.exit(code);
}, (error) => {
    console.error('Launcher failed to start the test', error.stacktrace);
    process.exit(1);
});
```

Der `run` Befehl gibt ein sog. [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) zurück, der aufgelöst wird, wenn der Test erfolgreich ausgeführt wurde oder fehlgeschlagen ist, wenn der Launcher die Tests nicht starten konnte.