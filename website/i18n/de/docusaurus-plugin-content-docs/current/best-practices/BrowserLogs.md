---
id: browser-logs
title: Browser Logs
---

Bei der Ausführung von Tests kann der Browser wichtige Informationen protokollieren, die für Sie interessant sind oder gegen die Sie prüfen möchten.

<Tabs
defaultValue="bidi"
values={[
{label: 'Bidi', value: 'bidi'},
{label: 'Classic (Veraltet)', value: 'classic'
}]
}>

<TabItem value='bidi'>

Bei der Verwendung von WebDriver Bidi, der Standardmethode von WebdriverIO zur Automatisierung des Browsers, können Sie Ereignisse abonnieren, die vom Browser kommen. Für Protokollereignisse möchten Sie auf `log.entryAdded` hören, z.B.:

```ts
await browser.sessionSubscribe({ events: ['log.entryAdded'] })

/**
 * gibt zurück: {"type":"console","method":"log","realm":null,"args":[{"type":"string","value":"Hello Bidi"}],"level":"info","text":"Hello Bidi","timestamp":1657282076037}
 */
browser.on('log.entryAdded', (entryAdded) => console.log('received %s', entryAdded))
```

In einem Test können Sie Protokollereignisse einfach in ein Array übertragen und dieses Array überprüfen, sobald Ihre Aktion abgeschlossen ist, z.B.:

```ts
import type { local } from 'webdriver'

describe('should log when doing a certain action', () => {
    const logs: string[] = []

    function logEvents (event: local.LogEntry) {
        logs.push(event.text) // Protokollnachricht zum Array hinzufügen
    }

    before(async () => {
        await browser.sessionSubscribe({ events: ['log.entryAdded'] })
        browser.on('log.entryAdded', logEvents)
    })

    it('should trigger the console event', () => {
        // den Browser veranlassen, eine Nachricht an die Konsole zu senden
        ...

        // prüfen, ob das Protokoll erfasst wurde
        expect(logs).toContain('Hello Bidi')
    })

    // Listener anschließend aufräumen
    after(() => {
        browser.off('log.entryAdded', logEvents)
    })
})
```

</TabItem>

<TabItem value='classic'>

Wenn Sie noch WebDriver Classic verwenden oder die Bidi-Nutzung über die Capability `'wdio:enforceWebDriverClassic': true` deaktiviert haben, können Sie den JSONWire-Befehl `getLogs` verwenden, um die neuesten Protokolle abzurufen. Da WebdriverIO diese veralteten Befehle entfernt hat, müssen Sie den [JSONWP Service](https://github.com/webdriverio-community/wdio-jsonwp-service) verwenden, um den Befehl wieder zu Ihrer Browser-Instanz hinzuzufügen.

Nachdem Sie den Service hinzugefügt oder initialisiert haben, können Sie Protokolle wie folgt abrufen:

```ts
const logs = await browser.getLogs('browser')
const logMessage = logs.find((log) => log.message.includes('Hello Bidi'))
expect(logMessage).toBeTruthy()
```

Hinweis: Der Befehl `getLogs` kann nur die neuesten Protokolle aus dem Browser abrufen. Er bereinigt möglicherweise Protokollnachrichten, wenn sie zu alt werden.
</TabItem>

</Tabs>

Bitte beachten Sie, dass Sie diese Methode verwenden können, um Fehlermeldungen abzurufen und zu überprüfen, ob Ihre Anwendung auf Fehler gestoßen ist.
