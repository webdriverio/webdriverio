---
id: mock
title: L'objet fictif
---

L'objet bouchon est un objet qui représente un bouchon réseau et contient des informations sur les requêtes qui ont été correspondantes à `url` donnée et `filterOptions`. Il peut être reçu en utilisant la commande [`bouchon`](/docs/api/browser/mock).

:::info

Notez que l'utilisation de la commande `mock` nécessite le support du protocole Chrome DevTools. That support is given if you run tests locally in Chromium based browser or if you use a Selenium Grid v4 or higher. This command can __not__ be used when running automated tests in the cloud. En savoir plus dans la section [Protocoles d'automatisation](/docs/automationProtocols).

:::

Vous pouvez en savoir plus sur les simulations de requêtes et de réponses dans WebdriverIO dans notre guide de [masques et espions](/docs/mocksandspies).

## Propriétés

Un objet `browser` possède les propriétés suivantes :

| Nom             | Type       | Détails                                                                                                                                                                                                             |
| --------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `url`           | `String`   | L'url est passée dans la commande bouchon                                                                                                                                                                           |
| `filterOptions` | `Object`   | Les options de filtrage de ressource sont passées dans la commande bouchon                                                                                                                                          |
| `browser`       | `Object`   | L'objet [Browser](/docs/api/browser) utilisé pour obtenir l'objet bouchon.                                                                                                                                          |
| `calls`         | `Object[]` | Informations à propos des requêtes correspondantes du navigateur, contenant des propriétés telles que `url`, `méthode`, `en-têtes`, `initialPriorité`, `référencePolic`, `statusCode`, `responseHeaders` and `body` |

## Méthodes

Les objets fictifs fournissent diverses commandes, énumérées dans la section `bouchon` , qui permettent aux utilisateurs de modifier le comportement de la requête ou de la réponse.

- [`abort`](/docs/api/mock/abort)
- [`abortOnce`](/docs/api/mock/abortOnce)
- [`clear`](/docs/api/mock/clear)
- [`respond`](/docs/api/mock/respond)
- [`respondOnce`](/docs/api/mock/respondOnce)
- [`restore`](/docs/api/mock/restore)

## Événements

L'objet bouchon est un EventEmitter et quelques événements sont émis pour vos cas d'utilisation.

Voici une liste des événements.

### `request`

Cet événement est émis lors du lancement d'une requête réseau qui correspond à des mock patterns. La requête est passée en cas de rappel.

Interface de requête :
```ts
interface RequestEvent {
    requestId: number
    request: Matches
    responseStatusCode: number
    responseHeaders: Record<string, string>
}
```

### `overwrite`

Cet événement est émis lorsque la réponse réseau est écrasée par [`répondre`](/docs/api/mock/respond) ou [`respondOnce`](/docs/api/mock/respondOnce). La réponse est passée en cas de rappel de l'événement.

Interface de réponse :
```ts
interface OverwriteEvent {
    requestId: number
    responseCode: number
    responseHeaders: Record<string, string>
    body?: string | Record<string, any>
}
```

### `fail`

Cet événement est en cours d'émission lorsque la requête réseau est annulée avec [`annule`](/docs/api/mock/abort) ou [`abortOnce`](/docs/api/mock/abortOnce). Le match est passé dans le rappel de l'événement.

Erreur de l'interface:
```ts
interface FailEvent {
    requestId: number
    errorReason: Protocol.Network.ErrorReason
}
```

### `match`

Cet événement est émis quand un nouveau match est ajouté, avant `continuer` ou `écraser`. Le match est passé dans le rappel de l'événement.

Interface de correspondance:
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

Cet événement est émis lorsque la réponse réseau n'a pas été écrasée ou interrompue, ou si la réponse a déjà été envoyée par un autre mock. `requestId` est passé en cas de rappel d'événement.

## Exemples

Obtention d'un certain nombre de requêtes en attente :

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

Lancer une erreur sur le réseau 404 échoue :

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

Déterminer si la valeur de réponse du bouchon a été utilisée :

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

Dans cet exemple, `firstMock` a été défini en premier et a un appel `respondOnce` , donc la valeur de réponse `secondMock` ne sera pas utilisée pour la première requête, mais sera utilisé pour le reste.
