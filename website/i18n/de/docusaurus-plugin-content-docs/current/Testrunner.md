---
id: testrunner
title: Testrunner
---

WebdriverIO wird mit einem eigenen Testrunner geliefert, damit Sie so schnell wie möglich mit dem Schreiben und Ausführen von Tests beginnen können. Es soll die ganze Arbeit für Sie erledigen, die Integration in Dienste von Drittanbietern ermöglichen und Ihnen helfen, Ihre Tests so effizient wie möglich durchzuführen.

Der Testrunner von WebdriverIO ist separat im NPM-Paket `@wdio/cli` gebündelt.

Installieren Sie es wie folgt:

```sh npm2yarn
npm install @wdio/cli
```

Um die Hilfe der Befehlszeilenschnittstelle anzuzeigen, geben Sie den folgenden Befehl in Ihr Terminal ein:

```sh
$ npx wdio --help

wdio <command>

Commands:
  wdio config                           Initialize WebdriverIO and setup configuration in
                                        your current project.
  wdio install <type> <name>            Add a `reporter`, `service`, or `framework` to
                                        your WebdriverIO project
  wdio repl <option> [capabilities]     Run WebDriver session in command line
  wdio run <configPath>                 Run your WDIO configuration file to initialize
                                        your tests.

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]
```

Großartig! Jetzt müssen Sie eine Konfigurationsdatei definieren, in der alle Informationen zu Ihren Tests, Fähigkeiten und Einstellungen festgelegt sind. Wechseln Sie zum Abschnitt [Konfigurationsdatei](configurationfile) , um zu sehen, wie diese Datei aussehen sollte.

Mit dem `wdio` Konfigurationshelfer ist es super einfach, Ihre Konfigurationsdatei zu generieren. Führen Sie einfach folgendes aus:

```sh
$ npx wdio config
```

... und es startet das Hilfsprogramm.

Es wird Ihnen Fragen stellen und in weniger als einer Minute eine Konfigurationsdatei für Sie generieren.

![WDIO-Konfigurationsprogramm](/img/config-utility.gif)

Sobald Sie Ihre Konfigurationsdatei eingerichtet haben, können Sie Ihre Tests starten, indem Sie Folgendes ausführen:

```sh
npx wdio run wdio.conf.js
```

Sie können Ihren Testlauf auch ohne den Befehl `run` initialisieren:

```sh
npx wdio wdio.conf.js
```

Das war's! Nun können Sie über die globale Variable `browser` auf die Browser-Instanz zugreifen.

## Befehle

### `wdio config`

Der Befehl `config` führt den WebdriverIO-Konfigurationshelfer aus. Dieser Helfer stellt Ihnen ein paar Fragen zu Ihrem WebdriverIO-Projekt und erstellt eine `wdio.conf.js` Datei basierend auf Ihren Antworten.

Beispiel:

```sh
wdio config
```

Optionen:

```
--help            prints WebdriverIO help menu                                [boolean]
--npm             Wether to install the packages using NPM instead of yarn    [boolean]
```

### `wdio run`

> Dies ist der Standardbefehl zum Ausführen Ihrer Konfiguration.

Der Befehl `run` initialisiert Ihre WebdriverIO-Konfigurationsdatei und führt Ihre Tests aus.

Beispiel:

```sh
wdio run ./wdio.conf.js --watch
```

Optionen:

```
--help                prints WebdriverIO help menu                   [boolean]
--version             prints WebdriverIO version                     [boolean]
--hostname, -h        automation driver host address                  [string]
--port, -p            automation driver port                          [number]
--user, -u            username if using a cloud service as automation backend
                                                                        [string]
--key, -k             corresponding access key to the user            [string]
--watch               watch specs for changes                        [boolean]
--logLevel, -l        level of logging verbosity
                            [choices: "trace", "debug", "info", "warn", "error", "silent"]
--bail                stop test runner after specific amount of tests have
                        failed                                          [number]
--baseUrl             shorten url command calls by setting a base url [string]
--waitforTimeout, -w  timeout for all waitForXXX commands             [number]
--framework, -f       defines the framework (Mocha, Jasmine or Cucumber) to
                        run the specs                                   [string]
--reporters, -r       reporters to print out the results on stdout     [array]
--suite               overwrites the specs attribute and runs the defined
                        suite                                            [array]
--spec                run only a certain spec file - overrides specs piped
                        from stdin                                       [array]
--exclude             exclude spec file(s) from a run - overrides specs piped
                        from stdin                                       [array]
--multi-run           Run one or more specs x amount of times            [number]
--mochaOpts           Mocha options
--jasmineOpts         Jasmine options
--cucumberOpts        Cucumber options
```

> Hinweis: Die Autokompilierung kann einfach mit den ENV-Variablen der entsprechenden Bibliothek gesteuert werden. Schauen Sie sich dazu die Dokumentation über die automatische Kompilierung von Tests, die auf den Seiten [TypeScript (ts-node)](typeScript) und [Babel (@babel/register)](babel) beschrieben ist.

### `wdio install`
Mit dem Befehl `install` können Sie Reporter und Dienste über die CLI zu Ihren WebdriverIO-Projekten hinzufügen.

Beispiel:

```sh
wdio install service sauce # installs @wdio/sauce-service
wdio install reporter dot # installs @wdio/dot-reporter
wdio install framework mocha # installs @wdio/mocha-framework
```

Wenn Sie die Pakete stattdessen mit `yarn` installieren möchten, können Sie den Parameter `--yarn` an den Befehl übergeben:

```sh
wdio install service sauce --yarn
```

Sie können auch einen benutzerdefinierten Konfigurationspfad übergeben, wenn sich Ihre WDIO-Konfigurationsdatei nicht in demselben Ordner befindet, an dem Sie gerade arbeiten:

```sh
wdio install service sauce --config="./path/to/wdio.conf.js"
```

#### Liste der unterstützten Dienste

```
sauce
testingbot
firefox-profile
devtools
browserstack
appium
intercept
zafira-listener
reportportal
docker
wiremock
lambdatest
vite
nuxt
```

#### Liste der unterstützten Reporter

```
dot
spec
junit
allure
sumologic
concise
reportportal
video
html
json
mochawesome
timeline
```

#### Liste der unterstützten Frameworks

```
mocha
jasmine
cucumber
```

### `wdio repl`

Der Befehl repl ermöglicht das Starten einer interaktiven Befehlszeilenschnittstelle zum Ausführen von WebdriverIO-Befehlen. Es kann zu Testzwecken oder zum schnellen Hochfahren der WebdriverIO-Sitzung verwendet werden.

Zum Beispiel: führen Sie Tests in lokalem Chrome aus:

```sh
wdio repl chrome
```

oder Tests auf Sauce Labs durchführen:

```sh
wdio repl chrome -u $SAUCE_USERNAME -k $SAUCE_ACCESS_KEY
```

Sie können die gleichen Argumente anwenden wie im [run-Befehl](#wdio-run).
