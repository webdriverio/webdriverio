---
id: mock
title: El objeto simulado
---

El objeto simulado es un objeto que representa una simulación de red y contiene información sobre las solicitudes que coinciden con `url` y `filterOptions` dadas. Puede ser recibido usando el comando [`mock`](/docs/api/browser/mock).

:::info

Tenga en cuenta que usar el comando `mock` requiere soporte para el protocolo de Chrome DevTools. Ese soporte se da si ejecuta las pruebas localmente en el navegador basado en Chromium o si usas una cuadrícula Selenium v4 o superior. Este comando no puede ____ utilizarse al ejecutar pruebas automatizadas en la nube. Obtenga más información en la sección de [Protocoles de Automatización](/docs/automationProtocols).

:::

Puede leer más acerca de las solicitudes de simulación y respuestas en WebdriverIO en nuestra guía [Mocks y espías](/docs/mocksandspies).

## Propiedades

Un objeto simulado contiene las siguientes propiedades:

| Nombre          | Tipo       | Información                                                                                                                                                                                          |
| --------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `url`           | `String`   | La URL pasó al comando simulado                                                                                                                                                                      |
| `filterOptions` | `Object`   | Las opciones de filtro de recursos pasadas en el comando mock                                                                                                                                        |
| `browser`       | `Object`   | El [Objeto de navegador](/docs/api/browser) utilizado para obtener el objeto simulado.                                                                                                               |
| `calls`         | `Object[]` | Información sobre solicitudes coincidentes del navegador, que contiene propiedades como `url`, `método`, `encabezados`, `inicialPriority`, `referrerPolic`, `statusCode`, `ResponseHeaders` y `body` |

## Métodos

Los objetos simulados proporcionan varios comandos, enumerados en la sección `simulacro` , que permiten a los usuarios modificar el comportamiento de la solicitud o respuesta.

- [`abort`](/docs/api/mock/abort)
- [`abortOnce`](/docs/api/mock/abortOnce)
- [`clear`](/docs/api/mock/clear)
- [`respond`](/docs/api/mock/respond)
- [`respondOne`](/docs/api/mock/respondOnce)
- [`restore`](/docs/api/mock/restore)

## Eventos

El objeto del navegador es un EventEmitter y se emiten un par de eventos para sus casos de uso.

He aquí una lista de eventos.

### `request`

Este evento está siendo emitido cuando se lanza una solicitud de red que coincide con los patrones simulados. La solicitud se pasa en el callback del evento.

Solicitud de interfaz:
```ts
interface RequestEvent {
    requestId: number
    request: Matches
    responseStatusCode: number
    responseHeaders: Record<string, string>
}
```

### `overwrite`

Este evento se emite cuando la respuesta de la red se sobrescribe con [`respond`](/docs/api/mock/respond) o [`respondOnce`](/docs/api/mock/respondOnce). La solicitud se pasa en el callback del evento.

Interfaz de respuesta:
```ts
interface OverwriteEvent {
    requestId: number
    responseCode: number
    responseHeaders: Record<string, string>
    body?: string | Record<string, any>
}
```

### `fail`

Este evento se emite cuando la respuesta de la red se sobrescribe con [`respond`](/docs/api/mock/abort) o [`respondOnce`](/docs/api/mock/abortOnce). La solicitud se pasa en el callback del evento.

Interfaz de falla:
```ts
interface FailEvent {
    requestId: number
    errorReason: Protocol.Network.ErrorReason
}
```

### `match`

Este evento se está emitiendo cuando se añade una nueva coincidencia, antes de `continuar` o `sobrescribir`. La solicitud se pasa en el callback del evento.

Interfaz de coincidencia:
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

Este evento se está emitiendo cuando la respuesta de red no ha sido sobrescrita ni interrumpida, o si la respuesta ya fue enviada por otro simulador. Se pasa `requestId` en la devolución de llamada del evento.

## Ejemplos

Obtener un número de solicitudes pendientes:

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

Fallo lanzando un error en la red 404:

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

Determinar si se usó un valor de respuesta simulado:

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

En este ejemplo, `firstMock` se definió primero y tiene una llamada `respondOnce` , por lo que el valor de respuesta `secondMock` no se usará para la primera solicitud, pero se usará para el resto de ellas.
