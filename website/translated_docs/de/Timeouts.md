---
id: timeouts
title: Timeouts
---

Jeder Befehl in WebdriverIO ist ein asynchroner Vorgang, wo eine Anfrage an einem WebDriver-Server (oder einen Cloud-Dienst wie [Sauce Labs](https://saucelabs.com/)) geschickt wird und dessen Antwort das Ergebnis enthält, sobald die Aktion wie z.B. ein klick abgeschlossen oder fehlgeschlagen ist. Daher ist Zeit eine entscheidende Komponente im gesamten Test Prozess. Wenn eine bestimmte Aktion vom Ergebnis einer anderen Aktion abhängt, müssen Sie sicherstellen, dass diese in der richtigen Reihenfolge ausgeführt werden. Timeouts spielen eine wichtige Rolle beim Umgang mit diesen Fragen.

## WebDriver Timeouts

### Skript Timeout

Jede Session hat ein zugehöriges Session-Skript-Timeout, die eine Zeit angibt, wie lange asynchrone Skripte laufen dürfen. Wenn nicht anders angegeben, ist diese 30 Sekunden. Sie können diesen Timeout festlegen über:

```js
browser.setTimeout({ 'script': 60000 });
browser.executeAsync((done) => {
    console.log('this should not fail');
    setTimeout(done, 59000);
});
```

### Ladezeit Timeout

Jede Session hat ein spezifisches Ladezeit Timeout, welches angibt, wie lange gewartet wird bis die Seite geladen ist. Wenn nicht anders angegeben, ist diese 300 Sekunden. Sie können diesen Timeout festlegen über:

```js
browser.setTimeout({ 'pageLoad': 10000 });
```

> Das `pageLoad` Schlüsselwort ist Teil der offiziellen WebDrivers [Spezifikation](https://www.w3.org/TR/webdriver/#set-timeouts), aber möglicherweise nicht [unterstützt](https://github.com/seleniumhq/selenium-google-code-issue-archive/issues/687) in Ihren Browser, wenn dieser nicht von einem W3C kompatiblen Driver gesteuert wird (der ehemalige Name für diese Art Timeout ist `page load`).

### Impliziter Timeout

Jede Session definiert einen impliziten Timeout der angibt, wie lange auf ein bestimmtes Element auf der Seite gewartet wird, wenn dieses mit dem [`findElement`](/docs/api/webdriver.html#findelement) oder [`findElements`](/docs/api/webdriver.html#findelements) Befehl (oder auch [`$`](/docs/api/browser/$.html) or [`$$`](/docs/api/browser/$$.html)) angefragt aber nicht gefunden werden kann. Wenn nicht anders angegeben, ist es 0 Millisekunden. Sie können diesen Timeout festlegen über:

```js
browser.setTimeout({ 'implicit': 5000 });
```

## Explizite Timeouts mit WebdriverIO

### WaitForXXX Timeout

WebdriverIO bietet mehrere Befehle an, die für bestimmte Elemente warten einen bestimmten Zustand zu erreichen (z.B. aktiviert, sichtbar oder existierender Zustand). Diese Befehle können auf Element Instanzen aufgerufen werden und nehmen als Parameter eine Zahl die den Timeout definiert, wie lange auf diesen Zustand gewartet werden soll. Die Option `waitforTimeout` erlaubt es Ihnen, den globalen Timeout für alle WaitFor Befehle festzulegen, damit Sie nicht immer wieder denselben Timeout festlegen müssen. Beachten Sie den Kleinbuchstaben `f` in `waitforTimeout`.

```js
// wdio.conf.js
exports.config = {
    // ...
    waitforTimeout: 5000,
    // ...
};
```

In Ihrem Test können Sie dies jetzt tun:

```js
const myElem = $('#myElem');
myElem.waitForVisible();

// you can also overwrite the default timeout if needed
myElem.waitForVisible(10000);
```

## Framework Spezifische Timeouts

Auch das Test-Framework, welches Sie in Verbindung mit WebdriverIO benutzen, muss mit Timeouts arbeiten, da alles asynchron ausgeführt wird. Es stellt sicher, dass der Testprozess nicht hängen bleibt, wenn etwas schief läuft. Standardmäßig wird der Timeout auf 10 Sekunden gesetzt, was bedeutet, dass ein einzelner Test nicht länger als das laufen kann. Ein einzelner Test z.B. in Mocha sieht folgendermaßen aus:

```js
it('should login into the application', () => {
    browser.url('/login');

    const form = $('form');
    const username = $('#username');
    const password = $('#password');

    username.setValue('userXY');
    password.setValue('******');
    form.submit();

    expect(browser.getTitle()).to.be.equal('Admin Area');
});
```

In Cucumber gilt die Zeitspanne für eine einzelne Schrittdefinition. Wenn Sie jedoch den Timeout erhöhen wollen, weil Ihr Test länger dauert als der Standardwert, müssen Sie diesen in den Einstelllungen ändern. Dies ist für Mocha:

```js
// wdio.conf.js
exports.config = {
    // ...
    framework: 'mocha',
    mochaOpts: {
        timeout: 20000
    },
    // ...
}
```

Für Jasmine:

```js
// wdio.conf.js
exports.config = {
    // ...
    framework: 'jasmine',
    jasmineNodeOpts: {
        defaultTimeoutInterval: 20000
    },
    // ...
}
```

und für Cucumber:

```js
// wdio.conf.js
exports.config = {
    // ...
    framework: 'cucumber',
    cucumberOpts: {
        timeout: 20000
    },
    // ...
}
```