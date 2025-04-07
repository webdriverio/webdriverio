---
id: mock
title: The Mock Object
---

O objeto simulado é um objeto que representa uma simulação de rede e contém informações sobre solicitações que correspondem a `url` e `filterOptions` fornecidos. Ele pode ser recebido usando o comando [`mock`](/docs/api/browser/mock).

:::info

Observe que usar o comando `mock` requer suporte ao protocolo Chrome DevTools. Esse suporte é fornecido se você executar testes localmente no navegador baseado em Chromium ou se você usar um Selenium Grid v4 ou superior. Este comando __não__ pode ser usado ao executar testes automatizados na nuvem. Saiba mais na seção [Protocolos de automação](/docs/automationProtocols).

:::

Você pode ler mais sobre solicitações e respostas simuladas no WebdriverIO em nosso guia [Mocks e Spies](/docs/mocksandspies).

## Propriedades

Um objeto simulado contém as seguintes propriedades:

| Nome            | Tipo       | Detalhes                                                                                                                                                                                         |
| --------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `url`           | `String`   | A url passada para o comando mock                                                                                                                                                                |
| `filterOptions` | `Object`   | As opções de filtro de recursos passadas para o comando mock                                                                                                                                     |
| `browser`       | `Object`   | O [Objeto do Navegador](/docs/api/browser) usado para obter o objeto simulado.                                                                                                                   |
| `calls`         | `Object[]` | Informações sobre solicitações de navegador correspondentes, contendo propriedades como `url`, `method`, `headers`, `initialPriority`, `referrerPolic`, `statusCode`, `responseHeaders` e `body` |

## Métodos

Objetos simulados fornecem vários comandos, listados na seção `mock`, que permitem aos usuários modificar o comportamento da solicitação ou resposta.

- [`abort`](/docs/api/mock/abort)
- [`abortOnce`](/docs/api/mock/abortOnce)
- [`clear`](/docs/api/mock/clear)
- [`request`](/docs/api/mock/request)
- [`requestOnce`](/docs/api/mock/requestOnce)
- [`respond`](/docs/api/mock/respond)
- [`respondOnce`](/docs/api/mock/respondOnce)
- [`restore`](/docs/api/mock/restore)

## Eventos

O objeto simulado é um EventEmitter e alguns eventos são emitidos para seus casos de uso.

Aqui está uma lista de eventos.

### `request`

Este evento está sendo emitido ao iniciar uma solicitação de rede que corresponde a padrões simulados. A solicitação é passada no retorno de chamada do evento.

Interface de solicitação:
```ts
interface RequestEvent {
    requestId: number
    request: Matches
    responseStatusCode: number
    responseHeaders: Record<string, string>
}
```

### `overwrite`

Este evento está sendo emitido quando a resposta da rede é substituída por [`respond`](/docs/api/mock/respond) ou [`respondOnce`](/docs/api/mock/respondOnce). A resposta é passada no retorno de chamada do evento.

Interface de resposta:
```ts
interface OverwriteEvent {
    requestId: number
    responseCode: number
    responseHeaders: Record<string, string>
    body?: string | Record<string, any>
}
```

### `fail`

Este evento é emitido quando a solicitação de rede é abortada com [`abort`](/docs/api/mock/abort) ou [`abortOnce`](/docs/api/mock/abortOnce). Fail é passado no retorno de chamada do evento.

Interface de falha:
```ts
interface FailEvent {
    requestId: number
    errorReason: Protocol.Network.ErrorReason
}
```

### `match`

Este evento está sendo emitido quando uma nova correspondência é adicionada, antes de `continuar` ou `sobrescrever`. A correspondência é passada no retorno de chamada do evento.

Interface de correspondência:
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

Este evento é emitido quando a resposta da rede não foi substituída nem interrompida, ou se a resposta já foi enviada por outro mock. `requestId` é passado no retorno de chamada do evento.

## Exemplos

Recebendo uma série de solicitações pendentes:

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

Lançando um erro em falha de rede 404:

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

Determinando se o valor de resposta simulada foi usado:

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

Neste exemplo, `firstMock` foi definido primeiro e tem uma chamada `respondOnce`, então o valor de resposta `secondMock` não será usado para a primeira solicitação, mas será usado para as demais.
