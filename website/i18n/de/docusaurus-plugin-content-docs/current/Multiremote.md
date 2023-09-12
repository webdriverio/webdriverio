---
id: multiremote
title: Multiremote
---

Mit WebdriverIO können Sie mehrere automatisierte Sitzungen in einem einzigen Test ausführen. Dies ist praktisch, wenn Sie Funktionen testen, die mehrere Benutzer erfordern (z. B. Chat- oder WebRTC-Anwendungen).

Anstatt ein paar Remote-Instanzen zu erstellen, in denen Sie allgemeine Befehle wie [`newSession`](/docs/api/webdriver#newsession) oder [`url`](/docs/api/browser/url) auf jeder Instanz ausführen müssen, können Sie einfach eine **multiremote** -Instanz erstellen und alle Browser gleichzeitig steuern.

Verwenden Sie dazu einfach die Funktion `multiremote()` und übergeben Sie ein Objekt mit Namen, die auf eine gewählte `Capability` verweisen. Indem Sie jeder Capability einen Namen geben, können Sie diese einzelne Instanz einfach auswählen und darauf zugreifen, wenn Sie Befehle auf einer einzelnen Instanz ausführen.

:::info

Multiremote ist _nicht geeignet_, um alle Ihre Tests parallel auszuführen. Es soll helfen, mehrere Browser und/oder Mobilgeräte für spezielle Integrationstests (z. B. Chat-Anwendungen) zu koordinieren.

:::

Alle Multiremote-Instanzen geben ein Array von Ergebnissen zurück. Das erste Ergebnis stellt die zuerst im Capability-Objekt definierte Capability dar, das zweite Ergebnis die zweite Capability und so weiter.

## Verwendung des Standalone-Modus

Hier ist ein Beispiel für die Erstellung einer Multiremote-Instanz im __Standalone-Modus__:

```js
import { multiremote } from 'webdriverio'

(async () => {
    const browser = await multiremote({
        myChromeBrowser: {
            capabilities: {
                browserName: 'chrome'
            }
        },
        myFirefoxBrowser: {
            capabilities: {
                browserName: 'firefox'
            }
        }
    })

    // open url with both browser at the same time
    await browser.url('http://json.org')

    // call commands at the same time
    const title = await browser.getTitle()
    expect(title).toEqual(['JSON', 'JSON'])

    // click on an element at the same time
    const elem = await browser.$('#someElem')
    await elem.click()

    // only click with one browser (Firefox)
    await elem.getInstance('myFirefoxBrowser').click()
})()
```

## Verwendung des WDIO Testrunner

Um Multiremote im WDIO-Testrunner zu verwenden, definieren Sie einfach das Objekt `capabilities` in Ihrer `wdio.conf.js` als Objekt mit dem Namen des Browser als Schlüssel (statt einer Liste von Capabilities):

```js
export const config = {
    // ...
    capabilities: {
        myChromeBrowser: {
            capabilities: {
                browserName: 'chrome'
            }
        },
        myFirefoxBrowser: {
            capabilities: {
                browserName: 'firefox'
            }
        }
    }
    // ...
}
```

Dadurch werden zwei WebDriver-Sitzungen mit Chrome und Firefox erstellt. Statt nur Chrome und Firefox können Sie auch zwei mobile Geräte mit [Appium](http://appium.io) oder ein mobiles Gerät und einen Browser starten lassen.

You can also run multiremote in parallel by putting the browser capabilities object in an array. Please make sure to have `capabilities` field included in each browser, as this is how we tell each mode apart.

```js
export const config = {
    // ...
    capabilities: [{
        myChromeBrowser0: {
            capabilities: {
                browserName: 'chrome'
            }
        },
        myFirefoxBrowser0: {
            capabilities: {
                browserName: 'firefox'
            }
        }
    }, {
        myChromeBrowser1: {
            capabilities: {
                browserName: 'chrome'
            }
        },
        myFirefoxBrowser1: {
            capabilities: {
                browserName: 'firefox'
            }
        }
    }]
    // ...
}
```

Sie können sogar eines der [Cloud-Services-Backends](https://webdriver.io/docs/cloudservices.html) zusammen mit lokalen Webdriver/Appium- oder Selenium-Standalone-Instanzen starten. WebdriverIO erkennt automatisch das Cloud-Backend, wenn Sie entweder `bstack:options` ([Browserstack](https://webdriver.io/docs/browserstack-service.html)), `sauce:options` ([SauceLabs](https://webdriver.io/docs/sauce-service.html)) oder `tb:options` ([TestingBot](https://webdriver.io/docs/testingbot-service.html)) in den Browser Capabilities angegeben.

```js
export const config = {
    // ...
    user: process.env.BROWSERSTACK_USERNAME,
    key: process.env.BROWSERSTACK_ACCESS_KEY,
    capabilities: {
        myChromeBrowser: {
            capabilities: {
                browserName: 'chrome'
            }
        },
        myBrowserStackFirefoxBrowser: {
            capabilities: {
                browserName: 'firefox',
                'bstack:options': {
                    // ...
                }
            }
        }
    },
    services: [
        ['browserstack', 'selenium-standalone']
    ],
    // ...
}
```

Hier ist jede Art von Betriebssystem/Browser-Kombination möglich (einschließlich mobiler und Desktop-Browser). Alle Befehle, die Ihre Tests über die Variable `browser` aufrufen, werden bei jeder Instanz parallel ausgeführt. Dies hilft, Ihre Integrationstests zu rationalisieren und ihre Ausführung zu beschleunigen.

Wenn Sie beispielsweise eine URL öffnen:

```js
browser.url('https://socketio-chat-h9jt.herokuapp.com/')
```

Das Ergebnis jedes Befehls ist ein Objekt mit den Browsernamen als Schlüssel und dem Befehlsergebnis als Wert, etwa so:

```js
// wdio testrunner example
await browser.url('https://www.whatismybrowser.com')

const elem = await $('.string-major')
const result = await elem.getText()

console.log(result[0]) // returns: 'Chrome 40 on Mac OS X (Yosemite)'
console.log(result[1]) // returns: 'Firefox 35 on Mac OS X (Yosemite)'
```

Beachten Sie, dass jeder Befehl einzeln ausgeführt wird. Das bedeutet, dass der Befehl beendet wird, sobald alle Browser ihn ausgeführt haben. Dies ist hilfreich, da es die Browseraktionen synchronisiert hält, was es einfacher macht zu verstehen, was gerade passiert.

Manchmal ist es notwendig, in jedem Browser unterschiedliche Dinge zu tun, um etwas zu testen. Wenn wir beispielsweise eine Chat-Anwendung testen möchten, muss es einen Browser geben, der eine Textnachricht sendet, während ein anderer Browser darauf wartet, sie zu empfangen, und dann eine Assertion darauf ausführt.

Bei Verwendung des WDIO-Testrunners werden die Browsernamen mit ihren Instanzen im globalen Bereich registriert:

```js
const myChromeBrowser = browser.getInstance('myChromeBrowser')
await myChromeBrowser.$('#message').setValue('Hi, I am Chrome')
await myChromeBrowser.$('#send').click()

// wait until messages arrive
await $('.messages').waitForExist()
// check if one of the messages contain the Chrome message
assert.true(
    (
        await $$('.messages').map((m) => m.getText())
    ).includes('Hi, I am Chrome')
)
```

In diesem Beispiel beginnt die Instanz `myFirefoxBrowser` mit dem Warten auf eine Nachricht, sobald die Instanz `myChromeBrowser` auf die Schaltfläche `#send` geklickt hat.

Multiremote macht es einfach und bequem, mehrere Browser zu steuern, egal ob Sie möchten, dass sie dasselbe oder verschiedene Dinge gleichzeitig tun.

## Zugriff auf Instanzen über das Browserobjekt
Zusätzlich zum Zugriff auf die Browserinstanz über ihre globalen Variablen (z. B. `myChromeBrowser`, `myFirefoxBrowser`) können Sie sie auch über das Objekt `browser` erreichen, z. B. `browser["myChromeBrowser"]` oder `browser["myFirefoxBrowser" ]`. Eine Liste aller Ihrer Instanzen erhalten Sie über `browser.instances`. Dies ist besonders nützlich, wenn wiederverwendbare Testschritte geschrieben werden, die in beiden Browsern ausgeführt werden können, z.B.:

wdio.conf.js:
```js
    capabilities: {
        userA: {
            capabilities: {
                browserName: 'chrome'
            }
        },
        userB: {
            capabilities: {
                browserName: 'chrome'
            }
        }
    }
```

Cucumber Datei:
    ```feature
    When User A types a message into the chat
    ```

Schrittdefinitionsdatei:
```js
When(/^User (.) types a message into the chat/, async (userId) => {
    await browser.getInstance(`user${userId}`).$('#message').setValue('Hi, I am Chrome')
    await browser.getInstance(`user${userId}`).$('#send').click()
})
```
