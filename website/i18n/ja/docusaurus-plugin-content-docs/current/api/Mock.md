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
- [`request`](/docs/api/mock/request)
- [`requestOnce`](/docs/api/mock/requestOnce)
- [`respond`](/docs/api/mock/respond)
- [`respondOnce`](/docs/api/mock/respondOnce)
- [`restore`](/docs/api/mock/restore)

## Events

モックオブジェクトはEventEmitterであり、ユースケースに対していくつかのイベントが出力されます。

イベントの一覧はこちらです。

### `request`

このイベントは、モックパターンと一致するネットワーク要求を起動するときに発生します。 リクエストはイベントコールバックで渡されます。

リクエストインターフェイス:
```ts
interface RequestEvent {
    requestId: number
    request: Matches
    responseStatusCode: number
    responseHeaders: Record<string, string>
}
```

### `overwrite`

このイベントは、ネットワーク応答が [` respond `](/docs/api/mock/respond) または [` respondOnce `](/docs/api/mock/respondOnce) で上書きされたときに発生します。 レスポンスはイベントコールバックで渡されます。

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

このイベントは、 [`abort`](/docs/api/mock/abort) または [`abortOnce`](/docs/api/mock/abortOnce) でネットワーク要求が中断されたときに発生します。 イベントコールバックで失敗しました。

Fail interface:
```ts
interface FailEvent {
    requestId: number
    errorReason: Protocol.Network.ErrorReason
}
```

### `match`

このイベントは、 `continue` または ` overwrite ` の前に、新しい一致が追加されたときに発生します。 マッチはイベントコールバックで渡されます。

一致インターフェイス:
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

このイベントは、ネットワーク応答が上書きまたは中断されていない場合、または既に別のモックによって応答が送信されている場合に発生します。 `requestId` がイベントコールバックで渡されます。

## Examples

保留中のリクエストの数を取得します:

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

404ネットワークでエラーが発生しました:

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

モック応答値が使用されているかどうかを決定します:

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

この例では、`firstMock` が最初に定義され、`respondOnce` 呼び出しが 1 つあるため、`firstMock` 応答値は最初のリクエストには使用されません。残りの部分に使用されます。
