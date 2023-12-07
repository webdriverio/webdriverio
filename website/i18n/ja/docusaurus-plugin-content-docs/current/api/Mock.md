---
id: mock
title: The Mock Object
---

モックオブジェクトはネットワークモックを表し、指定された `url` と `filterOptions` に一致するリクエストに関する情報を含むオブジェクトです。 [` mock `](/docs/api/browser/mock) コマンドを使用して受信することができます。

:::info

`モック` コマンドを使用するには、Chrome DevTools プロトコルのサポートが必要です。 このサポートは、Chromiumベースのブラウザでローカルにテストを実行する場合、または Selenium Grid v4以上を使用する場合に提供されます。 このコマンドは、クラウドで自動テストを実行する場合には使用__できません__。 詳細は、 [Automation Protocols](/docs/automationProtocols) セクションを参照してください。

:::

リクエストとレスポンスのモックについては、WebdriverIOの [Mocks and Spies](/docs/mocksandspies) ガイドをご覧ください。

## Properties

モックオブジェクトには次のプロパティがあります。

| Name            | Type       | Details                                                                                                                         |
| --------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `url`           | `String`   | モックコマンドに渡されるURL                                                                                                                 |
| `filterOptions` | `Object`   | モックコマンドに渡されたリソースフィルタオプション                                                                                                       |
| `browser`       | `Object`   | [Browser Object](/docs/api/browser) はモックオブジェクトを取得するために使用されます。                                                                   |
| `calls`         | `Object[]` | `url`、`method`、`headers`、`initialPriority`、`referrerPolic などのプロパティを含むブラウザ要求の一致に関する情報`、`statusCode`、`responseHeaders`、および `body` |

## Methods

モックオブジェクトは、 ` mock ` セクションにリストされている様々なコマンドを提供します。これにより、ユーザはリクエストやレスポンスの動作を変更できます。

- [`abort`](/docs/api/mock/abort)
- [`abortOnce`](/docs/api/mock/abortOnce)
- [`clear`](/docs/api/mock/clear)
- [`respond`](/docs/api/mock/respond)
- [`respondOnce`](/docs/api/mock/respondOnce)
- [`restore`](/docs/api/mock/restore)

## Events

モックオブジェクトはEventEmitterであり、ユースケースに対していくつかのイベントが出力されます。

イベントの一覧はこちらです。

### `request`

This event is being emitted when launching a network request that matches mock patterns. Request is passed in event callback.

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

This event is being emitted when network response is overwrited with [`respond`](/docs/api/mock/respond) or [`respondOnce`](/docs/api/mock/respondOnce). Response is passed in event callback.

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

This event is being emitted when network request is aborted with [`abort`](/docs/api/mock/abort) or [`abortOnce`](/docs/api/mock/abortOnce). Fail is passed in event callback.

Fail interface:
```ts
interface FailEvent {
    requestId: number
    errorReason: Protocol.Network.ErrorReason
}
```

### `match`

This event is being emitted when new match is added, before `continue` or `overwrite`. Match is passed in event callback.

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

This event is being emitted when the network response has neither been overwritten nor interrupted, or if response was already sent by another mock. `requestId` is passed in event callback.

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
