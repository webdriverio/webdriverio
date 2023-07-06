---
id: mock
title: Das Mock-Objekt
---

Das Mock-Objekt ist ein Objekt, das ein Netzwerk-Mock repräsentiert und Informationen über Anfragen enthält, die mit der `url` und `filterOptions` übereinstimmen. Es kann über den [`mock`](/docs/api/browser/mock) Befehl erstellt werden.

:::info

Beachten Sie, dass die Verwendung des `mock` Befehls Unterstützung für das Chrome DevTools Protokoll erfordert. Diese Unterstützung wird gewährt, wenn Sie lokal Tests im Chromium-Browser ausführen oder wenn Sie ein Selenium Grid v4 oder höher verwenden. Dieser Befehl kann __nicht__ beim Ausführen von automatisierten Tests in der Cloud verwendet werden. Erfahren Sie mehr im Bereich [Automation Protocols](/docs/automationProtocols).

:::

Sie können mehr über Mocking Requests und Antworten in WebdriverIO in unserem [Mocks und Spione](/docs/mocksandspies) Guide lesen.

## Eigenschaften

Ein Mock-Objekt hat folgende Eigenschaften:

| Namen           | Typ        | Details                                                                                                                                                                        |
| --------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `url`           | `String`   | Die Url, die an den Mock-Befehl übergeben wurde                                                                                                                                |
| `filterOptions` | `Object`   | Die Ressourcenfilter-Optionen, die an den Mock-Befehl übergeben wurde                                                                                                          |
| `browser`       | `Object`   | Das [Browser-Objekt](/docs/api/browser), von dem aus der Mock Befehl ausgeführt wurde.                                                                                         |
| `calls`         | `Object[]` | Informationen über passende Browser-Anfragen mit Eigenschaften wie `url`, `Methode`, `headers`, `initialPriority`, `referrerPolic`, `statusCode`, `responseHeaders` und `body` |

## Methoden

Mock-Objekte liefern verschiedene Befehle, die im `-Mock-` Abschnitt aufgelistet sind. Sie erlauben Benutzern das Verhalten der Netzwerk Anfrage oder der Server Antwort zu ändern.

- [`abort`](/docs/api/mock/abort)
- [`abortOnce`](/docs/api/mock/abortOnce)
- [`clear`](/docs/api/mock/clear)
- [`respond`](/docs/api/mock/respond)
- [`respondOnce`](/docs/api/mock/respondOnce)
- [`restore`](/docs/api/mock/restore)

## Ereignisse

Das Mock-Objekt ist ein EventEmitter und ein paar Ereignisse werden für Ihren Gebrauch emittiert.

Hier ist eine Liste der Ereignisse.

### `request`

Dieses Ereignis wird emittiert, wenn eine Netzwerkanfrage gestartet wird, die mit Mock-Patterns übereinstimmt. Anfrage wird bei einem Rückruf übergeben.

Anfrage-Interface:
```ts
interface RequestEvent {
    requestId: number
    request: Matches
    responseStatusCode: number
    responseHeaders: Record<string, string>
}
```

### `overwrite`

Dieses Ereignis wird emittiert, wenn die Netzwerkantwort mit [`respond`](/docs/api/mock/respond) oder [`respondOnce`](/docs/api/mock/respondOnce) verändert wurde. Anfrage wird bei einem Callback übergeben.

Anfrage-Interface:
```ts
interface OverwriteEvent {
    requestId: number
    responseCode: number
    responseHeaders: Record<string, string>
    body?: string | Record<string, any>
}
```

### `fail`

Dieses Ereignis wird emittiert, wenn die Netzwerkantwort mit [`abort`](/docs/api/mock/abort) oder [`abortOnce`](/docs/api/mock/abortOnce) verändert wurde. Fehler wird bei einem Rückruf übergeben.

Fehlerschnittstelle:
```ts
interface FailEvent {
    requestId: number
    errorReason: Protocol.Network.ErrorReason
}
```

### `match`

Dieses Ereignis wird abgesendet, wenn ein neues Match hinzugefügt wird, bevor `continue` oder `overwrite` emittiert wurde. Match wird bei einem Rückruf übergeben.

Match Interface:
```ts
interface MatchEvent {
    url: string // Request URL (without fragment).
    urlFragment?: string // Fragment of the requested URL starting with hash, if present.
    method: string // HTTP request method.
    headers: Record<string, string> // HTTP request headers.
    postData?: string // HTTP POST request data.
    hasPostData?: boolean // True when the request has POST data.
    mixedContentType?: MixedContentType // The mixed content export type of the request.
    initialPriority: ResourcePriority // Priority of the resource request at the time request is sent.
    referrerPolicy: ReferrerPolicy // The referrer policy of the request, as defined in https://www.w3.org/TR/referrer-policy/
    isLinkPreload?: boolean // Whether is loaded via link preload.
    body: string | Buffer | JsonCompatible // Body response of actual resource.
    responseHeaders: Record<string, string> // HTTP response headers.
    statusCode: number // HTTP response status code.
    mockedResponse?: string | Buffer // If mock, emitting the event, also modified it's response.
}
```

### `continue`

Dieses Ereignis wird emittiert, wenn die Netzwerk-Antwort weder überschrieben noch unterbrochen wurde oder wenn die Antwort bereits von einem anderen Mock gesendet wurde. `requestId` wird im Event Callback übergeben.

## Beispiele

Eine Anzahl ausstehender Anfragen:

```js
let pendingRequests = 0
const mock = await browser.mock('**') // it is important to match all requests otherwise, the resulting value can be very confusing.
mock.on('request', ({request}) => {
    pendingRequests++
    console.log(`matched request to ${request.url}, pending ${pendingRequests} requests`)
})
mock.on('match', ({url}) => {
    pendingRequests--
    console.log(`resolved request to ${url}, pending ${pendingRequests} requests`)
})
```

Einen Fehler im Falle eines fehlgeschlagenen Requests werden:

```js
browser.addCommand('loadPageWithout404', (url, {selector, predicate}) => new Promise(async (resolve, reject) => {
    const mock = await this.mock('**')

    mock.on('match', ({url, statusCode}) => {
        if (statusCode === 404) {
            reject(new Error(`request to ${url} failed with "Not Found"`))
        }
    })

    await this.url(url).catch(reject)

    // waiting here, because some requests can still be pending
    if (selector) {
        await this.$(selector).waitForExist().catch(reject)
    }

    if (predicate) {
        await this.waitUntil(predicate).catch(reject)
    }

    resolve()
}))

await browser.loadPageWithout404(browser, 'some/url', { selector: 'main' })
```

Festellen, ob Mock Resultat genutzt wurde:

```js
const firstMock = await browser.mock('**/foo/**')
const secondMock = await browser.mock('**/foo/bar/**')

firstMock.respondOnce({id: 3, title: 'three'})
secondMock.respond({id: 4, title: 'four'})

firstMock.on('overwrite', () => {
    // triggers for first request to '**/foo/**'
}).on('continue', () => {
    // triggers for rest requests to '**/foo/**'
})

secondMock.on('continue', () => {
    // triggers for first request to '**/foo/bar/**'
}).on('overwrite', () => {
    // triggers for rest requests to '**/foo/bar/**'
})
```

In diesem Beispiel wurde `firstMock` zuerst definiert und hat eine `respondOnce` anrufen, so dass der `secondMock` Antwortwert nicht für die erste Anfrage verwendet wird aber wird für den Rest von ihnen verwendet.
