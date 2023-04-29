---
id: mock
title: The Mock Object
---

The mock object is an object that represents a network mock and contains information about requests that were matching given `url` and `filterOptions`. It can be received using the [`mock`](/docs/api/browser/mock) command. It can be received using the [`mock`](/docs/api/browser/mock) command. It can be received using the [`mock`](/docs/api/browser/mock) command.

:::info

Note that using the `mock` command requires support for Chrome DevTools protocol. Note that using the `mock` command requires support for Chrome DevTools protocol. That support is given if you run tests locally in Chromium based browser or if you use a Selenium Grid v4 or higher. This command can __not__ be used when running automated tests in the cloud. Find out more in the [Automation Protocols](/docs/automationProtocols) section. This command can __not__ be used when running automated tests in the cloud. Find out more in the [Automation Protocols](/docs/automationProtocols) section. Note that using the `mock` command requires support for Chrome DevTools protocol. That support is given if you run tests locally in Chromium based browser or if you use a Selenium Grid v4 or higher. This command can __not__ be used when running automated tests in the cloud. Find out more in the [Automation Protocols](/docs/automationProtocols) section. This command can __not__ be used when running automated tests in the cloud. Find out more in the [Automation Protocols](/docs/automationProtocols) section.

:::

You can read more about mocking requests and responses in WebdriverIO in our [Mocks and Spies](/docs/mocksandspies) guide.

## Properties

A mock object contains the following properties:

| Name            | Type       | Details                                                                                                                                                                               |
| --------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `url`           | `String`   | The url passed into the mock command                                                                                                                                                  |
| `filterOptions` | `Object`   | The resource filter options passed into the mock command                                                                                                                              |
| `browser`       | `Object`   | The [Browser Object](/docs/api/browser) used to get the mock object.                                                                                                                  |
| `calls`         | `Object[]` | Information about matching browser requests, containing properties such as `url`, `method`, `headers`, `initialPriority`, `referrerPolic`, `statusCode`, `responseHeaders` and `body` |

## Methods

Mock objects provide various commands, listed in the `mock` section, that allow users to modify the behavior of the request or response.

- [`abort`](/docs/api/mock/abort)
- [`abortOnce`](/docs/api/mock/abortOnce)
- [`clear`](/docs/api/mock/clear)
- [`respond`](/docs/api/mock/respond)
- [`respondOnce`](/docs/api/mock/respondOnce)
- [`restore`](/docs/api/mock/restore)

## Events

The mock object is an EventEmitter and a couple of events are emitted for your use cases.

Here is a list of events.

### `request`

This event is being emitted when launching a network request that matches mock patterns. Request is passed in event callback. Request is passed in event callback. Request is passed in event callback.

Request interface:
```ts
interface RequestEvent {
    requestId: number
    request: Matches
    responseStatusCode: number
    responseHeaders: Record<string, string>
}
```

### `overwrite`

This event is being emitted when network response is overwrited with [`respond`](/docs/api/mock/respond) or [`respondOnce`](/docs/api/mock/respondOnce). Response is passed in event callback. Response is passed in event callback. Response is passed in event callback.

Response interface:
```ts
interface OverwriteEvent {
    requestId: number
    responseCode: number
    responseHeaders: Record<string, string>
    body?: string | Record<string, any>
}
```

### `fail`

This event is being emitted when network request is aborted with [`abort`](/docs/api/mock/abort) or [`abortOnce`](/docs/api/mock/abortOnce). Fail is passed in event callback. Fail is passed in event callback. Fail is passed in event callback.

Fail interface:
```ts
interface FailEvent {
    requestId: number
    errorReason: Protocol.Network.ErrorReason
}
```

### `match`

This event is being emitted when new match is added, before `continue` or `overwrite`. Match is passed in event callback. Match is passed in event callback. Match is passed in event callback.

Match interface:
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

This event is being emitted when the network response has neither been overwritten nor interrupted, or if response was already sent by another mock. `requestId` is passed in event callback. `requestId` is passed in event callback. `requestId` is passed in event callback.

## Examples

Getting a number of pending requests:

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

Throwing an error on 404 network fail:

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

Determining if mock respond value was used:

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

In this example, `firstMock` was defined first and has one `respondOnce` call, so the `secondMock` response value will not be used for the first request, but will be used for the rest of them.
