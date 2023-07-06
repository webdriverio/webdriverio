---
id: pageobjects
title: Seiten-Objekt-Muster
---

Version 5 von WebdriverIO wurde im Hinblick auf die Unterstützung von Seitenobjektmustern entwickelt. Durch die Einführung des „Element als First Class Citizens“-Prinzips ist es nun möglich, große Testsuiten nach diesem Muster aufzubauen.

Zum Erstellen von Seitenobjekten sind keine zusätzlichen Pakete erforderlich. Es stellt sich heraus, dass saubere, moderne Klassen alle notwendigen Funktionen bieten, die wir brauchen:

- Vererbung zwischen Seitenobjekten
- Lazy Loading von Elementen
- Kapselung von Methoden und Aktionen

Das Ziel der Verwendung von Seitenobjekten besteht darin, alle Seiteninformationen von den eigentlichen Tests zu abstrahieren. Idealerweise sollten Sie alle Selektoren oder spezifischen Anweisungen, die für eine bestimmte Seite einzigartig sind, in einem Seitenobjekt speichern, damit Sie Ihren Test auch noch ausführen können, nachdem Sie Ihre Seite komplett neu gestaltet haben.

## Erstellen eines Seitenobjekts

Zunächst einmal brauchen wir ein Hauptseitenobjekt, das wir `Page.js`nennen. Sie enthält allgemeine Selektoren oder Methoden, von denen alle Seitenobjekte erben.

```js
// Page.js
export default class Page {
    constructor() {
        this.title = 'My Page'
    }

    async open (path) {
        await browser.url(path)
    }
}
```

Wir werden immer eine Instanz eines Seitenobjekts `exportieren` und diese Instanz niemals im Test erstellen. Da wir End-to-End-Tests schreiben, betrachten wir die Seite immer als zustandsloses Konstrukt&mdash;, so wie jeder HTTP-Request ein zustandsloses Konstrukt ist.

Sicher, der Browser kann Session-Informationen enthalten und daher verschiedene Seiten basierend auf der Session anzeigen, aber dies sollte nicht in einem Seitenobjekt widergespiegelt werden. Diese Art von Zustandsänderungen sollte in Ihren Tests enthalten sein.

Beginnen wir mit dem Testen der ersten Seite. Zu Demonstrationszwecken verwenden wir [The Internet](http://the-internet.herokuapp.com) Website von [Elemental Selenium](http://elementalselenium.com) als Beispiel. Versuchen wir ein Seitenobjekt für die [Anmeldeseite](http://the-internet.herokuapp.com/login) zu erstellen.

## Selektoren Definieren

Der erste Schritt besteht darin, alle wichtigen Selektoren, die in unserem Objekt `login.page` benötigt werden, als Getter-Funktionen zu schreiben:

```js
// login.page.js
import Page from './page'

class LoginPage extends Page {

    get username () { return $('#username') }
    get password () { return $('#password') }
    get submitBtn () { return $('form button[type="submit"]') }
    get flash () { return $('#flash') }
    get headerLinks () { return $$('#header a') }

    async open () {
        await super.open('login')
    }

    async submit () {
        await this.submitBtn.click()
    }

}

export default new LoginPage()
```

Das Definieren von Selektoren in Getter-Funktionen sieht vielleicht etwas seltsam aus, ist aber nützlich. Diese Funktionen werden ausgewertet, _wenn Sie auf die Eigenschaft zugreifen,_ nicht wenn Sie das Objekt generieren. Damit fordern Sie das Element nur an, wenn Sie eine Aktion darauf ausführen möchten.

## Kettenbefehle

WebdriverIO merkt sich intern das letzte Ergebnis eines Befehls. Wenn Sie einen Elementbefehl mit einem Aktionsbefehl verketten, findet er das Element aus dem vorherigen Befehl und verwendet das Ergebnis, um die Aktion auszuführen. Dies sieht dann wie folgt aus:

```js
await LoginPage.username.setValue('Max Mustermann')
```

Was im Grunde dasselbe ist wie:

```js
let elem = await $('#username')
await elem.setValue('Max Mustermann')
```

oder

```js
await $('#username').setValue('Max Mustermann')
```

## Verwenden von Seitenobjekten in Ihren Tests

Nachdem Sie die notwendigen Elemente und Methoden für die Seite definiert haben, können Sie damit beginnen, den Test dafür zu schreiben. Alles, was Sie tun müssen, um das Seitenobjekt zu verwenden, ist es zu importieren. Das war's!

Da Sie eine bereits erstellte Instanz des Seitenobjekts exportiert haben, können Sie es nach dem Import sofort verwenden.

Wenn Sie ein Assertion Framework verwenden, können Ihre Tests dadurch noch aussagekräftiger werden:

```js
// login.spec.js
import LoginPage from '../pageobjects/login.page'

describe('login form', () => {
    it('should deny access with wrong creds', async () => {
        await LoginPage.open()
        await LoginPage.username.setValue('foo')
        await LoginPage.password.setValue('bar')
        await LoginPage.submit()

        await expect(LoginPage.flash).toHaveText('Your username is invalid!')
    })

    it('should allow access with correct creds', async () => {
        await LoginPage.open()
        await LoginPage.username.setValue('tomsmith')
        await LoginPage.password.setValue('SuperSecretPassword!')
        await LoginPage.submit()

        await expect(LoginPage.flash).toHaveText('You logged into a secure area!')
    })
})
```

Aus struktureller Sicht ist es sinnvoll, Test-Dateien und Seitenobjekte in verschiedene Verzeichnisse zu trennen. Zusätzlich können Sie jedem Seitenobjekt die Endung geben: `.page.js`. Dadurch wird deutlich gekennzeichnet, dass Sie ein Seitenobjekt importieren.

## Weitere Schritte

Dies ist das Grundprinzip zum Schreiben von Seitenobjekten mit WebdriverIO. Aber Sie können viel komplexere Seitenobjektstrukturen als diese aufbauen! Beispielsweise könnten Sie bestimmte Seitenobjekte für Modale-Fenster haben oder ein riesiges Seitenobjekt in verschiedene Klassen aufteilen, die jeweils einen anderen Teil der gesamten Webseite darstellen, die vom Hauptseitenobjekt erben. Das Muster bietet wirklich viele Möglichkeiten, Seiteninformationen von Ihren Tests zu trennen, was wichtig ist, um Ihre Testsuite in Zeiten, in denen das Projekt und die Anzahl der Tests wachsen, strukturiert und übersichtlich zu halten.

Sie finden dieses Beispiel (und noch mehr Beispiele für Seitenobjekte) im Ordner [`example`](https://github.com/webdriverio/webdriverio/tree/main/examples/pageobject) auf GitHub.
