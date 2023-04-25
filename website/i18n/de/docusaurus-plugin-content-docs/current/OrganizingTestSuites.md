---
id: organizingsuites
title: Testsuites Organisieren
---

Wenn Projekte wachsen, kommen zwangsläufig immer mehr Integrationstests hinzu. Dies erhöht die Bauzeit des Projektes und verlangsamt die Produktivität.

Um dies zu verhindern, sollten Sie Ihre Tests parallel ausführen. WebdriverIO testet bereits jede Test-Datei (oder _Feature-Datei_ in Cucumber) parallel innerhalb einer einzigen Sitzung. Versuchen Sie im Allgemeinen, nur ein einzelnes Feature pro Test-datei zu testen. Versuchen Sie, nicht zu viele aber auch nicht zu wenige Tests in einer Datei zu haben. (Allerdings gibt es hier keine goldene Regel.)

Sobald Sie Ihre Tests in mehreren Dateien definiert haben, sollten Sie mit der gleichzeitigen Ausführung Ihrer Tests beginnen. Passen Sie dazu die Eigenschaft `maxInstances` in Ihrer Konfigurationsdatei an. Mit WebdriverIO können Sie Ihre Tests mit maximaler Parallelität ausführen – das heißt, egal wie viele Dateien und Tests Sie haben, sie können alle parallel ausgeführt werden.  (Dies unterliegt immer noch bestimmten Einschränkungen, wie z. B. der CPU Ihres Computers usw.)

> Angenommen, Sie haben 3 verschiedene Capabilities definiert (z.B.: Chrome, Firefox und Safari) und Sie haben `maxInstances` auf `1` festgelegt. Der WDIO-Test-Runner erzeugt 3 Prozesse. Wenn Sie also 10 Spezifikationsdateien haben und `maxInstances` auf `10` setzen, werden _alle_ Test-Dateien gleichzeitig getestet und damit 30 Prozesse erzeugt.

Sie können die Eigenschaft `maxInstances` global definieren, um das Attribut für alle Browser festzulegen.

Wenn Sie Ihr eigenes WebDriver-Grid betreiben, können Sie möglicherweise mehr Kapazität für einen Browser haben als für einen anderen. In diesem Fall können Sie die `maxInstances` in Ihrem Capability-Objekt _begrenzen_:

```js
// wdio.conf.js
export const config = {
    // ...
    // set maxInstance for all browser
    maxInstances: 10,
    // ...
    capabilities: [{
        browserName: 'firefox'
    }, {
        // maxInstances can get overwritten per capability. So if you have an in-house WebDriver
        // grid with only 5 firefox instance available you can make sure that not more than
        // 5 instance gets started at a time.
        browserName: 'chrome'
    }],
    // ...
}
```

## Von der Hauptkonfigurationsdatei Erben

Wenn Sie Ihre Testsuite in mehreren Umgebungen ausführen (z.B. Entwicklungs- und Integration-Umgebung), kann es hilfreich sein, mehrere Konfigurationsdateien zu verwenden, um die Dinge überschaubar zu halten.

Ähnlich wie beim [Page-Objekt-Konzept](pageobjects) brauchen Sie als Erstes eine Hauptkonfigurationsdatei. Es enthält alle Konfigurationen, die Sie umgebungsübergreifend gemeinsam nutzen.

Erstellen Sie dann für jede Umgebung eine weitere Konfigurationsdatei und ergänzen Sie die Hauptkonfiguration mit den, die für die Umgebung wichtig sind:

```js
// wdio.dev.config.js
import { deepmerge } from 'deepmerge-ts'
import wdioConf from './wdio.conf.js'

// have main config file as default but overwrite environment specific information
export const config = deepmerge(wdioConf.config, {
    capabilities: [
        // more caps defined here
        // ...
    ],

    // run tests on sauce instead locally
    user: process.env.SAUCE_USERNAME,
    key: process.env.SAUCE_ACCESS_KEY,
    services: ['sauce']
}, { clone: false })

// add an additional reporter
config.reporters.push('allure')
```

## Gruppieren von Test-Dateien in Suiten

Sie können Test-Datein in Suiten gruppieren und einzelne spezifische Suiten anstelle von allen ausführen.

Definieren Sie zunächst Ihre Suiten in Ihrer WDIO-Konfiguration:

```js
// wdio.conf.js
export const config = {
    // define all tests
    specs: ['./test/specs/**/*.spec.js'],
    // ...
    // define specific suites
    suites: {
        login: [
            './test/specs/login.success.spec.js',
            './test/specs/login.failure.spec.js'
        ],
        otherFeature: [
            // ...
        ]
    },
    // ...
}
    // define specific suites
    suites: {
        login: [
            './test/specs/login.success.spec.js',
            './test/specs/login.failure.spec.js'
        ],
        otherFeature: [
            // ...
        ]
    },
    // ...
}
```

Wenn Sie jetzt nur eine einzelne Suite ausführen möchten, können Sie den Suite-Namen als CLI-Argument übergeben:

```sh
wdio wdio.conf.js --suite login
```

Oder führen Sie mehrere Suiten gleichzeitig aus:

```sh
wdio wdio.conf.js --suite login --suite otherFeature
```

## Gruppieren von Tests zur sequenziellen Ausführung

Wie oben beschrieben, gibt es Vorteile, wenn die Tests gleichzeitig ausgeführt werden.  Es gibt jedoch Fälle, in denen es vorteilhaft ist, Tests zu gruppieren, um sie sequenziell in einer Browser Session auszuführen.  Beispiele hierfür sind hauptsächlich dort, wo hohe Einrichtungskosten anfallen, z.B. das Transpilieren von Code oder das Bereitstellen von Cloud-Instanzen für die Umgebung unter Test. Aber es gibt auch erweiterte Nutzerszenarien, die von dieser Fähigkeit profitieren.

Um Tests zur Ausführung in einer einzigen Browser-Sitzung zu gruppieren, definieren Sie sie als Array innerhalb der Specs Definition.

```json
    "specs": [
        [
            "./test/specs/test_login.js",
            "./test/specs/test_product_order.js",
            "./test/specs/test_checkout.js"
        ],
        "./test/specs/test_b*.js",
    ],
```
Im obigen Beispiel werden die Tests „test_login.js“, „test_product_order.js“ und „test_checkout.js“ nacheinander in einer einzelnen Browser Sitzung ausgeführt, und jeder der „test_b*“-Tests wird gleichzeitig in einzelnen Browser Sitzungen ausgeführt.

Es ist auch möglich, in Suiten definierte Spezifikationen zu gruppieren, sodass Sie jetzt auch Suiten wie folgt definieren können:
```json
    "suites": {
        end2end: [
            [
                "./test/specs/test_login.js",
                "./test/specs/test_product_order.js",
                "./test/specs/test_checkout.js"
            ]
        ],
        allb: ["./test/specs/test_b*.js"]
},
```
und in diesem Fall würden alle Tests der "end2end"-Suite in einer einzigen Browser Sitzung ausgeführt.

Wenn Tests, die einem Glob Muster folgen ausgeführt werden, werden die Spezifikationsdateien in alphabetischer Reihenfolge ausgeführt

```json
  "suites": {
    end2end: ["./test/specs/test_*.js"]
  },
```

Dadurch werden die Dateien, die dem obigen Muster entsprechen, in der folgenden Reihenfolge ausgeführt:

```
  [
      "./test/specs/test_checkout.js",
      "./test/specs/test_login.js",
      "./test/specs/test_product_order.js"
  ]
```

## Ausgewählte Tests Ausführen

In einigen Fällen möchten Sie vielleicht nur einen einzelnen Test (oder eine Teilmenge von Tests) Ihrer Suiten ausführen.

Mit dem Parameter `--spec` können Sie angeben, welche _Suite_ (Mocha, Jasmine) oder _Feature_ (Cucumber) ausgeführt werden soll. Der Pfad wird relativ zu Ihrem aktuellen Arbeitsverzeichnis aufgelöst.

Zum Beispiel, um nur den Login-Test auszuführen:

```sh
wdio wdio.conf.js --spec ./test/specs/e2e/login.js
```

Oder führen Sie mehrere Tests gleichzeitig aus:

```sh
wdio wdio.conf.js --spec ./test/specs/signup.js --spec ./test/specs/forgot-password.js
```

Wenn der Wert `--spec` nicht auf eine bestimmte Test-Datei verweist, wird er stattdessen verwendet, um die in Ihrer Konfiguration definierten Spezifikationsdateinamen zu filtern.

Um alle Spezifikationen mit dem Wort „dialog“ in den Namen der Spezifikationsdateien auszuführen, könnten Sie Folgendes verwenden:

```sh
wdio wdio.conf.js --spec dialog
```

Beachten Sie, dass jede Testdatei in einem einzelnen Test-Runner-Prozess ausgeführt wird. Da WebdriverIO Dateien nicht im Voraus scant (Informationen zum Weiterleiten von Dateinamen an `wdio`finden Sie im nächsten Abschnitt), können Sie __ (zum Beispiel) `description.only` am Anfang Ihrer Spezifikationsdatei verwenden, um mit Mocha oder Jasmine nur diese Suite auszuführen.

Diese Funktion wird Ihnen helfen, dasselbe Ziel zu erreichen.

Wenn die Option `--spec` angegeben wird, überschreibt sie alle Muster, die durch den Parameter `specs` der Konfigurations- oder auf Capability-Ebene definiert sind.

## Ausgewählte Tests Ausschließen

Wenn Sie bei Bedarf bestimmte Test-Dateien von einer Ausführung ausschließen müssen, können Sie den Parameter `--exclude` verwenden.

Um beispielsweise Ihren Login-Test vom Testlauf auszuschließen:

```sh
wdio wdio.conf.js --exclude ./test/specs/e2e/login.js
```

Oder schließen Sie mehrere Test-Dateien gleichzeitig aus:

 ```sh
wdio wdio.conf.js --exclude ./test/specs/signup.js --exclude ./test/specs/forgot-password.js
```

Oder schließen Sie eine Test-Datei aus, wenn Sie mit einer Suite filtern:

```sh
wdio wdio.conf.js --suite login --exclude ./test/specs/e2e/login.js
```

Wenn die Option `--exclude` angegeben wird, überschreibt sie alle Muster, die durch den Parameter `Exclude` der Konfigurations- oder auf Capability-Ebene definiert sind.

## Ausführen von Suites und Test Datein

Führen Sie eine ganze Suite zusammen mit individuellen Tests aus:

```sh
wdio wdio.conf.js --suite login --spec ./test/specs/signup.js
```

## Ausführen von mehrere spezifische Tests

Manchmal ist es notwendig mehrere verschiedene Tests dynamisch anzugeben. Der `wdio` CLI Befehl von WebdriverIO akzeptiert das Angeben von Dateinamen via Pipe Befehl (von `find`, `grep`oder anderen).

Diese Dateinamen überschreiben die Liste der Globs oder Dateinamen, die in der `spec` -Liste der Konfiguration angegeben sind.

```sh
grep -r -l --include "*.js" "myText" | wdio wdio.conf.js
```

_**Hinweis:** Dies überschreibt_ nicht _den `--spec` Parameter zum Ausführen eines einzelnen Tests._

## Ausführen spezifischer Tests mit MochaOpts

Sie können auch angeben, welche spezifische `suite | describe` und/oder `it | test` Sie ausführen möchten, indem Sie ein Mocha-spezifisches Argument übergeben: `--mochaOpts.grep` als CLI Parameter.

```sh
wdio wdio.conf.js --mochaOpts.grep myText
wdio wdio.conf.js --mochaOpts.grep "Text with spaces"
```

_**Hinweis:** Mocha filtert die Tests, nachdem der WDIO-Test-Runner die Browser Sessions erstellt hat, sodass möglicherweise mehrere Browser erzeugt, aber nicht tatsächlich ausgeführt werden._

## Stoppen Sie den Testlauf nach einem Fehler

Mit der Option `bail` können Sie WebdriverIO anweisen, den Testlauf zu beenden, nachdem der erste Test fehlgeschlagen ist.

Dies ist bei großen Testsuiten hilfreich, wenn Sie bereits wissen, dass Ihr Build fehlschlägt, Sie aber das lange Warten auf einen vollständigen Testlauf vermeiden möchten.

Die Option `bail` erwartet eine Zahl, die angibt, wie viele Testfehler auftreten können, bevor WebdriverIO den gesamten Testlauf stoppt. Der Standardwert ist `0`, was bedeutet, dass immer alle Tests ausführt werden, auch wenn einer fehlschlägt.

Weitere Informationen zur bail Option finden Sie auf der [Options](configuration) Seite.
## Hierarchie der Ausführungsoptionen

Bei der Deklaration, welche Tests ausgeführt werden sollen, gibt es eine bestimmte Hierarchie, die definiert, welcher Parameter Typ Vorrang hat. Derzeit ist es wie folgt definiert, von der höchsten Priorität zur niedrigsten:

> CLI `--spec` Argument > Capability `specs` pattern > config `specs` pattern CLI `--exclude` argument > config `exclude` pattern > capability `exclude` pattern

Wenn nur der Konfigurationsparameter angegeben wird, wird er auf alle Capabilities angewendet. Wenn Sie das Muster jedoch auf der Capability-Ebene definieren, wird es anstelle des Konfigurationsmusters verwendet. Am Ende überschreibt jedes auf der Befehlszeile definierte Spec-Muster alle anderen angegebenen Muster.

### Verwenden von funktionsdefinierten Spezifikationsmustern

Wenn Sie ein Spezifikationsmuster auf der Capability Ebende definieren, überschreibt es alle auf der Konfigurationsebene definierten Muster. Dies ist nützlich, wenn Tests basierend auf unterschiedlichen Gerätefunktionen getrennt werden müssen. In solchen Fällen ist es sinnvoller, ein generisches Spezifikationsmuster auf der Konfigurationsebene und spezifischere Muster auf der Capability-Ebene zu verwenden.

Angenommen, Sie haben zwei Verzeichnisse, eines für Android-Tests und eines für iOS-Tests.

Ihre Konfigurationsdatei kann das Muster für unspezifische Gerätetests als solches definieren:

```js
{
    specs: ['tests/general/**/*.js']
}
```

und dann per Capability specizifische Geräte-gebundene Testspezifikationen verwenden:

```json
{
  "platformName": "Android",
  "specs": [
    "tests/android/**/*.js"
  ]
}
```

```json
{
  "platformName": "iOS",
  "specs": [
    "tests/ios/**/*.js"
  ]
}
```

Wenn Sie beide Capabilities in Ihrer Konfigurationsdatei verwenden, führt das Android-Gerät nur die Tests unter dem Namensraum „android“ aus, und die iOS-Tests führen nur Tests unter dem Namensraum „ios“ aus!

```js
//wdio.conf.js
export const config = {
    "specs": [
        "tests/general/**/*.js"
    ],
    "capabilities": [
        {
            platformName: "Android",
            specs: ["tests/android/**/*.js"],
            //...
        },
        {
            platformName: "iOS",
            specs: ["tests/ios/**/*.js"],
            //...
        },
        {
            platformName: "Chrome",
            //config level specs will be used
        }
    ]
}
```

