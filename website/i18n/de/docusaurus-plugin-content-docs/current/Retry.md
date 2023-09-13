---
id: retry
title: Fehlerhafte Tests Wiederholen
---

Sie können bestimmte Tests mit dem WebdriverIO-Testrunner wiederholen, die sich aufgrund von verschiedenen Faktoren, wie einem unbeständigen Netzwerk oder anderen Zufälligkeiten als instabil herausstellen. Es wird jedoch nicht empfohlen, die Wiederholungsrate einfach zu erhöhen, wenn Tests instabil werden!

## Wiederholen von Mocha Tests

In Mocha können Sie ganze Testsuiten erneut ausführen (alles innerhalb eines `describe` -Blocks). Wenn Sie Mocha verwenden, sollten Sie diesen Retry-Mechanismus der WebdriverIO-Implementierung vorziehen, die es Ihnen nur erlaubt, bestimmte Testblöcke (alles innerhalb eines `it` Blocks) erneut auszuführen. Um die Methode `this.retries()` zu verwenden, muss der Suite-Block `describe` als eine ungebundene Funktion `function(){}` statt einer Pfeil-Funktion `() => {}` geschrieben werde. So wird es in der  [Mocha-Dokumentation](https://mochajs.org/#arrow-functions) beschrieben. Mit Mocha können Sie auch einen Wiederholunglimit für alle Tests festlegen, indem Sie `mochaOpts.retries` in Ihrer `wdio.conf.js` angeben.

Hier ist ein Beispiel:

```js
describe('retries', function () {
    // Retry all tests in this suite up to 4 times
    this.retries(4)

    beforeEach(async () => {
        await browser.url('http://www.yahoo.com')
    })

    it('should succeed on the 3rd try', async function () {
        // Specify this test to only retry up to 2 times
        this.retries(2)
        console.log('run')
        await expect($('.foo')).toBeDisplayed()
    })
})
```

## Wiederholen von Jasmine oder Mocha Tests

Um einen bestimmten Testblock erneut auszuführen, können Sie einfach die Anzahl der Wiederholungen als letzten Parameter nach der Testblockfunktion anwenden:

<Tabs
  defaultValue="mocha"
  values={[
    {label: 'Mocha', value: 'mocha'},
 {label: 'Jasmine', value: 'jasmine'},
 ]
}>
<TabItem value="mocha">

```js
describe('my flaky app', () => {
    /**
     * spec that runs max 4 times (1 actual run + 3 reruns)
     */
    it('should rerun a test at least 3 times', async function () {
        console.log(this.wdioRetries) // returns number of retries
        // ...
    }, 3)
})
```

The same works for hooks too:

```js
describe('my flaky app', () => {
    /**
     * hook that runs max 2 times (1 actual run + 1 rerun)
     */
    beforeEach(async () => {
        // ...
    }, 1)

    // ...
})
```

</TabItem>
<TabItem value="jasmine">

```js
describe('my flaky app', () => {
    /**
     * spec that runs max 4 times (1 actual run + 3 reruns)
     */
    it('should rerun a test at least 3 times', async function () {
        console.log(this.wdioRetries) // returns number of retries
        // ...
    }, jasmine.DEFAULT_TIMEOUT_INTERVAL, 3)
})
```

The same works for hooks too:

```js
describe('my flaky app', () => {
    /**
     * hook that runs max 2 times (1 actual run + 1 rerun)
     */
    beforeEach(async () => {
        // ...
    }, jasmine.DEFAULT_TIMEOUT_INTERVAL, 1)

    // ...
})
```

Wenn Sie Jasmine verwenden, ist der zweite Parameter für Timeout reserviert. Um einen Wiederholungsparameter anzugeben, müssen Sie das Zeitlimit auf den Standardwert „jasmine.DEFAULT_TIMEOUT_INTERVAL“ setzen und dann Ihre Wiederholungsanzahl benennen.

</TabItem>
</Tabs>

Dieser Wiederholungsmechanismus erlaubt nur die Wiederholung einzelner Hooks oder Testblöcke. Wenn Ihr Test von einer Hook zum Einrichten Ihrer Anwendung begleitet wird, wird diese Hook nicht ausgeführt. [Mocha bietet](https://mochajs.org/#retry-tests) native Testwiederholungen, die dieses Verhalten bereitstellen, während Jasmine dies nicht tut. Sie können auf die Anzahl der ausgeführten Wiederholungen im Hook `afterTest` zugreifen.

## Wiederholung von Cucumber Tests

### Vollständige Suiten in Cucumber erneut ausführen

Für Cucumber >=6 können Sie die Konfigurationsoption [`retry`](https://github.com/cucumber/cucumber-js/blob/master/docs/cli.md#retry-failing-tests) zusammen mit einem optionalen Parameter `retryTagFilter` bereitstellen, damit alle oder einige Ihrer fehlgeschlagenen Szenarien wiederholt werden, bis sie erfolgreich sind. Damit diese Funktion funktioniert, müssen Sie den `scenarioLevelReporter` auf `true`setzen.

### Schrittdefinitionen in Cucumber erneut ausführen

Um die Anzahl der Wiederholungen für eine bestimmte Schrittdefinition zu definieren, wenden Sie einfach die Wiederholungsoption darauf an, wie zum Beispiel:

```js
export default function () {
    /**
     * step definition that runs max 3 times (1 actual run + 2 reruns)
     */
    this.Given(/^some step definition$/, { wrapperOptions: { retry: 2 } }, async () => {
        // ...
    })
    // ...
})
```

Wiederholungen können nur in Ihrer Test-Datei definiert werden, niemals in Ihrer Feature-Datei.

## Fügen Sie Wiederholungen pro Spezifikationsdatei hinzu

Zuvor waren nur Wiederholungsversuche auf Test- und Suite-Ebene verfügbar, was in den meisten Fällen in Ordnung ist.

Aber bei allen Tests, die einen Status beinhalten (wie auf einem Server oder in einer Datenbank), kann der Status nach dem ersten fehlgeschlagenen Test ungültig bleiben. Alle nachfolgenden Wiederholungsversuche haben aufgrund des ungültigen Status, mit dem sie beginnen würden, möglicherweise keine Chance zu bestehen.

Für jede Test-Datei wird eine neue `browser` Session erstellt, was dies zu einem idealen Ort macht, um alle anderen Zustände (Server, Datenbanken) zu verknüpfen und einzurichten. Wiederholungen auf dieser Ebene bedeuten, dass der gesamte Setup-Prozess einfach wiederholt wird, als ob es sich um eine neue Spezifikationsdatei handeln würde.

```js title="wdio.conf.js"
export const config = {
    // ...
    /**
     * The number of times to retry the entire specfile when it fails as a whole
     */
    specFileRetries: 1,
    /**
     * Delay in seconds between the spec file retry attempts
     */
    specFileRetriesDelay: 0,
    /**
     * Retried specfiles are inserted at the beginning of the queue and retried immediately
     */
    specFileRetriesDeferred: false
}
```

## Wiederholen spezifischer Tests

Dadurch soll verhindert werden, dass unzuverlässige Tests in eine Codebasis eingeführt werden. Durch Hinzufügen der Option `--multi-run` cli werden die angegebenen Tests oder Suiten x-mal ausgeführt. Bei Verwendung dieses CLI-Flags muss auch das Flag `--spec` oder `--suite` angegeben werden.

When adding new tests to a codebase, especially through a CI/CD process the tests could pass and get merged but become flaky later on. Diese Fehlerbeständigkeit kann von einer Reihe von Dingen wie Netzwerkproblemen, Serverlast, Datenbankgröße usw. erzeugt werden. Die Verwendung des Flags `--multi-run` in Ihrem CD/CD-Prozess kann dabei helfen, diese fehlerhaften Tests abzufangen, bevor sie zu einer Hauptcodebasis zusammengeführt werden.

One strategy to use is run your tests like regular in your CI/CD process but if you're introducing a new test you can then run another set of tests with the new spec specified in `--spec` along with `--multi-run` so it runs the new test x number of times. Wenn der Test in einem dieser Fälle fehlschlägt, muss der Test erst untersucht werden und stabiler gemacht werden.

```sh
# This will run the example.e2e.js spec 5 times
npx wdio run ./wdio.conf.js --spec example.e2e.js --multi-run 5
```
