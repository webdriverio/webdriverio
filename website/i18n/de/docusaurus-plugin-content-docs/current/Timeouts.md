---
id: timeouts
title: Timeouts
---

Jeder Befehl in WebdriverIO ist eine asynchrone Operation. Eine Anfrage wird an den WebDriver Backend, z.B. ein Selenium-Server (oder einen Cloud-Dienst wie [Sauce Labs](https://saucelabs.com)) gesendet, und seine Antwort enthält das Ergebnis, sobald die Aktion abgeschlossen oder fehlgeschlagen ist.

Daher ist Zeit eine entscheidende Komponente im gesamten Testprozess. Wenn eine bestimmte Aktion vom Ergebnis einer anderen Aktion abhängt, müssen Sie sicherstellen, dass sie die Befehle in der richtigen Reihenfolge ausgeführen. Timeouts spielen eine wichtige Rolle beim Umgang mit diesen Problemen.

## WebDriver Timeouts

### Session-Skript-Timeout

Eine Sitzung hat ein Zeitlimit für Skripts, das eine Wartezeit für die Ausführung asynchroner Skripts angibt. Wenn nicht anders angegeben, beträgt sie 30 Sekunden. Sie können dieses Timeout wie folgt festlegen:

```js
await browser.setTimeout({ 'script': 60000 })
await browser.executeAsync((done) => {
    console.log('this should not fail')
    setTimeout(done, 59000)
})
```

### Seitenlade-Timeout

Jede Sitzung hat ein Zeitlimit für das Laden von Web-Seiten. Wenn nicht anders angegeben, beträgt sie 30 Sekunden.

Sie können dieses Timeout wie folgt festlegen:

```js
await browser.setTimeout({ 'pageLoad': 10000 })
```

> Das Schlüsselwort `pageLoad` ist Teil der offiziellen WebDriver [-Spezifikation](https://www.w3.org/TR/webdriver/#set-timeouts), wird aber möglicherweise nicht [von Ihrem Browser unterstützt](https://github.com/seleniumhq/selenium-google-code-issue-archive/issues/687) (der vorherige Name lautet `page load`).

### Element-Timeout

Jede Sitzung ist ein implizites Warte-Timeout für das Finden von Elementen. Dies gibt die Zeit an, die auf die implizite Elementlokalisierungsstrategie gewartet werden soll, wenn Elemente mit den Befehlen [`findElement`](/docs/api/webdriver#findelement) oder [`findElements`](/docs/api/webdriver#findelements) ([`$`](/docs/api/browser/$) oder [`$$`](/docs/api/browser/$$)) gesucht werden. Wenn nicht anders angegeben, beträgt sie 0 Sekunden.

Sie können dieses Timeout wie folgt festlegen:

```js
await browser.setTimeout({ 'implicit': 5000 })
```

## WebdriverIO-bezogene Timeouts

### `WartenFor*` Timeout

WebdriverIO bietet mehrere Befehle, um darauf zu warten, dass Elemente einen bestimmten Zustand erreichen (z. B. aktiviert, sichtbar, vorhanden). Diese Befehle können über ein Element-Objekt aufgerufen werden und halten die Ausführung an, bis ein gewisser Status für das Element erreicht wurde. Mit der Option `waitforTimeout` können Sie die globale Zeitüberschreitung für alle `waitFor*` Befehle festlegen, sodass Sie nicht immer wieder den selben Timeout festlegen müssen. _(Beachten Sie die Kleinschreibung `f`!)_

```js
// wdio.conf.js
export const config = {
    // ...
    waitforTimeout: 5000,
    // ...
}
    waitforTimeout: 5000,
    // ...
}
    waitforTimeout: 5000,
    // ...
}
```

In Ihren Tests können Sie jetzt Folgendes tun:

```js
const myElem = await $('#myElem')
await myElem.waitForDisplayed()

// you can also overwrite the default timeout if needed
await myElem.waitForDisplayed({ timeout: 10000 })
```

## Frameworkbezogene Timeouts

Das Test-Framework, das Sie mit WebdriverIO verwenden, muss sich mit Timeouts befassen, insbesondere da alles asynchron ist. Es stellt sicher, dass der Testprozess nicht hängen bleibt, wenn etwas schief geht.

Standardmäßig beträgt das Timeout 10 Sekunden, was bedeutet, dass ein einzelner Test nicht länger dauern sollte.

Ein einzelner Test in Mocha sieht so aus:

```js
it('should login into the application', () => {
    await browser.url('/login')

    const form = await $('form')
    const username = await $('#username')
    const password = await $('#password')

    await username.setValue('userXY')
    await password.setValue('******')
    await form.submit()

    expect(await browser.getTitle()).to.be.equal('Admin Area')
})
```

In Cucumber gilt das Timeout für eine Einzelschrittdefinition. Wenn Sie das Timeout jedoch erhöhen möchten, weil Ihr Test länger als der Standardwert dauert, müssen Sie es in den Framework-Optionen festlegen.

<Tabs
  defaultValue="mocha"
  values={[
    {label: 'Mocha', value: 'mocha'},
 {label: 'Jasmine', value: 'jasmine'},
 {label: 'Cucumber', value: 'cucumber'}
 ]
}>
<TabItem value="mocha">

```js
// wdio.conf.js
export const config = {
    // ...
    framework: 'mocha',
    mochaOpts: {
        timeout: 20000
    },
    // ...
}
```

</TabItem>
<TabItem value="jasmine">

```js
// wdio.conf.js
export const config = {
    // ...
    framework: 'jasmine',
    jasmineOpts: {
        defaultTimeoutInterval: 20000
    },
    // ...
}
```

</TabItem>
<TabItem value="cucumber">

```js
// wdio.conf.js
export const config = {
    // ...
    framework: 'cucumber',
    cucumberOpts: {
        timeout: 20000
    },
    // ...
}
```

</TabItem>
</Tabs>
