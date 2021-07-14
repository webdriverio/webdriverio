---
id: api
title: API Dokumentation
---

Willkommen zur WebdriverIO API Dokumentation. Diese Seiten enthalten Referenzmaterialien für alle implementierten WebDriver Protokoll Befehle. WebdriverIO hat ebenfalls alle [JSONWire Protokoll](https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol) Befehle implementiert und unterstützt auch besondere Befehle speziell für [Appium](http://appium.io) oder andere Umgebungen wie Chrome oder Sauce Labs.

> **Hinweis:** Dies ist die Dokumentation für die neueste Version (v5.0.0) von WebdriverIO. Wenn Sie noch v4 oder ältere Versionen verwenden, nutzen Sie bitte die alte Dokumentationsseite auf [v4.webdriver.io](http://v4.webdriver.io)!

## Beispiele

Jede Befehl Dokumentation kommt in der Regel mit einem Beispiel, das veranschaulicht, wie der Befehl mit dem WebdriverIO Testrunner, bei dem alle Befehle synchron ausgeführt werden, verwendet werden kann. Wenn Sie WebdriverIO im Standalone-Modus ausführen können Sie all diese Befehle ebenfalls verwenden, müssen aber dafür sorgen, dass die Ausführungsreihenfolge richtig gehandhabt wird und die Promises korrekt aufgelöst werden. Also anstatt das Ergebnis eines Befehles direkt einer Variable zuzuweisen, wie es der WDIO Testrunner erlauben würde:

```js
it('kann Befehle synchron ausführen', () => {
    var value = $('#input').getValue();
    console.log(value); // gibt aus: irgendeinen Wert
});
```

musst du das erzeugte Promise zurückgeben und auf den Wert zugreifen, sobald das Promise aufgelöst wurde:

```js
it('löst Promises aus Befehlen auf', ()  =>{
    return $('#input').getValue().then((value) => {
        console.log(value); // gibt aus: irgendeinen Wert
    });
});
```

Natürlich können Sie Node.JS neueste [async/await](https://github.com/yortus/asyncawait) Funktionalität verwenden, um synchrone Syntax in Ihrem Test zu nutzten z.B.:

```js
it('kann Promises mit async/await auflösen', async function () {
    var value = await $('#input').getValue();
    console.log(value); // gibt aus: irgendein Wert
});
```

Es wird jedoch empfohlen, den WDIO Testrunner zu nutzen, um Ihre Testsuite zu skalieren, da er mit vielen nützlichen Add-ons wie dem [Sauce Service](_sauce-service.md) kommt, was es Ihnen erspart, jede Menge standard Code schreiben zu müssen.

## Unterstützen Sie Uns!

Wenn Sie das Gefühl haben, dass Sie ein gutes Beispiel für einen Befehl haben, zögern Sie nicht, einen PR zu öffnen und ihn einzureichen. Klicken Sie einfach auf den orange Button oben rechts mit dem Label *"Verbessern Sie dieses Dokument"*. Vergewissern Sie sich, dass Sie verstanden haben, wie man dieses Projekt unterstützt, indem Sie das Dokument [Projekt Unterstützen](https://github.com/webdriverio/webdriverio/blob/master/CONTRIBUTING.md) lesen.