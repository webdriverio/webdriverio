---
id: api
title: API Dokumentation
---
Willkommen zur WebdriverIO API Dokumentation. Diese Seiten enthalten Referenzmaterialien für alle implementierten WebDriver Protokoll Befehle. WebdriverIO hat ebenfalls alle [JSONWire Protokoll](https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol) Befehle implementiert und unterstützt auch besondere Befehle speziell für [Appium](http://appium.io) oder andere Umgebungen wie Chrome oder Sauce Labs.

> **Hinweis:** Dies ist die Dokumentation für die neueste Version (v5.0.0) von WebdriverIO. Wenn Sie noch v4 oder ältere Versionen verwenden, nutzen Sie bitte die alte Dokumentationsseite auf [v4.webdriver.io](http://v4.webdriver.io)!

## Beispiele

Jede Befehl Dokumentation kommt in der Regel mit einem Beispiel, das veranschaulicht, wie der Befehl mit dem WebdriverIO Testrunner, bei dem alle Befehle synchron ausgeführt werden, verwendet werden kann. Wenn Sie WebdriverIO im Standalone-Modus ausführen können Sie all diese Befehle ebenfalls verwenden, müssen aber dafür sorgen, dass die Ausführungsreihenfolge richtig gehandhabt wird und die Promises korrekt aufgelöst werden. Also anstatt das Ergebnis eines Befehles direkt einer Variable zuzuweisen, wie es der WDIO Testrunner erlauben würde:

```js
it('can handle commands synchronously', () => {
    var value = $('#input').getValue();
    console.log(value); // outputs: some value
});
```

you need return the command promise so it gets resolved properly as well as access the value when the promise got resolve:

```js
it('handles commands as promises', ()  =>{
    return $('#input').getValue().then((value) => {
        console.log(value); // outputs: some value
    });
});
```

Of course you can use Node.JS latest [async/await](https://github.com/yortus/asyncawait) functionality to bring synchronous syntax into your testflow like:

```js
it('can handle commands using async/await', async function () {
    var value = await $('#input').getValue();
    console.log(value); // outputs: some value
});
```

However it is recommended to use the testrunner to scale up your test suite as it comes with a lot of useful add ons like the [Sauce Service](_sauce-service.md) that helps you to avoid writing a lot of boilerplate code by yourself.

## Contribute

If you feel like you have a good example for a command, don't hesitate to open a PR and submit it. Just click on the orange button on the top right with the label *"Improve this doc"*. Make sure you understand the way we write these docs by checking the [Contribute](https://github.com/webdriverio/webdriverio/blob/master/CONTRIBUTING.md) section.