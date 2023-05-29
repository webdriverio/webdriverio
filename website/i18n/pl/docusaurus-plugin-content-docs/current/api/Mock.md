---
id: mock
title: Obiekt Mock
---

Obiekt mock to obiekt, który reprezentuje makietę sieciową (network mock) i zawiera informacje o żądaniach pasujących do podanych `url` i `filterOptions`. Można go uzyskać przy pomocy polecenia [`mock`](/docs/api/browser/mock).

:::info

Pamiętaj, że użycie polecenia `mock` wymaga wsparcia protokołu Chrome DevTools. Wsparcie jest zapewnione, jeśli wykonujesz testy lokalnie w przeglądarce opartej o Chromium lub jeśli używasz Selenium Grid w wersji 4, lub wyższej. Tego polecenia __nie__ można wykorzystać podczas uruchamiania testów automatycznych w chmurze. Dowiedz się więcej w sekcji [Protokoły automatyzacji](/docs/automationProtocols).

:::

Możesz przeczytać więcej o mockowaniu żądań i odpowiedziach w WebdriverIO w naszym przewodniku dotyczącym [Mock i Spy](/docs/mocksandspies).

## Właściwości

Obiekt mock ma następujące właściwości:

| Nazwa           | Typ        | Szczegóły                                                                                                                                                                                       |
| --------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `url`           | `String`   | Adres URL przekazany do polecenia mock                                                                                                                                                          |
| `filterOptions` | `Object`   | Opcje filtrowania zasobów przekazane do polecenia mock                                                                                                                                          |
| `browser`       | `Object`   | [Obiekt przeglądarki](/docs/api/browser) użyty do pobrania obiektu mock.                                                                                                                        |
| `calls`         | `Object[]` | Informacje o pasujących żądaniach przeglądarki, zawierające właściwości takie jak `url`, `method`, `headers`, `initialPriority`, `referrrerPolicy`, `statusCode`, `responseHeaders` oraz `body` |

## Metody

Obiekty Mock dostarczają różne polecenia, wymienione w sekcji `mock`, które pozwalają użytkownikom modyfikować zachowanie żądania lub odpowiedzi.

- [`abort`](/docs/api/mock/abort)
- [`abortOnce`](/docs/api/mock/abortOnce)
- [`clear`](/docs/api/mock/clear)
- [`respond`](/docs/api/mock/respond)
- [`respondOnce`](/docs/api/mock/respondOnce)
- [`restore`](/docs/api/mock/restore)

## Eventy

Obiekt mock jest EventEmitterem i emitowanych jest kilka eventów dla różnych przypadków użycia.

Poniżej znajduje się lista eventów.

### `request`

Ten event jest emitowany podczas uruchamiania żądania sieciowego, które pasuje do wzorców danego mocka. Żądanie jest przekazywane w ramach callbacku dla danego eventu.

Interfejs żądania:
```ts
interface RequestEvent {
    requestId: number
    request: Matches
    responseStatusCode: number
    responseHeaders: Record<string, string>
}
```

### `overwrite`

Ten event jest emitowany, gdy odpowiedź sieci zostanie nadpisana przez [`respond`](/docs/api/mock/respond) lub [`respondOnce`](/docs/api/mock/respondOnce). Żądanie jest przekazywane w ramach callbacku dla danego eventu.

Interfejs odpowiedzi:
```ts
interface OverwriteEvent {
    requestId: number
    responseCode: number
    responseHeaders: Record<string, string>
    body?: string | Record<string, any>
}
```

### `fail`

Ten event jest emitowany, gdy odpowiedź sieci zostanie przerwana przez [`abort`](/docs/api/mock/abort) lub [`abortOnce`](/docs/api/mock/abortOnce). Fail jest przekazywany w ramach callbacku dla danego eventu.

Interfejs fail:
```ts
interface FailEvent {
    requestId: number
    errorReason: Protocol.Network.ErrorReason
}
```

### `match`

Ten event jest emitowany po dodaniu nowego dopasowania, przed eventami `continue` lub `overwrite`. Dopasowanie jest przekazywane w ramach callbacku dla danego eventu.

Interfejs dopasowania:
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

Ten event jest emitowany, gdy odpowiedź sieci nie została nadpisana ani przerwana, lub jeśli odpowiedź została już wysłana przez inny mock. `requestId` jest przekazywany w ramach callbacku dla danego eventu.

## Przykłady

Pobieranie liczby oczekujących żądań:

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

Rzucanie błędu w przypadku 404 zwróconego jako status odpowiedzi:

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

Ustalanie, czy użyto mocka wartości odpowiedzi:

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

W tym przykładzie żądanie `firstMock` zostało zdefiniowane jako pierwsze i ma jedno wywołanie `respondOnce`, więc wartość odpowiedzi `secondMock` nie będzie używana dla pierwszego żądania, ale będzie wykorzystana w przypadku pozostałych żądań.
