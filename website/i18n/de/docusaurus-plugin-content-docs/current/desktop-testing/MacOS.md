---
id: macos
title: MacOS
---

WebdriverIO kann beliebige MacOS-Anwendungen mithilfe von [Appium](https://appium.io/docs/en/2.0/) automatisieren. Alles was du benötigst ist [XCode](https://developer.apple.com/xcode/), das auf deinem System installiert ist, Appium und der [Mac2 Driver](https://github.com/appium/appium-mac2-driver) als Abhängigkeit sowie die richtigen Capabilities.

## Erste Schritte

Um ein neues WebdriverIO-Projekt zu starten, führe folgenden Befehl aus:

```sh
npm create wdio@latest ./
```

Ein Installationsassistent führt dich durch den Prozess. Stelle sicher, dass du _"Desktop Testing - of MacOS Applications"_ auswählst, wenn gefragt wird, welche Art von Tests du durchführen möchtest. Danach kannst du die Standardeinstellungen beibehalten oder nach deinen Vorlieben anpassen.

Der Konfigurationsassistent installiert alle erforderlichen Appium-Pakete und erstellt eine `wdio.conf.js` oder `wdio.conf.ts` mit der notwendigen Konfiguration für Tests auf MacOS. Wenn du der automatischen Generierung von Testdateien zugestimmt hast, kannst du deinen ersten Test über `npm run wdio` ausführen.

<CreateMacOSProjectAnimation />

Das war's schon 🎉

## Beispiel

So kann ein einfacher Test aussehen, der die Taschenrechner-Anwendung öffnet, eine Berechnung durchführt und das Ergebnis überprüft:

```js
describe('My Login application', () => {
    it('should set a text to a text view', async function () {
        await $('//XCUIElementTypeButton[@label="seven"]').click()
        await $('//XCUIElementTypeButton[@label="multiply"]').click()
        await $('//XCUIElementTypeButton[@label="six"]').click()
        await $('//XCUIElementTypeButton[@title="="]').click()
        await expect($('//XCUIElementTypeStaticText[@label="main display"]')).toHaveText('42')
    });
})
```

__Hinweis:__ Die Taschenrechner-App wurde zu Beginn der Sitzung automatisch geöffnet, da `'appium:bundleId': 'com.apple.calculator'` als Capability-Option definiert wurde. Du kannst während der Sitzung jederzeit zwischen Apps wechseln.

## Weitere Informationen

Für Informationen zu Besonderheiten beim Testen auf MacOS empfehlen wir, das [Appium Mac2 Driver](https://github.com/appium/appium-mac2-driver) Projekt zu besuchen.
