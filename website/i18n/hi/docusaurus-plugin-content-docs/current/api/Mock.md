---
id: mock
title: मोक ऑब्जेक्ट
---

मॉक ऑब्जेक्ट एक ऐसी वस्तु है जो एक नेटवर्क मॉक का प्रतिनिधित्व करती है और इसमें उन अनुरोधों के बारे में जानकारी होती है जो दिए गए `url` और `filterOptions`से मेल खाते थे। इसे [`mock`](/docs/api/browser/mock) कमांड का उपयोग करके प्राप्त किया जा सकता है।

:::info

ध्यान दें कि `mock` कमांड का उपयोग करने के लिए क्रोम देवटूल प्रोटोकॉल के लिए समर्थन की आवश्यकता होती है। यह समर्थन तब दिया जाता है जब आप क्रोमियम आधारित ब्राउज़र में स्थानीय रूप से परीक्षण चलाते हैं या यदि आप सेलेनियम ग्रिड v4 या उच्चतर का उपयोग करते हैं। क्लाउड में स्वचालित परीक्षण चलाते समय इस आदेश का उपयोग __नहीं__ किया जा सकता है। [स्वचालन प्रोटोकॉल](/docs/automationProtocols) अनुभाग में और जानें।

:::

आप हमारे [मॉक और स्पाई](/docs/mocksandspies) गाइड में WebdriverIO में नकली अनुरोध और प्रतिक्रिया के बारे में अधिक पढ़ सकते हैं।

## विशेषताएं

एक तत्व वस्तु में निम्नलिखित गुण होते हैं:

| नाम             | प्रकार     | विवरण                                                                                                                                                                    |
| --------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `url`           | `String`   | Url मॉक कमांड में पास हो गया                                                                                                                                             |
| `filterOptions` | `Object`   | संसाधन फ़िल्टर विकल्प मॉक कमांड में पारित किया गया                                                                                                                       |
| `browser`       | `Object`   | मॉक ऑब्जेक्ट प्राप्त करने के लिए [ब्राउज़र ऑब्जेक्ट](/docs/api/browser) का उपयोग किया जाता है।                                                                           |
| `calls`         | `Object[]` | मिलान करने वाले ब्राउज़र अनुरोधों के बारे में जानकारी, जिसमें `url`, `method`, `headers`, `initialPriority`, `referrerPolic`, `statusCode`, `responseHeaders` and `body` |

## विधियां

कृत्रिम वस्तुएँ विभिन्न आदेश प्रदान करती हैं, जो `mock` खंड में सूचीबद्ध हैं, जो उपयोगकर्ताओं को अनुरोध या प्रतिक्रिया के व्यवहार को संशोधित करने की अनुमति देती हैं।

- [`abort`](/docs/api/mock/abort)
- [`abortOnce`](/docs/api/mock/abortOnce)
- [`clear`](/docs/api/mock/clear)
- [`respond`](/docs/api/mock/respond)
- [`respondOnce`](/docs/api/mock/respondOnce)
- [`restore`](/docs/api/mock/restore)

## इवेंट

ब्राउज़र ऑब्जेक्ट एक EventEmitter है और आपके उपयोग के मामलों के लिए कुछ ईवेंट उत्सर्जित होते हैं।

यहाँ घटनाओं की एक सूची है।

### `request`

मॉक पैटर्न से मेल खाने वाले नेटवर्क अनुरोध को लॉन्च करते समय यह ईवेंट उत्सर्जित किया जा रहा है। ईवेंट कॉलबैक में अनुरोध पारित किया गया है।

अनुरोध इंटरफ़ेस:
```ts
interface RequestEvent {
    requestId: number
    request: Matches
    responseStatusCode: number
    responseHeaders: Record<string, string>
}
```

### `overwrite`

जब नेटवर्क प्रतिक्रिया [`respond`](/docs/api/mock/respond) या [`respondOnce`](/docs/api/mock/respondOnce)के साथ ओवरराइट की जाती है तो यह घटना उत्सर्जित हो रही है। ईवेंट कॉलबैक में अनुरोध पारित किया गया है।

अनुरोध इंटरफ़ेस:
```ts
interface OverwriteEvent {
    requestId: number
    responseCode: number
    responseHeaders: Record<string, string>
    body?: string | Record<string, any>
}
```

### `fail`

जब नेटवर्क प्रतिक्रिया [`respond`](/docs/api/mock/abort) या [`respondOnce`](/docs/api/mock/abortOnce)के साथ ओवरराइट की जाती है तो यह घटना उत्सर्जित हो रही है। ईवेंट कॉलबैक में अनुरोध पारित किया गया है।

विफल इंटरफ़ेस:
```ts
interface FailEvent {
    requestId: number
    errorReason: Protocol.Network.ErrorReason
}
```

### `match`

नया मैच जोड़े जाने पर यह घटना उत्सर्जित हो रही है, `continue` या `overwrite`जारी रखें। ईवेंट कॉलबैक में अनुरोध पारित किया गया है।

विफल इंटरफ़ेस:
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

इस घटना को उत्सर्जित किया जा रहा है जब नेटवर्क प्रतिक्रिया को न तो ओवरराइट किया गया है और न ही बाधित किया गया है, या यदि प्रतिक्रिया पहले से ही किसी अन्य मॉक द्वारा भेजी गई है। ईवेंट कॉलबैक में `requestId` पारित किया गया है।

## उदाहरण

कई लंबित अनुरोध प्राप्त करना:

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

404 नेटवर्क पर त्रुटि फेंकना विफल:

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

यह निर्धारित करना कि नकली प्रतिक्रिया मान का उपयोग किया गया था या नहीं:

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

इस उदाहरण में, `firstMock` पहले परिभाषित किया गया था और इसमें एक `responseOnce` कॉल है, इसलिए `secondMock` प्रतिक्रिया मान का उपयोग पहले अनुरोध के लिए नहीं किया जाएगा, लेकिन बाकी के लिए उपयोग किया जाएगा।
